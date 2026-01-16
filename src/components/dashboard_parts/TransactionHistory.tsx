'use client';

import { useMemo } from 'react';

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
  
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return transactions.filter(t => {
      const mSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      t.category.name.toLowerCase().includes(searchQuery.toLowerCase());
      return mSearch;
    });
  }, [transactions, searchQuery]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100/50 flex flex-col overflow-hidden h-full">
      <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black">Histórico</h2>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">{selectedIds.length} selecionados</span>
              <button onClick={onDeleteBulk} className="text-[10px] font-black text-rose-600 hover:underline uppercase">Excluir</button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            value={searchQuery} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="w-full md:w-64 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl py-2 px-4 text-xs font-bold outline-none transition-all" 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {isLoading ? (
          <div className="py-20 text-center animate-pulse text-gray-300 font-black uppercase text-xs tracking-widest">Sincronizando...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center opacity-30 font-bold text-gray-400">Nenhuma movimentação encontrada.</div>
        ) : (
          filteredTransactions.slice(0, 50).map((t) => (
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
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${selectedIds.includes(t.id) ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                    {t.category.name}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${selectedIds.includes(t.id) ? 'bg-white/20' : 'bg-indigo-50 text-indigo-500'}`}>
                    {t.account.name}
                  </span>
                  <span className={`text-[9px] font-bold ${selectedIds.includes(t.id) ? 'text-white/60' : 'text-gray-300'}`}>
                    {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className={`text-right font-black tabular-nums text-sm md:text-lg whitespace-nowrap ${selectedIds.includes(t.id) ? 'text-white' : t.type === 'INCOME' ? 'text-emerald-600' : 'text-gray-900'}`}>
                {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
              </div>
              
              {/* Edit Button (Visible on Hover/Desktop) */}
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                className={`absolute right-2 top-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:block
                  ${selectedIds.includes(t.id) ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-400'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
