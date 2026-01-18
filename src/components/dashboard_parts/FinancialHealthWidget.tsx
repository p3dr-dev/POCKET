'use client';

interface HealthData {
  liquidTotal: number;
  investmentTotal: number;
  investmentGain: number;
  goalsProgress: number;
  debtTotal: number;
  netWorth: number;
  healthScore: number;
}

export default function FinancialHealthWidget({ data, isLoading }: { data: HealthData | null, isLoading: boolean }) {
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  if (isLoading) {
    return (
      <div className="bg-black text-white rounded-[2.5rem] p-8 shadow-2xl animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded mb-6" />
        <div className="h-12 w-48 bg-white/20 rounded mb-8" />
        <div className="grid grid-cols-2 gap-4">
           <div className="h-16 bg-white/5 rounded-2xl" />
           <div className="h-16 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const scoreColor = data.healthScore > 70 ? 'text-emerald-400' : data.healthScore > 40 ? 'text-orange-400' : 'text-rose-400';

  return (
    <div className="bg-black text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Saúde Global</h3>
            <div className="flex items-baseline gap-2">
               <span className={`text-4xl font-black ${scoreColor}`}>{data.healthScore}</span>
               <span className="text-gray-600 font-bold text-xs">/ 100</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
             <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Performance Meta</p>
              <p className="text-lg font-black">{data.goalsProgress.toFixed(0)}%</p>
              <div className="h-1 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${data.goalsProgress}%` }} />
              </div>
           </div>
           <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Retorno Invest.</p>
              <p className={`text-lg font-black ${data.investmentGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.investmentGain >= 0 ? '+' : ''}{formatCurrency(data.investmentGain)}
              </p>
           </div>
        </div>

        <div className="space-y-3">
           <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-gray-500 uppercase tracking-widest">Liquidez Total</span>
              <span className="text-white">{formatCurrency(data.liquidTotal)}</span>
           </div>
           <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-gray-500 uppercase tracking-widest">Total em Dívidas</span>
              <span className="text-rose-400">{formatCurrency(data.debtTotal)}</span>
           </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors" />
    </div>
  );
}
