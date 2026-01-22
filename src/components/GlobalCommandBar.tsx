'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function GlobalCommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
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

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Seu navegador não suporta voz.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Auto-submit após voz para fluidez
      setTimeout(() => handleSubmit(null, transcript), 500);
    };

    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent | null, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSubmit = textOverride || input;
    
    if (!textToSubmit.trim()) return;

    setIsLoading(true);
    const originalInput = textToSubmit;
    setInput(''); 
    
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
        setTimeout(() => window.location.reload(), 1000); 
      } else {
        toast(data.message, { 
          duration: 8000, 
          icon: '💡',
          style: { borderRadius: '16px', background: '#111', color: '#fff', maxWidth: '500px' }
        });
      }
      
      setIsOpen(false);
    } catch (err) {
      toast.error('Erro ao processar comando');
      setInput(originalInput);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 ring-1 ring-black/5">
        <div className="flex items-center px-4 py-3 border-b border-gray-100 gap-3">
          <button 
            onClick={startListening}
            className={`p-2 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            title="Falar comando"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </button>

          <form onSubmit={handleSubmit} className="flex-1">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Ouvindo..." : "Fale ou digite (ex: Gastei 50 no Uber)..."}
              className="w-full px-2 py-2 text-lg font-medium text-gray-900 placeholder-gray-400 outline-none bg-transparent"
              autoComplete="off"
            />
          </form>
          
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            {isLoading && <span className="animate-spin mr-2">⏳</span>}
            <span className="px-2 py-1 bg-gray-100 rounded hidden sm:inline">ESC</span>
          </div>
        </div>
        
        {!isLoading && !input && (
          <div className="px-4 py-3 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex gap-4 overflow-x-auto">
            <span className="whitespace-nowrap">🎤 "Recebi 500 reais"</span>
            <span className="whitespace-nowrap">🎤 "Quanto sobrou?"</span>
          </div>
        )}
      </div>
    </div>
  );
}
