import prisma from '@/lib/prisma';
import crypto from 'crypto';

interface CreateTransactionDTO {
  userId: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string; // ISO String or "YYYY-MM-DD"
  accountId: string;
  categoryId?: string;
  payee?: string | null;
  payer?: string | null;
  bankRefId?: string | null;
  externalId?: string | null;
}

export class TransactionService {
  
  static async create(data: CreateTransactionDTO) {
    const { 
      userId, description, amount, type, date, accountId, categoryId: inputCategoryId,
      payee, payer, bankRefId, externalId: inputExternalId 
    } = data;

    // 1. Date Normalization (Noon UTC)
    const rawDate = date.includes('T') ? date.split('T')[0] : date;
    const txDate = new Date(`${rawDate}T12:00:00.000Z`);

    // 2. Validate Account Ownership
    const account = await prisma.account.findUnique({
      where: { id: accountId, userId }
    });
    if (!account) throw new Error('Conta inválida ou não encontrada');

    // 3. Resolve Category
    let categoryId = inputCategoryId;
    if (categoryId === 'YIELD_AUTO' || !categoryId) {
      const catType = categoryId === 'YIELD_AUTO' ? 'INCOME' : (type || 'EXPENSE');
      const categoryName = categoryId === 'YIELD_AUTO' ? 'Rendimentos' : 'Outros';
      
      let category = await prisma.category.findUnique({
        where: { name_userId: { name: categoryName, userId } }
      });
      
      if (!category) {
        category = await prisma.category.create({
          data: { name: categoryName, type: catType, userId }
        });
      }
      categoryId = category.id;
    } else {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, userId }
      });
      if (!category) throw new Error('Categoria inválida ou não encontrada');
    }

    // 4. Fingerprinting / Deduplication
    const amountVal = Math.abs(Number(amount)).toFixed(2);
    const fingerprintBase = `${txDate.toISOString().split('T')[0]}|${description.toLowerCase().trim()}|${amountVal}|${accountId}`;
    const generatedExternalId = inputExternalId || crypto.createHash('md5').update(fingerprintBase).digest('hex');

    const existing = await prisma.transaction.findUnique({
      where: { externalId_accountId: { externalId: generatedExternalId, accountId } }
    });
    
    if (existing) throw new Error('Esta transação já foi registrada anteriormente.');

    // 5. Create Transaction
    return await prisma.transaction.create({
      data: {
        description,
        amount: Math.abs(Number(amount)),
        date: txDate,
        type,
        categoryId,
        accountId,
        userId,
        payee: payee || null,
        payer: payer || null,
        bankRefId: bankRefId || null,
        externalId: generatedExternalId
      }
    });
  }
}
