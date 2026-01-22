import { z } from 'zod';

// --- Esquemas de Conta ---
export const accountSchema = z.object({
  name: z.string().min(1, 'O nome da conta é obrigatório').max(50),
  type: z.enum(['BANK', 'CASH', 'CREDIT_CARD', 'CRYPTO', 'INVESTMENT']),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida'),
  initialBalance: z.number().optional(),
});

// --- Esquemas de Transação ---
export const transactionSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória').max(100),
  amount: z.number().positive('O valor deve ser maior que zero'),
  type: z.enum(['INCOME', 'EXPENSE']),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  accountId: z.string().min(1, 'A conta é obrigatória'),
  categoryId: z.string().optional(),
  payee: z.string().optional().nullable(),
  payer: z.string().optional().nullable(),
  bankRefId: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
});

// --- Esquemas de Transferência ---
export const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'Conta de origem é obrigatória'),
  toAccountId: z.string().min(1, 'Conta de destino é obrigatória'),
  amount: z.number().positive('O valor deve ser maior que zero'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  description: z.string().optional(),
  payee: z.string().optional().nullable(),
  payer: z.string().optional().nullable(),
  bankRefId: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
});

// --- Esquemas de Dívida ---
export const debtSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória'),
  totalAmount: z.number().positive('O valor deve ser positivo'),
  paidAmount: z.number().min(0).default(0),
  dueDate: z.string().nullable().optional(),
  type: z.enum(['SINGLE', 'INSTALLMENT']).optional().default('SINGLE'),
  installmentsCount: z.number().int().min(1).optional().default(1),
});

// --- Esquemas de Assinatura ---
export const subscriptionPaymentSchema = z.object({
  amount: z.number().positive('O valor deve ser positivo'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  accountId: z.string().optional(),
});
