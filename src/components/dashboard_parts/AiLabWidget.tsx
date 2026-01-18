'use client';

import toast from "react-hot-toast";

interface AiLabWidgetProps {
  insight: string | null;
  isLoading: boolean;
  onGenerate: () => void;
  onClear: () => void;
}

export default function AiLabWidget({ insight, isLoading, onGenerate, onClear }: AiLabWidgetProps) {
  const handleCopy = () => {
    if (insight) {
      navigator.clipboard.writeText(insight);
      toast.success('Copiado!');
    }
  };

  return (
    <div className="bg-black rounded-[2.5rem] p-8 border border-gray-900 shadow-2xl space-y-6 h-fit relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-700" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div>
           <h3 className="font-black text-sm uppercase tracking-widest text-white">Pocket AI Lab</h3>
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Powered by Gemini</p>
        </div>
      </div>
      
      {insight ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10 max-h-[300px] overflow-y-auto custom-scrollbar-dark">
            <p className="text-sm font-medium text-gray-200 leading-7 whitespace-pre-line">{insight}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopy} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              Copiar
            </button>
            <button onClick={onClear} className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
              Limpar
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white/5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3 min-h-[150px]">
           <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-[200px]">Solicite uma análise estratégica completa sobre seu momento financeiro atual.</p>
        </div>
      )}

      {!insight && (
        <button 
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group active:scale-[0.98] shadow-lg shadow-indigo-900/20"
        >
          {isLoading ? (
            <>
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               <span>Analisando Dados...</span>
            </>
          ) : (
            <>
              <span>Gerar Insights Estratégicos</span>
              <svg className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}
