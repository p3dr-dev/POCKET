'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BaseModal from './BaseModal';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal?: Goal | null;
}

export default function GoalModal({ isOpen, onClose, onSuccess, goal }: GoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [color, setColor] = useState('#000000');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (goal) {
        setName(goal.name);
        setTargetAmount(goal.targetAmount.toString());
        setCurrentAmount(goal.currentAmount.toString());
        setDeadline(new Date(goal.deadline).toISOString().split('T')[0]);
        setColor(goal.color || '#000000');
      } else {
        setName('');
        setTargetAmount('');
        setCurrentAmount('0');
        setDeadline(new Date().toISOString().split('T')[0]);
        setColor('#000000');
      }
    }
  }, [isOpen, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const url = goal ? `/api/goals/${goal.id}` : '/api/goals';
    const method = goal ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          targetAmount: parseFloat(targetAmount), 
          currentAmount: parseFloat(currentAmount || '0'), 
          deadline,
          color
        }),
      });

      if (!res.ok) throw new Error();
      toast.success(goal ? 'Objetivo atualizado' : 'Objetivo traçado!');
      onSuccess();
      onClose();
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? 'Ajustar Meta' : 'Novo Objetivo'}
      subtitle="Defina seus horizontes"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Meta</label>
          <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all" placeholder="Ex: Viagem para Europa" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta (R$)</label>
            <input required type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-black outline-none transition-all" placeholder="0,00" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Já tenho (R$)</label>
            <input required type="number" step="0.01" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-black outline-none transition-all" placeholder="0,00" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Prazo Final</label>
            <input required type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor</label>
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2.5 border-2 border-transparent">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 bg-transparent rounded-lg cursor-pointer border-0 p-0 overflow-hidden" />
              <span className="text-xs font-mono font-bold text-gray-400">{color.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <button 
            type="submit"
            disabled={isLoading} 
            className="w-full py-5 bg-black text-white rounded-[1.5rem] text-sm font-black transition-all hover:bg-gray-800 disabled:opacity-50 active:scale-95 shadow-xl shadow-black/10"
          >
            {isLoading ? 'Processando...' : 'Salvar Meta'}
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