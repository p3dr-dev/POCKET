'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BaseModal from './BaseModal';

interface Account {
  id: string;
  name: string;
}

interface Investment {
  id: string;
  name: string;
  amount: number;
  currentValue: number | null;
  accountId: string; // Conta original de custódia
}

interface InvestmentRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  investment: Investment | null;
}

export default function InvestmentRedeemModal({ isOpen, onClose, onSuccess, investment }: InvestmentRedeemModalProps) {
  const [amount, setAmount] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && investment) {
      fetch('/api/accounts').then(res => res.json()).then(data => {
        setAccounts(data);
        // Sugerir a conta original, se existir na lista, senão a primeira
        const original = data.find((a: Account) => a.id === investment.accountId);
        setTargetAccountId(original ? original.id : (data[0]?.id || ''));
      });
      setAmount('');
    }
  }, [isOpen, investment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const redeemAmount = parseFloat(amount);
      if (redeemAmount > (investment!.currentValue || investment!.amount)) {
        toast.error('Valor maior que o saldo atual');
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/investments/${investment!.id}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: redeemAmount,
          targetAccountId
        }),
      });

      if (!res.ok) throw new Error();

      toast.success('Resgate realizado com sucesso!');
      onSuccess();
      onClose();
    } catch {
      toast.error('Erro ao resgatar');
    } finally {
      setIsLoading(false);
    }
  };

  const currentBalance = investment ? (investment.currentValue || investment.amount) : 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Resgatar Investimento"
      subtitle={investment ? `De: ${investment.name}` : undefined}
      maxWidth="max-w-sm"
    >
      <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-center">
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Disponível</p>
         <p className="text-2xl font-black text-gray-900 mt-1">R$ {currentBalance.toFixed(2)}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Valor do Resgate</label>
          <input 
            required 
            type="number" 
            step="0.01" 
            max={currentBalance}
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 focus:border-black rounded-2xl p-4 text-lg font-black outline-none transition-all"
            placeholder="R$ 0,00"
          />
        </div>

        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Destino do dinheiro</label>
          <select 
            required 
            value={targetAccountId} 
            onChange={e => setTargetAccountId(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
          >
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
        </div>

        <button 
          disabled={isLoading}
          className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Processando...' : 'Confirmar Resgate'}
        </button>
      </form>
    </BaseModal>
  );
}
