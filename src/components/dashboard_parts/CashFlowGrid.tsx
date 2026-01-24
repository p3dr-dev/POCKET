import React from 'react';
import { usePrivacy } from '@/components/PrivacyProvider';

interface FlowData {
  income: number;
  expense: number;
  net: number;
}

interface CashFlowProps {
  pulse: {
    daily: FlowData;
    weekly: FlowData;
    monthly: FlowData;
  };
}

export default function CashFlowGrid({ pulse }: CashFlowProps) {
  const { isBlur } = usePrivacy();
  const format = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const Card = ({ title, data, icon }: { title: string, data: FlowData, icon: React.ReactNode }) => (
    <div className="bg-white rounded-[2rem] p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
          {icon}
        </div>
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-emerald-50/50 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Entrada</span>
          </div>
          <span className={`text-emerald-600 font-black tabular-nums text-sm md:text-base transition-all duration-300 ${isBlur ? 'blur-sm select-none' : ''}`}>
            {format(data.income)}
          </span>
        </div>
        
        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-rose-50/50 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Saída</span>
          </div>
          <span className={`text-rose-600 font-black tabular-nums text-sm md:text-base transition-all duration-300 ${isBlur ? 'blur-sm select-none' : ''}`}>
            {format(data.expense)}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-50 flex justify-between items-center px-2">
          <span className="text-[10px] font-black uppercase text-gray-300">Saldo Líquido</span>
          <span className={`font-black tabular-nums text-sm md:text-base transition-all duration-300 ${data.net >= 0 ? 'text-gray-900' : 'text-rose-600'} ${isBlur ? 'blur-sm select-none' : ''}`}>
            {data.net > 0 ? '+' : ''}{format(data.net)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card 
        title="Hoje" 
        data={pulse.daily} 
        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      />
      <Card 
        title="Esta Semana" 
        data={pulse.weekly} 
        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
      />
      <Card 
        title="Este Mês" 
        data={pulse.monthly} 
        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
      />
    </div>
  );
}
