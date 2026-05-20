import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICryptoWallet extends Document {
  userId: Types.ObjectId;
  walletAddress: string;
  cryptocurrency: 'BTC' | 'ETH' | 'USDT' | 'BNB' | 'ADA';
  balance: mongoose.Types.Decimal128;
  privateKey: string; // Encrypted
  publicKey: string;
  network: 'mainnet' | 'testnet';
  status: 'active' | 'frozen' | 'closed';
  createdAt: Date;
  updatedAt: Date;

  // Methods
  getBalance(): number;
  validateAddress(address: string): boolean;
}

const cryptoWalletSchema = new Schema<ICryptoWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    cryptocurrency: {
      type: String,
      enum: ['BTC', 'ETH', 'USDT', 'BNB', 'ADA'],
      required: true,
    },
    balance: {
      type: Schema.Types.Decimal128,
      default: 0,
    },
    privateKey: {
      type: String,
      required: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    network: {
      type: String,
      enum: ['mainnet', 'testnet'],
      default: 'mainnet',
    },
    status: {
      type: String,
      enum: ['active', 'frozen', 'closed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
cryptoWalletSchema.index({ userId: 1, cryptocurrency: 1 });
cryptoWalletSchema.index({ walletAddress: 1 }, { unique: true });
cryptoWalletSchema.index({ userId: 1, status: 1 });

// Note: privateKey encryption should be done in the service layer
// before saving, using the encryption utility

// Methods
cryptoWalletSchema.methods.getBalance = function (): number {
  return parseFloat(this.balance.toString());
};

cryptoWalletSchema.methods.validateAddress = function (address: string): boolean {
  // Basic validation - in production, use proper address validation libraries
  if (!address || address.length < 26 || address.length > 62) {
    return false;
  }

  // Add cryptocurrency-specific validation
  switch (this.cryptocurrency) {
    case 'BTC':
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
    case 'ETH':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'USDT':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    default:
      return true;
  }
};

const CryptoWallet = mongoose.model<ICryptoWallet>('CryptoWallet', cryptoWalletSchema);

export default CryptoWallet;
