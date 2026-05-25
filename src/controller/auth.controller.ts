import { Request, Response } from 'express';
import HTTP_STATUS from '../config/http.confiq';
import { CustomError, errorCodes, asyncHandler } from '../middleware/errorHandler';
import config from '../config';
import {
  registerSchema,
  verifyEmailSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validator/auth.validator';
import * as authService from '../service/auth.service';
import { parseBody } from '../validator';

const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 1000, 
};



// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = parseBody(registerSchema, req.body);
  const result = await authService.register(input);
  res.status(HTTP_STATUS.CREATED).json(result);
});

// POST /api/auth/verify-email
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const input = parseBody(verifyEmailSchema, req.body);
  const result = await authService.verifyEmail(input);
  res.status(HTTP_STATUS.OK).json(result);
});

// POST /api/auth/resend-otp
export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const input = parseBody(resendOtpSchema, req.body);
  const result = await authService.resendOtp(input);
  res.status(HTTP_STATUS.OK).json(result);
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = parseBody(loginSchema, req.body);
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  const { accessToken, refreshToken } = await authService.login(input, {
    ipAddress,
    userAgent,
  });

  res
    .cookie(REFRESH_COOKIE, refreshToken, cookieOptions)
    .status(HTTP_STATUS.OK)
    .json({ accessToken });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = parseBody(forgotPasswordSchema, req.body);
  const result = await authService.forgotPassword(input);
  res.status(HTTP_STATUS.OK).json(result);
});

// POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = parseBody(resetPasswordSchema, req.body);
  const result = await authService.resetPassword(input);
  res.clearCookie(REFRESH_COOKIE).status(HTTP_STATUS.OK).json(result);
});
 
// POST /api/auth/refresh
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new CustomError('Refresh token missing', errorCodes.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  const { accessToken, refreshToken } = await authService.refreshToken(token, { ipAddress, userAgent });

  res
    .cookie(REFRESH_COOKIE, refreshToken, cookieOptions)
    .status(HTTP_STATUS.OK)
    .json({ accessToken });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  const result = await authService.logout(token ?? '');
  res.clearCookie(REFRESH_COOKIE).status(HTTP_STATUS.OK).json(result);
});
