'use client';

import { formatCurrency } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string | number;
  type: 'income' | 'expense' | 'balance';
  change?: number; // Percentual de variação
  isLoading?: boolean;
}

export default function SummaryCard({ title, value, type, change, isLoading = false }: SummaryCardProps) {
  const styles = {
    income: {
      text: 'text-emerald-600',
      bg: 'bg-emerald-500',
      shadow: 'hover:shadow-emerald-100',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
    },
    expense: {
      text: 'text-rose-600',
      bg: 'bg-rose-500',
      shadow: 'hover:shadow-rose-100',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>
    },
    balance: {
      text: 'text-gray-900',
      bg: 'bg-black',
      shadow: 'hover:shadow-gray-200',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
  };

  const isPositiveChange = change !== undefined && change >= 0;
  // Para despesas, subir o gasto é negativo (vermelho), descer o gasto é positivo (verde)
  const isGoodTrend = type === 'expense' ? !isPositiveChange : isPositiveChange;

  return (
    <div className={`relative p-8 rounded-[2.5rem] bg-white border border-gray-100/60 shadow-sm transition-all duration-500 group overflow-hidden ${styles[type].shadow} hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between h-full`}>
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className={`p-3.5 rounded-2xl ${styles[type].bg} text-white shadow-lg transition-transform group-hover:scale-110 duration-500`}>
          {styles[type].icon}
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</span>
          {isLoading ? (
             <div className="h-4 w-12 bg-gray-100 rounded-full animate-pulse mt-1" />
          ) : change !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
              isGoodTrend ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
            }`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col relative z-10">
        {isLoading ? (
           <div className="space-y-2">
             <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
             <div className="h-3 w-20 bg-gray-50 rounded-md animate-pulse" />
           </div>
        ) : (
          <>
            <span className={`text-2xl xl:text-3xl font-black tracking-tighter tabular-nums leading-none ${styles[type].text}`}>
              {typeof value === 'number' ? formatCurrency(value) : value}
            </span>
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-2">Visão do Período</p>
          </>
        )}
      </div>

      {/* Decorativo de fundo sutil */}
      <div className={`absolute -right-2 -bottom-2 w-20 h-20 rounded-full opacity-[0.02] pointer-events-none transition-transform group-hover:scale-150 duration-700 ${styles[type].bg}`} />
    </div>
  );
}