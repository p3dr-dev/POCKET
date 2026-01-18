'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/goals/${goal.id}/contribute`, {
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Novo Aporte</h2>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Para: {goal.name}</p>

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
      </div>
    </div>
  );
}
