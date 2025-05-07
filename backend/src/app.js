import express from 'express';
import cors from 'cors';
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors());

app.get("/", (req, res) => {
    res.status(200).json({
      message: "Hello, World!"
    });
  });

// Auth Routes
import authRoutes from './routes/auth.routes.js';
app.use('/api/v1/auth', authRoutes);

// Transaction APIs
import transactionRoutes from './routes/transaction.routes.js';
app.use('/api/v1/transactions', transactionRoutes);

// Budget APIs
import budgetRoutes from './routes/budget.routes.js';
app.use('/api/v1/budgets', budgetRoutes);

// Recurring Items APIs
import recurringItemRoutes from './routes/recurringItem.routes.js';
app.use('/api/v1/recurring-items', recurringItemRoutes);

export default app;
