'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import TransactionModal from '@/components/modals/TransactionModal';
import TransactionTable from '@/components/transactions_parts/TransactionTable';
import TransactionFilters from '@/components/transactions_parts/TransactionFilters';
import toast from 'react-hot-toast';
import { downloadCSV } from '@/lib/utils';

interface Transaction {
// ... existing interface ...
// (rest of the interface stays same)
// I will keep the imports clean and just add what's needed.
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
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchTransactions = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search: searchQuery,
        type: filterType
      });
      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (error) {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = transactions.map(t => ({
      Data: new Date(t.date).toLocaleDateString('pt-BR'),
      Descrição: t.description,
      Valor: t.amount,
      Tipo: t.type === 'INCOME' ? 'Receita' : 'Despesa',
      Categoria: t.category.name,
      Conta: t.account.name,
      Beneficiário_Pagador: t.payee || t.payer || ''
    }));
    downloadCSV(exportData, `transacoes_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Exportação concluída');
  };

  useEffect(() => { 
    const timer = setTimeout(() => {
      fetchTransactions(1); 
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [searchQuery, filterType]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta transação?')) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Transação excluída');
      fetchTransactions(currentPage);
    } catch { toast.error('Erro ao excluir'); }
  };

  // Sorting is still fine on client for the current page, 
  // or we could move it to server as well. 
  // Given we fetch 50 at a time, client sort is instant.
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [transactions, sortBy, sortOrder]);

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
          
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center mr-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {total} transações
            </div>
            <button 
              onClick={handleExport}
              disabled={transactions.length === 0}
              className="bg-white text-black border border-gray-100 px-5 py-3 rounded-2xl font-black hover:bg-gray-50 transition-all text-xs flex items-center gap-2 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="hidden sm:inline">Exportar</span>
            </button>
            
            <button 
              onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} 
              className="bg-black text-white px-5 py-3 rounded-2xl font-black hover:bg-gray-800 transition-all text-xs flex items-center gap-2 active:scale-95 shadow-xl shadow-black/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">Novo Registro</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
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
              transactions={sortedTransactions}
              isLoading={isLoading}
              onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
              onDelete={handleDelete}
            />

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex-none p-4 md:p-6 border-t border-gray-50 flex items-center justify-center gap-2">
                <button 
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => fetchTransactions(currentPage - 1)}
                  className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(pages)].map((_, i) => {
                    const p = i + 1;
                    // Show only first, last and 2 neighbors of current page
                    if (p === 1 || p === pages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                      return (
                        <button
                          key={p}
                          onClick={() => fetchTransactions(p)}
                          className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                            currentPage === p ? 'bg-black text-white shadow-lg' : 'hover:bg-gray-50 text-gray-400'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === 2 || p === pages - 1) return <span key={p} className="text-gray-200">...</span>;
                    return null;
                  })}
                </div>
                <button 
                  disabled={currentPage === pages || isLoading}
                  onClick={() => fetchTransactions(currentPage + 1)}
                  className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
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
