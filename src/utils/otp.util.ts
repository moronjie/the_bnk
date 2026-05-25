import crypto from 'crypto';
import redis from '../config/redis.config';
import config from '../config';

export type OtpPurpose = 'email_verify' | 'password_reset';

const OTP_KEY = (purpose: OtpPurpose, email: string) =>
  `otp:${purpose}:${email.toLowerCase()}`;

const COOLDOWN_KEY = (purpose: OtpPurpose, email: string) =>
  `otp_cooldown:${purpose}:${email.toLowerCase()}`;

/**
 * Generates a cryptographically random 6-digit OTP and stores it in Redis.
 * Returns the plain-text OTP so it can be emailed to the user.
 */
export async function generateAndStoreOtp(
  purpose: OtpPurpose,
  email: string,
): Promise<string> {
  const otp = crypto.randomInt(100000, 999999).toString();

  await redis.set(
    OTP_KEY(purpose, email),
    otp,
    'EX',
    config.otpTtlSeconds,
  );

  await redis.set(
    COOLDOWN_KEY(purpose, email),
    '1',
    'EX',
    config.otpResendCooldownSeconds,
  );

  return otp;
}

/**
 * Verifies the OTP. Returns true and deletes it from Redis on success.
 * Returns false if not found or does not match.
 */
export async function verifyAndConsumeOtp(
  purpose: OtpPurpose,
  email: string,
  candidateOtp: string,
): Promise<boolean> {
  const key = OTP_KEY(purpose, email);
  const stored = await redis.get(key);

  if (!stored) return false; // expired or never sent

  const isMatch = stored === candidateOtp.trim();

  if (isMatch) {
    await redis.del(key);
    await redis.del(COOLDOWN_KEY(purpose, email));
  }

  return isMatch;
}

/**
 * Returns true if the user is still within the resend cooldown window.
 */
export async function isResendOnCooldown(
  purpose: OtpPurpose,
  email: string,
): Promise<boolean> {
  const result = await redis.get(COOLDOWN_KEY(purpose, email));
  return result !== null;
}

/**
 * Returns the remaining TTL (seconds) of the OTP, or 0 if not present.
 */
export async function getOtpTtl(
  purpose: OtpPurpose,
  email: string,
): Promise<number> {
  const ttl = await redis.ttl(OTP_KEY(purpose, email));
  return ttl > 0 ? ttl : 0;
}
