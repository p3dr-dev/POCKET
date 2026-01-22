'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BaseModal from './BaseModal';

interface Debt {
  id: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
}

interface Account {
  id: string;
  name: string;
}

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  debt: Debt | null;
}

export default function DebtPaymentModal({ isOpen, onClose, onSuccess, debt }: DebtPaymentModalProps) {
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
      if (debt) {
        setAmount(debt.totalAmount.toString());
      }
    }
  }, [isOpen, debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const finalAmount = parseFloat(amount);
      
      const res = await fetch(`/api/debts/${debt?.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          accountId,
          date: new Date().toISOString() // Data do pagamento é hoje
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao processar');

      toast.success('Pagamento registrado com sucesso!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Pagar Conta"
      subtitle={debt?.description}
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Valor Efetivo (Pode variar)</label>
          <input 
            required 
            type="number" 
            step="0.01" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-lg font-black outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Pagar usando a conta</label>
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
          className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Processando...' : 'Confirmar Pagamento'}
        </button>
      </form>
    </BaseModal>
  );
}
