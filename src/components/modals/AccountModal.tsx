'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { secureFetch } from '@/lib/api-client';
import BaseModal from './BaseModal';

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

const ACCOUNT_TYPES = [
  { id: 'BANK', label: 'Bancária', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
  { id: 'CREDIT_CARD', label: 'Cartão', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
  { id: 'CASH', label: 'Dinheiro', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { id: 'INVESTMENT', label: 'Corretora', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
  { id: 'CRYPTO', label: 'Cripto', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const url = account ? `/api/accounts/${account.id}` : '/api/accounts';
    const method = account ? 'PUT' : 'POST';

    try {
      await secureFetch(url, {
        method,
        body: JSON.stringify({ 
          name, 
          type, 
          color, 
          initialBalance: !account ? parseFloat(initialBalance || '0') : undefined 
        }),
      });

      toast.success(account ? 'Conta atualizada!' : 'Conta criada!');
      onSuccess();
      onClose();
    } catch (error) {
      // secureFetch already shows the toast error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? 'Editar Conta' : 'Nova Conta'}
      subtitle="Configuração de Ativos"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
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

        <div className="space-y-3">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Ativo</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id as any)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 group ${
                  type === t.id 
                    ? 'border-black bg-black text-white shadow-xl scale-[1.02]' 
                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:bg-white hover:text-black'
                }`}
              >
                <div className={`transition-transform duration-500 ${type === t.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {t.icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tighter">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {!account && (
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Saldo Inicial</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">R$</span>
              <input
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl py-4 pl-10 pr-4 text-sm font-black outline-none transition-all"
                placeholder="0,00"
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor da Identidade</label>
          <div className="flex items-center gap-4 bg-gray-50 rounded-[2rem] p-4 border border-gray-100">
            <div className="relative group">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 overflow-hidden bg-transparent"
              />
              <div className="absolute inset-0 rounded-xl pointer-events-none border-2 border-white/20" />
            </div>
            <div>
               <span className="text-xs font-mono font-black text-gray-900 block">{color.toUpperCase()}</span>
               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Hex Code</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <button 
            type="submit"
            disabled={isLoading} 
            className="w-full py-5 bg-black text-white rounded-[1.5rem] text-sm font-black transition-all hover:bg-gray-800 disabled:opacity-50 active:scale-95 shadow-xl shadow-black/10 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                <span>{account ? 'Atualizar Ecossistema' : 'Registrar Nova Conta'}</span>
              </>
            )}
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
    </BaseModal>
  );
}
