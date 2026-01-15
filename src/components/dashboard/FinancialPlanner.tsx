'use client';

interface FinancialPlannerProps {
  monthDebtsTotal: number;
  monthDebtsRemaining: number;
  dailyGoal: number;
}

export default function FinancialPlanner({ monthDebtsTotal, monthDebtsRemaining, dailyGoal }: FinancialPlannerProps) {
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  const paidAmount = monthDebtsTotal - monthDebtsRemaining;
  const progress = monthDebtsTotal > 0 ? (paidAmount / monthDebtsTotal) * 100 : 0;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full justify-between">
      <div>
        <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-6">Planejamento do Mês</h3>
        
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progresso de Quitação</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(paidAmount)} <span className="text-gray-300 text-sm">/ {formatCurrency(monthDebtsTotal)}</span></p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{progress.toFixed(0)}%</span>
            </div>
          </div>

          <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-1">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Meta Diária Restante</p>
            <p className="text-lg font-black text-gray-900 mt-1">{formatCurrency(dailyGoal)}</p>
          </div>
        </div>
        <p className="text-[10px] font-bold text-gray-300 max-w-[100px] text-right italic">Baseado nos dias restantes do mês atual.</p>
      </div>
    </div>
  );
}
