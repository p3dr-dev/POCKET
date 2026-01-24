import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DashboardService } from '@/services/dashboard.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const [data, accountsWithBalance] = await Promise.all([
      DashboardService.getPulse(userId),
      DashboardService.getBalances(userId)
    ]);

    // Calculate Safe Spend
    const totalBalance = accountsWithBalance.reduce((sum, a) => sum + a.balance, 0);
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);

    // Logic: (Liquid Cash - Fixed Costs Pending) / Days Remaining
    // We assume "Liquid Cash" is Total Balance.
    const disposableIncome = totalBalance - data.fixedCosts.total;
    const safeDaily = disposableIncome / daysRemaining;
    const safeWeekly = safeDaily * 7;
    const safeMonthly = disposableIncome; // For the rest of the month

    // Hustle Logic (Target Income)
    const totalMonthlyNeed = data.fixedCosts.total + data.goals.monthlyNeed;
    const currentIncome = data.pulse.monthly.income;
    const remainingToEarn = Math.max(0, totalMonthlyNeed - currentIncome);
    const dailyHustleTarget = remainingToEarn / daysRemaining;

    const hustle = {
      needed: totalMonthlyNeed,
      current: currentIncome,
      dailyTarget: dailyHustleTarget,
      daysLeft: daysRemaining,
      breakdown: {
        fixed: data.fixedCosts.total,
        goals: data.goals.monthlyNeed
      }
    };

    return NextResponse.json({
      pulse: data.pulse,
      safeSpend: {
        daily: safeDaily,
        weekly: safeWeekly,
        monthly: safeMonthly,
        disposable: disposableIncome
      },
      hustle,
      coverage: { // Legacy support or keep for gap widget if needed
         needed: data.fixedCosts.total,
         current: currentIncome,
         gap: Math.max(0, data.fixedCosts.total - currentIncome)
      },
      accounts: accountsWithBalance,
      budgets: data.budgets
    });

  } catch (error) {
    console.error('Dashboard Intelligence Error:', error);
    return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
  }
}
