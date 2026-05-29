import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/enums';
import { CustomError, errorCodes } from './errorHandler';
import HTTP_STATUS from '../config/http.confiq';
import logger from '../config/logger.config';

/**
 * Role-based authorization middleware
 * Checks if the authenticated user has one of the required roles
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        throw new CustomError(
          'Authentication required',
          errorCodes.UNAUTHORIZED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }
      
      const userRoles: UserRole[] = user.roles || [];
      
      // Check if user has any of the allowed roles
      const hasPermission = userRoles.some(role => allowedRoles.includes(role));
      
      if (!hasPermission) {
        logger.warn('Access denied - insufficient permissions', {
          userId: user.sub,
          userRoles,
          requiredRoles: allowedRoles,
          path: req.path,
          method: req.method,
        });
        
        throw new CustomError(
          'You do not have permission to access this resource',
          errorCodes.FORBIDDEN,
          HTTP_STATUS.FORBIDDEN,
        );
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check if user is admin
 */
export const isAdmin = authorize(UserRole.ADMIN);

/**
 * Check if user is customer
 */
export const isCustomer = authorize(UserRole.CUSTOMER);

/**
 * Check if user is support staff
 */
export const isSupport = authorize(UserRole.SUPPORT, UserRole.ADMIN);

/**
 * Check if user is accountant
 */
export const isAccountant = authorize(UserRole.ACCOUNTANT, UserRole.ADMIN);

/**
 * Check if user is teller
 */
export const isTeller = authorize(UserRole.TELLER, UserRole.ADMIN);

/**
 * Check if user has financial operation permissions (customer or admin)
 */
export const canPerformFinancialOperations = authorize(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.TELLER);

/**
 * Resource ownership middleware
 * Ensures user can only access their own resources (unless admin)
 */
export function checkResourceOwnership(resourceUserIdExtractor: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        throw new CustomError(
          'Authentication required',
          errorCodes.UNAUTHORIZED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }
      
      const userRoles: UserRole[] = user.roles || [];
      
      // Admins can access any resource
      if (userRoles.includes(UserRole.ADMIN)) {
        return next();
      }
      
      // Extract resource user ID
      const resourceUserId = resourceUserIdExtractor(req);
      
      // Check if user owns the resource
      if (resourceUserId !== user.sub) {
        logger.warn('Access denied - resource ownership violation', {
          userId: user.sub,
          resourceUserId,
          path: req.path,
          method: req.method,
        });
        
        throw new CustomError(
          'You can only access your own resources',
          errorCodes.FORBIDDEN,
          HTTP_STATUS.FORBIDDEN,
        );
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Permission checker utility
 * Can be used programmatically within route handlers
 */
export function hasPermission(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  return userRoles.some(role => requiredRoles.includes(role));
}

/**
 * Check if user is resource owner or has admin role
 */
export function isOwnerOrAdmin(userId: string, resourceUserId: string, userRoles: UserRole[]): boolean {
  return userId === resourceUserId || userRoles.includes(UserRole.ADMIN);
}
