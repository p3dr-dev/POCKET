'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import TransactionModal from '@/components/TransactionModal';
import TransactionTable from '@/components/transactions/TransactionTable';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import toast from 'react-hot-toast';

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
  payee?: string;
  payer?: string;
  bankRefId?: string;
  transferId?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta transação?')) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Transação excluída');
      fetchTransactions();
    } catch { toast.error('Erro ao excluir'); }
  };

  const filteredAndSortedTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             t.category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             t.payee?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             t.payer?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'ALL' || t.type === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'date') {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else {
          comparison = a.amount - b.amount;
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });
  }, [transactions, searchQuery, filterType, sortBy, sortOrder]);

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] font-sans selection:bg-black selection:text-white overflow-hidden text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="flex-none bg-[#F8FAFC]/80 backdrop-blur-md px-4 md:px-8 py-4 flex justify-between items-center border-b border-gray-100/50 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 lg:hidden active:scale-95 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight">Central de Transações</h1>
          </div>
          
          <button 
            onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} 
            className="bg-black text-white px-5 py-3 rounded-2xl font-black hover:bg-gray-800 transition-all text-xs flex items-center gap-2 active:scale-95 shadow-xl shadow-black/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">Novo Registro</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </header>

        <div className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden max-w-screen-2xl mx-auto w-full">
          <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] shadow-sm border border-gray-100/50 flex flex-col overflow-hidden">
            <TransactionFilters 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onToggleSortOrder={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            />

            <TransactionTable 
              transactions={filteredAndSortedTransactions}
              isLoading={isLoading}
              onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </main>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }} 
        onSuccess={fetchTransactions} 
        transaction={editingTransaction} 
      />
    </div>
  );
}
