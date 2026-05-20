
import mongoose, { Schema, Document, Model } from 'mongoose';
import Decimal from 'decimal.js';

// Account types
export enum AccountType {
  SAVINGS = 'savings',
  CHECKING = 'checking',
  CREDIT = 'credit',
  LOAN = 'loan',
}

// Account status
export enum AccountStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  CLOSED = 'closed',
  PENDING = 'pending',
}

// Currency types
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  NGN = 'NGN',
}

// Account interface
export interface IAccount extends Document {
  accountNumber: string;
  userId: mongoose.Types.ObjectId;
  accountType: AccountType;
  currency: Currency;
  balance: mongoose.Types.Decimal128;
  availableBalance: mongoose.Types.Decimal128;
  holds: number;
  status: AccountStatus;
  overdraftLimit: number;
  interestRate: number;
  version: number;
  lastTransactionDate?: Date;
  openedDate: Date;
  closedDate?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  hasAvailableBalance(amount: number): boolean;
  applyHold(amount: number): Promise<void>;
  releaseHold(amount: number): Promise<void>;
  getBalanceAsNumber(): number;
  getAvailableBalanceAsNumber(): number;
}

// Account schema
const AccountSchema = new Schema<IAccount>(
  {
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accountType: {
      type: String,
      enum: Object.values(AccountType),
      required: true,
      index: true,
    },
    currency: {
      type: String,
      enum: Object.values(Currency),
      default: Currency.USD,
    },
    balance: {
      type: Schema.Types.Decimal128,
      required: true,
      default: 0,
    },
    availableBalance: {
      type: Schema.Types.Decimal128,
      required: true,
      default: 0,
    },
    holds: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.PENDING,
      index: true,
    },
    overdraftLimit: {
      type: Number,
      default: 0,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    version: {
      type: Number,
      default: 0,
    },
    lastTransactionDate: Date,
    openedDate: {
      type: Date,
      default: Date.now,
    },
    closedDate: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
AccountSchema.index({ userId: 1, accountType: 1 });
AccountSchema.index({ userId: 1, status: 1 });
AccountSchema.index({ accountNumber: 1 }, { unique: true });
AccountSchema.index({ status: 1, accountType: 1 });

// Pre-save hook: Generate account number
AccountSchema.pre('save', async function () {
  if (!this.isNew || this.accountNumber) {
    return;
  }

  const bankCode = '001'; // Bank code prefix
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  this.accountNumber = `${bankCode}${timestamp}${random}`;
});

// Pre-save hook: Set available balance
AccountSchema.pre('save', function () {
  if (this.isModified('balance') || this.isModified('holds')) {
    const balance = new Decimal(this.balance.toString());
    const holds = new Decimal(this.holds);
    const availableBalance = balance.minus(holds);
    this.availableBalance = mongoose.Types.Decimal128.fromString(
      availableBalance.toString()
    );
  }
});

// Pre-save hook: Increment version for optimistic locking
AccountSchema.pre('save', function () {
  if (!this.isNew && (this.isModified('balance') || this.isModified('holds'))) {
    this.increment();
  }
});

// Validation: Balance must be >= 0 or within overdraft limit
AccountSchema.path('balance').validate(function (value: mongoose.Types.Decimal128) {
  const balance = new Decimal(value.toString());
  const overdraftLimit = new Decimal(this.overdraftLimit);
  const minAllowed = overdraftLimit.negated();
  return balance.greaterThanOrEqualTo(minAllowed);
}, 'Balance cannot be less than overdraft limit');

// Method: Check if available balance is sufficient
AccountSchema.methods.hasAvailableBalance = function (amount: number): boolean {
  const available = new Decimal(this.availableBalance.toString());
  const requested = new Decimal(amount);
  return available.greaterThanOrEqualTo(requested);
};

// Method: Apply hold
AccountSchema.methods.applyHold = async function (amount: number): Promise<void> {
  const currentHolds = new Decimal(this.holds);
  const newHolds = currentHolds.plus(amount);
  await this.updateOne({
    $set: { holds: newHolds.toNumber() },
  });
};

// Method: Release hold
AccountSchema.methods.releaseHold = async function (amount: number): Promise<void> {
  const currentHolds = new Decimal(this.holds);
  const newHolds = Decimal.max(0, currentHolds.minus(amount));
  await this.updateOne({
    $set: { holds: newHolds.toNumber() },
  });
};

// Method: Get balance as number
AccountSchema.methods.getBalanceAsNumber = function (): number {
  return parseFloat(this.balance.toString());
};

// Method: Get available balance as number
AccountSchema.methods.getAvailableBalanceAsNumber = function (): number {
  return parseFloat(this.availableBalance.toString());
};

// Export model
export const Account: Model<IAccount> = mongoose.model<IAccount>('Account', AccountSchema);
