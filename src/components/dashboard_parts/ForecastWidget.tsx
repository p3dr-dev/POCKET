'use client';

import { useMemo } from 'react';
import { usePrivacy } from '@/components/PrivacyProvider';

interface ForecastItem {
  date: string;
  balance: number;
  label: string;
}

export default function ForecastWidget({ data }: { data: ForecastItem[] }) {
  const { isBlur } = usePrivacy();
  
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const balances = data.map(d => d.balance);
    const min = Math.min(...balances);
    const endBalance = balances[balances.length - 1];
    
    // Find the date of minimum balance
    const minIndex = balances.indexOf(min);
    const minDate = data[minIndex];

    return { min, endBalance, minDate };
  }, [data]);

  const formatCurrency = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (!stats) return null;

  // Simplificar dados para visualização (pegar pontos chave a cada 5 dias ou onde houver queda brusca seria ideal, 
  // mas vamos mostrar pontos a cada 3 dias para caber na tela)
  const chartPoints = data.filter((_, i) => i % 3 === 0 || i === data.length - 1);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 relative overflow-hidden">
      {/* Resumo Crítico */}
      <div className="flex-1 space-y-6 z-10">
        <div>
          <h3 className="text-xl font-black tracking-tight text-gray-900">Futuro (30 Dias)</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Simulação de saldo pós-pagamentos</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className={`p-4 rounded-2xl border ${stats.endBalance >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-rose-50 border-rose-100 text-rose-900'}`}>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Saldo Final Estimado</p>
              <p className={`text-xl font-black tabular-nums ${isBlur ? 'blur-md select-none' : ''}`}>{formatCurrency(stats.endBalance)}</p>
           </div>
           
           <div className={`p-4 rounded-2xl border ${stats.min >= 0 ? 'bg-gray-50 border-gray-100 text-gray-900' : 'bg-rose-500 border-rose-600 text-white'}`}>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Pior Momento ({stats.minDate.label})</p>
              <p className={`text-xl font-black tabular-nums ${isBlur ? 'blur-md select-none' : ''}`}>{formatCurrency(stats.min)}</p>
           </div>
        </div>
      </div>

      {/* Mini Gráfico de Tendência (Sparkline) */}
      <div className="flex-1 h-32 md:h-auto relative z-10 flex items-end justify-between gap-1 pl-4 border-l border-gray-100/50">
         {chartPoints.map((d, i) => {
            const isMin = d.balance === stats.min;
            const heightPercentage = Math.max(10, ((d.balance - stats.min) / ((Math.max(...data.map(x=>x.balance)) - stats.min) || 1)) * 80 + 10);
            
            return (
              <div key={d.date} className="group relative flex-1 flex flex-col justify-end items-center gap-2 h-full">
                 <div className={`w-full rounded-t-lg transition-all duration-500 ${isMin ? 'bg-rose-500' : d.balance < 0 ? 'bg-rose-200' : 'bg-emerald-200 group-hover:bg-emerald-400'}`} 
                      style={{ height: `${heightPercentage}%` }} 
                 />
                 <span className="text-[8px] font-bold text-gray-300 absolute -bottom-4">{d.label.split(' ')[0]}</span>
                 
                 {/* Tooltip */}
                 <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-black text-white text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none transition-opacity">
                    {formatCurrency(d.balance)}
                 </div>
              </div>
            )
         })}
      </div>

      {/* Decorative Warning if negative */}
      {stats.min < 0 && (
        <div className="absolute top-0 right-0 p-4">
           <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        </div>
      )}
    </div>
  );
}