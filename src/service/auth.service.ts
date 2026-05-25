import crypto from 'crypto';
import { User } from '../model/User';
import Session from '../model/Session';
import HTTP_STATUS from '../config/http.confiq';
import { CustomError, errorCodes } from '../middleware/errorHandler';
import {
  generateAndStoreOtp,
  verifyAndConsumeOtp,
  isResendOnCooldown,
  OtpPurpose,
} from '../utils/otp.util';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.util';
import { sendEmailVerificationOtp, sendPasswordResetOtp } from '../utils/email.util';
import type {
  RegisterInput,
  VerifyEmailInput,
  ResendOtpInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../validator/auth.validator';

export async function register(input: RegisterInput) {
  const { email, phone, password } = input;

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    const field = existing.email === email ? 'email' : 'phone';
    throw new CustomError(
      `An account with this ${field} already exists`,
      errorCodes.USER_EXISTS,
      HTTP_STATUS.CONFLICT,
    );
  }

  const user = await User.create({
    email,
    phone,
    passwordHash: password, 
    emailVerified: false,
  });

  const otp = await generateAndStoreOtp('email_verify', email);
  await sendEmailVerificationOtp(email, otp);

  return { message: 'Registration successful. Please check your email for the verification code.' };
}

export async function verifyEmail(input: VerifyEmailInput) {
  const { email, otp } = input;

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError('User not found', errorCodes.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (user.emailVerified) {
    throw new CustomError(
      'Email is already verified',
      errorCodes.BAD_REQUEST,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const valid = await verifyAndConsumeOtp('email_verify', email, otp);
  if (!valid) {
    throw new CustomError(
      'Invalid or expired verification code',
      errorCodes.OTP_INVALID,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  user.emailVerified = true;
  await user.save();

  return { message: 'Email verified successfully. You can now log in.' };
}

export async function resendOtp(input: ResendOtpInput) {
  const { email, purpose } = input;

  const user = await User.findOne({ email });
  if (!user) {
    return { message: 'If that email exists, a new code has been sent.' };
  }

  if (purpose === 'email_verify' && user.emailVerified) {
    throw new CustomError(
      'Email is already verified',
      errorCodes.BAD_REQUEST,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const onCooldown = await isResendOnCooldown(purpose as OtpPurpose, email);
  if (onCooldown) {
    throw new CustomError(
      'Please wait before requesting a new code',
      errorCodes.TOO_MANY_REQUESTS,
      HTTP_STATUS.TOO_MANY_REQUESTS,
    );
  }

  const otp = await generateAndStoreOtp(purpose as OtpPurpose, email);

  if (purpose === 'email_verify') {
    await sendEmailVerificationOtp(email, otp);
  } else {
    await sendPasswordResetOtp(email, otp);
  }

  return { message: 'If that email exists, a new code has been sent.' };
}

export async function login(
  input: LoginInput,
  meta: { ipAddress: string; userAgent: string },
) {
  const { email, password } = input;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new CustomError(
      'Invalid email or password',
      errorCodes.INVALID_CREDENTIALS,
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  if (!user.isActive) {
    throw new CustomError(
      'This account has been deactivated',
      errorCodes.ACCOUNT_INACTIVE,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (user.isLocked) {
    throw new CustomError(
      'Account is temporarily locked due to too many failed attempts. Try again later.',
      errorCodes.ACCOUNT_LOCKED,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (!user.emailVerified) {
    throw new CustomError(
      'Please verify your email before logging in',
      errorCodes.EMAIL_NOT_VERIFIED,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    await user.incrementLoginAttempts();
    throw new CustomError(
      'Invalid email or password',
      errorCodes.INVALID_CREDENTIALS,
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  await user.resetLoginAttempts();

  const sessionId = crypto.randomUUID();
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    roles: user.roles,
  });
  const refreshToken = signRefreshToken({ sub: user.id, sessionId });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

  await Session.create({
    userId: user._id,
    sessionId,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    refreshToken,
    expiresAt,
    lastActivity: new Date(),
  });

  user.lastLogin = new Date();
  await user.save();

  return { accessToken, refreshToken, sessionId };
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const { email } = input;

  const user = await User.findOne({ email });

  // Always respond with the same message to avoid user enumeration
  if (!user || !user.isActive) {
    return { message: 'If that email exists, a password reset code has been sent.' };
  }

  const otp = await generateAndStoreOtp('password_reset', email);
  await sendPasswordResetOtp(email, otp);

  return { message: 'If that email exists, a password reset code has been sent.' };
}

export async function resetPassword(input: ResetPasswordInput) {
  const { email, otp, newPassword } = input;

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError('User not found', errorCodes.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const valid = await verifyAndConsumeOtp('password_reset', email, otp);
  if (!valid) {
    throw new CustomError(
      'Invalid or expired reset code',
      errorCodes.OTP_INVALID,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  user.passwordHash = newPassword;
  await user.save();

  await Session.updateMany(
    { userId: user._id, terminated: false },
    { $set: { terminated: true } },
  );

  return { message: 'Password reset successful. Please log in with your new password.' };
}

export async function refreshToken(
  token: string,
  meta: { ipAddress: string; userAgent: string },
) {
  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new CustomError(
      'Invalid or expired refresh token',
      errorCodes.INVALID_TOKEN,
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  const { sub: userId, sessionId } = payload;

  const session = await Session.findOne({ sessionId });

  // Session not found — could be reuse of an already-rotated token (theft signal)
  // Terminate ALL sessions for this user as a precaution
  if (!session) {
    await Session.updateMany({ userId, terminated: false }, { $set: { terminated: true } });
    throw new CustomError(
      'Refresh token already used or revoked',
      errorCodes.INVALID_TOKEN,
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  if (session.terminated) {
    throw new CustomError(
      'Session has been terminated',
      errorCodes.INVALID_TOKEN,
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new CustomError(
      'Account not found or deactivated',
      errorCodes.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  // Rotate: delete old session, issue new tokens, create new session
  await session.deleteOne();

  const newSessionId = crypto.randomUUID();
  const accessToken = signAccessToken({ sub: user.id, email: user.email, roles: user.roles });
  const newRefreshToken = signRefreshToken({ sub: user.id, sessionId: newSessionId });
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await Session.create({
    userId: user._id,
    sessionId: newSessionId,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    refreshToken: newRefreshToken,
    expiresAt,
    lastActivity: new Date(),
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(token: string) {
  try {
    const { sessionId } = verifyRefreshToken(token);
    await Session.deleteOne({ sessionId });
  } catch {
  }

  return { message: 'Logged out successfully.' };
}
