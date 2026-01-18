'use client';

import { useMemo } from 'react';

interface Commitment {
  id: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  type?: 'DEBT' | 'SUBSCRIPTION';
}

export default function MonthlyDebtsWidget({ debts }: { debts: Commitment[] }) {
  const currentMonthCommitments = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return debts
      .filter(d => {
        if (!d.dueDate) return false;
        const date = new Date(d.dueDate);
        const isThisMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        const isOverdueAndUnpaid = date < now && d.paidAmount < d.totalAmount;
        
        return isThisMonth || isOverdueAndUnpaid;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [debts]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-6">Compromissos do Mês</h3>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        {currentMonthCommitments.length === 0 ? (
           <p className="text-xs text-gray-400 font-medium text-center py-10 italic">Nenhum compromisso pendente este mês.</p>
        ) : (
           currentMonthCommitments.map(item => {
             const progress = Math.min((item.paidAmount / (item.totalAmount || 1)) * 100, 100);
             const isOverdue = new Date(item.dueDate) < new Date() && progress < 100;

             return (
               <div key={item.id} className="group p-1">
                 <div className="flex justify-between items-end mb-2">
                   <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'SUBSCRIPTION' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                        {item.type === 'SUBSCRIPTION' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-gray-900 line-clamp-1 group-hover:text-black transition-colors">{item.description}</p>
                        <p className={`text-[9px] font-black uppercase tracking-tighter ${isOverdue ? 'text-rose-500' : 'text-gray-400'}`}>
                          {isOverdue ? 'Atrasado desde ' : 'Vence dia '}{new Date(item.dueDate).getDate()}
                        </p>
                      </div>
                   </div>
                   <p className="font-black text-xs tabular-nums text-gray-900">{formatCurrency(item.totalAmount)}</p>
                 </div>
                 
                 <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden p-0.5 border border-gray-100/50">
                   <div 
                     className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : item.type === 'SUBSCRIPTION' ? 'bg-indigo-500' : 'bg-black'}`}
                     style={{ width: `${item.type === 'SUBSCRIPTION' ? 100 : progress}%` }}
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
