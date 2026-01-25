import prisma from '@/lib/prisma';
import { DashboardService } from './dashboard.service';

export class AiContextService {
  /**
   * Generates a comprehensive financial snapshot for the AI Agent.
   * This allows the AI to "see" the user's dashboard, debts, and investments.
   */
  static async buildContext(userId: string) {
    const now = new Date();
    
    // 1. Reuse the Dashboard Intelligence Logic (Best source of truth)
    // We fetch it directly using the service
    const [dashboard, investments] = await Promise.all([
      DashboardService.getPulse(userId),
      prisma.investment.findMany({
        where: { userId },
        include: { account: { select: { name: true } } },
        orderBy: { amount: 'desc' }
      })
    ]);

    // 2. Format Debts (Detailed)
    const debts = dashboard.obligationsList.filter(o => o.type === 'DEBT').map(d => 
      `${d.description}: R$ ${d.totalAmount} (Pago: ${d.paidAmount}, Vence: ${d.dueDate.split('T')[0]})`
    );

    // 3. Format Investments
    const investmentSummary = investments.map(i => 
      `${i.name} (${i.type}): R$ ${i.currentValue || i.amount} [Conta: ${i.account.name}]`
    );

    // 4. Format Accounts
    const accounts = dashboard.accounts.map(a => 
      `${a.name} (${a.type}): R$ ${a.balance.toFixed(2)}`
    );

    // 5. Construct the Context Object
    // We use a structured JSON that the LLM can parse easily
    return {
      user_status: {
        total_balance: dashboard.accounts.reduce((sum, a) => sum + a.balance, 0).toFixed(2),
        monthly_income: dashboard.pulse.monthly.income.toFixed(2),
        monthly_expense: dashboard.pulse.monthly.expense.toFixed(2),
        net_worth: (dashboard.accounts.reduce((sum, a) => sum + a.balance, 0) + investments.reduce((sum, i) => sum + (i.currentValue || i.amount), 0)).toFixed(2)
      },
      accounts: accounts,
      investments: investmentSummary.length > 0 ? investmentSummary : ['Nenhum investimento registrado.'],
      debts_upcoming: debts.length > 0 ? debts : ['Nenhuma dívida próxima.'],
      recent_transactions: dashboard.recentTransactions.slice(-10).map(t => 
        `${t.date.toISOString().split('T')[0]}: ${t.type} R$ ${t.amount} (${t.category?.name || 'Sem cat.'})`
      ),
      hustle_goals: {
        monthly_need: dashboard.goals.monthlyNeed.toFixed(2),
        fixed_costs: dashboard.fixedCosts.total.toFixed(2)
      }
    };
  }
}
