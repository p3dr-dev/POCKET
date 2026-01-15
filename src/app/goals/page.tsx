'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import GoalModal from '@/components/GoalModal';
import toast from 'react-hot-toast';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este objetivo?')) return;
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      toast.success('Excluído');
      fetchGoals();
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
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 lg:hidden active:scale-95 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight">Objetivos</h1>
          </div>
          <button 
            onClick={() => { setEditingGoal(null); setIsModalOpen(true); }} 
            className="bg-black text-white px-5 py-3 rounded-2xl font-black hover:bg-gray-800 transition-all text-xs flex items-center gap-2 active:scale-95 shadow-xl shadow-black/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">Novo Objetivo</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-10 custom-scrollbar">
          <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pb-20">
             {isLoading ? (
               <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
                  <span className="font-black text-gray-300 uppercase text-[10px] tracking-widest">Sincronizando...</span>
               </div>
             ) : goals.length === 0 ? (
               <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                  <p className="text-sm font-bold text-gray-400">Nenhum objetivo traçado ainda.</p>
               </div>
             ) : (
               goals.map((goal) => {
                 const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                 return (
                   <div key={goal.id} className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-10 relative z-10">
                         <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl transform transition-transform group-hover:rotate-6 group-hover:scale-110" style={{ backgroundColor: goal.color || '#000' }}>
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-6.857 2.143L12 21l-2.143-6.857L3 12l6.857-2.143L12 3z" /></svg>
                         </div>
                         <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setEditingGoal(goal); setIsModalOpen(true); }} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-black transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(goal.id)} className="p-2.5 hover:bg-rose-50 rounded-xl text-gray-400 hover:text-rose-600 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                         </div>
                      </div>
                      
                      <div className="relative z-10">
                        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight group-hover:text-black transition-colors">{goal.name}</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                             <div className="flex flex-col">
                               <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1.5">Acumulado</span>
                               <span className="text-3xl font-black tabular-nums tracking-tighter">{formatCurrency(goal.currentAmount)}</span>
                             </div>
                             <div className="text-right">
                               <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Meta</span>
                               <span className="text-sm font-black text-gray-500 tabular-nums">{formatCurrency(goal.targetAmount)}</span>
                             </div>
                          </div>
                          
                          <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-1">
                             <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${progress}%`, backgroundColor: goal.color || '#000' }} />
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-gray-400">{progress.toFixed(0)}% concluído</span>
                            <span className="text-gray-900">{formatCurrency(goal.targetAmount - goal.currentAmount)} faltantes</span>
                          </div>
                        </div>
                      </div>

                      {/* Decorativo de fundo */}
                      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundColor: goal.color || '#000' }} />
                   </div>
                 );
               })
             )}
          </div>
        </div>
      </main>
      <GoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchGoals} goal={editingGoal} />
    </div>
  );
}
