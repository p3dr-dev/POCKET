'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao cadastrar');
      }

      toast.success('Conta criada com sucesso! Faça login.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 selection:bg-black selection:text-white">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-emerald-500 rounded-[1.5rem] mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-emerald-200 -rotate-3 hover:rotate-0 transition-transform duration-500">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900">Nova Jornada</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-3">Crie sua inteligência financeira</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all placeholder:text-gray-300"
              placeholder="Ex: Pedro Simões"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Principal</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all placeholder:text-gray-300"
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha Segura</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all placeholder:text-gray-300"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Cadastrar Gratuitamente</span>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Já possui acesso?{' '}
            <Link href="/login" className="text-black hover:underline decoration-2 underline-offset-4">
              Fazer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
