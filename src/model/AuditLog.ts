import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';

export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  eventType: string;
  entityType?: string;
  entityId?: Types.ObjectId;
  action: string;
  changes?: {
    before: any;
    after: any;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  complianceCategory: 'KYC' | 'AML' | 'TRANSACTION' | 'ACCESS' | 'SECURITY' | 'OTHER';
  requestId?: string;
  sessionId?: string;
  hash: string;
  previousHash: string;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    eventType: {
      type: String,
      required: true,
    },
    entityType: String,
    entityId: {
      type: Schema.Types.ObjectId,
    },
    action: {
      type: String,
      required: true,
    },
    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    complianceCategory: {
      type: String,
      enum: ['KYC', 'AML', 'TRANSACTION', 'ACCESS', 'SECURITY', 'OTHER'],
      required: true,
    },
    requestId: String,
    sessionId: String,
    hash: {
      type: String,
      required: true,
    },
    previousHash: {
      type: String,
      required: true,
    },
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ eventType: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ complianceCategory: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ hash: 1 }, { unique: true });

// Pre-save hook to create hash chain
auditLogSchema.pre('save', async function () {
  if (!this.isNew) return;

  // Get the last audit log to get previousHash
  const lastLog = await mongoose.model<IAuditLog>('AuditLog').findOne().sort({ timestamp: -1 });
  this.previousHash = lastLog?.hash || '0';

  // Create hash of current record
  const data = JSON.stringify({
    userId: this.userId,
    eventType: this.eventType,
    action: this.action,
    timestamp: this.timestamp,
    previousHash: this.previousHash,
  });

  this.hash = crypto.createHash('sha256').update(data).digest('hex');
});

// Prevent updates - audit logs are immutable
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('Audit logs cannot be modified');
});

auditLogSchema.pre('updateOne', function () {
  throw new Error('Audit logs cannot be modified');
});

auditLogSchema.pre('updateMany', function () {
  throw new Error('Audit logs cannot be modified');
});

const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;
