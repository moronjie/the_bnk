import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBillPayment extends Document {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  billerName: string;
  billerCode: string;
  accountNumber: string;
  amount: mongoose.Types.Decimal128;
  category: 'electricity' | 'water' | 'internet' | 'phone' | 'gas' | 'other';
  status: 'pending' | 'scheduled' | 'completed' | 'failed';
  scheduledDate?: Date;
  paidDate?: Date;
  transactionId?: Types.ObjectId;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const billPaymentSchema = new Schema<IBillPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    billerName: {
      type: String,
      required: true,
      trim: true,
    },
    billerCode: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    category: {
      type: String,
      enum: ['electricity', 'water', 'internet', 'phone', 'gas', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'completed', 'failed'],
      default: 'pending',
    },
    scheduledDate: Date,
    paidDate: Date,
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    failureReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
billPaymentSchema.index({ userId: 1, status: 1 });
billPaymentSchema.index({ scheduledDate: 1, status: 1 });
billPaymentSchema.index({ status: 1 });
billPaymentSchema.index({ accountId: 1 });

const BillPayment = mongoose.model<IBillPayment>('BillPayment', billPaymentSchema);

export default BillPayment;
