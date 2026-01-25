'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import GoalModal from '@/components/modals/GoalModal';
import GoalContributionModal from '@/components/modals/GoalContributionModal';
import toast from 'react-hot-toast';
import { secureFetch } from '@/lib/api-client';

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
  
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const data = await secureFetch('/api/goals');
      setGoals(Array.isArray(data) ? data : []);
    } catch {
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este objetivo?')) return;
    try {
      await secureFetch(`/api/goals/${id}`, { method: 'DELETE' });
      toast.success('Excluído');
      fetchGoals();
    } catch {}
  };

  const handleContribute = (goal: Goal) => {
    setContributingGoal(goal);
    setIsContributeModalOpen(true);
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const globalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] font-sans selection:bg-black selection:text-white overflow-hidden text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
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
          <div className="max-w-screen-xl mx-auto space-y-8 pb-20">
            {/* Summary Card */}
            <div className="bg-black rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">Total Acumulado</span>
                    {isLoading ? (
                      <div className="h-14 w-48 bg-white/10 rounded-xl animate-pulse mt-4" />
                    ) : (
                      <h2 className="text-4xl md:text-6xl font-black tabular-nums mt-4 tracking-tighter transition-transform group-hover:scale-[1.02] origin-left duration-500">{formatCurrency(totalSaved)}</h2>
                    )}
                  </div>
                  <div className="flex flex-col md:items-end">
                    <span className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">Progresso Geral</span>
                    {isLoading ? (
                       <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse mt-2" />
                    ) : (
                      <div className="flex flex-col items-end gap-2 mt-2">
                        <div className="text-2xl md:text-3xl font-black tabular-nums text-emerald-400">
                          {globalProgress.toFixed(1)}%
                        </div>
                        <div className="h-2 w-32 md:w-48 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${globalProgress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
               </div>
               <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-700" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
             {isLoading ? (
               [...Array(4)].map((_, i) => (
                 <div key={i} className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-gray-100 flex flex-col min-h-[250px] justify-between">
                    <div className="flex justify-between items-start mb-10">
                       <div className="w-14 h-14 rounded-[1.25rem] bg-gray-100 animate-pulse" />
                       <div className="flex gap-2">
                          <div className="w-9 h-9 bg-gray-50 rounded-xl animate-pulse" />
                          <div className="w-9 h-9 bg-gray-50 rounded-xl animate-pulse" />
                       </div>
                    </div>
                    <div>
                      <div className="h-8 w-3/4 bg-gray-100 rounded-lg animate-pulse mb-2" />
                      <div className="h-3 w-1/3 bg-gray-50 rounded animate-pulse mb-8" />
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                           <div className="space-y-2">
                             <div className="h-2 w-16 bg-gray-50 rounded animate-pulse" />
                             <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
                           </div>
                           <div className="space-y-2 flex flex-col items-end">
                             <div className="h-2 w-10 bg-gray-50 rounded animate-pulse" />
                             <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                           </div>
                        </div>
                        <div className="h-4 w-full bg-gray-50 rounded-full animate-pulse" />
                      </div>
                    </div>
                 </div>
               ))
             ) : goals.length === 0 ? (
               <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                  <p className="text-sm font-bold text-gray-400">Nenhum objetivo traçado ainda.</p>
               </div>
             ) : (
               goals.map((goal) => {
                 const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                 
                 // Smart Logic
                 const now = new Date();
                 const deadline = new Date(goal.deadline);
                 const monthsLeft = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
                 
                 const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
                 const safeMonths = Math.max(1, monthsLeft); // Avoid div by zero
                 const monthlyNeeded = remaining / safeMonths;
                 
                 const isLate = monthsLeft <= 0 && remaining > 0;

                 return (
                   <div key={goal.id} className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-6 relative z-10">
                         <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl transform transition-transform group-hover:rotate-6 group-hover:scale-110" style={{ backgroundColor: goal.color || '#000' }}>
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-6.857 2.143L12 21l-2.143-6.857L3 12l6.857-2.143L12 3z" /></svg>
                         </div>
                         <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleContribute(goal)} className="p-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-600 transition-colors" title="Adicionar Saldo">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                            </button>
                            <button onClick={() => { setEditingGoal(goal); setIsModalOpen(true); }} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-black transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(goal.id)} className="p-2.5 hover:bg-rose-50 rounded-xl text-gray-400 hover:text-rose-600 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                         </div>
                      </div>
                      
                      <div className="relative z-10">
                        <div className="mb-6">
                           <h3 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-black transition-colors leading-tight">{goal.name}</h3>
                           <div className="flex items-center gap-2 mt-2">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${isLate ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
                                 {isLate ? 'Prazo Expirado' : `${monthsLeft} meses restantes`}
                              </span>
                           </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Aporte Mensal Sugerido</p>
                             <p className="text-xl font-black text-gray-900 tabular-nums">
                               {isLate ? 'Agora é tudo ou nada' : formatCurrency(monthlyNeeded) + '/mês'}
                             </p>
                          </div>

                          <div className="space-y-3">
                            <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-1">
                               <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${progress}%`, backgroundColor: goal.color || '#000' }} />
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-gray-400">{progress.toFixed(0)}% concluído</span>
                              <span className="text-gray-900">{formatCurrency(remaining)} faltantes</span>
                            </div>
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
        </div>
      </main>

      <GoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchGoals} goal={editingGoal} />
      <GoalContributionModal 
        isOpen={isContributeModalOpen} 
        onClose={() => setIsContributeModalOpen(false)} 
        onSuccess={fetchGoals} 
        goal={contributingGoal} 
      />
    </div>
  );
}