import { Request, Response, NextFunction } from 'express';
import { CustomError, errorCodes } from './errorHandler';
import HTTP_STATUS from '../config/http.confiq';
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt.util';
import { User } from '../model/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: string[];
      };
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError(
        'No authorization token provided',
        errorCodes.UNAUTHORIZED,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7); 

    let payload: AccessTokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new CustomError(
          'Access token has expired',
          errorCodes.TOKEN_EXPIRED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }
      throw new CustomError(
        'Invalid access token',
        errorCodes.INVALID_TOKEN,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    if (payload.type !== 'access') {
      throw new CustomError(
        'Invalid token type',
        errorCodes.INVALID_TOKEN,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new CustomError(
        'User not found',
        errorCodes.USER_NOT_FOUND,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    if (!user.isActive) {
      throw new CustomError(
        'Account has been deactivated',
        errorCodes.ACCOUNT_INACTIVE,
        HTTP_STATUS.FORBIDDEN,
      );
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-based Authorization Middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Middleware function that checks if user has required role
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new CustomError(
          'Authentication required',
          errorCodes.UNAUTHORIZED,
          HTTP_STATUS.UNAUTHORIZED,
        ),
      );
    }

    const hasRole = allowedRoles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      return next(
        new CustomError(
          'You do not have permission to access this resource',
          errorCodes.FORBIDDEN,
          HTTP_STATUS.FORBIDDEN,
        ),
      );
    }

    next();
  };
}

