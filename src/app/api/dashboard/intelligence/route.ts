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

    // Hustle Logic (Target Income) - Smart Liquidity Aware
    // If I have negative liquidity (Debt Hole), I must earn to cover it + goals.
    // If I have surplus liquidity, it counts towards my goals.
    
    const currentIncome = data.pulse.monthly.income;

    // Gap = What I Owe - What I Have. Positive = Deficit. Negative = Surplus.
    const liquidityGap = data.fixedCosts.total - totalBalance; 
    
    // Base Need (Goals only, since Fixed Costs are handled in the Gap check against Balance)
    const baseGoalNeed = data.goals.monthlyNeed;
    
    // Total Hustle Needed:
    // If Gap > 0 (Deficit): Need = Goal + Gap (Fill hole + Reach Goal)
    // If Gap < 0 (Surplus): Need = Max(0, Goal + Gap) (Use surplus to cover Goal)
    const totalHustleNeeded = Math.max(0, baseGoalNeed + liquidityGap);
    
    const dailyHustleTarget = totalHustleNeeded / daysRemainingInMonth;

    const hustle = {
      needed: totalHustleNeeded,
      current: currentIncome, // Keep showing income for reference
      dailyTarget: dailyHustleTarget,
      daysLeft: daysRemainingInMonth,
      breakdown: {
        fixed: data.fixedCosts.total,
        goals: data.goals.monthlyNeed,
        liquidityGap // Positive = Deficit
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
