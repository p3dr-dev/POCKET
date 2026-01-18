'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
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
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onDeleteBulk: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEdit: (t: Transaction) => void;
}

const formatDateGroup = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Normaliza a data da transação para meia-noite para comparação
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (txDate.getTime() === today.getTime()) return 'Hoje';
  if (txDate.getTime() === yesterday.getTime()) return 'Ontem';
  
  // Capitaliza a primeira letra
  const s = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function TransactionHistory({
  transactions,
  isLoading,
  selectedIds,
  onToggleSelect,
  onDeleteBulk,
  searchQuery,
  onSearchChange,
  onEdit
}: TransactionHistoryProps) {
  
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    const list = Array.isArray(transactions) ? transactions : [];
    
    list.forEach(t => {
      const group = formatDateGroup(t.date);
      if (!groups[group]) groups[group] = [];
      groups[group].push(t);
    });

    return groups;
  }, [transactions]);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100/50 flex flex-col overflow-hidden h-full">
      <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black">Histórico</h2>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">{selectedIds.length} selecionados</span>
              <button onClick={onDeleteBulk} aria-label="Excluir selecionados" className="text-[10px] font-black text-rose-600 hover:underline uppercase">Excluir</button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            value={searchQuery} 
            onChange={(e) => onSearchChange(e.target.value)} 
            aria-label="Pesquisar histórico"
            className="w-full md:w-64 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl py-2 px-4 text-xs font-bold outline-none transition-all" 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-4">
             {[...Array(5)].map((_, i) => (
               <div key={i} className="flex items-center gap-4 p-4 rounded-[2rem] border border-gray-50">
                 <div className="w-12 h-12 rounded-2xl bg-gray-100 animate-pulse" />
                 <div className="flex-1 space-y-2">
                   <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
                   <div className="flex gap-2">
                     <div className="h-3 w-16 bg-gray-50 rounded animate-pulse" />
                     <div className="h-3 w-16 bg-gray-50 rounded animate-pulse" />
                   </div>
                 </div>
                 <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
               </div>
             ))}
          </div>
        ) : Object.keys(groupedTransactions).length === 0 ? (
          <div className="py-20 text-center opacity-30 font-bold text-gray-400">Nenhuma movimentação encontrada.</div>
        ) : (
          Object.keys(groupedTransactions).map((dateGroup) => (
            <div key={dateGroup} className="space-y-3">
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-4">
                {dateGroup}
              </h3>
              <div className="space-y-2">
                {groupedTransactions[dateGroup].map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => onToggleSelect(t.id)} 
                    className={`group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 p-4 rounded-[2rem] transition-all border cursor-pointer select-none
                      ${selectedIds.includes(t.id) 
                        ? 'bg-black text-white border-black shadow-lg transform scale-[1.01]' 
                        : 'bg-white hover:bg-gray-50 border-transparent hover:border-gray-100 active:scale-[0.99]'
                      }`}
                  >
                    {/* Icon / Category Indicator */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
                      ${selectedIds.includes(t.id) ? 'bg-white/10 text-white' : t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.type === 'INCOME' ? 
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg> : 
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>
                      }
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex flex-col justify-center">
                      <p className={`font-black text-sm md:text-base truncate leading-tight ${selectedIds.includes(t.id) ? 'text-white' : 'text-gray-900'}`}>
                        {t.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1.5 bg-gray-100 rounded-md px-2 py-0.5">
                           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.category.color || '#000' }} />
                           <span className={`text-[9px] font-black uppercase ${selectedIds.includes(t.id) ? 'text-black' : 'text-gray-400'}`}>
                             {t.category.name}
                           </span>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${selectedIds.includes(t.id) ? 'bg-white/20' : 'bg-indigo-50 text-indigo-400'}`}>
                          {t.account.name}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className={`text-right font-black tabular-nums text-sm md:text-lg whitespace-nowrap ${selectedIds.includes(t.id) ? 'text-white' : t.type === 'INCOME' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                    </div>
                    
                    {/* Edit Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                      aria-label="Editar transação"
                      className={`absolute right-2 top-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:block
                        ${selectedIds.includes(t.id) ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-400'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
