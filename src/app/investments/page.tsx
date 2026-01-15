'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import InvestmentModal from '@/components/InvestmentModal';
import toast from 'react-hot-toast';

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  accountId: string;
  accountName: string;
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  const fetchInvestments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/investments');
      const data = await res.json();
      setInvestments(Array.isArray(data) ? data : []);
    } catch (error) {
      setInvestments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInvestments(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este ativo da sua carteira?')) return;
    try {
      await fetch(`/api/investments/${id}`, { method: 'DELETE' });
      toast.success('Ativo removido');
      fetchInvestments();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const handleEdit = (inv: Investment) => {
    setEditingInvestment(inv);
    setIsModalOpen(true);
  };

  const totalInvested = investments.reduce((acc, i) => acc + i.amount, 0);
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] font-sans selection:bg-black selection:text-white overflow-hidden text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="flex-none bg-[#F8FAFC]/80 backdrop-blur-md px-4 md:px-8 py-4 flex justify-between items-center border-b border-gray-100/50 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 lg:hidden active:scale-95 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight">Investimentos</h1>
          </div>
          <button 
            onClick={() => { setEditingInvestment(null); setIsModalOpen(true); }} 
            className="bg-black text-white px-5 py-3 rounded-2xl font-black hover:bg-gray-800 transition-all text-xs flex items-center gap-2 active:scale-95 shadow-xl shadow-black/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">Novo Ativo</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-10 custom-scrollbar">
          <div className="max-w-screen-xl mx-auto space-y-8 pb-20">
            {/* Asset Total Card */}
            <div className="bg-black rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10">
                  <span className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">Patrimônio em Ativos</span>
                  <h2 className="text-4xl md:text-6xl font-black tabular-nums mt-4 tracking-tighter transition-transform group-hover:scale-[1.02] origin-left duration-500">{formatCurrency(totalInvested)}</h2>
               </div>
               <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-700" />
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {isLoading ? (
                 <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
                    <span className="font-black text-gray-300 uppercase text-[10px] tracking-widest">Sincronizando Carteira...</span>
                 </div>
               ) : investments.length === 0 ? (
                 <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                    <p className="text-sm font-bold text-gray-400">Sua carteira de investimentos está vazia.</p>
                 </div>
               ) : (
                 investments.map((inv) => (
                   <div key={inv.id} className="group bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between min-h-[240px]">
                      <div className="flex justify-between items-start">
                         <div className="p-3 md:p-4 bg-gray-50 rounded-2xl text-black shadow-sm group-hover:bg-black group-hover:text-white transition-all duration-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                         </div>
                         <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleEdit(inv)} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-black transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(inv.id)} className="p-2.5 hover:bg-rose-50 rounded-xl text-gray-400 hover:text-rose-600 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                         </div>
                      </div>
                      
                      <div className="mt-8">
                        <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">{inv.type}</span>
                        <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight group-hover:text-black transition-colors">{inv.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{inv.accountName}</span>
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col">
                           <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Valor Atual</span>
                           <span className="text-2xl md:text-3xl font-black tabular-nums text-gray-900 tracking-tighter">{formatCurrency(inv.amount)}</span>
                        </div>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      </main>

      <InvestmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchInvestments} investment={editingInvestment} />
    </div>
  );
}
