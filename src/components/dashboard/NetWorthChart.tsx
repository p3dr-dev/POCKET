'use client';

import { useMemo } from 'react';

interface Transaction {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
}

export default function NetWorthChart({ 
  transactions, 
  currentBalance 
}: { 
  transactions: Transaction[], 
  currentBalance: number 
}) {
  const evolutionData = useMemo(() => {
    // Pegar os últimos 6 meses
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('pt-BR', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        value: 0
      });
    }

    // Reconstruir o patrimônio de trás para frente
    let runningBalance = currentBalance;
    const reversedMonths = [...months].reverse();

    return reversedMonths.map((m, idx) => {
      // Valor no final deste mês é o runningBalance atual
      const monthValue = runningBalance;

      // Para o próximo mês (indo para o passado), subtraímos o que entrou e somamos o que saiu NESTE mês
      const monthTxs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      });

      const monthIncomes = monthTxs.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
      const monthExpenses = monthTxs.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

      runningBalance = runningBalance - monthIncomes + monthExpenses;

      return {
        ...m,
        value: monthValue
      };
    }).reverse();
  }, [transactions, currentBalance]);

  const maxValue = Math.max(...evolutionData.map(d => d.value), 1);
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-8">Evolução Patrimonial (6 Meses)</h3>
      
      <div className="flex-1 flex items-end gap-4 pb-2">
        {evolutionData.map((d, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap z-10 pointer-events-none shadow-xl">
              {formatCurrency(d.value)}
            </div>

            {/* Bar */}
            <div 
              className="w-full bg-gray-50 rounded-2xl group-hover:bg-indigo-50 transition-colors relative overflow-hidden"
              style={{ height: '100%' }}
            >
              <div 
                className="absolute bottom-0 left-0 w-full bg-black rounded-2xl transition-all duration-1000 group-hover:bg-indigo-600"
                style={{ height: `${(d.value / maxValue) * 100}%` }}
              />
            </div>

            <span className="text-[10px] font-black text-gray-400 uppercase">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
