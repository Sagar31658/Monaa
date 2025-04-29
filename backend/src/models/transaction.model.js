import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  smartCategoryTag: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: ""
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdFrom: {
    type: String,
    enum: ['voice', 'manual'],
    default: 'manual'
  },
  predictedOverrun: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);
