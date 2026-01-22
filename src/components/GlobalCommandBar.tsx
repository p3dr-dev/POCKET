'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function GlobalCommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    const originalInput = input;
    setInput(''); // Limpa visualmente, mas mantém contexto se precisar
    
    try {
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: originalInput })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      if (data.type === 'TRANSACTION_CREATE') {
        toast.success(data.message, { duration: 5000, icon: '🤖' });
        // Pequeno delay para permitir re-fetch se estiver no dashboard
        setTimeout(() => window.location.reload(), 1000); 
      } else {
        // Query ou Advice exibe em um toast longo ou modal customizado
        toast(data.message, { 
          duration: 8000, 
          icon: '💡',
          style: { borderRadius: '16px', background: '#111', color: '#fff', maxWidth: '500px' }
        });
      }
      
      setIsOpen(false);
    } catch (err) {
      toast.error('Erro ao processar comando');
      setInput(originalInput); // Devolve o texto em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 ring-1 ring-black/5">
        <div className="flex items-center px-4 py-3 border-b border-gray-100">
          <svg className={`w-5 h-5 ${isLoading ? 'animate-spin text-indigo-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isLoading ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            )}
          </svg>
          <form onSubmit={handleSubmit} className="flex-1">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ao Pocket ou registre um gasto..."
              className="w-full px-4 py-2 text-lg font-medium text-gray-900 placeholder-gray-400 outline-none bg-transparent"
              autoComplete="off"
            />
          </form>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <span className="px-2 py-1 bg-gray-100 rounded">ESC</span>
          </div>
        </div>
        
        {/* Sugestões ou Histórico (Futuro) */}
        {!isLoading && !input && (
          <div className="px-4 py-3 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex gap-4">
            <span>Tente: "Gastei 30 no Uber"</span>
            <span>"Quanto gastei esse mês?"</span>
          </div>
        )}
      </div>
    </div>
  );
}
