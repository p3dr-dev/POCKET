import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const userId = session.user.id;

    // 1. Fetch Standard Investments
    const investments = await prisma.investment.findMany({
      where: { userId },
      include: {
        account: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch Yielding Accounts (Magie Style)
    const yieldingAccounts = await prisma.account.findMany({
      where: { 
        userId,
        yieldCdiPercent: { gt: 0 }
      },
      include: {
        transactions: {
          where: {
            type: 'INCOME',
            category: { name: 'Rendimentos' }
          },
          select: { amount: true }
        }
      }
    });

    // 3. Calculate Balance for each yielding account to construct the "Investment" view
    const accountBalances = await prisma.transaction.groupBy({
      by: ['accountId', 'type'],
      where: { 
        userId,
        accountId: { in: yieldingAccounts.map(a => a.id) }
      },
      _sum: { amount: true }
    });

    const virtualInvestments = yieldingAccounts.map(acc => {
      const accTxs = accountBalances.filter(t => t.accountId === acc.id);
      const inc = accTxs.find(t => t.type === 'INCOME')?._sum.amount || 0;
      const exp = accTxs.find(t => t.type === 'EXPENSE')?._sum.amount || 0;
      const balance = inc - exp;

      // Profit is the sum of "Rendimentos" transactions
      const totalYield = acc.transactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Principal = Balance - Profit (Approximation for display)
      // If user spent the profit, this logic holds: "How much of current balance is principal vs yield"
      const principal = Math.max(0, balance - totalYield);

      return {
        id: `virtual-yield-${acc.id}`,
        name: `${acc.name} (Saldo Remunerado)`,
        type: `Liquidez Diária (${acc.yieldCdiPercent}% CDI)`,
        amount: principal,
        currentValue: balance,
        accountId: acc.id,
        account: { name: acc.name },
        isVirtual: true // Frontend should disable Edit/Delete
      };
    }).filter(inv => inv.currentValue > 1); // Only show if significant balance

    // Merge and Return
    // We cast to any because the Virtual Investment shape matches the JSON output structure
    return NextResponse.json([...investments, ...virtualInvestments]);
  } catch (error) {
    console.error('Investments GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const userId = session.user.id;

    const account = await prisma.account.findUnique({
      where: { id: body.accountId, userId }
    });

    if (!account) {
      return NextResponse.json({ message: 'Conta inválida ou não encontrada' }, { status: 403 });
    }

    const investmentDate = body.date ? new Date(body.date) : new Date();

    const investment = await prisma.$transaction(async (tx) => {
      const inv = await tx.investment.create({
        data: {
          name: body.name,
          type: body.type,
          amount: Number(body.amount),
          currentValue: Number(body.currentValue || body.amount),
          accountId: body.accountId,
          userId,
          createdAt: investmentDate
        }
      });

      let category = await tx.category.findUnique({
        where: { name_userId: { name: 'Investimentos', userId } }
      });

      if (!category) {
        category = await tx.category.create({
          data: { name: 'Investimentos', type: 'EXPENSE', userId }
        });
      }

      await tx.transaction.create({
        data: {
          description: `Aporte: ${body.name}`,
          amount: Math.abs(Number(body.amount)),
          date: investmentDate,
          type: 'EXPENSE',
          categoryId: category.id,
          accountId: body.accountId,
          userId,
          investmentId: inv.id // Link aqui
        }
      });

      return inv;
    });

    return NextResponse.json(investment, { status: 201 });
  } catch (error: any) {
    console.error('Investment POST Error:', error);
    return NextResponse.json({ message: 'Erro ao criar investimento', details: error.message }, { status: 500 });
  }
}

