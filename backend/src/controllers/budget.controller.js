import { Budget } from '../models/budget.model.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Create Budget
export const createBudget = asyncHandler(async (req, res) => {
  const { name, amount, startDate, endDate, warningThreshold } = req.body;

  if (!name || !amount || !startDate || !endDate) {
    throw new ApiError(400, "Name, amount, start date and end date are required.");
  }
  const newBudget = await Budget.create({
    user: req.user._id,
    name,
    amount,
    remainingAmount: amount,
    startDate,
    endDate,
    warningThreshold: warningThreshold || 80
  });

  res.status(201).json(
    new ApiResponse(201, newBudget, "Budget created successfully.")
  );
});

// Get All Budgets for User
export const getAllBudgets = asyncHandler(async (req, res) => {
    const budgets = await Budget.find({ user: req.user._id }).sort({ createdAt: -1 });
    const today = new Date();
    let updates = [];
  
    for (const budget of budgets) {
      if (budget.isActive && budget.endDate < today) {
        budget.isActive = false;
        updates.push(budget.save());
      }
    }
    if (updates.length > 0) {
      await Promise.all(updates);
    }
    const freshBudgets = await Budget.find({ user: req.user._id }).sort({ createdAt: -1 });
  
    res.status(200).json(
      new ApiResponse(200, freshBudgets, "Budgets fetched successfully.")
    );
  });
  

// Get Single Budget
export const getBudgetById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const budget = await Budget.findById(id);

  if (!budget || budget.user.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "Budget not found or unauthorized");
  }

  res.status(200).json(
    new ApiResponse(200, budget, "Budget fetched successfully.")
  );
});

// Delete Budget
export const deleteBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const budget = await Budget.findById(id);

  if (!budget || budget.user.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "Budget not found or unauthorized");
  }
  await budget.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, "Budget deleted successfully.")
  );
});
