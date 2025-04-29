import { Transaction } from '../models/transaction.model.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { categories } from '../config/constant.js';

// Create Transaction
export const createTransaction = asyncHandler(async (req, res) => {
  const { amount, type, category, description, budget, date, createdFrom } = req.body;
  if (!amount || !type || !category) {
    throw new ApiError(400, "Amount, type and category are required fields.");
  }

  if (type === 'expense' && !categories.expense.includes(category)) {
    throw new ApiError(400, "Invalid expense category.");
  }

  if (type === 'income' && !categories.income.includes(category)) {
    throw new ApiError(400, "Invalid income category.");
  }

  const newTransaction = await Transaction.create({
    user: req.user._id,
    amount,
    type,
    category,
    description,
    budget: budget || null,
    date: date || Date.now(),
    createdFrom: createdFrom || 'manual'
  });

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
