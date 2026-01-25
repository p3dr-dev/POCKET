import prisma from '@/lib/prisma';

export class DashboardService {
  static async getPulse(userId: string, refDate?: Date) {
    const now = refDate || new Date();
    
    // Time Ranges
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Fetch Aggregated Transactions (Single DB Hit strategy roughly)
    const [daily, weekly, monthly, recentTransactions] = await Promise.all([
      this.getFlow(userId, startOfDay),
      this.getFlow(userId, startOfWeek),
      this.getFlow(userId, startOfMonth),
      prisma.transaction.findMany({
        where: { 
          userId, 
          date: { gte: startOfMonth },
          type: 'EXPENSE',
          transferId: null
        },
        select: { amount: true, type: true, date: true, transferId: true },
        orderBy: { date: 'asc' }
      })
    ]);

    // 2. Fetch Balances
    const accounts = await this.getBalances(userId);

    // 3. Fixed Costs (Debts + Subs)
    const [allDebts, subs] = await Promise.all([
      prisma.debt.findMany({
        where: { userId },
        orderBy: { dueDate: 'asc' }
      }),
      prisma.recurringTransaction.findMany({
        where: { userId, active: true }
      })
    ]);

    const debts = allDebts.filter(d => d.paidAmount < d.totalAmount);

    // Calculate pending debts for a rolling 30-day window
    const rollingWindowDate = new Date(now);
    rollingWindowDate.setDate(now.getDate() + 30);

    const debtsDue = debts.filter(d => {
      if (!d.dueDate) return false; 
      const dDate = new Date(d.dueDate);
      return dDate <= rollingWindowDate;
    });
    
    const upcomingObligationsVal = debtsDue.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

    // Calculate monthly subs
    const monthlySubsVal = subs.reduce((sum, s) => {
      let val = s.amount || 0;
      if (s.frequency === 'WEEKLY') val *= 4;
      if (s.frequency === 'YEARLY') val /= 12;
      return sum + val;
    }, 0);

    const totalFixedCosts = upcomingObligationsVal + monthlySubsVal;
    
    // Create Unified Obligations List for Widget
    const obligationsList = [
      ...debtsDue.map(d => ({
        id: d.id,
        description: d.description,
        totalAmount: d.totalAmount,
        paidAmount: d.paidAmount,
        dueDate: d.dueDate ? d.dueDate.toISOString() : '',
        type: 'DEBT' as const
      })),
      ...subs.map(s => ({
        id: s.id,
        description: s.description || 'Assinatura',
        totalAmount: s.amount || 0,
        paidAmount: 0, // Subs don't have partial payment tracking usually
        dueDate: s.nextRun ? s.nextRun.toISOString() : '', 
        type: 'SUBSCRIPTION' as const
      }))
    ].sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));

    // 4. Goals (Target Gap & Monthly Contribution Needed)
    const goals = await prisma.goal.findMany({ where: { userId } });
    
    const goalsMath = goals.reduce((acc, g) => {
      const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);
      
      // Calculate months until deadline
      const deadline = new Date(g.deadline);
      const today = now;
      
      // Difference in months
      let monthsLeft = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth());
      
      // Adjust if day of month is passed (rough estimate)
      if (deadline.getDate() < today.getDate()) monthsLeft -= 0.5;
      
      monthsLeft = Math.max(0.5, monthsLeft); // Avoid division by zero, min half a month

      const monthlyContribution = remainingAmount / monthsLeft;
      
      return {
        totalRemaining: acc.totalRemaining + remainingAmount,
        monthlyNeed: acc.monthlyNeed + monthlyContribution
      };
    }, { totalRemaining: 0, monthlyNeed: 0 });

    // 5. Budgets (Category Limits)
    const budgets = await this.getBudgets(userId, now);

    return {
      pulse: { daily, weekly, monthly },
      fixedCosts: { debts: upcomingObligationsVal, subs: monthlySubsVal, total: totalFixedCosts },
      goals: goalsMath,
      accounts,
      budgets,
      recentTransactions,
      obligationsList
    };
  }

  private static async getBudgets(userId: string, refDate?: Date) {
    const now = refDate || new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch categories with limits
    const categories = await prisma.category.findMany({
      where: { userId, monthlyLimit: { not: null } },
      select: { id: true, name: true, color: true, monthlyLimit: true }
    });

    if (categories.length === 0) return [];

    // Aggregate expenses for these categories this month
    const spending = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        date: { gte: startOfMonth },
        type: 'EXPENSE',
        categoryId: { in: categories.map(c => c.id) }
      },
      _sum: { amount: true }
    });

    return categories.map(cat => {
      const spent = spending.find(s => s.categoryId === cat.id)?._sum.amount || 0;
      return {
        ...cat,
        spent,
        remaining: (cat.monthlyLimit || 0) - spent,
        percentage: Math.min(100, (spent / (cat.monthlyLimit || 1)) * 100)
      };
    }).sort((a, b) => b.percentage - a.percentage); // Sort by highest usage
  }

  private static async getFlow(userId: string, fromDate: Date) {
    const aggregations = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        date: { gte: fromDate },
        transferId: null, // Exclude explicit transfers
        // Extra safety: Exclude categories that sound like transfers
        category: {
           isNot: { name: { contains: 'Transfer', mode: 'insensitive' } }
        }
      },
      _sum: { amount: true }
    });

    const income = aggregations.find(a => a.type === 'INCOME')?._sum.amount || 0;
    const expense = aggregations.find(a => a.type === 'EXPENSE')?._sum.amount || 0;

    return { income, expense, net: income - expense };
  }

  static async getBalances(userId: string) {
    // This replicates the logic from /api/accounts to get actual balances
    const accounts = await prisma.account.findMany({ where: { userId } });
    
    // Aggregations for speed
    const txs = await prisma.transaction.groupBy({
      by: ['accountId', 'type'],
      where: { userId },
      _sum: { amount: true }
    });

    return accounts.map(acc => {
      const accTxs = txs.filter(t => t.accountId === acc.id);
      const inc = accTxs.find(t => t.type === 'INCOME')?._sum.amount || 0;
      const exp = accTxs.find(t => t.type === 'EXPENSE')?._sum.amount || 0;
      return {
        ...acc,
        balance: inc - exp
      };
    });
  }
}
