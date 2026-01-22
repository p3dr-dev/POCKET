'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BaseModal from './BaseModal';

interface Goal {
  id: string;
  name: string;
}

interface Account {
  id: string;
  name: string;
}

interface GoalContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: Goal | null;
}

export default function GoalContributionModal({ isOpen, onClose, onSuccess, goal }: GoalContributionModalProps) {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/accounts').then(res => res.json()).then(data => {
        setAccounts(data);
        if (data.length > 0) setAccountId(data[0].id);
      });
      setAmount('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/goals/${goal?.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          accountId
        }),
      });

      if (!res.ok) throw new Error();

      toast.success('Contribuição realizada!');
      onSuccess();
      onClose();
    } catch {
      toast.error('Erro ao contribuir');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Aporte"
      subtitle={goal ? `Para: ${goal.name}` : undefined}
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Valor do Aporte</label>
          <input 
            required 
            type="number" 
            step="0.01" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-lg font-black outline-none transition-all"
            placeholder="R$ 0,00"
          />
        </div>

        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Origem dos fundos</label>
          <select 
            required 
            value={accountId} 
            onChange={e => setAccountId(e.target.value)}
            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
          >
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
        </div>

        <button 
          disabled={isLoading}
          className="w-full py-5 bg-black text-white rounded-2xl text-sm font-black hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Processando...' : 'Confirmar Aporte'}
        </button>
      </form>
    </BaseModal>
  );
}
