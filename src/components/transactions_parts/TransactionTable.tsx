'use client';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  categoryId: string;
  accountId: string;
  category: { name: string };
  account: { name: string };
  payee?: string;
  payer?: string;
  bankRefId?: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionTable({ transactions, isLoading, onEdit, onDelete }: TransactionTableProps) {
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
        <p className="mt-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Carregando...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30">
        <p className="font-bold text-gray-400">Nenhuma transação encontrada.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View (Card List) */}
      <div className="flex-1 overflow-y-auto block lg:hidden p-4 space-y-3 custom-scrollbar">
        {transactions.map((t) => (
          <div key={t.id} className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4 shadow-sm active:scale-[0.98] transition-transform">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {t.type === 'INCOME' ? 
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg> : 
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>
                  }
                </div>
                <div>
                  <h3 className="font-black text-gray-900 leading-tight">{t.description}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t.category.name}</p>
                </div>
              </div>
              <div className={`font-black tabular-nums text-right ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-gray-900'}`}>
                {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded w-fit">{t.account.name}</span>
                <span className="text-[10px] font-bold text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(t)} className="p-2 bg-gray-50 rounded-lg text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                <button onClick={() => onDelete(t.id)} className="p-2 bg-rose-50 rounded-lg text-rose-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View (Table) */}
      <div className="flex-1 overflow-y-auto hidden lg:block custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10 border-b border-gray-100 shadow-sm">
            <tr>
              <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Data</th>
              <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Descrição / Detalhes</th>
              <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Conta</th>
              <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Pagador/Recebedor</th>
              <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</th>
              <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map((t) => (
              <tr key={t.id} className="group hover:bg-gray-50/80 transition-all">
                <td className="px-6 py-5 text-xs font-bold text-gray-400 tabular-nums">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-black text-gray-900 text-sm">{t.description}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] font-black text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">{t.category.name}</span>
                      {t.bankRefId && <span className="text-[8px] font-mono text-gray-300">ID: {t.bankRefId.slice(0, 12)}...</span>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 whitespace-nowrap">
                    {t.account.name}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-0.5">
                    {t.payer && <span className="text-[10px] font-bold text-gray-500 truncate max-w-[150px]"><span className="text-gray-300">De:</span> {t.payer}</span>}
                    {t.payee && <span className="text-[10px] font-bold text-gray-500 truncate max-w-[150px]"><span className="text-gray-300">Para:</span> {t.payee}</span>}
                  </div>
                </td>
                <td className={`px-6 py-5 text-right font-black tabular-nums text-base ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => onEdit(t)} className="p-2 hover:bg-black hover:text-white rounded-lg text-gray-400 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => onDelete(t.id)} className="p-2 hover:bg-rose-600 hover:text-white rounded-lg text-gray-400 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
