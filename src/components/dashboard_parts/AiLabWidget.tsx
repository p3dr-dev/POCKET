'use client';

interface AiLabWidgetProps {
  insight: string | null;
  isLoading: boolean;
  onGenerate: () => void;
  onClear: () => void;
}

export default function AiLabWidget({ insight, isLoading, onGenerate, onClear }: AiLabWidgetProps) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6 h-fit">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Pocket AI Lab</h3>
      </div>
      
      {insight ? (
        <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-bold text-indigo-900 leading-relaxed italic">"{insight}"</p>
          <button onClick={onClear} className="mt-3 text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-600 transition-colors">Limpar Análise</button>
        </div>
      ) : (
        <p className="text-xs text-gray-400 font-medium leading-relaxed">Solicite uma análise estratégica do Gemini sobre seu patrimônio atual.</p>
      )}

      <button 
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group active:scale-[0.98]"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <span>Gerar Insights</span>
            <svg className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </>
        )}
      </button>
    </div>
  );
}
