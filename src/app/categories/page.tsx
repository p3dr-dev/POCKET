'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  monthlyLimit: number | null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [newLimit, setNewLimit] = useState('');
  const [newColor, setNewColor] = useState('#000000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
    setIsLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName, 
          type: newType, 
          color: newColor,
          monthlyLimit: newLimit ? parseFloat(newLimit) : null 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Categoria criada!');
      setNewName('');
      setNewLimit('');
      setNewColor('#000000');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, name: string, limit: number | null, color?: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, monthlyLimit: limit, color }),
      });
      if (res.ok) toast.success('Atualizado');
      fetchCategories();
    } catch { toast.error('Erro ao atualizar'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta categoria?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Categoria excluída');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir');
    }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] font-sans selection:bg-black selection:text-white overflow-hidden text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="flex-none bg-[#F8FAFC]/80 backdrop-blur-md px-4 md:px-8 py-4 flex justify-between items-center border-b border-gray-100/50 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 lg:hidden active:scale-95 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight">Categorias e Orçamentos</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-10 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-10 pb-20">
            
            {/* Create New Section */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-lg font-black mb-6 uppercase tracking-widest text-gray-400">Novo Planejamento</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Nome</label>
                    <input 
                      required
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Ex: Alimentação, Apps..." 
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Tipo</label>
                    <select 
                      value={newType}
                      onChange={e => setNewType(e.target.value as any)}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                    >
                      <option value="EXPENSE">Saída (Gasto)</option>
                      <option value="INCOME">Entrada (Receita)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Limite Mensal</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={newLimit}
                      onChange={e => setNewLimit(e.target.value)}
                      placeholder="R$ 0,00" 
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Cor</label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2 border-2 border-transparent focus-within:border-black transition-all">
                      <input 
                        type="color"
                        value={newColor}
                        onChange={e => setNewColor(e.target.value)}
                        className="w-10 h-10 bg-transparent rounded-lg cursor-pointer border-0 p-0 overflow-hidden" 
                      />
                      <span className="text-[10px] font-mono font-bold text-gray-400">{newColor.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="md:col-span-5 flex justify-end mt-2">
                    <button 
                      disabled={isSubmitting}
                      className="bg-black text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-black/10"
                    >
                      {isSubmitting ? '...' : 'Salvar Categoria'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* List Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Expenses */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">Gestão de Gastos</h3>
                  {!isLoading && <span className="text-[10px] font-bold text-gray-300 uppercase">{categories.filter(c => c.type === 'EXPENSE').length} itens</span>}
                </div>
                <div className="space-y-3">
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white rounded-[2rem] p-6 border border-gray-100 flex items-center justify-between">
                         <div className="space-y-2">
                           <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                           <div className="h-3 w-20 bg-gray-50 rounded animate-pulse" />
                         </div>
                         <div className="w-8 h-8 bg-gray-50 rounded-lg animate-pulse" />
                      </div>
                    ))
                  ) : (
                    categories.filter(c => c.type === 'EXPENSE').map(cat => (
                      <div key={cat.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex items-center justify-between group hover:border-rose-200 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100" style={{ backgroundColor: cat.color }}>
                             <div className="w-2 h-2 rounded-full bg-white/30" />
                          </div>
                          <div>
                            <span className="font-black text-gray-900 block">{cat.name}</span>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                              Limite: {cat.monthlyLimit ? formatCurrency(cat.monthlyLimit) : 'Sem limite definido'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              const val = prompt('Novo limite mensal (ou deixe em branco para remover):', cat.monthlyLimit?.toString() || '');
                              if (val !== null) handleUpdate(cat.id, cat.name, val === '' ? null : parseFloat(val), cat.color);
                            }}
                            className="p-2 hover:bg-gray-50 rounded-lg text-gray-300 hover:text-black transition-colors"
                            title="Editar Limite"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button 
                            onClick={() => {
                              const color = prompt('Nova cor (hex):', cat.color);
                              if (color) handleUpdate(cat.id, cat.name, cat.monthlyLimit, color);
                            }}
                            className="p-2 hover:bg-gray-50 rounded-lg text-gray-300 hover:text-black transition-colors"
                            title="Mudar Cor"
                          >
                            <div className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: cat.color }} />
                          </button>
                          <button 
                            onClick={() => handleDelete(cat.id)}
                            className="p-2 hover:bg-rose-50 rounded-lg text-gray-300 hover:text-rose-600 transition-colors"
                            title="Excluir Categoria"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Incomes */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">Gestão de Receitas</h3>
                  {!isLoading && <span className="text-[10px] font-bold text-gray-300 uppercase">{categories.filter(c => c.type === 'INCOME').length} itens</span>}
                </div>
                <div className="space-y-3">
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white rounded-[2rem] p-6 border border-gray-100 flex items-center justify-between">
                         <div className="space-y-2">
                           <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                           <div className="h-3 w-20 bg-gray-50 rounded animate-pulse" />
                         </div>
                         <div className="w-8 h-8 bg-gray-50 rounded-lg animate-pulse" />
                      </div>
                    ))
                  ) : (
                    categories.filter(c => c.type === 'INCOME').map(cat => (
                      <div key={cat.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100" style={{ backgroundColor: cat.color }}>
                             <div className="w-2 h-2 rounded-full bg-white/30" />
                          </div>
                          <div>
                            <span className="font-black text-gray-900 block">{cat.name}</span>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Estimativa: {cat.monthlyLimit ? formatCurrency(cat.monthlyLimit) : 'Não estimada'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              const val = prompt('Estimativa mensal:', cat.monthlyLimit?.toString() || '');
                              if (val !== null) handleUpdate(cat.id, cat.name, val === '' ? null : parseFloat(val), cat.color);
                            }}
                            className="p-2 hover:bg-gray-50 rounded-lg text-gray-300 hover:text-black transition-colors"
                            title="Editar Limite"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button 
                            onClick={() => {
                              const color = prompt('Nova cor (hex):', cat.color);
                              if (color) handleUpdate(cat.id, cat.name, cat.monthlyLimit, color);
                            }}
                            className="p-2 hover:bg-gray-50 rounded-lg text-gray-300 hover:text-black transition-colors"
                            title="Mudar Cor"
                          >
                            <div className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: cat.color }} />
                          </button>
                          <button 
                            onClick={() => handleDelete(cat.id)}
                            className="p-2 hover:bg-rose-50 rounded-lg text-gray-300 hover:text-rose-600 transition-colors"
                            title="Excluir Categoria"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
