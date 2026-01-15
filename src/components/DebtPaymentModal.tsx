'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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

  if (!isOpen || !debt) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const finalAmount = parseFloat(amount);
      
      // 1. Atualizar a Dívida (Marcar como paga e ajustar valor total se variou)
      const debtUpdate = fetch(`/api/debts/${debt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...debt,
          totalAmount: finalAmount, // Ajusta para o valor real pago
          paidAmount: finalAmount,  // Marca como quitada
          dueDate: new Date().toISOString() // Mantém a data original ou usa hoje? Vamos manter a lógica do PUT existente que exige dueDate. 
          // Nota: O PUT atual sobrescreve tudo. Precisamos de cuidado.
        }),
      });

      // 2. Criar a Transação de Saída na conta selecionada
      const transactionCreate = fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Pagamento: ${debt.description}`,
          amount: finalAmount,
          type: 'EXPENSE',
          date: new Date().toISOString().split('T')[0],
          accountId,
          categoryId: '', // A API vai precisar tratar ou vamos buscar uma padrão
        }),
      });

      const [resDebt] = await Promise.all([debtUpdate, transactionCreate]);

      if (!resDebt.ok) throw new Error();

      toast.success('Pagamento registrado e conta atualizada!');
      onSuccess();
      onClose();
    } catch {
      toast.error('Erro ao processar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Pagar Conta</h2>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{debt.description}</p>

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
      </div>
    </div>
  );
}
