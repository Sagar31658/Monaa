import { RecurringItem } from '../models/recurringItem.model.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { categories, TRANSACTION_TYPES, FREQUENCY_TYPES } from '../config/constant.js';

// Create Recurring Item
export const createRecurringItem = asyncHandler(async (req, res) => {
  const { amount, type, category, description, frequency, nextDueDate } = req.body;

  if (!amount || !type || !category || !frequency || !nextDueDate) {
    throw new ApiError(400, "Amount, type, category, frequency, and next due date are required.");
  }

  if (type === TRANSACTION_TYPES.EXPENSE && !categories.expense.includes(category)) {
    throw new ApiError(400, "Invalid expense category.");
  }

  if (type === TRANSACTION_TYPES.INCOME && !categories.income.includes(category)) {
    throw new ApiError(400, "Invalid income category.");
  }

  if (!FREQUENCY_TYPES.includes(frequency)) {
    throw new ApiError(400, "Invalid frequency.");
  }

  const newItem = await RecurringItem.create({
    user: req.user._id,
    amount,
    type,
    category,
    description,
    frequency,
    nextDueDate
  });

  res.status(201).json(
    new ApiResponse(201, newItem, "Recurring item created successfully.")
  );
});

// Get All Recurring Items
export const getAllRecurringItems = asyncHandler(async (req, res) => {
  const items = await RecurringItem.find({ user: req.user._id })
    .sort({ nextDueDate: 1 }); // Next due item first

  res.status(200).json(
    new ApiResponse(200, items, "Recurring items fetched successfully.")
  );
});

// Delete Recurring Item
export const deleteRecurringItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await RecurringItem.findById(id);

  if (!item || item.user.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "Recurring item not found or unauthorized");
  }
  await item.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, "Recurring item deleted successfully.")
  );
});

export const toggleRecurringItemStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    const item = await RecurringItem.findById(id);
  
    if (!item || item.user.toString() !== req.user._id.toString()) {
      throw new ApiError(404, "Recurring item not found or unauthorized");
    }
  
    item.isActive = !item.isActive;
    await item.save();
  
    res.status(200).json(
      new ApiResponse(200, item, `Recurring item ${item.isActive ? 'resumed' : 'paused'} successfully.`)
    );
  });
  