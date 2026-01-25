'use client';

import { usePrivacy } from '@/components/PrivacyProvider';

interface HustleProps {
  data: {
    needed: number; // Fixed Costs + Goal Contribution
    current: number; // Income so far
    dailyTarget: number; // (Needed - Current) / DaysLeft
    daysLeft: number;
    activeIncome?: number;
    passiveIncome?: number;
    breakdown: {
      fixed: number;
      goals: number;
      liquidityGap?: number; // New field
    };
  };
}

export default function HustleWidget({ data }: HustleProps) {
  const { isBlur } = usePrivacy();
  const format = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const isCovered = data.current >= data.needed;
  const progress = data.needed > 0 ? Math.min(100, (data.current / data.needed) * 100) : 100;
  
  const gap = data.breakdown.liquidityGap || 0;
  const hasGap = Math.abs(gap) > 1; // Tolerance

  return (
    <div className="bg-black text-white rounded-[2.5rem] p-8 border border-gray-800 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="relative z-10 flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-black tracking-tight">Meta Diária (Hustle)</h3>
            <p className="text-xs text-gray-400 mt-1 font-medium max-w-[200px]">
              Para cobrir custos, metas e rombos.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest">{data.daysLeft} dias rest.</span>
            </div>
            {data.passiveIncome && data.passiveIncome > 0 && (
              <div className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase tracking-tighter bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                <span>+{format(data.passiveIncome)} passivo</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Number */}
        <div className="relative z-10 mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Você precisa gerar hoje</p>
          <div className={`text-4xl lg:text-5xl font-black tracking-tighter tabular-nums transition-all duration-300 ${isBlur ? 'blur-md select-none' : ''} ${isCovered ? 'text-emerald-400' : 'text-white'}`}>
            {isCovered ? 'META BATIDA!' : format(data.dailyTarget)}
          </div>
        </div>

              {/* Progress Bar */}
              <div className="relative z-10 space-y-2 mb-6">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span>Cobertura Caixa</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isCovered ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.max(0, progress)}%` }}
                  />
                </div>
              </div>      </div>

      {/* Breakdown Grid */}
      <div className="relative z-10 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
        <div>
          <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-1">Custo Fixo</p>
          <p className={`text-xs font-bold transition-all duration-300 ${isBlur ? 'blur-sm select-none' : ''}`}>{format(data.breakdown.fixed)}</p>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-1">Aporte Metas</p>
          <p className={`text-xs font-bold transition-all duration-300 ${isBlur ? 'blur-sm select-none' : ''}`}>{format(data.breakdown.goals)}</p>
        </div>
        {hasGap && (
           <div>
             <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-1">
               {gap > 0 ? 'Déficit Caixa' : 'Superávit'}
             </p>
             <p className={`text-xs font-black transition-all duration-300 ${gap > 0 ? 'text-rose-500' : 'text-emerald-500'} ${isBlur ? 'blur-sm select-none' : ''}`}>
               {gap > 0 ? '+' : ''}{format(Math.abs(gap))}
             </p>
           </div>
        )}
      </div>

      {/* Background Decor */}
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none" />
    </div>
  );
}
