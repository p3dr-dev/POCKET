'use client';

import { useMemo } from 'react';

interface Debt {
  id: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
}

export default function MonthlyDebtsWidget({ debts }: { debts: Debt[] }) {
  const currentMonthDebts = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return debts
      .filter(d => {
        if (!d.dueDate) return false;
        const date = new Date(d.dueDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [debts]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-6">Dívidas do Mês</h3>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        {currentMonthDebts.length === 0 ? (
           <p className="text-xs text-gray-400 font-medium">Nenhuma dívida para este mês.</p>
        ) : (
           currentMonthDebts.map(debt => {
             const progress = Math.min((debt.paidAmount / debt.totalAmount) * 100, 100);
             const isOverdue = new Date(debt.dueDate) < new Date() && progress < 100;

             return (
               <div key={debt.id} className="space-y-2">
                 <div className="flex justify-between items-end">
                   <div>
                     <p className="font-bold text-xs text-gray-900 line-clamp-1">{debt.description}</p>
                     <p className={`text-[9px] font-black uppercase ${isOverdue ? 'text-rose-500' : 'text-gray-400'}`}>
                       {isOverdue ? 'Vencida dia ' : 'Vence dia '}{new Date(debt.dueDate).getDate()}
                     </p>
                   </div>
                   <p className="font-black text-xs tabular-nums text-gray-900">{formatCurrency(debt.totalAmount)}</p>
                 </div>
                 
                 <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                   <div 
                     className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-black'}`}
                     style={{ width: `${progress}%` }}
                   />
                 </div>
               </div>
             );
           })
        )}
      </div>
    </div>
  );
}
