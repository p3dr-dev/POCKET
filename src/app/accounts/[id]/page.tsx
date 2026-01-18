'use client';

import { useState, useEffect, use } from 'react';
import Sidebar from '@/components/Sidebar';
import TransactionHistory from '@/components/dashboard_parts/TransactionHistory';
import TransactionModal from '@/components/modals/TransactionModal';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Account {
  id: string;
  name: string;
  type: string;
  color: string;
  balance: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  category: { name: string };
  account: { name: string };
}

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Unwrap params using React.use()
  const { id } = use(params);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch account details
      const accRes = await fetch(`/api/accounts/${id}`);
      if (!accRes.ok) throw new Error('Conta não encontrada');
      const accData = await accRes.json();
      setAccount(accData);

      // Fetch account transactions
      // Note: We might need a specific API route or filter params for this
      // Ideally: /api/transactions?accountId={id}
      // For now, let's filter client-side or assume an endpoint exists
      // I will implement a filter in the main transactions API or create a specific one
      const txRes = await fetch(`/api/transactions?accountId=${id}`); 
      const txData = await txRes.json();
      setTransactions(Array.isArray(txData) ? txData : []);

    } catch (err) {
      toast.error('Erro ao carregar dados da conta');
      router.push('/accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleDeleteTransaction = async () => {
    if (!confirm(`Excluir ${selectedIds.length} transações?`)) return;
    try {
      await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      toast.success('Transações excluídas');
      setSelectedIds([]);
      fetchData();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] font-sans selection:bg-black selection:text-white overflow-hidden text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="flex-none bg-[#F8FAFC]/80 backdrop-blur-md px-4 md:px-8 py-4 flex justify-between items-center border-b border-gray-100/50 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-black tracking-tight">{account?.name || 'Carregando...'}</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{account?.type || 'Conta'}</p>
            </div>
          </div>
          <button 
            onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} 
            className="bg-black text-white px-5 py-3 rounded-2xl font-black hover:bg-gray-800 transition-all text-xs flex items-center gap-2 active:scale-95 shadow-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">Nova Transação</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-10 custom-scrollbar">
          <div className="max-w-screen-xl mx-auto space-y-8">
            
            {/* Account Summary Card */}
            {account && (
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
                 <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                       <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Saldo Atual</span>
                       <h2 className={`text-4xl md:text-6xl font-black tabular-nums mt-2 tracking-tighter ${account.balance >= 0 ? 'text-gray-900' : 'text-rose-600'}`}>
                         {formatCurrency(account.balance)}
                       </h2>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: account.color || '#000' }}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                       </div>
                    </div>
                 </div>
                 <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full opacity-[0.03] pointer-events-none" style={{ backgroundColor: account.color || '#000' }} />
              </div>
            )}

            {/* Transactions List */}
            <div className="h-[600px]">
              <TransactionHistory 
                transactions={transactions}
                isLoading={isLoading}
                selectedIds={selectedIds}
                onToggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                onDeleteBulk={handleDeleteTransaction}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
              />
            </div>
          </div>
        </div>
      </main>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }} 
        onSuccess={fetchData} 
        transaction={editingTransaction} 
      />
    </div>
  );
}
