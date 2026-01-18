'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Account {
  id: string;
  name: string;
}

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number | null;
  accountId: string;
}

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  investment?: Investment | null;
}

export default function InvestmentModal({ isOpen, onClose, onSuccess, investment }: InvestmentModalProps) {
  const [currentValue, setCurrentValue] = useState('');
  const [accountId, setAccountId] = useState('');
  const [createTransaction, setCreateTransaction] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/accounts').then(res => res.json()).then(data => {
        setAccounts(data);
        if (investment) {
          setName(investment.name);
          setType(investment.type);
          setAmount(investment.amount.toString());
          setCurrentValue(investment.currentValue?.toString() || investment.amount.toString());
          setAccountId(investment.accountId);
          setCreateTransaction(false); // Edição geralmente não recria transação
        } else {
          setName('');
          setType('CDB');
          setAmount('');
          setCurrentValue('');
          setCreateTransaction(true); // Novo registro padrão = debitar
          if (data.length > 0) setAccountId(data[0].id);
        }
      });
    }
  }, [isOpen, investment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const url = investment ? `/api/investments/${investment.id}` : '/api/investments';
    const method = investment ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          type, 
          amount: parseFloat(amount), 
          currentValue: parseFloat(currentValue || amount),
          accountId,
          createTransaction: !investment && createTransaction // Só envia true se for novo e checkbox marcado
        }),
      });
// ... (rest of code inside return, before button)
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Conta de Custódia</label>
              <select required value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none">
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>

            {!investment && (
              <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={createTransaction} 
                  onChange={e => setCreateTransaction(e.target.checked)} 
                  className="w-5 h-5 rounded-md border-2 border-gray-300 text-black focus:ring-0"
                />
                <span className="text-xs font-bold text-gray-600">Debitar valor do saldo da conta</span>
              </label>
            )}

            <div className="pt-4 flex flex-col gap-3">
              <button disabled={isLoading} type="submit" className="w-full py-5 bg-black text-white rounded-[1.5rem] text-sm font-black transition-all hover:bg-gray-800 disabled:opacity-50 active:scale-95 shadow-xl">
                {isLoading ? 'Salvando...' : 'Confirmar Registro'}
              </button>
              <button type="button" onClick={onClose} className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors sm:hidden">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
