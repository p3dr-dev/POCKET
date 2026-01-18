'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    accounts: number;
  };
}
// ...
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                      {user._count.accounts} contas cadastradas
                    </td>

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => {
        if (!res.ok) throw new Error('Acesso negado');
        return res.json();
      })
      .then(setUsers)
      .catch(() => toast.error('Acesso restrito a administradores'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] font-sans text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="flex-none bg-[#F8FAFC]/80 backdrop-blur-md px-8 py-4 flex items-center border-b border-gray-100 z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden mr-4"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          <h1 className="text-2xl font-black">Gestão de Usuários</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Usuário</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Dados</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-sm font-bold text-gray-400">Carregando...</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                      {user._count.accounts} contas, {user._count.transactions} transações
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
