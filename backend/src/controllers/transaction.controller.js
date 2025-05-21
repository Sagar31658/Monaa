import { Transaction } from '../models/transaction.model.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { categories, TRANSACTION_TYPES } from '../config/constant.js';
import { Budget } from '../models/budget.model.js';
import { getTransactionFromAudio } from '../utils/externalApi.js';
import dayjs from 'dayjs';
import fs from 'fs';

// Create Transaction (Manual or Voice)
export const createTransaction = asyncHandler(async (req, res) => {
  let { amount, type, category, description, budget, date, createdFrom } = req.body;

  // If voice input is used, parse from voice
  if (req.file) {
    const filePath = req.file.path;
    const response = await getTransactionFromAudio(filePath);
    fs.unlinkSync(filePath);
    const prediction = response[0]
    const desc = response[1]
    if (!prediction) {
      throw new ApiError(500, 'Voice transaction failed to parse');
    }
    
    const parsed = Object.fromEntries(
      prediction.split(', ').map((s) => s.split(': ').map((x) => x.trim()))
    );

    //WOrk around temporary:
    const categoryMap = {
      bonus: "Bonus",
      education: "Education",
      entertainment: "Entertainment",
      food_and_dining: "Food & Dining",
      freelance: "Freelance",
      gift: "Gift",
      groceries: "Groceries",
      healthcare: "Healthcare",
      insurance: "Insurance",
      interest: "Interest",
      investment: "Investment",
      misc: "Other",
      mortgage: "Mortgage",
      other: "Other",
      rent: "Rent",
      salary: "Salary",
      shopping: "Shopping",
      subscriptions: "Subscriptions",
      transportation: "Transportation",
      travel: "Travel",
      utilities: "Utilities"
    };
    
    const normalizeCategory = (rawCategory) => {
      if (!rawCategory) return rawCategory;
      return categoryMap[rawCategory.toLowerCase()] || rawCategory;
    };
    

    amount = parseFloat(parsed.amount);
    type = parsed.type;
    description=desc;
    category = normalizeCategory(parsed.category);
    date = parsed.date || date;
    createdFrom = 'voice';
  }

  if (!amount || !type || !category) {
    throw new ApiError(400, 'Amount, type and category are required fields.');
  }

  if (type === TRANSACTION_TYPES.EXPENSE && !categories.expense.includes(category)) {
    throw new ApiError(400, 'Invalid expense category.');
  }

  if (type === TRANSACTION_TYPES.INCOME && !categories.income.includes(category)) {
    throw new ApiError(400, 'Invalid income category.');
  }

  let linkedBudget = null;
  const today = date ? new Date(date) : new Date();

  if (budget) {
    linkedBudget = await Budget.findById(budget);
    if (!linkedBudget || linkedBudget.user.toString() !== req.user._id.toString()) {
      throw new ApiError(404, 'Budget not found or unauthorized');
    }
    if (today < linkedBudget.startDate || today > linkedBudget.endDate) {
      throw new ApiError(400, 'Transaction date does not fall within budget period');
    }
  } else {
    linkedBudget = await Budget.findOne({
      user: req.user._id,
      startDate: { $lte: today },
      endDate: { $gte: today },
      isActive: true
    });
  }

  const newTransaction = await Transaction.create({
    user: req.user._id,
    amount,
    type,
    category,
    description: description || category,
    budget: linkedBudget?._id || null,
    date: today,
    createdFrom: createdFrom || 'manual'
  });

  if (linkedBudget && type === 'expense') {
    linkedBudget.remainingAmount -= amount;
    if (linkedBudget.remainingAmount < 0) {
      linkedBudget.remainingAmount = 0;
    }
    await linkedBudget.save();
  }

  res.status(201).json(
    new ApiResponse(201, newTransaction, 'Transaction created successfully.')
  );
});

// Get all Transactions of a User
export const getAllTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });
  res.status(200).json(
    new ApiResponse(200, transactions, 'Transactions fetched successfully.')
  );
});

// Delete a Transaction
export const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transaction = await Transaction.findById(id);
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }
  if (transaction.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Unauthorized to delete this transaction');
  }
  if (transaction.type === 'expense' && transaction.budget) {
    const budget = await Budget.findById(transaction.budget);
    if (budget) {
      budget.remainingAmount += transaction.amount;
      await budget.save();
    }
  }

  await transaction.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Transaction deleted successfully.')
  );
});
