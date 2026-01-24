'use client';

import { usePrivacy } from '@/components/PrivacyProvider';

interface CoverageProps {
  data: {
    needed: number;
    current: number;
    gap: number;
  };
}

export default function TargetGapWidget({ data }: CoverageProps) {
  const { isBlur } = usePrivacy();
  const format = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const percentage = Math.min(100, (data.current / data.needed) * 100);
  const isSafe = data.gap === 0;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h3 className="text-xl font-black tracking-tight text-gray-900">Meta de Cobertura</h3>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            Para cobrir Dívidas + Assinaturas + Metas deste mês.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Falta Arrecadar</p>
          <p className={`text-3xl font-black tabular-nums transition-all duration-300 ${isSafe ? 'text-emerald-500' : 'text-indigo-600'} ${isBlur ? 'blur-md select-none' : ''}`}>
            {isSafe ? 'Coberto!' : format(data.gap)}
          </p>
        </div>
      </div>

      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${isSafe ? 'bg-emerald-500' : 'bg-indigo-600'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <span className={`transition-all duration-300 ${isBlur ? 'blur-sm select-none' : ''}`}>Arrecadado: {format(data.current)}</span>
        <span className={`transition-all duration-300 ${isBlur ? 'blur-sm select-none' : ''}`}>Necessário: {format(data.needed)}</span>
      </div>
    </div>
  );
}
