'use client';

interface FinancialPlannerProps {

  monthDebtsTotal: number;

  monthDebtsRemaining: number;

  monthlyFixedCost: number;

  monthlyGoalTarget: number;

  dailyGoal: number;

  revenueGap?: number;

  isSacrificingGoals?: boolean;

  isLoading?: boolean;

}



import Skeleton from '../Skeleton';

export default function FinancialPlanner({ 
  monthDebtsTotal, 
  monthDebtsRemaining, 
  monthlyFixedCost,
  monthlyGoalTarget,
  dailyGoal,
  revenueGap = 0,
  isSacrificingGoals = false,
  isLoading = false 
}: FinancialPlannerProps) {
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  const paidAmount = monthDebtsTotal - monthDebtsRemaining;
  const progress = monthDebtsTotal > 0 ? (paidAmount / monthDebtsTotal) * 100 : 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-6">
            <Skeleton className="h-4 w-32" variant="text" />
            <Skeleton className="h-4 w-20" variant="text" />
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" variant="text" />
                  <Skeleton className="h-3 w-12" variant="text" />
                </div>
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-50">
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    );
  }



  return (

    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full justify-between relative overflow-hidden">

      {isSacrificingGoals && (

        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-rose-500 animate-pulse" />

      )}

      

      <div>

        <div className="flex justify-between items-start mb-6">

          <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Planejamento Estratégico</h3>

          {!isLoading && (

            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${!isSacrificingGoals && dailyGoal >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>

              {isSacrificingGoals ? 'Metas em Pausa' : dailyGoal >= 0 ? 'Orçamento Saudável' : 'Orçamento em Risco'}

            </span>

          )}

        </div>

        

        <div className="space-y-5">

          {/* ... existing code ... */}

          <div className="group">

            <div className="flex justify-between items-end mb-1.5">

              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dívidas Pendentes</p>

              <span className="text-[9px] font-bold text-gray-900 tabular-nums">{formatCurrency(monthDebtsRemaining)}</span>

            </div>

            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">

              <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (monthDebtsRemaining / (monthDebtsTotal || 1)) * 100)}%` }} />

            </div>

          </div>



          <div className="group">

            <div className="flex justify-between items-end mb-1.5">

              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Assinaturas (Fixos)</p>

              <span className="text-[9px] font-bold text-gray-900 tabular-nums">{formatCurrency(monthlyFixedCost)}</span>

            </div>

            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">

              <div className="h-full bg-black rounded-full transition-all duration-1000" style={{ width: '100%' }} />

            </div>

          </div>



          <div className="group">

            <div className="flex justify-between items-end mb-1.5">

              <div className="flex items-center gap-2">

                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reserva Metas</p>

                {isSacrificingGoals && <span className="text-[7px] bg-orange-100 text-orange-600 px-1 rounded font-black uppercase tracking-tighter">Gap: {formatCurrency(revenueGap)}</span>}

              </div>

              <span className={`text-[9px] font-bold tabular-nums ${isSacrificingGoals ? 'text-gray-300 line-through' : 'text-indigo-600'}`}>{formatCurrency(monthlyGoalTarget)}</span>

            </div>

            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">

              <div className={`h-full rounded-full transition-all duration-1000 ${isSacrificingGoals ? 'bg-gray-200' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'}`} style={{ width: isSacrificingGoals ? '0%' : '100%' }} />

            </div>

          </div>

        </div>

      </div>



      <div className="mt-8 pt-6 border-t border-gray-50">

        <div className={`rounded-2xl p-4 flex items-center justify-between transition-colors ${dailyGoal >= 0 ? (isSacrificingGoals ? 'bg-orange-50/50 border border-orange-100' : 'bg-gray-50') : 'bg-rose-50 border border-rose-100'}`}>

          <div className="flex items-center gap-3">

            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dailyGoal >= 0 ? (isSacrificingGoals ? 'bg-orange-500' : 'bg-emerald-500') : 'bg-rose-500'} text-white shadow-lg shadow-black/5`}>

              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>

            </div>

            <div>

              <p className={`text-[8px] font-black uppercase tracking-widest leading-none ${dailyGoal >= 0 ? (isSacrificingGoals ? 'text-orange-400' : 'text-gray-400') : 'text-rose-400'}`}>Limite Seguro Diário</p>

              <p className={`text-sm font-black tabular-nums ${dailyGoal >= 0 ? (isSacrificingGoals ? 'text-orange-600' : 'text-gray-900') : 'text-rose-600'}`}>{formatCurrency(dailyGoal)}</p>

            </div>

          </div>

          {(dailyGoal < 0 || isSacrificingGoals) && (

            <div className="group relative">

              <svg className={`w-4 h-4 ${isSacrificingGoals ? 'text-orange-300' : 'text-rose-300'} cursor-help`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>

              <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-black text-white text-[9px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-20">

                {isSacrificingGoals 

                  ? `Para atingir suas metas, você precisa de mais ${formatCurrency(revenueGap)} de receita este mês.` 

                  : "Atenção: Suas dívidas e compromissos fixos superam seu saldo atual."}

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}
