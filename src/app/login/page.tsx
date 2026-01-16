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
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-black rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-black/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Bem-vindo(a)</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Entre para gerenciar suas finanças</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-4 text-sm font-bold outline-none transition-all"
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-4 text-sm font-bold outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white p-4 rounded-xl font-black text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs font-bold text-gray-400">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-black hover:underline transition-all">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
