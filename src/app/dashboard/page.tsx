'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SafeSpendHero from '@/components/dashboard_parts/SafeSpendHero';
import CashFlowGrid from '@/components/dashboard_parts/CashFlowGrid';
import HustleWidget from '@/components/dashboard_parts/HustleWidget';
import BudgetWidget from '@/components/dashboard_parts/BudgetWidget';
import DailyExpensesWidget from '@/components/widgets/DailyExpensesWidget';
import MonthlyDebtsWidget from '@/components/widgets/MonthlyDebtsWidget';
import { secureFetch } from '@/lib/api-client';
import { usePrivacy } from '@/components/PrivacyProvider';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isBlur, toggleBlur } = usePrivacy();

  useEffect(() => {
    async function load() {
      try {
        const res = await secureFetch('/api/dashboard/intelligence');
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const formatCurrency = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

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
              <h1 className="text-xl lg:text-2xl font-black tracking-tight">Visão Geral</h1>
              <p className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Inteligência Operacional</p>
            </div>
          </div>

          {/* Privacy Toggle */}
          <button 
            onClick={toggleBlur}
            className={`p-3 rounded-xl transition-all active:scale-95 border ${
              isBlur 
                ? 'bg-black text-white border-black shadow-lg' 
                : 'bg-white text-gray-400 border-gray-100 hover:text-black hover:border-black'
            }`}
            title={isBlur ? "Mostrar Valores" : "Ocultar Valores"}
          >
            {isBlur ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-screen-xl mx-auto space-y-6">
            
            {isLoading ? (
              <div className="animate-pulse space-y-6">
                <div className="h-64 bg-gray-200 rounded-[2.5rem]" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-40 bg-gray-200 rounded-[2rem]" />
                  <div className="h-40 bg-gray-200 rounded-[2rem]" />
                  <div className="h-40 bg-gray-200 rounded-[2rem]" />
                </div>
              </div>
            ) : data ? (
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* 1. Accounts Ticker (Compact & Snappy) */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-widest mb-3 pl-1">Minhas Contas</h3>
                  <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x touch-pan-x -mx-4 px-4 md:mx-0 md:px-0">
                    {data.accounts.map((acc: any) => (
                      <div key={acc.id} className="flex-none snap-center bg-white p-4 rounded-2xl border border-gray-100 w-[160px] md:w-[200px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[9px] font-black uppercase text-gray-400 truncate w-full" title={acc.name}>{acc.name}</p>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.color }} />
                        </div>
                        <p className={`text-lg md:text-xl font-black truncate transition-all duration-300 ${isBlur ? 'blur-md select-none' : ''} ${acc.balance < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                          {formatCurrency(acc.balance)}
                        </p>
                      </div>
                    ))}
                    
                    {/* Add Account Button (Fake) */}
                    <button className="flex-none snap-center bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 w-[60px] flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                </div>

                {/* 2. Hero: Safe Spend */}
                <SafeSpendHero data={data.safeSpend} />

                {/* 3. Cash Flow Pulse */}
                <CashFlowGrid pulse={data.pulse} />

                {/* 4. Hustle & Budgets Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <HustleWidget data={data.hustle} />
                   <BudgetWidget budgets={data.budgets} />
                </div>

                {/* 5. Detailed Widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                   <div className="h-[400px]">
                      <DailyExpensesWidget transactions={data.recentTransactions} />
                   </div>
                   <div className="h-[400px]">
                      <MonthlyDebtsWidget debts={data.obligationsList} />
                   </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-20">
                <p className="font-bold text-gray-400">Não foi possível carregar os dados.</p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
