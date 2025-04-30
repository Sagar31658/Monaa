import express from 'express';
import { createRecurringItem, getAllRecurringItems, deleteRecurringItem, toggleRecurringItemStatus } from '../controllers/recurringItem.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes protected
router.use(verifyJWT);

// POST /recurring-items
router.post('/', createRecurringItem);

// GET /recurring-items
router.get('/', getAllRecurringItems);

// DELETE /recurring-items/:id
router.delete('/:id', deleteRecurringItem);

// PATCH /recurring-items/:id/toggle
router.patch('/:id/toggle', toggleRecurringItemStatus);

export default router;
