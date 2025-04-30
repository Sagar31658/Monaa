import mongoose from 'mongoose';
import { TRANSACTION_TYPES, FREQUENCY_TYPES } from '../config/constant.js';

const recurringItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(TRANSACTION_TYPES),
    required: true
  },
  frequency: {
    type: String,
    enum: FREQUENCY_TYPES,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export const RecurringItem = mongoose.model('RecurringItem', recurringItemSchema);
