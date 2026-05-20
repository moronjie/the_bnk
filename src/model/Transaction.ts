import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  transactionId: string;
  idempotencyKey: string;
  type: 'debit' | 'credit';
  category:
    | 'deposit'
    | 'withdrawal'
    | 'transfer'
    | 'card_payment'
    | 'loan_payment'
    | 'investment'
    | 'investment_sale'
    | 'crypto_purchase'
    | 'crypto_sale'
    | 'fee'
    | 'interest'
    | 'reversal';
  fromAccountId?: Types.ObjectId;
  toAccountId?: Types.ObjectId;
  amount: mongoose.Types.Decimal128;
  debitEntries: {
    accountId: Types.ObjectId;
    amount: mongoose.Types.Decimal128;
  }[];
  creditEntries: {
    accountId: Types.ObjectId;
    amount: mongoose.Types.Decimal128;
  }[];
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  metadata: {
    description?: string;
    reference?: string;
    initiatedBy?: Types.ObjectId;
    approvedBy?: Types.ObjectId;
    ipAddress?: string;
    userAgent?: string;
    geolocation?: {
      lat: number;
      lon: number;
    };
  };
  fraudScore: number;
  relatedTransactions: Types.ObjectId[];
  parentTransactionId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  isReversible(): boolean;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'deposit',
        'withdrawal',
        'transfer',
        'card_payment',
        'loan_payment',
        'investment',
        'investment_sale',
        'crypto_purchase',
        'crypto_sale',
        'fee',
        'interest',
        'reversal',
      ],
      required: true,
    },
    fromAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    },
    toAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    debitEntries: [
      {
        accountId: {
          type: Schema.Types.ObjectId,
          ref: 'Account',
          required: true,
        },
        amount: {
          type: Schema.Types.Decimal128,
          required: true,
        },
      },
    ],
    creditEntries: [
      {
        accountId: {
          type: Schema.Types.ObjectId,
          ref: 'Account',
          required: true,
        },
        amount: {
          type: Schema.Types.Decimal128,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'reversed'],
      default: 'pending',
    },
    metadata: {
      description: String,
      reference: String,
      initiatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      ipAddress: String,
      userAgent: String,
      geolocation: {
        lat: Number,
        lon: Number,
      },
    },
    fraudScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    relatedTransactions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],
    parentTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ idempotencyKey: 1 }, { unique: true });
transactionSchema.index({ fromAccountId: 1, createdAt: -1 });
transactionSchema.index({ toAccountId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ category: 1, createdAt: -1 });
transactionSchema.index({ 'metadata.initiatedBy': 1, createdAt: -1 });

// Validation: debitEntries sum must equal creditEntries sum (double-entry bookkeeping)
transactionSchema.pre('save', function () {
  if (this.debitEntries.length === 0 || this.creditEntries.length === 0) {
    return;
  }

  const debitSum = this.debitEntries.reduce(
    (sum, entry) => sum + parseFloat(entry.amount.toString()),
    0
  );

  const creditSum = this.creditEntries.reduce(
    (sum, entry) => sum + parseFloat(entry.amount.toString()),
    0
  );

  if (Math.abs(debitSum - creditSum) > 0.001) {
    throw new Error('Debit entries must equal credit entries (double-entry bookkeeping)');
  }
});

// Make transaction immutable - prevent updates
transactionSchema.pre('findOneAndUpdate', function () {
  throw new Error('Transactions cannot be updated. Create a reversal instead.');
});

transactionSchema.pre('updateOne', function () {
  throw new Error('Transactions cannot be updated. Create a reversal instead.');
});

transactionSchema.pre('updateMany', function () {
  throw new Error('Transactions cannot be updated. Create a reversal instead.');
});

// Methods
transactionSchema.methods.isReversible = function (): boolean {
  return (
    this.status === 'completed' &&
    this.category !== 'reversal' &&
    !this.relatedTransactions.some((t) => t.toString())
  );
};

const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);

export default Transaction;
