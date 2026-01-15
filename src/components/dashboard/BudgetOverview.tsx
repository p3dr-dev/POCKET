'use client';

import { useMemo } from 'react';

interface Transaction {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string;
  date: string;
}

interface Category {
  id: string;
  name: string;
  monthlyLimit: number | null;
  type: 'INCOME' | 'EXPENSE';
}

export default function BudgetOverview({ 
  transactions, 
  categories 
}: { 
  transactions: Transaction[], 
  categories: Category[] 
}) {
  const budgets = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Categorias que possuem limite
    const activeBudgets = categories.filter(c => c.monthlyLimit && c.monthlyLimit > 0 && c.type === 'EXPENSE');

    return activeBudgets.map(cat => {
      const spent = transactions
        .filter(t => {
          const d = new Date(t.date);
          return t.categoryId === cat.id && d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'EXPENSE';
        })
        .reduce((acc, t) => acc + t.amount, 0);

      const limit = cat.monthlyLimit || 0;
      const percentage = Math.min((spent / limit) * 100, 100);
      const isOver = spent > limit;

      return {
        name: cat.name,
        spent,
        limit,
        percentage,
        isOver
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [transactions, categories]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  if (budgets.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-6">Orçamentos Ativos</h3>
      
      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
        {budgets.map((budget) => (
          <div key={budget.name} className="space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <span className="font-black text-xs text-gray-900">{budget.name}</span>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                  {formatCurrency(budget.spent)} de {formatCurrency(budget.limit)}
                </p>
              </div>
              <span className={`text-[10px] font-black ${budget.isOver ? 'text-rose-500' : 'text-emerald-500'}`}>
                {budget.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${budget.isOver ? 'bg-rose-500' : budget.percentage > 80 ? 'bg-orange-400' : 'bg-indigo-500'}`}
                style={{ width: `${budget.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
