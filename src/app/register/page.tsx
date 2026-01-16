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
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Criar Conta</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Comece a organizar sua vida financeira</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-4 text-sm font-bold outline-none transition-all"
              placeholder="Seu Nome"
              required
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white p-4 rounded-xl font-black text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Criando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs font-bold text-gray-400">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-black hover:underline transition-all">
              Faça Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
