import { Request, Response, NextFunction } from 'express';
import * as accountService from '../service/account.service';
import type {
  CreateAccountInput,
  GetAccountByIdInput,
  UpdateAccountSettingsInput,
  UpdateAccountStatusInput,
  ListAccountsInput,
  GetAccountBalanceInput,
} from '../validator/account.validator';

/**
 * Create a new account
 * POST /api/accounts
 */
export async function createAccount(
  req: Request<{}, {}, CreateAccountInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const result = await accountService.createAccount(userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all accounts for the authenticated user
 * GET /api/accounts
 */
export async function listAccounts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const result = await accountService.listAccounts(userId, req.query as unknown as ListAccountsInput);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get account details by ID
 * GET /api/accounts/:accountId
 */
export async function getAccountById(
  req: Request<GetAccountByIdInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const result = await accountService.getAccountById(userId, req.params);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get account balance
 * GET /api/accounts/:accountId/balance
 */
export async function getAccountBalance(
  req: Request<GetAccountBalanceInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const result = await accountService.getAccountBalance(userId, req.params);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Update account settings
 * PATCH /api/accounts/:accountId/settings
 */
export async function updateAccountSettings(
  req: Request<
    UpdateAccountSettingsInput['params'],
    {},
    UpdateAccountSettingsInput['body']
  >,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const result = await accountService.updateAccountSettings(userId, {
      params: req.params,
      body: req.body,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Update account status (freeze/unfreeze/close)
 * PATCH /api/accounts/:accountId/status
 */
export async function updateAccountStatus(
  req: Request<
    UpdateAccountStatusInput['params'],
    {},
    UpdateAccountStatusInput['body']
  >,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const result = await accountService.updateAccountStatus(userId, {
      params: req.params,
      body: req.body,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
