'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="text-center">
        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-4 animate-bounce">
          <span className="text-white font-bold text-xl">P</span>
        </div>
        <h1 className="text-lg font-black tracking-tighter italic">POCKET</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Carregando Ecossistema...</p>
        <a href="/login" className="mt-6 inline-block text-[10px] font-black underline uppercase tracking-widest text-gray-400 hover:text-black">
          Clique aqui se não for redirecionado
        </a>
      </div>
    </div>
  );
}
