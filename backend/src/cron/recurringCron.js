import cron from 'node-cron';
import { RecurringItem } from '../models/recurringItem.model.js';
import { Transaction } from '../models/transaction.model.js';
import { TRANSACTION_TYPES } from '../config/constant.js';
import mongoose from 'mongoose';

const advanceDate = (date, frequency) => {
  const d = new Date(date);
  if (frequency === 'daily') d.setDate(d.getDate() + 1);
  if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d;
};

export const startRecurringTransactionCron = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running recurring transaction job...');
    const today = new Date();

    try {
      const dueItems = await RecurringItem.find({
        isActive: true,
        nextDueDate: { $lte: today }
      });

      for (const item of dueItems) {
        // Create corresponding transaction
        await Transaction.create({
          user: item.user,
          amount: item.amount,
          type: item.type,
          category: item.category,
          description: item.description || item.category,
          date: item.nextDueDate,
          createdFrom: 'auto'
        });

        // Advance nextDueDate based on frequency
        item.nextDueDate = advanceDate(item.nextDueDate, item.frequency);
        await item.save();
      }

      console.log(`[CRON] ${dueItems.length} recurring transactions processed.`);
    } catch (error) {
      console.error('[CRON ERROR] Failed to process recurring transactions:', error.message);
    }
  });
};
