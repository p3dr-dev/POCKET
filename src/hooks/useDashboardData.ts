import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  categoryId: string;
  category: { name: string, color?: string };
  accountId: string;
  account: { name: string };
  bankRefId?: string;
  transferId?: string;
}

export function useDashboardData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (search = '') => {
    setIsLoading(true);
    try {
      const [txRes, accRes, invRes, debtRes, catRes, subRes] = await Promise.all([
        fetch(`/api/transactions?limit=500&search=${search}`),
        fetch('/api/accounts'),
        fetch('/api/investments'),
        fetch('/api/debts'),
        fetch('/api/categories'),
        fetch('/api/subscriptions')
      ]);
      
      const txData = await txRes.json();
      setTransactions(txData.transactions || []);
      setAccounts(await accRes.json());
      setInvestments(await invRes.json());
      setDebts(await debtRes.json());
      setCategories(await catRes.json());
      setSubscriptions(await subRes.json());

      const [nwRes, healthRes] = await Promise.all([
        fetch('/api/reports/net-worth'),
        fetch('/api/reports/financial-health')
      ]);
      
      setNetWorthHistory(await nwRes.json());
      setHealthData(await healthRes.json());

    } catch (err) {
      console.error('Fetch Error:', err);
      toast.error('Erro de conexão com o servidor');
    } finally { setIsLoading(false); }
  }, []);

  // Hook para Stats e Cálculos
  const getStats = useMemo(() => (timeView: 'DAY' | 'WEEK' | 'MONTH') => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const filterDate = timeView === 'DAY' ? startOfDay : timeView === 'WEEK' ? startOfWeek : startOfMonth;

    // Accounts balance
    const accBalance = Array.isArray(accounts) ? accounts.reduce((acc, a) => acc + (a.balance || 0), 0) : 0;
    const invTotal = Array.isArray(investments) ? investments.reduce((acc, i) => acc + (i.currentValue || i.amount), 0) : 0;

    const periodTxs = Array.isArray(transactions) ? transactions.filter(t => new Date(t.date) >= filterDate) : [];
    
    // Exclude transfers (t.transferId)
    const periodIncomes = periodTxs.filter(t => t.type === 'INCOME' && !t.transferId).reduce((acc, t) => acc + t.amount, 0);
    const periodExpenses = periodTxs.filter(t => t.type === 'EXPENSE' && !t.transferId).reduce((acc, t) => acc + t.amount, 0);

    // Comparison with Previous Month
    const prevMonthTxs = Array.isArray(transactions) ? transactions.filter(t => {
      const d = new Date(t.date);
      return d >= startOfPrevMonth && d <= endOfPrevMonth;
    }) : [];
    const prevMonthIncomes = prevMonthTxs.filter(t => t.type === 'INCOME' && !t.transferId).reduce((acc, t) => acc + t.amount, 0);
    const prevMonthExpenses = prevMonthTxs.filter(t => t.type === 'EXPENSE' && !t.transferId).reduce((acc, t) => acc + t.amount, 0);

    const calcChange = (current: number, prev: number) => {
      if (prev === 0) {
        if (current === 0) return 0;
        return current > 0 ? 100 : -100;
      }
      return ((current - prev) / prev) * 100;
    };

    // Filter Debts
    const monthDebts = Array.isArray(debts) ? debts.filter(d => {
      if (!d.dueDate) return false;
      const dDate = new Date(d.dueDate);
      const isPaid = (d.totalAmount - d.paidAmount) <= 0.01;
      return !isPaid && ((dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear()) || (dDate < now));
    }) : [];
    
    const monthDebtsTotal = monthDebts.reduce((acc, d) => acc + d.totalAmount, 0);
    const monthDebtsRemaining = monthDebts.reduce((acc, d) => acc + Math.max(0, d.totalAmount - d.paidAmount), 0);

    const activeSubscriptions = Array.isArray(subscriptions) ? subscriptions.filter(s => s.active) : [];
    const monthlyFixedCost = activeSubscriptions
      .filter(s => s.type === 'EXPENSE')
      .reduce((acc, s) => {
        let val = s.amount || 0;
        if (s.frequency === 'WEEKLY') val *= 4;
        if (s.frequency === 'YEARLY') val /= 12;
        return acc + val;
      }, 0);

    const pendingIncomes = activeSubscriptions
      .filter(s => s.type === 'INCOME')
      .reduce((acc, s) => {
        let val = s.amount || 0;
        if (s.frequency === 'WEEKLY') val *= 4;
        if (s.frequency === 'YEARLY') val /= 12;
        return acc + val;
      }, 0);

    const goalTarget = healthData?.monthlyGoalTarget || 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);
    
    const totalCommitments = monthDebtsRemaining + monthlyFixedCost;
    const survivalLimit = (accBalance + pendingIncomes - totalCommitments) / daysRemaining;
    const idealLimit = survivalLimit - (goalTarget / daysRemaining);
    const dailyGoal = idealLimit < 0 ? survivalLimit : idealLimit;
    const isSacrificingGoals = idealLimit < 0 && survivalLimit > 0;

    return {
      netWorth: accBalance + invTotal,
      periodIncomes,
      periodExpenses,
      incomeChange: calcChange(periodIncomes, prevMonthIncomes),
      expenseChange: calcChange(periodExpenses, prevMonthExpenses),
      monthDebtsTotal,
      monthDebtsRemaining,
      monthlyFixedCost,
      totalCommitments,
      dailyGoal,
      idealLimit,
      isSacrificingGoals,
      revenueGap: healthData?.revenueGap || 0,
      liquid: accBalance,
      investmentTotal: invTotal
    };
  }, [accounts, investments, debts, transactions, subscriptions, healthData]);

  const combinedCommitments = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const debtsList = Array.isArray(debts) ? debts
      .filter(d => {
        if (!d.dueDate) return true;
        const dDate = new Date(d.dueDate);
        const isPaid = (d.totalAmount - d.paidAmount) <= 0.01;
        return !isPaid && ((dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear) || (dDate < now));
      })
      .map(d => ({ ...d, type: 'DEBT' as const })) : [];

    const subsList = Array.isArray(subscriptions) ? subscriptions
      .filter(s => s.active)
      .map(s => ({
        id: s.id,
        description: s.description,
        totalAmount: s.amount || 0,
        paidAmount: 0,
        dueDate: s.nextRun || new Date(currentYear, currentMonth, 28).toISOString(),
        type: 'SUBSCRIPTION' as const
      })) : [];

    return [...debtsList, ...subsList].sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [debts, subscriptions]);

  return {
    transactions,
    accounts,
    investments,
    debts,
    categories,
    subscriptions,
    netWorthHistory,
    healthData,
    isLoading,
    fetchData,
    getStats,
    combinedCommitments
  };
}
