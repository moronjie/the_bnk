import { Router } from 'express';
import * as accountController from '../controller/account.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../validator';
import {
  createAccountSchema,
  listAccountsSchema,
  getAccountByIdSchema,
  getAccountBalanceSchema,
  updateAccountSettingsSchema,
  updateAccountStatusSchema,
} from '../validator/account.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/accounts
 * @desc    Create a new account
 * @access  Private
 */
router.post('/', validate(createAccountSchema), accountController.createAccount);

/**
 * @route   GET /api/accounts
 * @desc    Get all accounts for authenticated user
 * @access  Private
 */
router.get('/', validate(listAccountsSchema), accountController.listAccounts);

/**
 * @route   GET /api/accounts/:accountId
 * @desc    Get account details by ID
 * @access  Private (own account only)
 */
router.get('/:accountId', validate(getAccountByIdSchema), accountController.getAccountById);

/**
 * @route   GET /api/accounts/:accountId/balance
 * @desc    Get account balance
 * @access  Private (own account only)
 */
router.get(
  '/:accountId/balance',
  validate(getAccountBalanceSchema),
  accountController.getAccountBalance,
);

/**
 * @route   PATCH /api/accounts/:accountId/settings
 * @desc    Update account settings (overdraft, interest rate)
 * @access  Private (own account only)
 */
router.patch(
  '/:accountId/settings',
  validate(updateAccountSettingsSchema),
  accountController.updateAccountSettings,
);

/**
 * @route   PATCH /api/accounts/:accountId/status
 * @desc    Update account status (freeze/unfreeze/close)
 * @access  Private (own account only)
 */
router.patch(
  '/:accountId/status',
  validate(updateAccountStatusSchema),
  accountController.updateAccountStatus,
);

export default router;
