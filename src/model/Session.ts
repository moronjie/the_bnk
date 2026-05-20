import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  sessionId: string;
  deviceFingerprint?: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    city?: string;
    country?: string;
    lat?: number;
    lon?: number;
  };
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  terminated: boolean;
  refreshToken: string;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    deviceFingerprint: String,
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    location: {
      city: String,
      country: String,
      lat: Number,
      lon: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    terminated: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
sessionSchema.index({ sessionId: 1 }, { unique: true });
sessionSchema.index({ userId: 1, terminated: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
sessionSchema.index({ userId: 1, lastActivity: -1 });

const Session = mongoose.model<ISession>('Session', sessionSchema);

export default Session;
