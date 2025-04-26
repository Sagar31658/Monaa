import mongoose, {Schema} from 'mongoose'

const transactionSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: [true, 'Transaction type is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be a positive number']
    },
    category: {
        type: String,
        enum: [
            'salary',
            'business',
            'investment',
            'gift',
            'groceries',
            'rent',
            'utilities',
            'entertainment',
            'transportation',
            'health',
            'shopping',
            'other'
        ],
        required: [true, 'Category is required']
    },
    note: {
        type: String,
        trim: true,
        maxlength: [100, 'Note cannot exceed 100 characters']
    }
}, { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);

transactionSchema.virtual('month').get(function() {
    return this.date.getMonth() + 1;
});
