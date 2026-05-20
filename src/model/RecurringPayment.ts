import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRecurringPayment extends Document {
  userId: Types.ObjectId;
  fromAccountId: Types.ObjectId;
  toBeneficiaryId: Types.ObjectId;
  amount: mongoose.Types.Decimal128;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate?: Date;
  nextRunDate: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  lastRunDate?: Date;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateNextRunDate(): Date;
  canExecute(): boolean;
}

const recurringPaymentSchema = new Schema<IRecurringPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fromAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    toBeneficiaryId: {
      type: Schema.Types.ObjectId,
      ref: 'Beneficiary',
      required: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    nextRunDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'cancelled'],
      default: 'active',
    },
    lastRunDate: Date,
    executionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
recurringPaymentSchema.index({ nextRunDate: 1, status: 1 });
recurringPaymentSchema.index({ userId: 1 });
recurringPaymentSchema.index({ fromAccountId: 1 });
recurringPaymentSchema.index({ status: 1 });

// Methods
recurringPaymentSchema.methods.calculateNextRunDate = function (): Date {
  const baseDate = this.lastRunDate || this.startDate;
  const nextDate = new Date(baseDate);

  switch (this.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }

  return nextDate;
};

recurringPaymentSchema.methods.canExecute = function (): boolean {
  const now = new Date();

  // Check if active
  if (this.status !== 'active') return false;

  // Check if next run date has passed
  if (this.nextRunDate > now) return false;

  // Check if end date has passed
  if (this.endDate && this.endDate < now) {
    this.status = 'completed';
    return false;
  }

  return true;
};

const RecurringPayment = mongoose.model<IRecurringPayment>(
  'RecurringPayment',
  recurringPaymentSchema
);

export default RecurringPayment;
