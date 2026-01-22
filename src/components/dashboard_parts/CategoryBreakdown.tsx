'use client';

import { useMemo, useState } from 'react';

interface Transaction {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: { name: string, color?: string };
  date: string;
  transferId?: string;
}

export default function CategoryBreakdown({ transactions, isLoading = false }: { transactions: Transaction[], isLoading?: boolean }) {
  const [view, setView] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const breakdown = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      // Exclude transfers
      return !t.transferId && t.type === view && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const total = filtered.reduce((acc, t) => acc + t.amount, 0);

    const grouped = filtered.reduce((acc, t) => {
      const cat = t.category?.name || 'Outros';
      const color = t.category?.color || (view === 'EXPENSE' ? '#000000' : '#10b981');
      if (!acc[cat]) acc[cat] = { amount: 0, color };
      acc[cat].amount += t.amount;
      return acc;
    }, {} as Record<string, { amount: number, color: string }>);

    return Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        color: data.color,
        percentage: total > 0 ? (data.amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, view]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Distribuição</h3>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('EXPENSE')} 
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${view === 'EXPENSE' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Gastos
          </button>
          <button 
            onClick={() => setView('INCOME')} 
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${view === 'INCOME' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Ganhos
          </button>
        </div>
      </div>
      
      <div className="flex-1 space-y-6">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-24 bg-gray-50 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-50 rounded animate-pulse" />
              </div>
              <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                <div className="h-full bg-gray-100 rounded-full animate-pulse w-1/2" />
              </div>
            </div>
          ))
        ) : breakdown.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
             <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             </div>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Sem dados no período</p>
          </div>
        ) : (
          breakdown.map((item) => (
            <div key={item.name} className="space-y-2 group">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-gray-400 group-hover:text-gray-900 transition-colors">{item.name}</span>
                <span className="text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
              <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden p-0.5 border border-gray-100/50">
                <div 
                  className="h-full rounded-full transition-all duration-1000 shadow-sm"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                />
              </div>
              <div className="flex justify-end">
                <span className="text-[8px] font-black text-gray-300">{item.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
