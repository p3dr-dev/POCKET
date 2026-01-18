import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    // 1. Consolidar saldos de todas as contas em apenas 2 queries (Otimizado)
    const [incomesByAccount, expensesByAccount] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['accountId'],
        where: { userId, type: 'INCOME' },
        _sum: { amount: true }
      }),
      prisma.transaction.groupBy({
        by: ['accountId'],
        where: { userId, type: 'EXPENSE' },
        _sum: { amount: true }
      })
    ]);

    const balancesMap: Record<string, number> = {};
    incomesByAccount.forEach(item => {
      balancesMap[item.accountId] = (balancesMap[item.accountId] || 0) + (item._sum.amount || 0);
    });
    expensesByAccount.forEach(item => {
      balancesMap[item.accountId] = (balancesMap[item.accountId] || 0) - (item._sum.amount || 0);
    });

    const liquidTotal = Object.values(balancesMap).reduce((acc, val) => acc + val, 0);

    // 2. Consolidar Investimentos
    const investments = await prisma.investment.findMany({
      where: { userId }
    });
    const investmentTotal = investments.reduce((acc, inv) => acc + (inv.currentValue || inv.amount), 0);
    const investmentInitial = investments.reduce((acc, inv) => acc + inv.amount, 0);
    const investmentGain = investmentTotal - investmentInitial;

    // 3. Consolidar Metas (Goals) e calcular aporte mensal necessário
    const goals = await prisma.goal.findMany({
      where: { userId }
    });
    const goalsTotalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
    const goalsTotalCurrent = goals.reduce((acc, g) => acc + g.currentAmount, 0);
    const goalsProgress = goalsTotalTarget > 0 ? (goalsTotalCurrent / goalsTotalTarget) * 100 : 0;

    let monthlyGoalTarget = 0;
    goals.forEach(g => {
      const remaining = g.targetAmount - g.currentAmount;
      if (remaining <= 0) return;

      const now = new Date();
      const deadline = new Date(g.deadline);
      const diffTime = deadline.getTime() - now.getTime();
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Média de dias por mês

      if (diffMonths > 0) {
        monthlyGoalTarget += remaining / diffMonths;
      } else {
        monthlyGoalTarget += remaining; // Se o prazo já venceu, precisa de tudo agora
      }
    });

    // 4. Calcular Dívidas Ativas
    const debts = await prisma.debt.findMany({
      where: { userId }
    });
    const debtTotal = debts.reduce((acc, d) => acc + (d.totalAmount - d.paidAmount), 0);

    // 5. Calcular Assinaturas Ativas (Custo Fixo)
    const subscriptions = await prisma.recurringTransaction.findMany({
      where: { userId, active: true }
    });
    const monthlyFixedCost = subscriptions.reduce((acc, s) => {
      let amount = s.amount || 0;
      if (s.frequency === 'WEEKLY') amount *= 4;
      if (s.frequency === 'YEARLY') amount /= 12;
      return acc + amount;
    }, 0);

    // 6. Calcular Gap de Receita
    const totalRequired = debtTotal + monthlyFixedCost + monthlyGoalTarget;
    const totalAvailable = liquidTotal + investmentGain; // Consideramos lucro de investimento como disponível
    const revenueGap = Math.max(0, totalRequired - totalAvailable);

    // 7. Net Worth
    const netWorth = liquidTotal + investmentTotal - debtTotal;

    return NextResponse.json({
      liquidTotal,
      investmentTotal,
      investmentGain,
      goalsProgress,
      monthlyGoalTarget,
      debtTotal,
      monthlyFixedCost,
      totalRequired,
      revenueGap,
      netWorth,
      healthScore: calculateHealthScore(liquidTotal, debtTotal + monthlyFixedCost + monthlyGoalTarget, investmentTotal)
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
