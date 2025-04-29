import express from 'express';
import { createTransaction, getAllTransactions, deleteTransaction } from '../controllers/transaction.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /transactions - create new transaction
router.post('/', verifyJWT,createTransaction);

// GET /transactions - fetch all transactions
router.get('/', verifyJWT, getAllTransactions);

// DELETE /transactions/:id - delete a transaction
router.delete('/:id', verifyJWT, deleteTransaction);

export default router;
