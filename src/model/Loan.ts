import mongoose, { Schema, Document, Types } from 'mongoose';
import Decimal from 'decimal.js';

export interface ILoan extends Document {
  loanNumber: string;
  userId: Types.ObjectId;
  accountId?: Types.ObjectId;
  loanType: 'personal' | 'home' | 'auto' | 'education' | 'business';
  principal: mongoose.Types.Decimal128;
  outstandingBalance: mongoose.Types.Decimal128;
  interestRate: number;
  tenure: number; // in months
  emiAmount: mongoose.Types.Decimal128;
  nextEmiDate: Date;
  status: 'pending' | 'active' | 'closed' | 'rejected' | 'defaulted';
  paymentSchedule: {
    emiNumber: number;
    dueDate: Date;
    emiAmount: mongoose.Types.Decimal128;
    principalComponent: mongoose.Types.Decimal128;
    interestComponent: mongoose.Types.Decimal128;
    status: 'pending' | 'paid' | 'overdue';
    paidDate?: Date;
  }[];
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateEMI(): number;
  applyPayment(amount: number): Promise<void>;
  markOverdue(): Promise<void>;
  generatePaymentSchedule(): void;
}

const loanSchema = new Schema<ILoan>(
  {
    loanNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    },
    loanType: {
      type: String,
      enum: ['personal', 'home', 'auto', 'education', 'business'],
      required: true,
    },
    principal: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    outstandingBalance: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    interestRate: {
      type: Number,
      required: true,
    },
    tenure: {
      type: Number,
      required: true,
    },
    emiAmount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    nextEmiDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'closed', 'rejected', 'defaulted'],
      default: 'pending',
    },
    paymentSchedule: [
      {
        emiNumber: {
          type: Number,
          required: true,
        },
        dueDate: {
          type: Date,
          required: true,
        },
        emiAmount: {
          type: Schema.Types.Decimal128,
          required: true,
        },
        principalComponent: {
          type: Schema.Types.Decimal128,
          required: true,
        },
        interestComponent: {
          type: Schema.Types.Decimal128,
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'paid', 'overdue'],
          default: 'pending',
        },
        paidDate: Date,
      },
    ],
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
loanSchema.index({ loanNumber: 1 }, { unique: true });
loanSchema.index({ userId: 1, status: 1 });
loanSchema.index({ nextEmiDate: 1, status: 1 });
loanSchema.index({ status: 1 });

// Pre-save hook to generate loan number
loanSchema.pre('save', async function () {
  if (this.isNew && !this.loanNumber) {
    const prefix = 'LN';
    const random = Math.floor(10000000 + Math.random() * 90000000);
    this.loanNumber = `${prefix}${random}`;
  }
});

// Validation: outstandingBalance <= principal + interest
loanSchema.pre('save', function () {
  const principal = new Decimal(this.principal.toString());
  const outstanding = new Decimal(this.outstandingBalance.toString());
  const rate = new Decimal(this.interestRate).div(100);
  const maxOutstanding = principal.mul(rate.plus(1));

  if (outstanding.greaterThan(maxOutstanding)) {
    throw new Error('Outstanding balance cannot exceed principal + interest');
  }
});

// Methods
loanSchema.methods.calculateEMI = function (): number {
  // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
  // where P = principal, r = monthly interest rate, n = tenure in months
  const P = new Decimal(this.principal.toString());
  const r = new Decimal(this.interestRate).div(100).div(12); // monthly rate
  const n = new Decimal(this.tenure);

  const onePlusR = r.plus(1);
  const numerator = P.mul(r).mul(onePlusR.pow(n.toNumber()));
  const denominator = onePlusR.pow(n.toNumber()).minus(1);

  return numerator.div(denominator).toNumber();
};

loanSchema.methods.applyPayment = async function (amount: number): Promise<void> {
  const paymentAmount = new Decimal(amount);
  const outstanding = new Decimal(this.outstandingBalance.toString());
  const newOutstanding = outstanding.minus(paymentAmount);

  // Find next pending EMI
  const nextEmi = this.paymentSchedule.find((emi) => emi.status === 'pending');

  if (nextEmi) {
    nextEmi.status = 'paid';
    nextEmi.paidDate = new Date();

    // Find next due date
    const nextPendingEmi = this.paymentSchedule.find((emi) => emi.status === 'pending');
    if (nextPendingEmi) {
      this.nextEmiDate = nextPendingEmi.dueDate;
    } else {
      // All EMIs paid
      this.status = 'closed';
    }
  }

  this.outstandingBalance = mongoose.Types.Decimal128.fromString(
    newOutstanding.toString()
  );

  return this.save();
};

loanSchema.methods.markOverdue = async function (): Promise<void> {
  const now = new Date();

  this.paymentSchedule.forEach((emi) => {
    if (emi.status === 'pending' && emi.dueDate < now) {
      emi.status = 'overdue';
    }
  });

  return this.save();
};

loanSchema.methods.generatePaymentSchedule = function (): void {
  const emiAmount = this.calculateEMI();
  const monthlyRate = new Decimal(this.interestRate).div(100).div(12);
  let balance = new Decimal(this.principal.toString());
  const schedule = [];

  for (let i = 1; i <= this.tenure; i++) {
    const interestComponent = balance.mul(monthlyRate);
    const principalComponent = new Decimal(emiAmount).minus(interestComponent);
    balance = balance.minus(principalComponent);

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      emiNumber: i,
      dueDate,
      emiAmount: mongoose.Types.Decimal128.fromString(emiAmount.toString()),
      principalComponent: mongoose.Types.Decimal128.fromString(
        principalComponent.toString()
      ),
      interestComponent: mongoose.Types.Decimal128.fromString(
        interestComponent.toString()
      ),
      status: 'pending' as const,
    });
  }

  this.paymentSchedule = schedule;
  this.emiAmount = mongoose.Types.Decimal128.fromString(emiAmount.toString());
  this.nextEmiDate = schedule[0].dueDate;
};

const Loan = mongoose.model<ILoan>('Loan', loanSchema);

export default Loan;
