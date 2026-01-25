import prisma from '@/lib/prisma';

const CDI_ANNUAL_RATE = 0.1125; // 11.25% (Adjustable later)
const TAX_RATE = 0.2715; // 27.15% (IR + PIS/COFINS)

export class YieldService {
  /**
   * Calculates and applies CDI yield for all eligible accounts.
   * Should be triggered daily or on demand.
   */
  static async processYields(userId: string) {
    const accounts = await prisma.account.findMany({
      where: {
        userId,
        yieldCdiPercent: { not: null, gt: 0 }
      }
    });

    const results = [];

    for (const acc of accounts) {
      if (!acc.yieldCdiPercent) continue;

      const lastDate = acc.lastYieldDate || acc.createdAt;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to midnight

      const last = new Date(lastDate);
      last.setHours(0, 0, 0, 0);

      // If already processed today, skip
      if (last.getTime() >= today.getTime()) {
        results.push({ account: acc.name, status: 'SKIPPED', amount: 0 });
        continue;
      }

      // Calculate yield
      let currentBalance = await this.getBalance(acc.id);
      let totalYield = 0;
      let daysProcessed = 0;

      // Iterate day by day from last+1 to today
      const cursor = new Date(last);
      cursor.setDate(cursor.getDate() + 1);

      while (cursor <= today) {
        // Business Day Check (Simple: Mon=1 to Fri=5)
        const dayOfWeek = cursor.getDay();
        const isBusinessDay = dayOfWeek >= 1 && dayOfWeek <= 5;

        if (isBusinessDay) {
          // CDI Formula: Balance * ((1 + Rate)^(1/252) - 1)
          const dailyFactor = Math.pow(1 + CDI_ANNUAL_RATE, 1 / 252) - 1;
          const grossYield = currentBalance * dailyFactor * (acc.yieldCdiPercent / 100);
          const netYield = grossYield * (1 - TAX_RATE);
          
          totalYield += netYield;
          currentBalance += netYield; // Compound it locally
          daysProcessed++;
        }
        
        cursor.setDate(cursor.getDate() + 1);
      }

      if (totalYield > 0.01) { // Min 1 cent
        // Create Transaction
        await prisma.transaction.create({
          data: {
            description: `Rendimento Automático (${daysProcessed} dias úteis)`,
            amount: totalYield,
            type: 'INCOME',
            date: new Date(), // Booking date is today
            accountId: acc.id,
            categoryId: await this.getOrCreateCategory(userId),
            userId,
            payee: 'Banco Magie',
          }
        });

        results.push({ account: acc.name, status: 'PROCESSED', amount: totalYield, days: daysProcessed });
      } else {
        results.push({ account: acc.name, status: 'NO_YIELD', amount: 0 });
      }

      // Update Account lastYieldDate regardless of amount (to advance the cursor)
      await prisma.account.update({
        where: { id: acc.id },
        data: { lastYieldDate: new Date() }
      });
    }

    return results;
  }

  private static async getBalance(accountId: string) {
    const agg = await prisma.transaction.aggregate({
      where: { accountId },
      _sum: { amount: true }
    });
    // Normally balance is Income - Expense. 
    // Wait, transaction amounts are absolute. We need to respect type.
    const income = await prisma.transaction.aggregate({
        where: { accountId, type: 'INCOME' },
        _sum: { amount: true }
    });
    const expense = await prisma.transaction.aggregate({
        where: { accountId, type: 'EXPENSE' },
        _sum: { amount: true }
    });
    
    return (income._sum.amount || 0) - (expense._sum.amount || 0);
  }

  private static async getOrCreateCategory(userId: string) {
    const cat = await prisma.category.findFirst({
      where: { userId, name: 'Rendimentos' }
    });
    if (cat) return cat.id;

    const newCat = await prisma.category.create({
      data: {
        name: 'Rendimentos',
        type: 'INCOME',
        color: '#10B981', // Emerald
        userId
      }
    });
    return newCat.id;
  }
}
