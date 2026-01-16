'use client';

import { useMemo } from 'react';

interface Transaction {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: { name: string };
  date: string;
}

export default function CategoryBreakdown({ transactions }: { transactions: Transaction[] }) {
  const breakdown = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expenses = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'EXPENSE' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);

    const grouped = expenses.reduce((acc, t) => {
      const cat = t.category.name;
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-6">Maiores Gastos (Mês)</h3>
      
      <div className="flex-1 space-y-5">
        {breakdown.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium">Sem despesas registradas.</p>
        ) : (
          breakdown.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider">
                <span className="text-gray-500">{item.name}</span>
                <span className="text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-black rounded-full transition-all duration-1000"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
