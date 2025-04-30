import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  warningThreshold: {
    type: Number,
    default: 80 // Alert when 80% spent
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export const Budget = mongoose.model('Budget', budgetSchema);
