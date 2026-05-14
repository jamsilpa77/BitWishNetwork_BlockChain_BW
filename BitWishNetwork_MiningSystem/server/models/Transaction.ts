import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    txHash: { type: String, required: true, unique: true },
    senderAddress: { type: String, required: true },
    recipientAddress: { type: String, required: true },
    amount: { type: Number, required: true },
    fee: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'SUCCESS' },
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
