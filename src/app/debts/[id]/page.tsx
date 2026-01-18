'use client';

import { useState, useEffect, use } from 'react';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Debt {
  id: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export default function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [debt, setDebt] = useState<Debt | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { id } = use(params);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/debts`); // Idealmente seria /api/debts/[id]
        const debts = await res.json();
        const currentDebt = debts.find((d: Debt) => d.id === id);
        
        if (!currentDebt) throw new Error('Dívida não encontrada');
        setDebt(currentDebt);

        // Buscar histórico de pagamentos (Heurística por nome)
        const txRes = await fetch('/api/transactions');
        const txs = await txRes.json();
        const relatedTxs = txs.filter((t: Transaction) => 
          t.description.includes(currentDebt.description) && t.description.toLowerCase().includes('pagamento')
        );
        setHistory(relatedTxs);

      } catch {
        toast.error('Erro ao carregar');
        router.push('/debts');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] font-sans text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="flex-none bg-[#F8FAFC]/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center gap-4 border-b border-gray-100 z-10">
          <button onClick={() => router.back()} className="p-2 bg-white rounded-xl shadow-sm border hover:bg-gray-50"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
          <h1 className="text-xl font-black tracking-tight">{debt?.description || 'Carregando...'}</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {debt && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 text-center">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Restante</p>
                 <h2 className="text-5xl font-black text-gray-900 mt-2">{formatCurrency(debt.totalAmount - debt.paidAmount)}</h2>
                 <p className="text-xs font-bold text-gray-400 mt-4">Total Original: {formatCurrency(debt.totalAmount)}</p>
                 
                 <div className="mt-8 h-4 w-full bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(debt.paidAmount / debt.totalAmount) * 100}%` }} />
                 </div>
                 <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase tracking-widest">{((debt.paidAmount / debt.totalAmount) * 100).toFixed(0)}% Quitado</p>
              </div>

              <div>
                <h3 className="font-black text-lg mb-4">Histórico de Pagamentos</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhum pagamento registrado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map(t => (
                      <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                          <p className="text-xs text-gray-400">{t.description}</p>
                        </div>
                        <span className="font-black text-emerald-600">{formatCurrency(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
