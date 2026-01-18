'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Account {
  id: string;
  name: string;
  type: 'BANK' | 'CASH' | 'CREDIT_CARD' | 'CRYPTO' | 'INVESTMENT';
  color: string;
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: Account | null;
}

export default function AccountModal({ isOpen, onClose, onSuccess, account }: AccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('BANK');
  const [color, setColor] = useState('#000000');
  const [initialBalance, setInitialBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (account) {
        setName(account.name);
        setType(account.type);
        setColor(account.color || '#000000');
        setInitialBalance('');
      } else {
        setName('');
        setType('BANK');
        setColor('#000000');
        setInitialBalance('0');
      }
    }
  }, [isOpen, account]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const url = account ? `/api/accounts/${account.id}` : '/api/accounts';
    const method = account ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          type, 
          color, 
          initialBalance: !account ? parseFloat(initialBalance || '0') : undefined 
        }),
      });

      if (!res.ok) throw new Error();

      toast.success(account ? 'Conta atualizada!' : 'Conta criada!');
      onSuccess();
      onClose();
    } catch {
      toast.error('Erro ao salvar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md max-h-[95dvh] md:max-h-[90vh] overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-2xl transform animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="flex-none p-6 md:p-8 pb-4 flex justify-between items-center border-b border-gray-50">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{account ? 'Editar Conta' : 'Nova Conta'}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configuração de Ativos</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Conta</label>
              <input
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                placeholder="Ex: Nubank, Binance, Corretora..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Ativo</label>
                <select
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                >
                  <option value="BANK">Conta Bancária</option>
                  <option value="CASH">Dinheiro em Espécie</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="CRYPTO">Cripto / Exchange</option>
                  <option value="INVESTMENT">Investimentos / Corretora</option>
                </select>
              </div>

              {!account && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Saldo Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-black outline-none transition-all"
                    placeholder="0,00"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor de Identificação</label>
              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2.5">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                />
                <span className="text-xs font-mono font-bold text-gray-400">{color.toUpperCase()}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button 
                type="submit"
                disabled={isLoading} 
                className="w-full py-5 bg-black text-white rounded-[1.5rem] text-sm font-black transition-all hover:bg-gray-800 disabled:opacity-50 active:scale-95 shadow-xl shadow-black/10"
              >
                {isLoading ? 'Processando...' : account ? 'Salvar Alterações' : 'Criar Conta'}
              </button>
              <button 
                type="button" 
                onClick={onClose} 
                className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors sm:hidden"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}