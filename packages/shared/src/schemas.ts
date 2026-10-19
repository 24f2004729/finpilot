import { z } from 'zod';
import { TRANSACTION_TYPES, SUPPORTED_CURRENCIES } from './constants';

export const RegisterSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password cannot exceed 128 characters.'),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
});

export const LoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const CreateTransactionSchema = z.object({
  amountCents: z
    .number()
    .int('Amount must be in exact cents.')
    .positive('Transaction amount must be greater than zero.'),
  type: z.enum(TRANSACTION_TYPES),
  category: z.string().trim().min(1, 'Category is required.').max(50),
  occurrenceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD.'),
  description: z.string().trim().min(1, 'Description is required.').max(255),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial();

export const TransactionFilterSchema = z.object({
  monthKey: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Month must be formatted as YYYY-MM.')
    .optional(),
  category: z.string().optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const CreateBudgetSchema = z.object({
  category: z.string().trim().min(1, 'Category is required.').max(50),
  monthKey: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Month must be formatted as YYYY-MM.'),
  limitCents: z
    .number()
    .int('Budget limit must be in integer cents.')
    .positive('Budget limit must be greater than zero.'),
});

export const UpdateBudgetSchema = z.object({
  limitCents: z
    .number()
    .int('Budget limit must be in integer cents.')
    .positive('Budget limit must be greater than zero.'),
});

export const MonthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Month must be formatted as YYYY-MM.')
    .optional(),
});

export const DismissInsightSchema = z.object({
  insightKey: z.string().min(1),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
});

export const DeleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: "Please type 'DELETE' exactly to confirm account deletion." }),
  }),
});
