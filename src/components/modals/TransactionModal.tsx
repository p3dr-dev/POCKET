'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Category { id: string; name: string; type: 'INCOME' | 'EXPENSE'; }
interface Account { id: string; name: string; }
interface Transaction { 
  id: string; description: string; amount: number; type: 'INCOME' | 'EXPENSE'; 
  date: string; categoryId: string; accountId: string; 
  payee?: string; payer?: string; bankRefId?: string;
  externalId?: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction | null;
}

type TabType = 'SINGLE' | 'TRANSFER' | 'YIELD';

export default function TransactionModal({ isOpen, onClose, onSuccess, transaction }: TransactionModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('SINGLE');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Single Transaction State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toLocaleTimeString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', 'T'));
  
  // Receipt details
  const [payee, setPayee] = useState('');
  const [payer, setPayer] = useState('');
  const [bankRefId, setBankRefId] = useState('');
  const [externalId, setExternalId] = useState<string | null>(null);
  
  // Transfer State
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [magicText, setMagicText] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

  useEffect(() => {
    if (highlightedFields.length > 0) {
      const timer = setTimeout(() => setHighlightedFields([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedFields]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch('/api/categories').then(res => res.json()),
        fetch('/api/accounts').then(res => res.json())
      ]).then(([catData, accData]) => {
        setCategories(catData);
        setAccounts(accData);
        if (transaction) {
          setDescription(transaction.description);
          setAmount(transaction.amount.toString());
          setType(transaction.type);
          setCategoryId(transaction.categoryId);
          setAccountId(transaction.accountId);
          
          const localDate = new Date(transaction.date);
          const formatted = localDate.toLocaleTimeString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', 'T');
          setDate(formatted);

          setPayee(transaction.payee || '');
          setPayer(transaction.payer || '');
          setBankRefId(transaction.bankRefId || '');
          setExternalId(transaction.externalId || null);
          setActiveTab('SINGLE');
        } else {
          resetForm();
          if (accData.length > 0) {
            setAccountId(accData[0].id);
            setFromAccountId(accData[0].id);
            if (accData.length > 1) setToAccountId(accData[1].id);
          }
        }
      });
    }
  }, [isOpen, transaction]);

  const handleMagicParse = async () => {
    if (!magicText.trim()) return;
    setIsMagicLoading(true);
    try {
      const res = await fetch('/api/ai/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: magicText }),
      });
      const data = await res.json();
      applyAiData(data);
      setMagicText('');
      toast.success('Organizado!');
    } finally { setIsMagicLoading(false); }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    toast.loading('Escaneando comprovante...', { id: 'scan' });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      applyAiData(data);
      toast.success('Comprovante processado!', { id: 'scan' });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao escanear', { id: 'scan' });
    } finally {
      setIsScanning(false);
    }
  };

  const applyAiData = (data: any) => {
    const fields: string[] = [];
    if (data.type === 'TRANSFER') {
      setActiveTab('TRANSFER');
      setTransferAmount(data.amount.toString());
      if (data.fromAccountId) setFromAccountId(data.fromAccountId);
      if (data.toAccountId) setToAccountId(data.toAccountId);
      fields.push('transferAmount', 'fromAccountId', 'toAccountId');
    } else {
      setActiveTab('SINGLE');
      if (data.description) { setDescription(data.description); fields.push('description'); }
      if (data.amount) { setAmount(data.amount.toString()); fields.push('amount'); }
      if (data.type) { setType(data.type); fields.push('type'); }
      if (data.categoryId) { setCategoryId(data.categoryId); fields.push('categoryId'); }
      if (data.accountId) { setAccountId(data.accountId); fields.push('accountId'); }
    }
    
    if (data.date) {
        const hasTime = data.date.includes('T') || data.date.includes(':');
        if (!hasTime) {
            const nowTime = new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
            setDate(`${data.date}T${nowTime}`);
        } else {
            setDate(data.date);
        }
        fields.push('date');
    }
    if (data.payee) setPayee(data.payee);
    if (data.payer) setPayer(data.payer);
    if (data.bankRefId) setBankRefId(data.bankRefId);
    if (data.externalId) setExternalId(data.externalId);

    setHighlightedFields(fields);
  };

  const formatCurrency = (v: string) => {
    const n = parseFloat(v);
    if (isNaN(n)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (activeTab === 'SINGLE') {
        const url = transaction ? `/api/transactions/${transaction.id}` : '/api/transactions';
        const res = await fetch(url, {
          method: transaction ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            description, amount: parseFloat(amount), type, categoryId, accountId, date,
            payee, payer, bankRefId, externalId
          }),
        });
        if (!res.ok) throw new Error('Erro ao salvar');
      } 
      else if (activeTab === 'YIELD') {
        const yieldCat = categories.find(c => c.name.toLowerCase().includes('rendimento')) || categories.find(c => c.type === 'INCOME');
        if (!yieldCat) throw new Error('Categoria Rendimentos não encontrada');

        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            description: description || 'Rendimento Automático', 
            amount: parseFloat(amount), 
            type: 'INCOME', 
            categoryId: yieldCat.id, 
            accountId, 
            date,
            payee: 'Banco', 
            payer: 'Banco'
          }),
        });
        if (!res.ok) throw new Error('Erro ao salvar rendimento');
      }
      else {
        if (fromAccountId === toAccountId) throw new Error('Contas iguais');
        const res = await fetch('/api/transactions/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fromAccountId, 
            toAccountId, 
            amount: parseFloat(transferAmount), 
            date, 
            description: description || 'Transferência',
            payee,
            payer,
            bankRefId,
            externalId
          }),
        });
        if (!res.ok) throw new Error('Erro na transferência');
      }
      toast.success('Sucesso!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar');
    } finally { setIsLoading(false); }
  };

  const resetForm = () => {
    setDescription(''); setAmount(''); setTransferAmount(''); setMagicText('');
    setPayee(''); setPayer(''); setBankRefId(''); setExternalId(null);
    setDate(new Date().toLocaleTimeString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', 'T'));
    setType('EXPENSE');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg max-h-[95dvh] md:max-h-[90vh] overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-2xl transform animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header - Sticky */}
        <div className="flex-none p-6 md:p-8 pb-4 flex justify-between items-center bg-white border-b border-gray-50">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{transaction ? 'Editar Lançamento' : 'Novo Registro'}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Preencha os dados abaixo</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-4 custom-scrollbar space-y-6">
          {!transaction && (
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              {(['SINGLE', 'TRANSFER', 'YIELD'] as TabType[]).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)} 
                  className={`flex-1 py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                    activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab === 'SINGLE' ? 'Simples' : tab === 'TRANSFER' ? 'Transferência' : 'Rendimento'}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'SINGLE' && !transaction && (
            <div className="space-y-3">
              <div className="relative group">
                <input 
                  value={magicText} 
                  onChange={e => setMagicText(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleMagicParse())} 
                  placeholder="✨ Descreva (ex: Almoço 45,90 no Itaú)" 
                  className="w-full bg-indigo-50/50 rounded-2xl py-4 pl-5 pr-20 text-sm font-bold border-2 border-transparent focus:border-indigo-200 focus:bg-white outline-none transition-all" 
                />
                <button 
                  onClick={handleMagicParse} 
                  disabled={isMagicLoading || !magicText} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200"
                >
                  {isMagicLoading ? '...' : 'OK'}
                </button>
              </div>
              
              <div className="relative">
                <input type="file" accept=".pdf,image/*" onChange={handleReceiptUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isScanning} />
                <div className="flex items-center justify-center gap-3 py-4 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl text-emerald-600 font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>{isScanning ? 'Processando Comprovante...' : 'Escaneie um Comprovante'}</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 pb-4">
            {activeTab === 'SINGLE' ? (
              <div className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                    <input 
                      required 
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                      className={`w-full bg-gray-50 border-2 rounded-2xl p-4 text-sm font-bold outline-none transition-all ${
                        highlightedFields.includes('description') ? 'border-indigo-400 ring-4 ring-indigo-50 bg-white' : 'border-transparent focus:border-black'
                      }`} 
                      placeholder="O que você comprou/recebeu?" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 relative">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor</label>
                      <input 
                        required 
                        type="number" 
                        step="0.01" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        className={`w-full bg-gray-50 border-2 rounded-2xl p-4 text-sm font-black outline-none transition-all ${
                          highlightedFields.includes('amount') ? 'border-indigo-400 ring-4 ring-indigo-50 bg-white' : 'border-transparent focus:border-black'
                        }`} 
                        placeholder="R$ 0,00" 
                      />
                      {amount && (
                        <span className="absolute right-4 bottom-4 text-[10px] font-black text-gray-300 pointer-events-none">
                          {formatCurrency(amount)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Data e Hora</label>
                      <input 
                        required 
                        type="datetime-local" 
                        step="1"
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        className={`w-full bg-gray-50 border-2 rounded-2xl p-4 text-sm font-bold outline-none transition-all ${
                          highlightedFields.includes('date') ? 'border-indigo-400 ring-4 ring-indigo-50 bg-white' : 'border-transparent focus:border-black'
                        }`} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                      <select 
                        required 
                        value={categoryId} 
                        onChange={e => setCategoryId(e.target.value)} 
                        className={`w-full bg-gray-50 border-2 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none ${
                          highlightedFields.includes('categoryId') ? 'border-indigo-400 ring-4 ring-indigo-50 bg-white' : 'border-transparent focus:border-black'
                        }`}
                      >
                        <option value="">Selecione...</option>
                        {categories.filter(c => c.type === type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Conta</label>
                      <select 
                        required 
                        value={accountId} 
                        onChange={e => setAccountId(e.target.value)} 
                        className={`w-full bg-gray-50 border-2 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none ${
                          highlightedFields.includes('accountId') ? 'border-indigo-400 ring-4 ring-indigo-50 bg-white' : 'border-transparent focus:border-black'
                        }`}
                      >
                        <option value="">Selecione...</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {/* Details Toggle Header */}
                  <div className="pt-4 border-t border-gray-100">
                    <button 
                      type="button" 
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                    >
                      <span>{showAdvanced ? 'Esconder Detalhes' : 'Detalhes Avançados'}</span>
                      <svg className={`w-3 h-3 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    
                    {showAdvanced && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          <input value={payer} onChange={e => setPayer(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-3 text-xs font-bold outline-none transition-all" placeholder="Pagador" />
                          <input value={payee} onChange={e => setPayee(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-3 text-xs font-bold outline-none transition-all" placeholder="Recebedor" />
                        </div>
                        <input value={bankRefId} onChange={e => setBankRefId(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-3 mt-4 text-xs font-bold outline-none transition-all" placeholder="ID da Transação (Opcional)" />
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ) : activeTab === 'TRANSFER' ? (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-2xl p-5 flex items-center gap-4 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">Transfira saldo entre suas contas sem afetar suas receitas ou despesas.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Origem</label>
                      <select required value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none">
                        <option value="">Selecione...</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                      </select>
                    </div>
                    <div className="hidden sm:flex h-12 items-center text-gray-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Destino</label>
                      <select required value={toAccountId} onChange={e => setToAccountId(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none">
                        <option value="">Selecione...</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor</label>
                      <input required type="number" step="0.01" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-black outline-none transition-all" placeholder="R$ 0,00" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Data e Hora</label>
                      <input required type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-emerald-50 rounded-2xl p-5 flex items-center gap-4 text-emerald-700">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">Registre lucros, dividendos ou a valorização automática de suas contas.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Conta / Cofrinho</label>
                    <select required value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none">
                      <option value="">Selecione...</option>
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor do Rendimento</label>
                      <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-black outline-none transition-all" placeholder="R$ 0,00" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Data e Hora</label>
                      <input required type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Observação (Opcional)</label>
                    <input value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-bold outline-none transition-all" placeholder="Ex: Rendimento CDI Mensal" />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-col gap-3">
              <button 
                type="submit"
                disabled={isLoading || isScanning} 
                className="w-full py-5 bg-black text-white rounded-[1.5rem] text-sm font-black transition-all hover:bg-gray-800 disabled:opacity-50 active:scale-95 shadow-xl shadow-black/10 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    <span>Confirmar Lançamento</span>
                  </>
                )}
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
        </div>
      </div>
    </div>
  );
}