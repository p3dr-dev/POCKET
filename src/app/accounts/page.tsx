'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import AccountModal from '@/components/AccountModal';
import ImportModal from '@/components/ImportModal';
import toast from 'react-hot-toast';

interface Account {
  id: string;
  name: string;
  type: 'BANK' | 'CASH' | 'CREDIT_CARD' | 'CRYPTO' | 'INVESTMENT';
  color: string;
  transactions: {
    amount: number;
    type: 'INCOME' | 'EXPENSE';
  }[];
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/accounts?includeTransactions=true');
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta conta?')) return;
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Conta excluída');
      fetchAccounts();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const handleReset = async (id: string) => {
    if (!confirm('ATENÇÃO: Isso apagará TODAS as transações desta conta. Continuar?')) return;
    try {
      const res = await fetch(`/api/accounts/${id}/reset`, { method: 'POST' });
      if (!res.ok) throw new Error();
      toast.success('Conta zerada');
      fetchAccounts();
    } catch {
      toast.error('Erro ao zerar conta');
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const calculateBalance = (account: Account) => {
    if (!account.transactions) return 0;
    return account.transactions.reduce((acc, t) => {
      return t.type === 'INCOME' ? acc + t.amount : acc - t.amount;
    }, 0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BANK': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
      case 'CASH': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'CREDIT_CARD': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
      case 'CRYPTO': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
      case 'INVESTMENT': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
      default: return null;
    }
  };

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] font-sans selection:bg-black selection:text-white overflow-hidden text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="flex-none bg-[#F8FAFC]/80 backdrop-blur-md px-4 md:px-8 py-4 flex justify-between items-center border-b border-gray-100/50 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 lg:hidden active:scale-95 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-black tracking-tight leading-none">Contas</h1>
              <p className="hidden md:block text-gray-400 text-[11px] font-bold uppercase tracking-wider mt-1">Gerencie seu saldo disponível</p>
            </div>
          </div>
          
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-emerald-50 text-emerald-600 p-3 md:px-4 md:py-2.5 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-emerald-100 transition-all active:scale-95"
              title="Importar Extrato"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button
              onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}
              className="bg-black text-white p-3 md:px-6 md:py-3 rounded-xl font-black hover:bg-gray-800 transition-all shadow-xl shadow-black/10 text-xs flex items-center gap-2 active:scale-95"
              title="Nova Conta"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">Nova Conta</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-10 custom-scrollbar">
          <div className="max-w-screen-xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Carregando...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                 <p className="text-sm font-bold text-gray-400">Nenhuma conta encontrada.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {accounts.map((acc) => {
                  const balance = calculateBalance(acc);
                  return (
                    <div key={acc.id} className="group bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col justify-between min-h-[220px]">
                      <div className="flex justify-between items-start">
                        <div className="p-3 md:p-4 rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110 group-active:scale-95" style={{ backgroundColor: acc.color || '#000' }}>
                          {getIcon(acc.type)}
                        </div>
                        <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => handleReset(acc.id)} className="p-2 hover:bg-orange-50 rounded-lg text-gray-300 hover:text-orange-600 transition-colors" title="Zerar Transações">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                          <button onClick={() => handleEdit(acc)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-300 hover:text-black transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(acc.id)} className="p-2 hover:bg-rose-50 rounded-lg text-gray-300 hover:text-rose-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 md:mt-8">
                        <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block truncate">{acc.name}</span>
                        <h3 className={`text-2xl md:text-3xl font-black tabular-nums mt-1 truncate ${balance >= 0 ? 'text-gray-900' : 'text-rose-600'}`}>
                          {formatCurrency(balance)}
                        </h3>
                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-2">Saldo Disponível</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingAccount(null); }}
        onSuccess={fetchAccounts}
        account={editingAccount}
      />

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={fetchAccounts} 
      />
    </div>
  );
}
