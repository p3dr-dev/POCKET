'use client';

import { useMemo } from 'react';

interface Transaction {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
}

export default function DailyExpensesWidget({ transactions }: { transactions: Transaction[] }) {
  const dailyData = useMemo(() => {
    // 1. Filtrar apenas despesas do mês atual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expenses = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'EXPENSE' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // 2. Agrupar por dia
    const grouped = expenses.reduce((acc, t) => {
      const day = new Date(t.date).getDate();
      acc[day] = (acc[day] || 0) + t.amount;
      return acc;
    }, {} as Record<number, number>);

    // 3. Preencher array de dados (dias 1..31)
    // Para simplificar e ficar bonito, vamos pegar os últimos 7 dias ou o mês todo?
    // Mês todo pode ficar apertado. Vamos mostrar o mês todo mas com scroll se precisar ou apenas barras finas.
    // Melhor: Mês todo.
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const data = [];
    let maxAmount = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const amount = grouped[i] || 0;
      if (amount > maxAmount) maxAmount = amount;
      data.push({ day: i, amount });
    }

    return { data, maxAmount };
  }, [transactions]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-6">Gastos Diários (Mês Atual)</h3>
      
      <div className="flex-1 flex items-end gap-1 overflow-x-auto custom-scrollbar pb-2">
        {dailyData.data.map((d) => (
          <div key={d.day} className="group relative flex-1 min-w-[12px] flex flex-col justify-end items-center gap-2 h-40">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-10 pointer-events-none">
              Dia {d.day}: {formatCurrency(d.amount)}
            </div>
            
            {/* Bar */}
            <div 
              className={`w-full rounded-t-lg transition-all duration-500 ${d.amount > 0 ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-gray-100'}`}
              style={{ height: d.amount > 0 ? `${(d.amount / dailyData.maxAmount) * 100}%` : '4px' }}
            />
            
            {/* Label (apenas alguns dias para não poluir) */}
            <span className="text-[9px] font-bold text-gray-400">
               {d.day % 5 === 0 || d.day === 1 ? d.day : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
