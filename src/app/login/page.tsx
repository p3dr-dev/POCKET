'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react'; // Client-side sign in
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Usando o signIn do next-auth/react para credentials
      const result = await signIn('credentials', {
        redirect: false, // Não redirecionar automaticamente para controlar erros
        email,
        password,
      });

      if (result?.error) {
        toast.error('Email ou senha incorretos.');
      } else {
        toast.success('Login realizado!');
        router.push('/dashboard');
        router.refresh(); // Atualiza dados da sessão
      }
    } catch (error) {
      toast.error('Erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 selection:bg-black selection:text-white">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-black rounded-[2rem] mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-black/20 rotate-3 hover:rotate-0 transition-transform duration-500 group">
            <span className="text-white text-3xl font-black group-hover:scale-110 transition-transform">P</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900">Bem-vindo(a)</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-3">Acesse seu ecossistema financeiro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Corporativo ou Pessoal</label>
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
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all placeholder:text-gray-300"
              placeholder="••••••••"
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
                <span>Acessar Carteira</span>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Ainda não tem acesso?{' '}
            <Link href="/register" className="text-black hover:underline decoration-2 underline-offset-4">
              Criar Conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
