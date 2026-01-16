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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('CDB');
  const [amount, setAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [accountId, setAccountId] = useState('');
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
        } else {
          setName('');
          setType('CDB');
          setAmount('');
          setCurrentValue('');
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
          accountId 
        }),
      });

      if (!res.ok) throw new Error();
      toast.success(investment ? 'Ativo atualizado' : 'Ativo registrado');
      onSuccess();
      onClose();
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md max-h-[95dvh] md:max-h-[90vh] overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-2xl transform animate-in zoom-in-95 duration-300 flex flex-col">
        <div className="flex-none p-6 md:p-8 pb-4 flex justify-between items-center border-b border-gray-50">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{investment ? 'Ajustar Ativo' : 'Novo Investimento'}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestão de Patrimônio</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Ativo</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all" placeholder="Ex: Tesouro Selic 2029" />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none">
                <option value="CDB">CDB</option>
                <option value="Ações">Ações</option>
                <option value="Tesouro">Tesouro Direto</option>
                <option value="FIIs">FIIs</option>
                <option value="Cripto">Cripto</option>
                <option value="ETF">ETF</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor Investido</label>
                <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-black outline-none transition-all" placeholder="0,00" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor de Mercado</label>
                <input type="number" step="0.01" value={currentValue} onChange={e => setCurrentValue(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-black outline-none transition-all" placeholder="Opcional" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Conta de Custódia</label>
              <select required value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none">
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>

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
