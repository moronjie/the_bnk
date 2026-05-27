import { z } from 'zod';
import { AccountType, Currency } from '../model/Account';

// Create account validation
export const createAccountSchema = z.object({
  body: z.object({
    accountType: z.nativeEnum(AccountType, {
      message: 'Invalid account type. Must be savings, checking, credit, or loan',
    }),
    currency: z.nativeEnum(Currency).optional().default(Currency.USD),
    initialDeposit: z
      .number()
      .min(0, 'Initial deposit must be non-negative')
      .optional()
      .default(0),
    overdraftLimit: z
      .number()
      .min(0, 'Overdraft limit must be non-negative')
      .max(10000, 'Overdraft limit cannot exceed $10,000')
      .optional()
      .default(0),
  }),
});

// Get account by ID validation
export const getAccountByIdSchema = z.object({
  params: z.object({
    accountId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid account ID format'),
  }),
});

// Update account settings validation
export const updateAccountSettingsSchema = z.object({
  params: z.object({
    accountId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid account ID format'),
  }),
  body: z.object({
    overdraftLimit: z
      .number()
      .min(0, 'Overdraft limit must be non-negative')
      .max(10000, 'Overdraft limit cannot exceed $10,000')
      .optional(),
    interestRate: z
      .number()
      .min(0, 'Interest rate must be non-negative')
      .max(20, 'Interest rate cannot exceed 20%')
      .optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

// Freeze/unfreeze account validation
export const updateAccountStatusSchema = z.object({
  params: z.object({
    accountId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid account ID format'),
  }),
  body: z.object({
    action: z.enum(['freeze', 'unfreeze', 'close'], {
      message: 'Action must be freeze, unfreeze, or close',
    }),
  }),
});

// List accounts query validation
export const listAccountsSchema = z.object({
  query: z.object({
    accountType: z.nativeEnum(AccountType).optional(),
    status: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});

// Get account balance validation
export const getAccountBalanceSchema = z.object({
  params: z.object({
    accountId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid account ID format'),
  }),
});

// Export types
export type CreateAccountInput = z.infer<typeof createAccountSchema>['body'];
export type GetAccountByIdInput = z.infer<typeof getAccountByIdSchema>['params'];
export type UpdateAccountSettingsInput = {
  params: z.infer<typeof updateAccountSettingsSchema>['params'];
  body: z.infer<typeof updateAccountSettingsSchema>['body'];
};
export type UpdateAccountStatusInput = {
  params: z.infer<typeof updateAccountStatusSchema>['params'];
  body: z.infer<typeof updateAccountStatusSchema>['body'];
};
export type ListAccountsInput = z.infer<typeof listAccountsSchema>['query'];
export type GetAccountBalanceInput = z.infer<typeof getAccountBalanceSchema>['params'];
