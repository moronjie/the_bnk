import mongoose, { Schema, Document, Types } from 'mongoose';
import Decimal from 'decimal.js';

export interface IInvestment extends Document {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  investmentType: 'stocks' | 'bonds' | 'crypto' | 'mutual_funds';
  assetSymbol: string;
  quantity: number;
  purchasePrice: mongoose.Types.Decimal128;
  currentPrice: mongoose.Types.Decimal128;
  purchaseDate: Date;
  status: 'active' | 'sold';
  soldDate?: Date;
  soldPrice?: mongoose.Types.Decimal128;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateReturns(): number;
  calculateProfitLoss(): number;
}

const investmentSchema = new Schema<IInvestment>(
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
    investmentType: {
      type: String,
      enum: ['stocks', 'bonds', 'crypto', 'mutual_funds'],
      required: true,
    },
    assetSymbol: {
      type: String,
      required: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    purchasePrice: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    currentPrice: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'sold'],
      default: 'active',
    },
    soldDate: Date,
    soldPrice: Schema.Types.Decimal128,
  },
  {
    timestamps: true,
  }
);

// Indexes
investmentSchema.index({ userId: 1, investmentType: 1 });
investmentSchema.index({ userId: 1, status: 1 });
investmentSchema.index({ assetSymbol: 1 });
investmentSchema.index({ status: 1 });

// Methods
investmentSchema.methods.calculateReturns = function (): number {
  const purchase = new Decimal(this.purchasePrice.toString());
  const current = new Decimal(this.currentPrice.toString());
  const quantity = new Decimal(this.quantity);

  const totalPurchase = purchase.mul(quantity);
  const totalCurrent = current.mul(quantity);
  const returns = totalCurrent.minus(totalPurchase);

  return returns.toNumber();
};

investmentSchema.methods.calculateProfitLoss = function (): number {
  const purchase = new Decimal(this.purchasePrice.toString());
  const current = this.status === 'sold' && this.soldPrice
    ? new Decimal(this.soldPrice.toString())
    : new Decimal(this.currentPrice.toString());
  const quantity = new Decimal(this.quantity);

  const totalPurchase = purchase.mul(quantity);
  const totalCurrent = current.mul(quantity);
  const profitLoss = totalCurrent.minus(totalPurchase);
  const percentage = profitLoss.div(totalPurchase).mul(100);

  return percentage.toNumber();
};

const Investment = mongoose.model<IInvestment>('Investment', investmentSchema);

export default Investment;
