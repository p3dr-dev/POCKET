import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    // 1. Consolidar saldos de contas
    const accounts = await prisma.account.findMany({
      where: { userId }
    });

    const accountBalances = await Promise.all(accounts.map(async (acc) => {
      const [incomeSum, expenseSum] = await Promise.all([
        prisma.transaction.aggregate({
          where: { accountId: acc.id, userId, type: 'INCOME' },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: { accountId: acc.id, userId, type: 'EXPENSE' },
          _sum: { amount: true }
        })
      ]);
      return (incomeSum._sum.amount || 0) - (expenseSum._sum.amount || 0);
    }));

    const liquidTotal = accountBalances.reduce((acc, val) => acc + val, 0);

    // 2. Consolidar Investimentos
    const investments = await prisma.investment.findMany({
      where: { userId }
    });
    const investmentTotal = investments.reduce((acc, inv) => acc + (inv.currentValue || inv.amount), 0);
    const investmentInitial = investments.reduce((acc, inv) => acc + inv.amount, 0);
    const investmentGain = investmentTotal - investmentInitial;

    // 3. Consolidar Metas (Goals)
    const goals = await prisma.goal.findMany({
      where: { userId }
    });
    const goalsTotalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
    const goalsTotalCurrent = goals.reduce((acc, g) => acc + g.currentAmount, 0);
    const goalsProgress = goalsTotalTarget > 0 ? (goalsTotalCurrent / goalsTotalTarget) * 100 : 0;

    // 4. Calcular Dívidas Ativas
    const debts = await prisma.debt.findMany({
      where: { userId }
    });
    const debtTotal = debts.reduce((acc, d) => acc + (d.totalAmount - d.paidAmount), 0);

    // 5. Net Worth
    const netWorth = liquidTotal + investmentTotal - debtTotal;

    return NextResponse.json({
      liquidTotal,
      investmentTotal,
      investmentGain,
      goalsProgress,
      debtTotal,
      netWorth,
      healthScore: calculateHealthScore(liquidTotal, debtTotal, investmentTotal)
    });
  } catch (error) {
    console.error('Financial Health API Error:', error);
    return NextResponse.json({ message: 'Erro ao calcular saúde financeira' }, { status: 500 });
  }
}

function calculateHealthScore(liquid: number, debt: number, investment: number) {
  // Lógica simples de score de 0 a 100
  let score = 50;
  if (liquid > debt) score += 20;
  if (investment > liquid) score += 15;
  if (debt === 0) score += 15;
  if (debt > (liquid + investment)) score -= 30;
  return Math.max(0, Math.min(100, score));
}
