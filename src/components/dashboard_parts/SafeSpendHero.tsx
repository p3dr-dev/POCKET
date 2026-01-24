'use client';

import { useState } from 'react';
import { usePrivacy } from '@/components/PrivacyProvider';

interface SafeSpendProps {
  data: {
    daily: number;
    weekly: number;
    monthly: number;
    disposable: number;
  };
}

export default function SafeSpendHero({ data }: SafeSpendProps) {
  const [view, setView] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const { isBlur } = usePrivacy();

  const getValue = () => {
    switch (view) {
      case 'DAILY': return data.daily;
      case 'WEEKLY': return data.weekly;
      case 'MONTHLY': return data.monthly;
    }
  };

  const formatCurrency = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const value = getValue();
  const isDanger = value < 0;

  return (
    <div className={`relative overflow-hidden rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 transition-all duration-500 shadow-xl ${isDanger ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-black text-white shadow-gray-200'}`}>
      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="w-full lg:w-auto">
          {/* Toggle Switch */}
          <div className="flex p-1 bg-white/10 w-full sm:w-fit rounded-xl backdrop-blur-md mb-6 md:mb-8 border border-white/5">
            {['DAILY', 'WEEKLY', 'MONTHLY'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] md:text-xs font-black tracking-widest transition-all duration-300 ${
                  view === v ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {v === 'DAILY' ? 'HOJE' : v === 'WEEKLY' ? 'SEMANA' : 'MÊS'}
              </button>
            ))}
          </div>
          
          <div className="space-y-1 md:space-y-2">
            <h2 className="text-xs md:text-sm font-bold opacity-70 uppercase tracking-[0.2em]">
              Disponível para Gastar
            </h2>
            <div className={`text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black tracking-tighter tabular-nums leading-none -ml-1 transition-all duration-300 ${isBlur ? 'blur-md select-none' : ''}`}>
              {formatCurrency(value)}
            </div>
          </div>
        </div>

        {/* Disposable Card */}
        <div className="bg-white/10 backdrop-blur-md p-5 md:p-6 rounded-2xl border border-white/10 w-full lg:w-auto min-w-[200px] hover:bg-white/15 transition-colors">
          <div className="flex items-center gap-2 mb-2 opacity-60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-[10px] font-bold uppercase tracking-widest">Saldo Líquido Real</p>
          </div>
          <p className={`text-2xl md:text-3xl font-black tracking-tight transition-all duration-300 ${isBlur ? 'blur-md select-none' : ''}`}>
            {formatCurrency(data.disposable)}
          </p>
          <p className="text-[10px] mt-1 opacity-50">Livre de dívidas do mês</p>
        </div>
      </div>
      
      {/* Background FX */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none mix-blend-overlay" />
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </div>
  );
}
