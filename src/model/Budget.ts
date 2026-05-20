import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBudget extends Document {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  category: string;
  monthlyLimit: mongoose.Types.Decimal128;
  currentSpent: mongoose.Types.Decimal128;
  month: number;
  year: number;
  alerts: {
    threshold: number;
    sent: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;

  // Methods
  addExpense(amount: number): Promise<void>;
  checkThreshold(): number[];
  resetMonthly(): Promise<void>;
}

const budgetSchema = new Schema<IBudget>(
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
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    monthlyLimit: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    currentSpent: {
      type: Schema.Types.Decimal128,
      default: 0,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    alerts: [
      {
        threshold: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        sent: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
budgetSchema.index({ userId: 1, month: 1, year: 1, category: 1 }, { unique: true });
budgetSchema.index({ category: 1 });
budgetSchema.index({ userId: 1 });

// Default alerts at 50%, 75%, 90%, and 100%
budgetSchema.pre('save', function () {
  if (this.isNew && this.alerts.length === 0) {
    this.alerts = [
      { threshold: 50, sent: false },
      { threshold: 75, sent: false },
      { threshold: 90, sent: false },
      { threshold: 100, sent: false },
    ];
  }
});

// Methods
budgetSchema.methods.addExpense = async function (amount: number): Promise<void> {
  const currentSpent = parseFloat(this.currentSpent.toString());
  const newSpent = currentSpent + amount;

  this.currentSpent = mongoose.Types.Decimal128.fromString(newSpent.toString());

  return this.save();
};

budgetSchema.methods.checkThreshold = function (): number[] {
  const limit = parseFloat(this.monthlyLimit.toString());
  const spent = parseFloat(this.currentSpent.toString());
  const percentage = (spent / limit) * 100;

  const triggeredAlerts: number[] = [];

  this.alerts.forEach((alert) => {
    if (percentage >= alert.threshold && !alert.sent) {
      triggeredAlerts.push(alert.threshold);
      alert.sent = true;
    }
  });

  return triggeredAlerts;
};

budgetSchema.methods.resetMonthly = async function (): Promise<void> {
  const now = new Date();
  this.month = now.getMonth() + 1;
  this.year = now.getFullYear();
  this.currentSpent = mongoose.Types.Decimal128.fromString('0');

  // Reset alert flags
  this.alerts.forEach((alert) => {
    alert.sent = false;
  });

  return this.save();
};

const Budget = mongoose.model<IBudget>('Budget', budgetSchema);

export default Budget;
