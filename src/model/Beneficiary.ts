import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBeneficiary extends Document {
  userId: Types.ObjectId;
  beneficiaryName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  nickname?: string;
  verified: boolean;
  verificationAmount?: number;
  addedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const beneficiarySchema = new Schema<IBeneficiary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    beneficiaryName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    bankCode: {
      type: String,
      required: true,
      trim: true,
    },
    nickname: {
      type: String,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationAmount: {
      type: Number,
    },
    addedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
beneficiarySchema.index({ userId: 1 });
beneficiarySchema.index({ userId: 1, accountNumber: 1 }, { unique: true });
beneficiarySchema.index({ userId: 1, verified: 1 });

// Validation for account number format
beneficiarySchema.pre('save', function () {
  // Basic validation - adjust based on your requirements
  if (this.accountNumber.length < 8 || this.accountNumber.length > 18) {
    throw new Error('Account number must be between 8 and 18 characters');
  }

  // Validate bank code exists (you can add a list of valid bank codes)
  if (!this.bankCode || this.bankCode.length < 3) {
    throw new Error('Invalid bank code');
  }
});

const Beneficiary = mongoose.model<IBeneficiary>('Beneficiary', beneficiarySchema);

export default Beneficiary;
