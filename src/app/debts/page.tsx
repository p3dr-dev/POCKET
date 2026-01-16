'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DebtModal from '@/components/modals/DebtModal';
import DebtPaymentModal from '@/components/modals/DebtPaymentModal';
import toast from 'react-hot-toast';

interface Debt {
  id: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);

  const fetchDebts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/debts');
      const data = await res.json();
      setDebts(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDebts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este compromisso?')) return;
    try {
      await fetch(`/api/debts/${id}`, { method: 'DELETE' });
      toast.success('Excluído');
      fetchDebts();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const handleDeleteBulk = async () => {
    if (!confirm(`Deseja excluir os ${selectedIds.length} compromissos selecionados?`)) return;
    try {
      const res = await fetch('/api/debts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error();
      toast.success('Excluídos com sucesso');
      setSelectedIds([]);
      fetchDebts();
    } catch {
      toast.error('Erro ao excluir em lote');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handlePay = (debt: Debt) => {
    setPayingDebt(debt);
    setIsPayModalOpen(true);
  };

  const totalRemaining = debts.reduce((acc, d) => acc + (d.totalAmount - d.paidAmount), 0);
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

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
              <h1 className="text-xl lg:text-2xl font-black tracking-tight">Compromissos</h1>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{selectedIds.length} selecionados</span>
                  <button onClick={handleDeleteBulk} className="text-[10px] font-black text-rose-600 hover:underline uppercase tracking-tighter">Excluir Lote</button>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => { setEditingDebt(null); setIsModalOpen(true); }} 
            className="bg-black text-white px-5 py-3 rounded-2xl font-black hover:bg-gray-800 transition-all text-xs flex items-center gap-2 active:scale-95 shadow-xl shadow-black/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">Novo Compromisso</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-10 custom-scrollbar">
          <div className="max-w-screen-xl mx-auto space-y-8 pb-20">
            {/* Banner Card */}
            <div className="bg-rose-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10">
                  <span className="text-rose-200 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">Saldo Devedor Ativo</span>
                  <h2 className="text-4xl md:text-6xl font-black tabular-nums mt-4 tracking-tighter transition-transform group-hover:scale-[1.02] origin-left duration-500">{formatCurrency(totalRemaining)}</h2>
               </div>
               <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-black/10 rounded-full blur-3xl group-hover:bg-black/20 transition-colors duration-700" />
               <div className="absolute top-0 right-0 p-8 opacity-20">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
            </div>

            <div className="space-y-4">
               {isLoading ? (
                 <div className="py-20 text-center flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
                    <span className="font-black text-gray-300 uppercase text-[10px] tracking-widest">Sincronizando...</span>
                 </div>
               ) : debts.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                    <p className="text-sm font-bold text-gray-400">Nenhum compromisso pendente.</p>
                 </div>
               ) : (
                 debts.map((debt) => {
                   const remaining = debt.totalAmount - debt.paidAmount;
                   const isOverdue = new Date(debt.dueDate) < new Date() && remaining > 0;
                   const isSelected = selectedIds.includes(debt.id);
                   const isPaid = remaining <= 0;
                   
                   return (
                    <div 
                      key={debt.id} 
                      onClick={() => !isPaid && toggleSelect(debt.id)}
                      className={`group flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[2rem] transition-all border cursor-pointer select-none
                        ${isSelected 
                          ? 'bg-black text-white border-black shadow-xl scale-[1.01]' 
                          : isPaid 
                            ? 'bg-gray-50/50 opacity-60 grayscale border-transparent'
                            : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200 shadow-sm'
                        }`}
                    >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className={`font-black text-lg leading-tight ${isSelected ? 'text-white' : 'text-gray-900'}`}>{debt.description}</h3>
                            {isOverdue && !isSelected && <span className="bg-rose-50 text-rose-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-rose-100">Vencida</span>}
                            {isSelected && <span className="bg-white/20 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Selecionada</span>}
                            {isPaid && <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Paga</span>}
                          </div>
                          <p className={`text-[10px] font-bold uppercase mt-2 ${isSelected ? 'text-white/60' : isOverdue ? 'text-rose-400' : 'text-gray-400'}`}>
                            Vencimento: {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('pt-BR') : 'Sem data definida'}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end gap-8">
                          <div className="text-left md:text-right">
                              <p className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-white/40' : 'text-gray-400'}`}>Restante</p>
                              <p className={`text-xl font-black tabular-nums ${isSelected ? 'text-white' : remaining > 0 ? 'text-gray-900' : 'text-emerald-500'}`}>
                                {remaining > 0 ? formatCurrency(remaining) : 'Quitada'}
                              </p>
                          </div>
                          <div className="flex gap-2 md:opacity-0 group-hover:opacity-100 transition-all">
                              {!isPaid && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handlePay(debt); }} 
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-600'}`}
                                >
                                  Pagar
                                </button>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); setEditingDebt(debt); setIsModalOpen(true); }} 
                                className={`p-2.5 rounded-xl transition-colors ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-black'}`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              {!isSelected && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(debt.id); }} 
                                  className="p-2.5 hover:bg-rose-50 rounded-xl text-gray-400 hover:text-rose-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              )}
                          </div>
                        </div>
                    </div>
                   );
                 })
               )}
            </div>
          </div>
        </div>
      </main>

      <DebtModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchDebts} debt={editingDebt} />
      <DebtPaymentModal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} onSuccess={fetchDebts} debt={payingDebt} />
    </div>
  );
}
