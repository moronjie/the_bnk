import mongoose from 'mongoose';
import { Account, AccountType, AccountStatus, IAccount } from '../model/Account';
import { User } from '../model/User';
import { CustomError, errorCodes } from '../middleware/errorHandler';
import HTTP_STATUS from '../config/http.confiq';
import type {
  CreateAccountInput,
  GetAccountByIdInput,
  UpdateAccountSettingsInput,
  UpdateAccountStatusInput,
  ListAccountsInput,
  GetAccountBalanceInput,
} from '../validator/account.validator';

/**
 * Create a new account for the authenticated user
 */
export async function createAccount(userId: string, input: CreateAccountInput) {
  const { accountType, currency, initialDeposit, overdraftLimit } = input;

  // Verify user exists and is active
  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError('User not found', errorCodes.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (!user.isActive) {
    throw new CustomError(
      'Account is inactive',
      errorCodes.ACCOUNT_INACTIVE,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  // Check if user already has this account type
  const existingAccount = await Account.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    accountType,
    status: { $ne: AccountStatus.CLOSED },
  });

  if (existingAccount) {
    throw new CustomError(
      `You already have an active ${accountType} account`,
      errorCodes.DUPLICATE_RESOURCE,
      HTTP_STATUS.CONFLICT,
    );
  }

  // Business rules for different account types
  if (accountType === AccountType.SAVINGS && initialDeposit < 100) {
    throw new CustomError(
      'Savings account requires a minimum deposit of $100',
      errorCodes.BAD_REQUEST,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (accountType === AccountType.CHECKING && initialDeposit < 25) {
    throw new CustomError(
      'Checking account requires a minimum deposit of $25',
      errorCodes.BAD_REQUEST,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Credit and Loan accounts cannot be created directly
  if (accountType === AccountType.CREDIT || accountType === AccountType.LOAN) {
    throw new CustomError(
      `${accountType} accounts must be created through the application process`,
      errorCodes.BAD_REQUEST,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Create the account
  const account = await Account.create({
    userId: new mongoose.Types.ObjectId(userId),
    accountType,
    currency,
    balance: mongoose.Types.Decimal128.fromString(initialDeposit.toString()),
    availableBalance: mongoose.Types.Decimal128.fromString(initialDeposit.toString()),
    overdraftLimit,
    status: AccountStatus.ACTIVE,
    openedDate: new Date(),
  });

  return {
    message: 'Account created successfully',
    account: formatAccountResponse(account),
  };
}

/**
 * Get all accounts for the authenticated user
 */
export async function listAccounts(userId: string, input: ListAccountsInput) {
  const { accountType, status, page = 1, limit = 10 } = input;

  const filter: any = { userId: new mongoose.Types.ObjectId(userId) };

  if (accountType) {
    filter.accountType = accountType;
  }

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [accounts, total] = await Promise.all([
    Account.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Account.countDocuments(filter),
  ]);

  return {
    accounts: accounts.map(formatAccountResponse),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get account details by ID
 */
export async function getAccountById(userId: string, input: GetAccountByIdInput) {
  const { accountId } = input;

  const account = await Account.findById(accountId).lean();

  if (!account) {
    throw new CustomError('Account not found', errorCodes.RESOURCE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Ensure user owns this account
  if (account.userId.toString() !== userId) {
    throw new CustomError(
      'You do not have permission to access this account',
      errorCodes.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  return { account: formatAccountResponse(account) };
}

/**
 * Get account balance
 */
export async function getAccountBalance(userId: string, input: GetAccountBalanceInput) {
  const { accountId } = input;

  const account = await Account.findById(accountId).lean();

  if (!account) {
    throw new CustomError('Account not found', errorCodes.RESOURCE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Ensure user owns this account
  if (account.userId.toString() !== userId) {
    throw new CustomError(
      'You do not have permission to access this account',
      errorCodes.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (account.status !== AccountStatus.ACTIVE) {
    throw new CustomError(
      `Account is ${account.status}`,
      errorCodes.BAD_REQUEST,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return {
    accountNumber: account.accountNumber,
    balance: parseFloat(account.balance.toString()),
    availableBalance: parseFloat(account.availableBalance.toString()),
    currency: account.currency,
    holds: account.holds,
  };
}

/**
 * Update account settings (overdraft, interest rate)
 */
export async function updateAccountSettings(userId: string, input: UpdateAccountSettingsInput) {
  const { accountId } = input.params;
  const { overdraftLimit, interestRate } = input.body;

  const account = await Account.findById(accountId);

  if (!account) {
    throw new CustomError('Account not found', errorCodes.RESOURCE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Ensure user owns this account
  if (account.userId.toString() !== userId) {
    throw new CustomError(
      'You do not have permission to modify this account',
      errorCodes.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (account.status === AccountStatus.CLOSED) {
    throw new CustomError(
      'Cannot modify a closed account',
      errorCodes.BAD_REQUEST,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Update fields
  if (overdraftLimit !== undefined) {
    account.overdraftLimit = overdraftLimit;
  }

  if (interestRate !== undefined) {
    // Only allow interest rate changes on savings accounts
    if (account.accountType !== AccountType.SAVINGS) {
      throw new CustomError(
        'Interest rate can only be set on savings accounts',
        errorCodes.BAD_REQUEST,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    account.interestRate = interestRate;
  }

  await account.save();

  return {
    message: 'Account settings updated successfully',
    account: formatAccountResponse(account),
  };
}

/**
 * Update account status (freeze, unfreeze, close)
 */
export async function updateAccountStatus(userId: string, input: UpdateAccountStatusInput) {
  const { accountId } = input.params;
  const { action } = input.body;

  const account = await Account.findById(accountId);

  if (!account) {
    throw new CustomError('Account not found', errorCodes.RESOURCE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Ensure user owns this account
  if (account.userId.toString() !== userId) {
    throw new CustomError(
      'You do not have permission to modify this account',
      errorCodes.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  // Handle different actions
  switch (action) {
    case 'freeze':
      if (account.status === AccountStatus.FROZEN) {
        throw new CustomError(
          'Account is already frozen',
          errorCodes.BAD_REQUEST,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      if (account.status === AccountStatus.CLOSED) {
        throw new CustomError(
          'Cannot freeze a closed account',
          errorCodes.BAD_REQUEST,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      account.status = AccountStatus.FROZEN;
      break;

    case 'unfreeze':
      if (account.status !== AccountStatus.FROZEN) {
        throw new CustomError(
          'Account is not frozen',
          errorCodes.BAD_REQUEST,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      account.status = AccountStatus.ACTIVE;
      break;

    case 'close':
      if (account.status === AccountStatus.CLOSED) {
        throw new CustomError(
          'Account is already closed',
          errorCodes.BAD_REQUEST,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      // Check balance before closing
      const balance = parseFloat(account.balance.toString());
      if (balance !== 0) {
        throw new CustomError(
          'Cannot close account with non-zero balance. Please transfer all funds first.',
          errorCodes.BAD_REQUEST,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      account.status = AccountStatus.CLOSED;
      account.closedDate = new Date();
      break;
  }

  await account.save();

  return {
    message: `Account ${action}d successfully`,
    account: formatAccountResponse(account),
  };
}

/**
 * Format account response (hide sensitive data, convert Decimal128 to numbers)
 */
function formatAccountResponse(account: any) {
  return {
    id: account._id.toString(),
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    currency: account.currency,
    balance: parseFloat(account.balance.toString()),
    availableBalance: parseFloat(account.availableBalance.toString()),
    holds: account.holds,
    status: account.status,
    overdraftLimit: account.overdraftLimit,
    interestRate: account.interestRate,
    openedDate: account.openedDate,
    closedDate: account.closedDate,
    lastTransactionDate: account.lastTransactionDate,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}
