'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BaseModal from './BaseModal';

interface Category { id: string; name: string; type: 'INCOME' | 'EXPENSE'; }
interface Account { id: string; name: string; }

interface Subscription {
  id: string;
  description: string;
  amount: number | null;
  type: 'INCOME' | 'EXPENSE';
  frequency: string;
  nextRun: string | null;
  categoryId: string;
  accountId: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscription?: Subscription | null;
}

export default function SubscriptionModal({ isOpen, onClose, onSuccess, subscription }: SubscriptionModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isVariableAmount, setIsVariableAmount] = useState(false);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [nextRun, setNextRun] = useState(new Date().toISOString().split('T')[0]);
  const [isVariableDate, setIsVariableDate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch('/api/categories').then(res => res.json()),
        fetch('/api/accounts').then(res => res.json())
      ]).then(([catData, accData]) => {
        setCategories(catData);
        setAccounts(accData);
        
        if (subscription) {
          setDescription(subscription.description);
          setAmount(subscription.amount?.toString() || '');
          setIsVariableAmount(subscription.amount === null || subscription.amount === 0);
          setType(subscription.type);
          setFrequency(subscription.frequency);
          setCategoryId(subscription.categoryId);
          setAccountId(subscription.accountId);
          if (subscription.nextRun) {
            setNextRun(new Date(subscription.nextRun).toISOString().split('T')[0]);
            setIsVariableDate(false);
          } else {
            setIsVariableDate(true);
          }
        } else {
          resetForm();
          if (accData.length > 0) setAccountId(accData[0].id);
        }
      });
    }
  }, [isOpen, subscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const method = subscription ? 'PATCH' : 'POST';
    const url = subscription ? `/api/subscriptions/${subscription.id}` : '/api/subscriptions';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description, 
          amount: isVariableAmount ? null : parseFloat(amount), 
          type, 
          frequency,
          categoryId, 
          accountId, 
          nextRun: isVariableDate ? null : new Date(nextRun + 'T12:00:00.000Z').toISOString() 
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao salvar');
      }

      toast.success(subscription ? 'Assinatura atualizada!' : 'Assinatura criada!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!subscription || !confirm('Deseja realmente excluir esta assinatura?')) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Assinatura excluída');
      onSuccess();
      onClose();
    } catch {
      toast.error('Erro ao excluir');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setIsVariableAmount(false);
    setIsVariableDate(false);
    setNextRun(new Date().toISOString().split('T')[0]);
    setFrequency('MONTHLY');
    setType('EXPENSE');
    setCategoryId('');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={subscription ? 'Editar Assinatura' : 'Nova Assinatura'}
      subtitle="Configure um lançamento recorrente"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
          <input required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all" placeholder="Ex: Netflix, Aluguel, Academia..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor</label>
              <button type="button" onClick={() => setIsVariableAmount(!isVariableAmount)} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded transition-all ${isVariableAmount ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                {isVariableAmount ? 'Variável ✓' : 'Variável?'}
              </button>
            </div>
            {!isVariableAmount ? (
              <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-black outline-none transition-all" placeholder="0,00" />
            ) : (
              <div className="w-full bg-gray-100 rounded-2xl p-4 text-[10px] font-bold text-gray-400 italic">Valor definido no lançamento</div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Frequência</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none">
              <option value="WEEKLY">Semanal</option>
              <option value="MONTHLY">Mensal</option>
              <option value="YEARLY">Anual</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none">
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Próximo Lançamento</label>
              <button type="button" onClick={() => setIsVariableDate(!isVariableDate)} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded transition-all ${isVariableDate ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                {isVariableDate ? 'Sem Data ✓' : 'Sem Data?'}
              </button>
            </div>
            {!isVariableDate ? (
              <input required type="date" value={nextRun} onChange={e => setNextRun(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all" />
            ) : (
              <div className="w-full bg-gray-100 rounded-2xl p-4 text-[10px] font-bold text-gray-400 italic">Lançamento manual</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
            <select required value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none">
              <option value="">Selecione...</option>
              {categories.filter(c => c.type === type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Conta de Débito</label>
            <select required value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none">
              <option value="">Selecione...</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
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
                <span>{subscription ? 'Salvar Alterações' : 'Salvar Assinatura'}</span>
              </>
            )}
          </button>
          
          {subscription && (
            <button 
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full py-4 text-[10px] font-black text-rose-600 uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all"
            >
              Excluir Assinatura
            </button>
          )}
        </div>
      </form>
    </BaseModal>
  );
}
