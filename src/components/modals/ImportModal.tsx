'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Account {
  id: string;
  name: string;
}

export default function ImportModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/accounts').then(res => res.json()).then(data => {
        setAccounts(data);
        if (data.length > 0) setSelectedAccountId(data[0].id);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedAccountId) return toast.error('Selecione um arquivo e uma conta');

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', selectedAccountId);

    try {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success(`${data.message} ${data.details || ''}`, {
        duration: 5000,
        style: { borderRadius: '16px', background: '#000', color: '#fff' }
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl transform animate-in zoom-in-95">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Importar Extrato</h2>
        
        <form onSubmit={handleImport} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Conta de Destino</label>
            <select 
              value={selectedAccountId} 
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3.5 text-sm font-bold outline-none"
            >
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>

          <div className="group relative border-2 border-dashed border-gray-200 rounded-[2rem] p-10 text-center hover:border-black transition-all">
            <input 
              type="file" 
              accept=".ofx,.csv,.pdf" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2">
              <svg className="w-10 h-10 mx-auto text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-bold text-gray-500">
                {file ? file.name : 'Arraste seu PDF (PicPay), OFX ou CSV'}
              </p>
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Formatos aceitos: PDF, OFX, CSV</p>
            </div>
          </div>

          <button 
            disabled={isLoading || !file}
            className="w-full py-4 bg-black text-white rounded-2xl text-sm font-black hover:bg-emerald-600 transition-all transform active:scale-95 disabled:opacity-20"
          >
            {isLoading ? 'Processando dados...' : 'Confirmar Importação'}
          </button>
        </form>
      </div>
    </div>
  );
}
