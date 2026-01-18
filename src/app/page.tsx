'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500 selection:text-white flex flex-col font-sans">
      <nav className="p-6 md:p-10 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center rotate-3">
            <span className="text-black font-black text-xl">P</span>
          </div>
          <span className="font-black tracking-tighter text-xl">POCKET</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
            Login
          </Link>
          <Link href="/register" className="px-6 py-2.5 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-lg shadow-white/10">
            Começar
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sistema Financeiro Inteligente v1.0
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
            Domine seu <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">Patrimônio.</span>
          </h1>
          
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-medium">
            Gestão financeira completa com Inteligência Artificial local. 
            Controle gastos, investimentos e dívidas em uma única plataforma segura e privada.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/register" className="px-10 py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl shadow-white/20">
              Criar Conta Grátis
            </Link>
            <Link href="/login" className="px-10 py-5 bg-white/10 border border-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all backdrop-blur-md">
              Acessar Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 w-full px-4">
          {[
            { title: 'IA Integrada', desc: 'Insights estratégicos sobre seus gastos gerados localmente via Ollama.', icon: '🧠' },
            { title: 'Multi-Contas', desc: 'Gerencie bancos, cartões e cripto em um só lugar unificado.', icon: '💳' },
            { title: 'Metas Reais', desc: 'Planejamento financeiro que conecta seus sonhos ao seu saldo atual.', icon: '🎯' }
          ].map((f, i) => (
            <div key={i} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-white/20 transition-colors text-left group">
              <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform duration-300">{f.icon}</span>
              <h3 className="text-lg font-black mb-2">{f.title}</h3>
              <p className="text-gray-400 text-xs font-medium leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-10 text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest border-t border-white/5">
        &copy; 2026 Pocket Finance. Todos os direitos reservados.
      </footer>
    </div>
  );
}
