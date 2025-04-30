import express from 'express';
import { createBudget, getAllBudgets, getBudgetById, deleteBudget } from '../controllers/budget.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// create budget
router.post('/', verifyJWT, createBudget);

// get all budgets
router.get('/', verifyJWT, getAllBudgets);

// get single budget
router.get('/:id', verifyJWT, getBudgetById);

// delete budget
router.delete('/:id', verifyJWT, deleteBudget);

export default router;
