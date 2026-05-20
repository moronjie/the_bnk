import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransactionLock extends Document {
  accountId: Types.ObjectId;
  transactionId: string;
  lockedAt: Date;
  expiresAt: Date;
}

const transactionLockSchema = new Schema<ITransactionLock>({
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    unique: true,
  },
  transactionId: {
    type: String,
    required: true,
  },
  lockedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30000), // 30 seconds
  },
});

// TTL Index - automatically delete expired locks
transactionLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for quick lookup
transactionLockSchema.index({ accountId: 1 }, { unique: true });

const TransactionLock = mongoose.model<ITransactionLock>(
  'TransactionLock',
  transactionLockSchema
);

export default TransactionLock;
