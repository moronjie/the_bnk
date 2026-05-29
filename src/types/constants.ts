/**
 * Banking application constants
 * Configuration values, limits, and business rules
 */

// ========== BANKING LIMITS ==========

export const ACCOUNT_LIMITS = {
  SAVINGS: {
    MIN_INITIAL_DEPOSIT: 100,
    MIN_BALANCE: 0,
    DAILY_WITHDRAWAL_LIMIT: 5000,
    MONTHLY_TRANSACTION_LIMIT: 100,
    INTEREST_RATE: 2.5, // Annual percentage
  },
  CHECKING: {
    MIN_INITIAL_DEPOSIT: 25,
    MIN_BALANCE: 0,
    DAILY_WITHDRAWAL_LIMIT: 10000,
    MONTHLY_TRANSACTION_LIMIT: 500,
    OVERDRAFT_LIMIT: 500,
    INTEREST_RATE: 0.1,
  },
  CREDIT: {
    DEFAULT_LIMIT: 5000,
    MAX_LIMIT: 50000,
    INTEREST_RATE: 18.99,
    LATE_FEE: 35,
    MIN_PAYMENT_PERCENT: 5,
  },
} as const;

export const CARD_LIMITS = {
  DAILY_LIMIT: 1000,
  WEEKLY_LIMIT: 5000,
  MONTHLY_LIMIT: 20000,
  SINGLE_TRANSACTION_LIMIT: 5000,
  ATM_DAILY_LIMIT: 500,
  PIN_ATTEMPTS: 3,
  CVV_LENGTH: 3,
} as const;

export const LOAN_LIMITS = {
  PERSONAL: {
    MIN_AMOUNT: 1000,
    MAX_AMOUNT: 50000,
    MIN_TENURE: 6, // months
    MAX_TENURE: 60,
    INTEREST_RATE: 12.5,
  },
  HOME: {
    MIN_AMOUNT: 50000,
    MAX_AMOUNT: 1000000,
    MIN_TENURE: 60,
    MAX_TENURE: 360,
    INTEREST_RATE: 7.5,
  },
  AUTO: {
    MIN_AMOUNT: 5000,
    MAX_AMOUNT: 100000,
    MIN_TENURE: 12,
    MAX_TENURE: 84,
    INTEREST_RATE: 9.5,
  },
  EDUCATION: {
    MIN_AMOUNT: 1000,
    MAX_AMOUNT: 150000,
    MIN_TENURE: 12,
    MAX_TENURE: 180,
    INTEREST_RATE: 8.5,
  },
  BUSINESS: {
    MIN_AMOUNT: 10000,
    MAX_AMOUNT: 500000,
    MIN_TENURE: 12,
    MAX_TENURE: 120,
    INTEREST_RATE: 11.0,
  },
} as const;

export const TRANSACTION_LIMITS = {
  INTERNAL_TRANSFER: {
    MIN_AMOUNT: 1,
    MAX_AMOUNT: 100000,
    DAILY_LIMIT: 50000,
    DAILY_COUNT: 50,
  },
  EXTERNAL_TRANSFER: {
    MIN_AMOUNT: 10,
    MAX_AMOUNT: 50000,
    DAILY_LIMIT: 25000,
    DAILY_COUNT: 10,
  },
  BILL_PAYMENT: {
    MIN_AMOUNT: 1,
    MAX_AMOUNT: 10000,
    DAILY_LIMIT: 20000,
  },
  CRYPTO: {
    MIN_AMOUNT: 10,
    MAX_AMOUNT: 50000,
    DAILY_LIMIT: 100000,
  },
} as const;

// ========== SECURITY SETTINGS ==========

export const SECURITY = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  PIN: {
    LENGTH: 4,
    MAX_ATTEMPTS: 3,
  },
  OTP: {
    LENGTH: 6,
    EXPIRY_MINUTES: 10,
    RESEND_COOLDOWN_SECONDS: 60,
    MAX_ATTEMPTS: 5,
  },
  LOGIN: {
    MAX_FAILED_ATTEMPTS: 5,
    LOCK_DURATION_MINUTES: 30,
  },
  SESSION: {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    MAX_ACTIVE_SESSIONS: 5,
  },
  TWO_FA: {
    ISSUER: 'BankApp',
    WINDOW: 2, // Number of time steps to check
  },
} as const;

// ========== RATE LIMITING ==========

export const RATE_LIMITS = {
  GLOBAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 10,
  },
  TRANSACTION: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 10,
  },
  API: {
    WINDOW_MS: 60 * 1000,
    MAX_REQUESTS: 60,
  },
} as const;

// ========== FRAUD DETECTION ==========

export const FRAUD_DETECTION = {
  VELOCITY_CHECK: {
    MAX_TRANSACTIONS_PER_HOUR: 20,
    MAX_TRANSACTIONS_PER_DAY: 100,
  },
  AMOUNT_THRESHOLD: {
    SUSPICIOUS_AMOUNT: 10000,
    HIGH_RISK_AMOUNT: 50000,
  },
  LOCATION: {
    MAX_DISTANCE_KM: 500, // Max distance between consecutive transactions
    TIME_WINDOW_HOURS: 2,
  },
  PATTERN: {
    RAPID_SMALL_TRANSACTIONS: 5, // Number of small transactions in short time
    TIME_WINDOW_MINUTES: 10,
    SMALL_AMOUNT_THRESHOLD: 100,
  },
  SCORE_THRESHOLDS: {
    LOW_RISK: 30,
    MEDIUM_RISK: 60,
    HIGH_RISK: 80,
  },
} as const;

// ========== FEES ==========

export const FEES = {
  ATM_WITHDRAWAL: {
    OWN_BANK: 0,
    OTHER_BANK: 2.5,
  },
  INTERNATIONAL_TRANSFER: 25,
  CURRENCY_EXCHANGE: 0.5, // Percentage
  STATEMENT_GENERATION: 5,
  CARD_REPLACEMENT: 10,
  OVERDRAFT: 35,
  LATE_PAYMENT: 35,
  ACCOUNT_CLOSURE: 0,
  INSUFFICIENT_FUNDS: 30,
} as const;

// ========== ACCOUNT NUMBER GENERATION ==========

export const ACCOUNT_NUMBER = {
  BANK_CODE: '123456', // Mock bank code
  LENGTH: 16,
  PREFIX: {
    SAVINGS: '1',
    CHECKING: '2',
    CREDIT: '3',
    LOAN: '4',
  },
} as const;

// ========== CARD GENERATION ==========

export const CARD = {
  BIN: '453200', // Mock BIN (Bank Identification Number)
  EXPIRY_YEARS: 3,
  CVV_LENGTH: 3,
} as const;

// ========== INTEREST CALCULATION ==========

export const INTEREST = {
  COMPOUNDING_FREQUENCY: {
    MONTHLY: 12,
    QUARTERLY: 4,
    ANNUALLY: 1,
  },
  SAVINGS_RATE: 2.5, // Annual percentage
  CREDIT_RATE: 18.99,
} as const;

// ========== NOTIFICATION SETTINGS ==========

export const NOTIFICATIONS = {
  TRANSACTION_THRESHOLD: 1000, // Notify for transactions above this amount
  BUDGET_ALERT_THRESHOLDS: [50, 75, 90, 100], // Percentage of budget
  EMAIL: {
    FROM: process.env.EMAIL_FROM || 'noreply@bankapp.com',
    SUPPORT: process.env.EMAIL_SUPPORT || 'support@bankapp.com',
  },
} as const;

// ========== COMPLIANCE ==========

export const COMPLIANCE = {
  AML: {
    CASH_REPORTING_THRESHOLD: 10000, // Report cash transactions above this
    SUSPICIOUS_ACTIVITY_THRESHOLD: 5000,
  },
  KYC: {
    DOCUMENT_EXPIRY_DAYS: 365,
    RE_VERIFICATION_DAYS: 730, // Re-verify every 2 years
  },
  DATA_RETENTION: {
    TRANSACTION_RECORDS: 2555, // 7 years in days
    AUDIT_LOGS: 2555,
    DELETED_ACCOUNTS: 365,
  },
} as const;

// ========== PAGINATION ==========

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ========== ERROR CODES ==========

export const ERROR_CODES = {
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  
  // User
  USER_EXISTS: 'USER_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  
  // Account
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  ACCOUNT_FROZEN: 'ACCOUNT_FROZEN',
  DUPLICATE_ACCOUNT: 'DUPLICATE_ACCOUNT',
  
  // Transaction
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  DAILY_LIMIT_EXCEEDED: 'DAILY_LIMIT_EXCEEDED',
  TRANSACTION_LIMIT_EXCEEDED: 'TRANSACTION_LIMIT_EXCEEDED',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
  
  // Card
  CARD_BLOCKED: 'CARD_BLOCKED',
  CARD_EXPIRED: 'CARD_EXPIRED',
  INVALID_PIN: 'INVALID_PIN',
  
  // Loan
  LOAN_NOT_ELIGIBLE: 'LOAN_NOT_ELIGIBLE',
  LOAN_LIMIT_EXCEEDED: 'LOAN_LIMIT_EXCEEDED',
  
  // Security
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  FRAUD_DETECTED: 'FRAUD_DETECTED',
  
  // Resource
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
} as const;

// ========== HTTP STATUS CODES ==========

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ========== REDIS KEYS ==========

export const REDIS_KEYS = {
  OTP: (purpose: string, identifier: string) => `otp:${purpose}:${identifier}`,
  RATE_LIMIT: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,
  TRANSACTION_LOCK: (accountId: string) => `lock:transaction:${accountId}`,
  TOKEN_BLACKLIST: (token: string) => `blacklist:token:${token}`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
  IDEMPOTENCY: (key: string) => `idempotency:${key}`,
} as const;

// ========== REDIS TTL (in seconds) ==========

export const REDIS_TTL = {
  OTP: 600, // 10 minutes
  RATE_LIMIT: 900, // 15 minutes
  TRANSACTION_LOCK: 30, // 30 seconds
  TOKEN_BLACKLIST: 900, // 15 minutes (match token expiry)
  SESSION: 604800, // 7 days
  IDEMPOTENCY: 86400, // 24 hours
} as const;
