import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionService } from './transaction.service';
import prisma from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    account: { findUnique: vi.fn() },
    category: { findUnique: vi.fn(), create: vi.fn() },
    transaction: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  }
}));

describe('TransactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a transaction successfully with explicit category', async () => {
    // Mocks
    (prisma.account.findUnique as any).mockResolvedValue({ id: 'acc-1', userId: 'user-1' });
    (prisma.category.findUnique as any).mockResolvedValue({ id: 'cat-1', name: 'Food' });
    (prisma.transaction.findUnique as any).mockResolvedValue(null); // No duplicate
    (prisma.transaction.create as any).mockResolvedValue({
      id: 'tx-1',
      description: 'Lunch',
      amount: 50,
      type: 'EXPENSE',
      categoryId: 'cat-1'
    });

    const result = await TransactionService.create({
      userId: 'user-1',
      description: 'Lunch',
      amount: 50,
      type: 'EXPENSE',
      date: '2023-10-27',
      accountId: 'acc-1',
      categoryId: 'cat-1'
    });

    expect(result.id).toBe('tx-1');
    expect(prisma.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        description: 'Lunch',
        amount: 50,
        categoryId: 'cat-1'
      })
    }));
  });

  it('should auto-categorize based on similar transaction', async () => {
     (prisma.account.findUnique as any).mockResolvedValue({ id: 'acc-1' });
     (prisma.transaction.findUnique as any).mockResolvedValue(null);
     
     // Mock finding a similar transaction
     (prisma.transaction.findFirst as any).mockResolvedValue({ categoryId: 'cat-similar' });
     
     await TransactionService.create({
       userId: 'user-1',
       description: 'Uber Ride', 
       amount: 20,
       type: 'EXPENSE',
       date: '2023-10-27',
       accountId: 'acc-1'
     });
     
     expect(prisma.transaction.findFirst).toHaveBeenCalled();
     expect(prisma.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
           categoryId: 'cat-similar'
        })
     }));
  });

  it('should throw error if account not found', async () => {
    (prisma.account.findUnique as any).mockResolvedValue(null);

    await expect(TransactionService.create({
      userId: 'user-1',
      description: 'Fail',
      amount: 10,
      type: 'EXPENSE',
      date: '2023-10-27',
      accountId: 'acc-invalid'
    })).rejects.toThrow('Conta inválida ou não encontrada');
  });

  it('should detect duplicates', async () => {
    (prisma.account.findUnique as any).mockResolvedValue({ id: 'acc-1' });
    (prisma.category.findUnique as any).mockResolvedValue({ id: 'cat-1' });
    (prisma.transaction.findUnique as any).mockResolvedValue({ id: 'existing' }); // Duplicate found

    await expect(TransactionService.create({
      userId: 'user-1',
      description: 'Duplicate',
      amount: 10,
      type: 'EXPENSE',
      date: '2023-10-27',
      accountId: 'acc-1',
      categoryId: 'cat-1'
    })).rejects.toThrow('Esta transação já foi registrada anteriormente.');
  });
});
