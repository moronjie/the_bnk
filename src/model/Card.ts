import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface ICard extends Document {
  cardNumber: string; // Encrypted
  last4: string;
  accountId: Types.ObjectId;
  userId: Types.ObjectId;
  cardType: 'debit' | 'credit';
  status: 'active' | 'blocked' | 'expired';
  cvv: string; // Encrypted
  expiryDate: Date;
  dailyLimit: number;
  dailySpent: number;
  lastResetDate: Date;
  pin: string; // Hashed
  pinAttempts: number;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  validatePin(candidatePin: string): Promise<boolean>;
  incrementPinAttempts(): Promise<void>;
  resetPinAttempts(): Promise<void>;
  blockCard(): Promise<void>;
  resetDailyLimit(): Promise<void>;
  isWithinDailyLimit(amount: number): boolean;
}

const cardSchema = new Schema<ICard>(
  {
    cardNumber: {
      type: String,
      required: true,
    },
    last4: {
      type: String,
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cardType: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
      default: 'debit',
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'expired'],
      default: 'active',
    },
    cvv: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    dailyLimit: {
      type: Number,
      default: 1000,
    },
    dailySpent: {
      type: Number,
      default: 0,
    },
    lastResetDate: {
      type: Date,
      default: Date.now,
    },
    pin: {
      type: String,
    },
    pinAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
cardSchema.index({ last4: 1 });
cardSchema.index({ userId: 1, status: 1 });
cardSchema.index({ accountId: 1 });
cardSchema.index({ status: 1 });

// Pre-save hook for PIN hashing
cardSchema.pre('save', async function () {
  if (!this.isModified('pin') || !this.pin) return;

  const salt = await bcrypt.genSalt(12);
  this.pin = await bcrypt.hash(this.pin, salt);
});

// Note: cardNumber and CVV encryption should be done in the service layer
// before saving, using the encryption utility

// Methods
cardSchema.methods.validatePin = async function (candidatePin: string): Promise<boolean> {
  if (!this.pin) return false;
  return bcrypt.compare(candidatePin, this.pin);
};

cardSchema.methods.incrementPinAttempts = async function (): Promise<void> {
  const updates: any = { $inc: { pinAttempts: 1 } };

  // Block card after 3 failed PIN attempts
  if (this.pinAttempts + 1 >= 3) {
    updates.$set = { status: 'blocked' };
  }

  return this.updateOne(updates);
};

cardSchema.methods.resetPinAttempts = async function (): Promise<void> {
  return this.updateOne({
    $set: { pinAttempts: 0 },
  });
};

cardSchema.methods.blockCard = async function (): Promise<void> {
  return this.updateOne({
    $set: { status: 'blocked' },
  });
};

cardSchema.methods.resetDailyLimit = async function (): Promise<void> {
  return this.updateOne({
    $set: {
      dailySpent: 0,
      lastResetDate: new Date(),
    },
  });
};

cardSchema.methods.isWithinDailyLimit = function (amount: number): boolean {
  return this.dailySpent + amount <= this.dailyLimit;
};

const Card = mongoose.model<ICard>('Card', cardSchema);

export default Card;
