import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);
    const userId = session.user.id;

    // 1. Fetch all accounts
    const accounts = await prisma.account.findMany({
      where: { userId },
      include: {
        _count: { select: { transactions: true } }
      },
      orderBy: { name: 'asc' }
    });

    // 2. Aggregate Incomes and Expenses by AccountId (Single Query)
    const transactionAggregations = await prisma.transaction.groupBy({
      by: ['accountId', 'type'],
      where: { userId },
      _sum: { amount: true }
    });

    // 3. Aggregate Investments by AccountId (Single Query)
    const investmentAggregations = await prisma.investment.groupBy({
      by: ['accountId'],
      where: { userId },
      _sum: { currentValue: true, amount: true }
    });

    // 4. Map results in memory
    const results = accounts.map((acc) => {
      const accountTransactions = transactionAggregations.filter(t => t.accountId === acc.id);
      
      const incomeSum = accountTransactions.find(t => t.type === 'INCOME')?._sum.amount || 0;
      const expenseSum = accountTransactions.find(t => t.type === 'EXPENSE')?._sum.amount || 0;
      const balance = incomeSum - expenseSum;

      const accountInvestment = investmentAggregations.find(i => i.accountId === acc.id);
      const investmentTotal = accountInvestment?._sum.currentValue || accountInvestment?._sum.amount || 0;

      return {
        ...acc,
        balance,
        investmentTotal
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Accounts GET Error:', error);
    return NextResponse.json([]);
  }
}

import { accountSchema } from '@/lib/validations';

// ... (GET method remains the same)

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json();

    // 1. Validação com Zod
    const validation = accountSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        message: 'Dados inválidos',
        errors: validation.error.format()
      }, { status: 400 });
    }

    const data = validation.data;
    
    // 2. Validar se o usuário existe no banco para evitar P2003
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      return NextResponse.json({
        message: 'Sessão inválida ou usuário não encontrado. Por favor, saia (Logout) e entre novamente no sistema.'
      }, { status: 403 });
    }

    const account = await prisma.$transaction(async (tx) => {
      const acc = await tx.account.create({
        data: {
          name: data.name,
          type: data.type,
          color: data.color || '#000000',
          userId,
          yieldCdiPercent: data.yieldCdiPercent
        }
      });

      if (data.initialBalance && Number(data.initialBalance) !== 0) {
        const amount = Number(data.initialBalance);
        const type = amount > 0 ? 'INCOME' : 'EXPENSE';
        const categoryName = 'Ajuste de Saldo';

        let category = await tx.category.findUnique({
          where: { name_userId: { name: categoryName, userId } }
        });

        if (!category) {
          category = await tx.category.create({
            data: { name: categoryName, type: 'INCOME', userId }
          });
        }

        const now = new Date();
        const fingerprint = crypto.createHash('md5').update(`${now.toISOString()}|initial-balance|${acc.id}`).digest('hex');

        await tx.transaction.create({
          data: {
            description: 'Saldo Inicial',
            amount: Math.abs(amount),
            date: now,
            type,
            categoryId: category.id,
            accountId: acc.id,
            userId,
            externalId: fingerprint
          }
        });
      }

      return acc;
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    console.error('Account Create Error:', error);
    return NextResponse.json({
      message: 'Erro ao criar conta',
      details: error.message
    }, { status: 500 });
  }
}
