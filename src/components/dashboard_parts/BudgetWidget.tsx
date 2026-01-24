'use client';

import { usePrivacy } from '@/components/PrivacyProvider';

interface Budget {
  id: string;
  name: string;
  color: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentage: number;
}

interface BudgetWidgetProps {
  budgets: Budget[];
}

export default function BudgetWidget({ budgets }: BudgetWidgetProps) {
  const { isBlur } = usePrivacy();
  const format = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (!budgets || budgets.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
      <h3 className="text-xl font-black tracking-tight text-gray-900 mb-6">Orçamentos Mensais</h3>
      
      <div className="space-y-6">
        {budgets.map((budget) => {
          const isOver = budget.remaining < 0;
          const percentage = Math.min(100, budget.percentage);
          
          return (
            <div key={budget.id} className="group">
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.color || '#000' }} />
                  <span className="text-sm font-bold text-gray-900">{budget.name}</span>
                </div>
                <div className={`text-right transition-all duration-300 ${isBlur ? 'blur-sm select-none' : ''}`}>
                  <span className={`text-xs font-black ${isOver ? 'text-rose-600' : 'text-gray-400'}`}>
                    {format(budget.spent)}
                  </span>
                  <span className="text-[10px] text-gray-300 font-bold mx-1">/</span>
                  <span className="text-[10px] text-gray-400 font-bold">{format(budget.monthlyLimit)}</span>
                </div>
              </div>

              <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                    isOver ? 'bg-rose-500' : 
                    percentage > 80 ? 'bg-orange-400' : 
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <p className={`text-[9px] font-bold uppercase tracking-widest mt-1.5 text-right transition-all duration-300 ${isOver ? 'text-rose-500' : 'text-gray-400'} ${isBlur ? 'blur-sm select-none' : ''}`}>
                {isOver ? `Estourou ${format(Math.abs(budget.remaining))}` : `Resta ${format(budget.remaining)}`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
