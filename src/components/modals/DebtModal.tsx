'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BaseModal from './BaseModal';

interface Debt {
  id: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
}

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  debt?: Debt | null;
}

type DebtType = 'SINGLE' | 'INSTALLMENT';

export default function DebtModal({ isOpen, onClose, onSuccess, debt }: DebtModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [noDueDate, setNoDueDate] = useState(false);
  const [type, setType] = useState<DebtType>('SINGLE');
  const [installmentsCount, setInstallmentsCount] = useState('2');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (debt) {
        setDescription(debt.description);
        setAmount(debt.totalAmount.toString());
        setPaidAmount(debt.paidAmount.toString());
        if (debt.dueDate) {
          setDueDate(new Date(debt.dueDate).toISOString().split('T')[0]);
          setNoDueDate(false);
        } else {
          setNoDueDate(true);
        }
        setType('SINGLE');
      } else {
        setDescription('');
        setAmount('');
        setPaidAmount('0');
        setDueDate(new Date().toISOString().split('T')[0]);
        setNoDueDate(false);
        setType('SINGLE');
        setInstallmentsCount('2');
      }
    }
  }, [isOpen, debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const url = debt ? `/api/debts/${debt.id}` : '/api/debts';
    const method = debt ? 'PUT' : 'POST';

    try {
      const finalAmount = parseFloat(amount.replace(',', '.'));
      const finalPaid = parseFloat((paidAmount || '0').replace(',', '.'));

      if (isNaN(finalAmount)) {
        toast.error('Valor total inválido');
        setIsLoading(false);
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description, 
          totalAmount: finalAmount, 
          paidAmount: finalPaid, 
          dueDate: (noDueDate || !dueDate) ? null : dueDate,
          type,
          installmentsCount: type === 'SINGLE' ? 1 : (parseInt(installmentsCount) || 1)
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao salvar');
      }

      toast.success(debt ? 'Dívida atualizada' : 'Dívidas registradas');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={debt ? 'Editar Dívida' : 'Nova Dívida'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!debt && (
          <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
            {(['SINGLE', 'INSTALLMENT'] as DebtType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${type === t ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {t === 'SINGLE' ? 'Única' : 'Parcelada'}
              </button>
            ))}
          </div>
        )}

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Descrição</label>
          <input required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3.5 text-sm font-bold outline-none transition-all" placeholder={type === 'INSTALLMENT' ? "Ex: Notebook" : "Ex: Empréstimo Amigo"} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">
              {type === 'SINGLE' ? 'Valor Total' : 'Valor da Parcela'}
            </label>
            <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3.5 text-sm font-black outline-none transition-all" placeholder="0,00" />
          </div>
          
          {type === 'SINGLE' ? (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Valor Pago</label>
              <input required type="number" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3.5 text-sm font-black outline-none transition-all" placeholder="0,00" />
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Nº Parcelas</label>
              <input required type="number" min="2" max="360" value={installmentsCount} onChange={e => setInstallmentsCount(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3.5 text-sm font-black outline-none transition-all" />
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5 ml-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {type === 'SINGLE' ? 'Vencimento' : '1º Vencimento'}
            </label>
            <button type="button" onClick={() => setNoDueDate(!noDueDate)} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded transition-all ${noDueDate ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
              {noDueDate ? 'Sem Data ✓' : 'Sem Data?'}
            </button>
          </div>
          {!noDueDate && (
            <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3.5 text-sm font-bold outline-none transition-all" />
          )}
          {noDueDate && (
            <div className="w-full bg-gray-100 rounded-xl p-3.5 text-xs font-bold text-gray-400 italic">
              Data não definida (Aguardando pagamento)
            </div>
          )}
        </div>

        <button disabled={isLoading} className="w-full py-4 bg-black text-white rounded-xl text-sm font-black mt-4 hover:bg-rose-600 transition-all transform active:scale-95">
          {isLoading ? 'Salvando...' : 'Salvar Compromisso'}
        </button>
      </form>
    </BaseModal>
  );
}
