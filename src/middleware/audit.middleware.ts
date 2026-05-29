import type { Request, Response, NextFunction } from 'express';
import AuditLog from '../model/AuditLog';
import { AuditEventType, AuditSeverity } from '../types/enums';
import { createHashChain } from '../utils/encryption.util';
import logger from '../config/logger.config';

/**
 * Audit logging middleware
 * Captures all requests for compliance and security
 */
export function auditLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Capture response data
  const originalJson = res.json.bind(res);
  let responseBody: any;
  
  res.json = function (body: any) {
    responseBody = body;
    return originalJson(body);
  };
  
  // Log after response is sent
  res.on('finish', async () => {
    try {
      const user = (req as any).user;
      const duration = Date.now() - startTime;
      
      // Determine if this request should be audited
      const shouldAudit = shouldAuditRequest(req, res);
      
      if (shouldAudit) {
        const auditData = {
          userId: user?.sub,
          eventType: determineEventType(req, res),
          entityType: extractEntityType(req),
          entityId: extractEntityId(req, responseBody),
          action: `${req.method} ${req.path}`,
          changes: extractChanges(req, responseBody),
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get('user-agent'),
          timestamp: new Date(),
          severity: determineSeverity(req, res),
          complianceCategory: determineComplianceCategory(req),
          requestId: req.requestId,
          sessionId: user?.sessionId,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            query: req.query,
          },
        };
        
        // Get previous audit log hash for chain
        const lastAudit = await AuditLog.findOne().sort({ createdAt: -1 }).select('hash');
        const previousHash = lastAudit?.hash || '';
        
        // Create hash chain
        const dataToHash = JSON.stringify({
          ...auditData,
          timestamp: auditData.timestamp.toISOString(),
        });
        const hash = createHashChain(dataToHash, previousHash);
        
        // Save audit log
        await AuditLog.create({
          ...auditData,
          hash,
          previousHash,
        });
      }
    } catch (error) {
      logger.error('Failed to create audit log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
      });
      // Don't fail the request if audit logging fails
    }
  });
  
  next();
}

/**
 * Determine if request should be audited
 */
function shouldAuditRequest(req: Request, res: Response): boolean {
  // Audit all non-GET requests
  if (req.method !== 'GET') {
    return true;
  }
  
  // Audit failed requests
  if (res.statusCode >= 400) {
    return true;
  }
  
  // Audit specific sensitive GET endpoints
  const sensitivePatterns = [
    /\/api\/accounts/,
    /\/api\/transactions/,
    /\/api\/users\/profile/,
  ];
  
  return sensitivePatterns.some(pattern => pattern.test(req.path));
}

/**
 * Determine audit event type from request
 */
function determineEventType(req: Request, res: Response): AuditEventType {
  const path = req.path.toLowerCase();
  const method = req.method.toUpperCase();
  
  // Authentication events
  if (path.includes('/auth/register')) return AuditEventType.USER_REGISTERED;
  if (path.includes('/auth/login')) return AuditEventType.USER_LOGIN;
  if (path.includes('/auth/logout')) return AuditEventType.USER_LOGOUT;
  if (path.includes('/auth/verify-email')) return AuditEventType.EMAIL_VERIFIED;
  if (path.includes('/auth/reset-password')) return AuditEventType.PASSWORD_RESET;
  
  // Account events
  if (path.includes('/accounts') && method === 'POST') return AuditEventType.ACCOUNT_CREATED;
  if (path.includes('/accounts') && method === 'PUT') return AuditEventType.ACCOUNT_UPDATED;
  
  // Transaction events
  if (path.includes('/transactions')) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return AuditEventType.TRANSACTION_COMPLETED;
    } else {
      return AuditEventType.TRANSACTION_FAILED;
    }
  }
  
  // Card events
  if (path.includes('/cards/block')) return AuditEventType.CARD_BLOCKED;
  if (path.includes('/cards/unblock')) return AuditEventType.CARD_UNBLOCKED;
  
  // Default for access denied
  if (res.statusCode === 403) return AuditEventType.ACCESS_DENIED;
  
  // Generic transaction created for POST requests
  if (method === 'POST') return AuditEventType.TRANSACTION_CREATED;
  
  return AuditEventType.USER_LOGIN; // Default fallback
}

/**
 * Extract entity type from request path
 */
function extractEntityType(req: Request): string {
  const path = req.path.toLowerCase();
  
  if (path.includes('/users')) return 'User';
  if (path.includes('/accounts')) return 'Account';
  if (path.includes('/transactions')) return 'Transaction';
  if (path.includes('/cards')) return 'Card';
  if (path.includes('/loans')) return 'Loan';
  if (path.includes('/investments')) return 'Investment';
  if (path.includes('/beneficiaries')) return 'Beneficiary';
  
  return 'Unknown';
}

/**
 * Extract entity ID from request or response
 */
function extractEntityId(req: Request, responseBody: any): string | undefined {
  // Try to get from URL params
  if (req.params.id) return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (req.params.accountId) return Array.isArray(req.params.accountId) ? req.params.accountId[0] : req.params.accountId;
  if (req.params.transactionId) return Array.isArray(req.params.transactionId) ? req.params.transactionId[0] : req.params.transactionId;
  
  // Try to get from response body
  if (responseBody?.data?.id) return responseBody.data.id;
  if (responseBody?.data?._id) return responseBody.data._id;
  if (responseBody?.account?.id) return responseBody.account.id;
  if (responseBody?.transaction?.id) return responseBody.transaction.id;
  
  return undefined;
}

/**
 * Extract changes from request body
 */
function extractChanges(req: Request, responseBody: any): any {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    return {
      before: null,
      after: sanitizeData(req.body),
    };
  }
  
  if (req.method === 'DELETE') {
    return {
      before: { id: req.params.id },
      after: null,
    };
  }
  
  return null;
}

/**
 * Determine severity level
 */
function determineSeverity(req: Request, res: Response): AuditSeverity {
  if (res.statusCode >= 500) return AuditSeverity.CRITICAL;
  if (res.statusCode >= 400) return AuditSeverity.ERROR;
  if (res.statusCode === 401 || res.statusCode === 403) return AuditSeverity.WARNING;
  
  const path = req.path.toLowerCase();
  if (path.includes('/transactions') || path.includes('/transfer')) {
    return AuditSeverity.WARNING; // Financial operations
  }
  
  return AuditSeverity.INFO;
}

/**
 * Determine compliance category
 */
function determineComplianceCategory(req: Request): 'aml' | 'kyc' | 'fraud' | 'regulatory' | 'privacy' | 'security' | undefined {
  const path = req.path.toLowerCase();
  
  if (path.includes('/auth') || path.includes('/kyc')) return 'kyc';
  if (path.includes('/transactions') || path.includes('/transfer')) return 'aml';
  if (path.includes('/fraud')) return 'fraud';
  if (path.includes('/password') || path.includes('/2fa')) return 'security';
  
  return undefined;
}

/**
 * Sanitize sensitive data from logs
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'passwordHash', 'pin', 'cvv', 'cardNumber', 'privateKey', 'otp'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
}
