/**
 * Enums for banking application
 * Centralized enum definitions for type safety and consistency
 */

// ========== USER ENUMS ==========

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SUPPORT = 'support',
  ACCOUNTANT = 'accountant',
  TELLER = 'teller',
}

export enum KYCStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// ========== ACCOUNT ENUMS ==========

export enum AccountType {
  SAVINGS = 'savings',
  CHECKING = 'checking',
  CREDIT = 'credit',
  LOAN = 'loan',
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FROZEN = 'frozen',
  CLOSED = 'closed',
  SUSPENDED = 'suspended',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
  GHS = 'GHS',
}

// ========== TRANSACTION ENUMS ==========

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
  TRANSFER = 'transfer',
  FEE = 'fee',
  INTEREST = 'interest',
  REVERSAL = 'reversal',
  REFUND = 'refund',
}

export enum TransactionCategory {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  INTERNAL_TRANSFER = 'internal_transfer',
  EXTERNAL_TRANSFER = 'external_transfer',
  CARD_PAYMENT = 'card_payment',
  ATM_WITHDRAWAL = 'atm_withdrawal',
  LOAN_PAYMENT = 'loan_payment',
  LOAN_DISBURSEMENT = 'loan_disbursement',
  INVESTMENT = 'investment',
  INVESTMENT_SALE = 'investment_sale',
  CRYPTO_PURCHASE = 'crypto_purchase',
  CRYPTO_SALE = 'crypto_sale',
  CRYPTO_TRANSFER = 'crypto_transfer',
  BILL_PAYMENT = 'bill_payment',
  RECURRING_PAYMENT = 'recurring_payment',
  CURRENCY_EXCHANGE = 'currency_exchange',
  FEE_CHARGE = 'fee_charge',
  INTEREST_CREDIT = 'interest_credit',
  REVERSAL = 'reversal',
  REFUND = 'refund',
  OTHER = 'other',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
  CANCELLED = 'cancelled',
}

// ========== CARD ENUMS ==========

export enum CardType {
  DEBIT = 'debit',
  CREDIT = 'credit',
  VIRTUAL = 'virtual',
  PREPAID = 'prepaid',
}

export enum CardStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
  LOST = 'lost',
  STOLEN = 'stolen',
  DAMAGED = 'damaged',
}

// ========== LOAN ENUMS ==========

export enum LoanType {
  PERSONAL = 'personal',
  HOME = 'home',
  AUTO = 'auto',
  EDUCATION = 'education',
  BUSINESS = 'business',
}

export enum LoanStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  CLOSED = 'closed',
  DEFAULTED = 'defaulted',
  OVERDUE = 'overdue',
}

export enum EMIStatus {
  SCHEDULED = 'scheduled',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
}

// ========== INVESTMENT ENUMS ==========

export enum InvestmentType {
  STOCKS = 'stocks',
  BONDS = 'bonds',
  CRYPTO = 'crypto',
  MUTUAL_FUNDS = 'mutual_funds',
  ETF = 'etf',
  COMMODITIES = 'commodities',
}

export enum InvestmentStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}

// ========== CRYPTO ENUMS ==========

export enum CryptoCurrency {
  BTC = 'BTC',
  ETH = 'ETH',
  USDT = 'USDT',
  USDC = 'USDC',
  BNB = 'BNB',
  XRP = 'XRP',
}

export enum CryptoNetwork {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

export enum CryptoWalletStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

// ========== BILL PAYMENT ENUMS ==========

export enum BillCategory {
  ELECTRICITY = 'electricity',
  WATER = 'water',
  GAS = 'gas',
  INTERNET = 'internet',
  MOBILE = 'mobile',
  TV = 'tv',
  INSURANCE = 'insurance',
  CREDIT_CARD = 'credit_card',
  OTHER = 'other',
}

export enum BillPaymentStatus {
  SCHEDULED = 'scheduled',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// ========== RECURRING PAYMENT ENUMS ==========

export enum RecurringFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum RecurringPaymentStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

// ========== NOTIFICATION ENUMS ==========

export enum NotificationType {
  EMAIL = 'email',
  IN_APP = 'in_app',
  PUSH = 'push',
  SMS = 'sms',
}

export enum NotificationChannel {
  TRANSACTION = 'transaction',
  SECURITY = 'security',
  ACCOUNT = 'account',
  MARKETING = 'marketing',
  SYSTEM = 'system',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// ========== AUDIT LOG ENUMS ==========

export enum AuditEventType {
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  EMAIL_VERIFIED = 'email_verified',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGED = 'password_changed',
  TWO_FA_ENABLED = 'two_fa_enabled',
  TWO_FA_DISABLED = 'two_fa_disabled',
  TWO_FA_VERIFIED = 'two_fa_verified',
  KYC_SUBMITTED = 'kyc_submitted',
  KYC_APPROVED = 'kyc_approved',
  KYC_REJECTED = 'kyc_rejected',
  ACCOUNT_CREATED = 'account_created',
  ACCOUNT_UPDATED = 'account_updated',
  ACCOUNT_CLOSED = 'account_closed',
  ACCOUNT_FROZEN = 'account_frozen',
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_COMPLETED = 'transaction_completed',
  TRANSACTION_FAILED = 'transaction_failed',
  TRANSACTION_REVERSED = 'transaction_reversed',
  CARD_ISSUED = 'card_issued',
  CARD_BLOCKED = 'card_blocked',
  CARD_UNBLOCKED = 'card_unblocked',
  LOAN_APPLIED = 'loan_applied',
  LOAN_APPROVED = 'loan_approved',
  LOAN_REJECTED = 'loan_rejected',
  LOAN_CLOSED = 'loan_closed',
  FRAUD_ALERT = 'fraud_alert',
  SESSION_TERMINATED = 'session_terminated',
  ACCESS_DENIED = 'access_denied',
  SECURITY_BREACH = 'security_breach',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum ComplianceCategory {
  AML = 'aml', // Anti-Money Laundering
  KYC = 'kyc', // Know Your Customer
  FRAUD = 'fraud',
  REGULATORY = 'regulatory',
  PRIVACY = 'privacy',
  SECURITY = 'security',
}

// ========== BUDGET ENUMS ==========

export enum BudgetCategory {
  GROCERIES = 'groceries',
  UTILITIES = 'utilities',
  ENTERTAINMENT = 'entertainment',
  TRANSPORTATION = 'transportation',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  SHOPPING = 'shopping',
  DINING = 'dining',
  TRAVEL = 'travel',
  SAVINGS = 'savings',
  INVESTMENTS = 'investments',
  OTHER = 'other',
}

export enum BudgetAlertThreshold {
  FIFTY_PERCENT = 50,
  SEVENTY_FIVE_PERCENT = 75,
  NINETY_PERCENT = 90,
  ONE_HUNDRED_PERCENT = 100,
}

// ========== SESSION ENUMS ==========

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
}
