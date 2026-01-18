'use client';

import { useState, useEffect, useMemo } from 'react';
import SummaryCard from '@/components/SummaryCard';
import TransactionModal from '@/components/modals/TransactionModal';
import Sidebar from '@/components/Sidebar';
import DailyExpensesWidget from '@/components/widgets/DailyExpensesWidget';
import MonthlyDebtsWidget from '@/components/widgets/MonthlyDebtsWidget';
import TransactionHistory from '@/components/dashboard_parts/TransactionHistory';
import AiLabWidget from '@/components/dashboard_parts/AiLabWidget';
import FinancialPlanner from '@/components/dashboard_parts/FinancialPlanner';
import CategoryBreakdown from '@/components/dashboard_parts/CategoryBreakdown';
import BudgetOverview from '@/components/dashboard_parts/BudgetOverview';
import NetWorthChart from '@/components/dashboard_parts/NetWorthChart';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  categoryId: string;
  category: { name: string };
  accountId: string;
  account: { name: string };
  bankRefId?: string;
  transferId?: string;
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeView, setTimeView] = useState<'DAY' | 'WEEK' | 'MONTH'>('MONTH');
  
  // IA Lab State
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [txRes, accRes, invRes, debtRes, catRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/accounts?includeTransactions=true'),
        fetch('/api/investments'),
        fetch('/api/debts'),
        fetch('/api/categories')
      ]);
      setTransactions(await txRes.json());
      setAccounts(await accRes.json());
      setInvestments(await invRes.json());
      setDebts(await debtRes.json());
      setCategories(await catRes.json());
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const filterDate = timeView === 'DAY' ? startOfDay : timeView === 'WEEK' ? startOfWeek : startOfMonth;

    // Accounts balance
    const accBalance = Array.isArray(accounts) ? accounts.reduce((acc, a) => {
      const b = a.transactions?.reduce((sum: number, t: any) => t.type === 'INCOME' ? sum + t.amount : sum - t.amount, 0) || 0;
      return acc + b;
    }, 0) : 0;

    const invTotal = Array.isArray(investments) ? investments.reduce((acc, i) => acc + i.amount, 0) : 0;

    const periodTxs = Array.isArray(transactions) ? transactions.filter(t => new Date(t.date) >= filterDate) : [];
    const periodIncomes = periodTxs.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const periodExpenses = periodTxs.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

    // Comparison with Previous Month
    const prevMonthTxs = Array.isArray(transactions) ? transactions.filter(t => {
      const d = new Date(t.date);
      return d >= startOfPrevMonth && d <= endOfPrevMonth;
    }) : [];
    const prevMonthIncomes = prevMonthTxs.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const prevMonthExpenses = prevMonthTxs.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

    const calcChange = (current: number, prev: number) => {
      if (prev === 0) {
        if (current === 0) return 0;
        return current > 0 ? 100 : -100;
      }
      return ((current - prev) / prev) * 100;
    };

    const monthDebts = Array.isArray(debts) ? debts.filter(d => {
      if (!d.dueDate) return false;
      const dDate = new Date(d.dueDate);
      return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
    }) : [];
    
    const monthDebtsTotal = monthDebts.reduce((acc, d) => acc + d.totalAmount, 0);
    const monthDebtsRemaining = monthDebts.reduce((acc, d) => acc + (d.totalAmount - d.paidAmount), 0);

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);
    const dailyGoal = monthDebtsRemaining / daysRemaining;

    return {
      netWorth: accBalance + invTotal,
      periodIncomes,
      periodExpenses,
      incomeChange: calcChange(periodIncomes, prevMonthIncomes),
      expenseChange: calcChange(periodExpenses, prevMonthExpenses),
      monthDebtsTotal,
      monthDebtsRemaining,
      dailyGoal,
      liquid: accBalance
    };
  }, [accounts, investments, debts, transactions, timeView]);

  const handleManualAI = async () => {
    setIsAiLoading(true);
    try {
      // Calcular breakdown localmente para enviar à IA
      const currentMonth = new Date().getMonth();
      const expenses = transactions.filter(t => t.type === 'EXPENSE' && new Date(t.date).getMonth() === currentMonth);
      const grouped = expenses.reduce((acc, t) => {
        const cat = t.category?.name || 'Outros';
        acc[cat] = (acc[cat] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
      
      const topCategories = Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, val]) => `${name}: R$ ${val.toFixed(2)}`)
        .join(', ');

      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...stats, topCategories }),
      });
      const result = await res.json();
      setAiInsight(result.content);
      toast.success('Insights gerados pelo Gemini');
    } catch {
      toast.error('Erro ao chamar IA');
    } finally { setIsAiLoading(false); }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Excluir ${selectedIds.length} transações?`)) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        toast.success('Removidas');
        setSelectedIds([]);
        await fetchData();
      }
    } finally { setIsLoading(false); }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] font-sans selection:bg-black selection:text-white overflow-hidden text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="flex-none px-6 py-6 xl:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100/50 bg-[#F8FAFC]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded-xl shadow-sm border lg:hidden active:scale-95 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-black">Dashboard</h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                  {(['DAY', 'WEEK', 'MONTH'] as const).map(v => (
                    <button key={v} onClick={() => setTimeView(v)} className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all ${timeView === v ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>{v === 'DAY' ? 'Dia' : v === 'WEEK' ? 'Sem' : 'Mês'}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} 
            className="bg-black text-white px-8 py-4 rounded-[20px] font-black hover:bg-gray-800 transition-all shadow-xl flex items-center gap-3 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            <span>Novo Lançamento</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 xl:px-12 py-8 custom-scrollbar">
          <div className="max-w-screen-2xl mx-auto space-y-10 pb-20">
            
            {/* Onboarding Wizard (Only visible if no transactions & not loading) */}
            {!isLoading && transactions.length === 0 && (
              <div className="bg-black text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in slide-in-from-top-4 relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                   <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4">Bem-vindo ao Pocket! 🚀</h2>
                   <p className="text-gray-400 font-medium mb-8 leading-relaxed">
                     Seu painel financeiro está pronto. Para começar a ver a mágica acontecer, precisamos de alguns dados iniciais.
                     Siga os passos abaixo para ativar sua inteligência financeira.
                   </p>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button onClick={() => window.location.href='/accounts'} className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left transition-all border border-white/10 group">
                         <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">1</div>
                         <h3 className="font-bold text-sm">Criar Conta</h3>
                         <p className="text-[10px] text-gray-400 mt-1">Cadastre seu banco ou carteira física.</p>
                      </button>
                      <button onClick={() => setIsModalOpen(true)} className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left transition-all border border-white/10 group">
                         <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">2</div>
                         <h3 className="font-bold text-sm">Primeiro Registro</h3>
                         <p className="text-[10px] text-gray-400 mt-1">Adicione uma receita ou despesa inicial.</p>
                      </button>
                   </div>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
                   <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad-onboarding)" />
                      <defs>
                        <linearGradient id="grad-onboarding" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                   </svg>
                </div>
              </div>
            )}

            {/* Main Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard title="Patrimônio Líquido" value={formatCurrency(stats.netWorth)} type="balance" isLoading={isLoading} />
              <SummaryCard 
                title={timeView === 'DAY' ? 'Receita Hoje' : timeView === 'WEEK' ? 'Receita Semana' : 'Receita Mês'} 
                value={formatCurrency(stats.periodIncomes)} 
                type="income" 
                change={timeView === 'MONTH' ? stats.incomeChange : undefined}
                isLoading={isLoading}
              />
              <SummaryCard 
                title="Dívidas (Mês)" 
                value={formatCurrency(stats.monthDebtsRemaining)} 
                type="expense" 
                change={timeView === 'MONTH' ? stats.expenseChange : undefined}
                isLoading={isLoading}
              />
              <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 flex flex-col justify-between group overflow-hidden relative transition-all hover:scale-[1.02]">
                <div className="relative z-10">
                  <span className="text-indigo-200 text-[10px] font-black uppercase tracking-widest leading-none">Meta Diária Restante</span>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-indigo-500 rounded-lg animate-pulse mt-2" />
                  ) : (
                    <h3 className="text-2xl font-black mt-2 tabular-nums">{formatCurrency(stats.dailyGoal)}</h3>
                  )}
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              </div>
            </div>

            {/* Middle Section: Planner, Evolution & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              <FinancialPlanner 
                monthDebtsTotal={stats.monthDebtsTotal} 
                monthDebtsRemaining={stats.monthDebtsRemaining} 
                dailyGoal={stats.dailyGoal} 
                isLoading={isLoading}
              />
              <NetWorthChart transactions={transactions} currentBalance={stats.netWorth} />
              <CategoryBreakdown transactions={transactions} isLoading={isLoading} />
            </div>

            {/* Widgets Section: AI, Budgets & Debts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
               <div className="space-y-8">
                 <AiLabWidget 
                   insight={aiInsight} 
                   isLoading={isAiLoading} 
                   onGenerate={handleManualAI} 
                   onClear={() => setAiInsight(null)} 
                 />
                 <BudgetOverview transactions={transactions} categories={categories} />
               </div>
               <div className="space-y-8">
                 <DailyExpensesWidget transactions={transactions} />
                 <div className="h-[450px]">
                   <MonthlyDebtsWidget debts={debts} />
                 </div>
               </div>
            </div>

            {/* Bottom Section: Transaction History */}
            <div className="h-[800px]">
              <TransactionHistory 
                transactions={transactions}
                isLoading={isLoading}
                selectedIds={selectedIds}
                onToggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                onDeleteBulk={handleDeleteBulk}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
              />
            </div>
          </div>
        </div>
      </main>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }} 
        onSuccess={fetchData} 
        transaction={editingTransaction} 
      />
    </div>
  );
}
