'use client';

interface FinancialPlannerProps {
  monthDebtsTotal: number;
  monthDebtsRemaining: number;
  monthlyFixedCost: number;
  dailyGoal: number;
  isLoading?: boolean;
}

export default function FinancialPlanner({ 
  monthDebtsTotal, 
  monthDebtsRemaining, 
  monthlyFixedCost,
  dailyGoal, 
  isLoading = false 
}: FinancialPlannerProps) {
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  const paidAmount = monthDebtsTotal - monthDebtsRemaining;
  const progress = monthDebtsTotal > 0 ? (paidAmount / monthDebtsTotal) * 100 : 0;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full justify-between">
      <div>
        <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-6">Planejamento do Mês</h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dívidas (Parcelas/Abertas)</p>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{progress.toFixed(0)}% Pago</span>
            </div>
            {isLoading ? (
              <div className="h-8 w-full bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <p className="text-xl font-black text-gray-900">{formatCurrency(monthDebtsRemaining)} <span className="text-gray-300 text-sm">pendente</span></p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Assinaturas (Custo Fixo)</p>
            {isLoading ? (
              <div className="h-8 w-full bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <p className="text-xl font-black text-gray-900">{formatCurrency(monthlyFixedCost)} <span className="text-gray-300 text-sm">este mês</span></p>
            )}
          </div>

          <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
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
            {isLoading ? (
               <div className="h-7 w-24 bg-gray-100 rounded-lg animate-pulse mt-1" />
            ) : (
               <p className="text-lg font-black text-gray-900 mt-1">{formatCurrency(dailyGoal)}</p>
            )}
          </div>
        </div>
        <p className="text-[10px] font-bold text-gray-300 max-w-[100px] text-right italic">Baseado nos dias restantes do mês atual.</p>
      </div>
    </div>
  );
}
