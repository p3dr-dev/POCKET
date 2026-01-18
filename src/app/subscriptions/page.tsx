'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  description: string;
  amount: number;
  frequency: string;
  nextRun: string;
  active: boolean;
  category: { name: string };
  account: { name: string };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/subscriptions');
      const data = await res.json();
      setSubscriptions(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSubscriptions(); }, []);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus })
      });
      toast.success(currentStatus ? 'Assinatura pausada' : 'Assinatura ativada');
      fetchSubscriptions();
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

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
            <h1 className="text-xl lg:text-2xl font-black tracking-tight">Assinaturas e Recorrências</h1>
          </div>
          <button 
            onClick={() => toast('Em breve: Modal de Assinatura')} 
            className="bg-black text-white px-5 py-3 rounded-2xl font-black hover:bg-gray-800 transition-all text-xs flex items-center gap-2 active:scale-95 shadow-xl shadow-black/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">Nova Assinatura</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-10 custom-scrollbar">
          <div className="max-w-screen-xl mx-auto space-y-6">
             {/* Total Card */}
             <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                   <span className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Custo Mensal Fixo</span>
                   <h2 className="text-4xl font-black mt-2 tabular-nums">
                     {formatCurrency(subscriptions.filter(s => s.active).reduce((acc, s) => acc + s.amount, 0))}
                   </h2>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
             </div>

             {isLoading ? (
               <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
                  <span className="font-black text-gray-300 uppercase text-[10px] tracking-widest">Carregando...</span>
               </div>
             ) : subscriptions.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                  <p className="text-sm font-bold text-gray-400">Nenhuma assinatura cadastrada.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {subscriptions.map(sub => (
                   <div key={sub.id} className={`bg-white rounded-[2rem] p-6 border transition-all ${sub.active ? 'border-gray-100 shadow-sm' : 'border-gray-50 opacity-60 grayscale'}`}>
                      <div className="flex justify-between items-start mb-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sub.active ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{sub.frequency}</span>
                            <div className={`w-2 h-2 rounded-full ${sub.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                         </div>
                      </div>
                      
                      <h3 className="font-black text-lg text-gray-900 truncate">{sub.description}</h3>
                      <p className="text-2xl font-black text-gray-900 mt-1 tabular-nums">{formatCurrency(sub.amount)}</p>
                      
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-gray-400 uppercase">{sub.account.name}</span>
                         <button 
                           onClick={() => toggleActive(sub.id, sub.active)}
                           className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors ${sub.active ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                         >
                           {sub.active ? 'Pausar' : 'Ativar'}
                         </button>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
