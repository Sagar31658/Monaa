import { Transaction } from '../models/transaction.model.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { categories, TRANSACTION_TYPES } from '../config/constant.js';
import {Budget} from '../models/budget.model.js'
import dayjs from 'dayjs';

// Create Transaction
export const createTransaction = asyncHandler(async (req, res) => {
    const { amount, type, category, description, budget, date, createdFrom } = req.body;
  
    if (!amount || !type || !category) {
      throw new ApiError(400, "Amount, type and category are required fields.");
    }
  
    if (type === TRANSACTION_TYPES.EXPENSE && !categories.expense.includes(category)) {
      throw new ApiError(400, "Invalid expense category.");
    }
      
    if (type === TRANSACTION_TYPES.INCOME && !categories.income.includes(category)) {
      throw new ApiError(400, "Invalid income category.");
    }
  
    let linkedBudget = null;
    const today = date ? new Date(date) : new Date();
  
    if (budget) {
      // Budget manually provided by user
      linkedBudget = await Budget.findById(budget);
  
      if (!linkedBudget || linkedBudget.user.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "Budget not found or unauthorized");
      }
  
      if (today < linkedBudget.startDate || today > linkedBudget.endDate) {
        throw new ApiError(400, "Transaction date does not fall within budget period");
      }
    } else {
      // Auto-detect active budget
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
  
    // Deduct from Budget if Expense and Budget linked
    if (linkedBudget && type === 'expense') {
      linkedBudget.remainingAmount -= amount;
      if (linkedBudget.remainingAmount < 0) {
        linkedBudget.remainingAmount = 0;
      }
      await linkedBudget.save();
    }
  
    res.status(201).json(
      new ApiResponse(201, newTransaction, "Transaction created successfully.")
    );
  });
  
// Get all Transactions of a User
export const getAllTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id })
    .sort({ date: -1 }); // Latest first

  res.status(200).json(
    new ApiResponse(200, transactions, "Transactions fetched successfully.")
  );
});

// Delete a Transaction
export const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await Transaction.findById(id);

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  if (transaction.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to delete this transaction");
  }

  await transaction.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, "Transaction deleted successfully.")
  );
});
