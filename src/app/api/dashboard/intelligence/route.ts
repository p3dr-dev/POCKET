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
    
    // We use a 30-day window for "Safe Spend" to match our rolling obligations look-ahead.
    // This prevents the "end-of-month surplus" illusion.
    const windowDays = 30;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemainingInMonth = Math.max(1, daysInMonth - now.getDate() + 1);

    // Safe Spend Logic: (Total Liquidity - Obligations in next 30 days) / 30 days
    const disposableIncome = totalBalance - data.fixedCosts.total;
    const safeDaily = disposableIncome / windowDays;
    const safeWeekly = safeDaily * 7;
    const safeMonthly = disposableIncome; // Real disposable for the next 30 days

    // Hustle Logic (Solvency Based)
    // We stop looking at "Income History" and look at "Current Solvency".
    // Formula: (Fixed Costs + Goal Contributions) - Current Balance = Amount to Earn
    
    const currentIncome = data.pulse.monthly.income;
    const totalMonthlyNeed = data.fixedCosts.total + data.goals.monthlyNeed;
    
    // If Balance covers everything, Missing is 0.
    // If Balance is low (or negative safe spend), Missing is High.
    const remainingToRaise = Math.max(0, totalMonthlyNeed - totalBalance);
    
    const dailyHustleTarget = remainingToRaise / daysRemainingInMonth;

    const hustle = {
      needed: totalMonthlyNeed,
      current: totalBalance, // We compare against Balance, not Income
      dailyTarget: dailyHustleTarget,
      daysLeft: daysRemainingInMonth,
      breakdown: {
        fixed: data.fixedCosts.total,
        goals: data.goals.monthlyNeed,
        liquidityGap: Math.max(0, data.fixedCosts.total - totalBalance) // For UI feedback
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
      budgets: data.budgets,
      recentTransactions: data.recentTransactions,
      obligationsList: data.obligationsList
    });

  } catch (error) {
    console.error('Dashboard Intelligence Error:', error);
    return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
  }
}
