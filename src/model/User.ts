import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

// User roles
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SUPPORT = 'support',
  ACCOUNTANT = 'accountant',
}

// KYC status
export enum KYCStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

// KYC Data interface
interface IKYCData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  idType: string;
  idNumber: string;
  documents: {
    idDocument?: string;
    addressProof?: string;
    selfie?: string;
  };
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
}

// 2FA Settings interface
interface I2FASettings {
  enabled: boolean;
  secret?: string;
  backupCodes?: string[];
  enabledAt?: Date;
}

// Notification Preferences interface
interface INotificationPreferences {
  email: {
    transactions: boolean;
    security: boolean;
    marketing: boolean;
    statements: boolean;
  };
  inApp: {
    transactions: boolean;
    security: boolean;
    marketing: boolean;
  };
  push: {
    transactions: boolean;
    security: boolean;
    marketing: boolean;
  };
  sms: {
    transactions: boolean;
    security: boolean;
  };
}

// User interface
export interface IUser extends Document {
  email: string;
  phone: string;
  passwordHash: string;
  kycStatus: KYCStatus;
  kycData?: IKYCData;
  twoFactorAuth: I2FASettings;
  roles: UserRole[];
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  transactionPin?: string;
  transactionPinAttempts: number;
  transactionPinLockUntil?: Date;
  notificationPreferences: INotificationPreferences;
  deviceTokens: string[];
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  isLocked: boolean;
  fullName: string;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementLoginAttempts(): Promise<void>;
  lockAccount(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  compareTransactionPin(candidatePin: string): Promise<boolean>;
  incrementTransactionPinAttempts(): Promise<void>;
  resetTransactionPinAttempts(): Promise<void>;
}

// User schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    kycStatus: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.PENDING,
      index: true,
    },
    kycData: {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
      idType: String,
      idNumber: String,
      documents: {
        idDocument: String,
        addressProof: String,
        selfie: String,
      },
      verifiedAt: Date,
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectionReason: String,
    },
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false,
      },
      secret: {
        type: String,
        select: false,
      },
      backupCodes: {
        type: [String],
        select: false,
      },
      enabledAt: Date,
    },
    roles: {
      type: [String],
      enum: Object.values(UserRole),
      default: [UserRole.CUSTOMER],
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    lastLogin: Date,
    transactionPin: {
      type: String,
      select: false,
    },
    transactionPinAttempts: {
      type: Number,
      default: 0,
    },
    transactionPinLockUntil: Date,
    notificationPreferences: {
      email: {
        transactions: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
        statements: { type: Boolean, default: true },
      },
      inApp: {
        transactions: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
      },
      push: {
        transactions: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
      },
      sms: {
        transactions: { type: Boolean, default: false },
        security: { type: Boolean, default: false },
      },
    },
    deviceTokens: {
      type: [String],
      default: [],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: Date,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ phone: 1, isActive: 1 });
UserSchema.index({ kycStatus: 1, createdAt: -1 });
UserSchema.index({ roles: 1 });

// Virtual: isLocked
UserSchema.virtual('isLocked').get(function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Virtual: fullName
UserSchema.virtual('fullName').get(function (this: IUser) {
  if (this.kycData?.firstName && this.kycData?.lastName) {
    return `${this.kycData.firstName} ${this.kycData.lastName}`;
  }
  return this.email;
});

// Pre-save hook: Hash password
UserSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Pre-save hook: Hash transaction PIN
UserSchema.pre('save', async function () {
  if (!this.isModified('transactionPin') || !this.transactionPin) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.transactionPin = await bcrypt.hash(this.transactionPin, salt);
});

// Method: Compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    return false;
  }
};

// Method: Increment login attempts
UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) }; // Lock for 2 hours
  }

  await this.updateOne(updates);
};

// Method: Lock account
UserSchema.methods.lockAccount = async function (): Promise<void> {
  await this.updateOne({
    $set: {
      lockUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), 
    },
  });
};

// Method: Reset login attempts
UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Method: Compare transaction PIN
UserSchema.methods.compareTransactionPin = async function (
  candidatePin: string
): Promise<boolean> {
  if (!this.transactionPin) {
    return false;
  }

  try {
    return await bcrypt.compare(candidatePin, this.transactionPin);
  } catch (error) {
    return false;
  }
};

// Method: Increment transaction PIN attempts
UserSchema.methods.incrementTransactionPinAttempts = async function (): Promise<void> {
  // Reset attempts if lock has expired
  if (this.transactionPinLockUntil && this.transactionPinLockUntil < new Date()) {
    await this.updateOne({
      $set: { transactionPinAttempts: 1 },
      $unset: { transactionPinLockUntil: 1 },
    });
    return;
  }

  const updates: any = { $inc: { transactionPinAttempts: 1 } };

  // Lock PIN after 3 failed attempts
  const isPinLocked = this.transactionPinLockUntil && this.transactionPinLockUntil > new Date();
  if (this.transactionPinAttempts + 1 >= 3 && !isPinLocked) {
    updates.$set = { transactionPinLockUntil: new Date(Date.now() + 30 * 60 * 1000) }; // Lock for 30 minutes
  }

  await this.updateOne(updates);
};

// Method: Reset transaction PIN attempts
UserSchema.methods.resetTransactionPinAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { transactionPinAttempts: 0 },
    $unset: { transactionPinLockUntil: 1 },
  });
};

// Export model
export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
