import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * Generate a new UUID v4
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Generate a transaction ID with prefix
 * Format: TXN-{uuid}
 */
export function generateTransactionId(): string {
  return `TXN-${uuidv4()}`;
}

/**
 * Generate a session ID
 * Format: SES-{uuid}
 */
export function generateSessionId(): string {
  return `SES-${uuidv4()}`;
}

/**
 * Generate a request ID for tracing
 * Format: REQ-{uuid}
 */
export function generateRequestId(): string {
  return `REQ-${uuidv4()}`;
}

/**
 * Generate an idempotency key
 */
export function generateIdempotencyKey(): string {
  return uuidv4();
}

/**
 * Generate a loan number
 * Format: LN-{timestamp}-{short-uuid}
 */
export function generateLoanNumber(): string {
  const timestamp = Date.now();
  const shortUuid = uuidv4().split('-')[0];
  return `LN-${timestamp}-${shortUuid}`;
}

/**
 * Generate a card number (mock - not real Luhn-valid card)
 * For production, use proper card number generation with Luhn algorithm
 * Format: 16 digits
 */
export function generateMockCardNumber(bin: string = '4532'): string {
  // BIN (Bank Identification Number) - first 6 digits
  // For testing: 4532 is a common test BIN
  const middle = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const accountNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // This is a mock card number - in production, implement proper Luhn algorithm
  return `${bin}${middle}${accountNumber}`;
}

/**
 * Generate a CVV (3 digits)
 */
export function generateCVV(): string {
  return Math.floor(Math.random() * 900 + 100).toString();
}

/**
 * Validate if string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  return uuidValidate(uuid);
}

/**
 * Generate a verification code (6 digits)
 */
export function generateVerificationCode(length: number = 6): string {
  const max = Math.pow(10, length) - 1;
  const min = Math.pow(10, length - 1);
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

/**
 * Generate a PIN (4 or 6 digits)
 */
export function generatePIN(length: number = 4): string {
  return generateVerificationCode(length);
}

/**
 * Generate a reference number for transactions
 * Format: REF-{timestamp}-{random}
 */
export function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REF-${timestamp}-${random}`;
}
