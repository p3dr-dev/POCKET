'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetch('/api/user').then(res => res.json()).then(setUser).catch(() => {});
  }, []);

  const handleExportBackup = async () => {
    // ... existing handleExportBackup ...
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ATENÇÃO: Isso substituirá TODOS os dados atuais pelos dados do backup. Esta ação não pode ser desfeita. Continuar?')) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading('Restaurando ecossistema...');
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);

          const res = await fetch('/api/user/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          const result = await res.json();

          if (res.ok) {
            toast.success('Ecossistema restaurado!', { id: toastId });
            setTimeout(() => window.location.reload(), 1500);
          } else {
            throw new Error(result.error);
          }
        } catch (err: any) {
          toast.error('Erro ao processar arquivo: ' + err.message, { id: toastId });
        }
      };
      reader.readAsText(file);
    } catch {
      toast.error('Erro na leitura do arquivo', { id: toastId });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] font-sans selection:bg-black selection:text-white overflow-hidden text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="flex-none bg-[#F8FAFC]/80 backdrop-blur-md px-4 md:px-8 py-4 flex justify-between items-center border-b border-gray-100/50 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 lg:hidden active:scale-95 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight">Configurações</h1>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Perfil */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100/50">
              <h2 className="text-lg font-black mb-6">Perfil do Usuário</h2>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-black flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-black/20">
                  {user?.name?.slice(0, 2).toUpperCase() || 'P'}
                </div>
                <div>
                  <h3 className="text-xl font-black">{user?.name || 'Pedro Simões'}</h3>
                  <p className="text-gray-400 font-bold text-sm">Plano {user?.level || 'Premium'}</p>
                </div>
              </div>
            </section>

            {/* Dados e Segurança */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100/50">
              <h2 className="text-lg font-black mb-6">Dados e Segurança</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                  <div>
                    <h4 className="font-black text-sm text-gray-900">Exportar Backup Completo</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Baixe todos os seus dados em formato JSON</p>
                  </div>
                  <button 
                    onClick={handleExportBackup}
                    disabled={isExporting}
                    className="bg-black text-white px-6 py-2.5 rounded-xl font-black text-[10px] hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isExporting ? 'Processando...' : 'Exportar JSON'}
                  </button>
                </div>

                <div className={`flex items-center justify-between p-4 bg-gray-50 rounded-2xl border transition-all ${isImporting ? 'border-indigo-200 bg-indigo-50/30' : 'border-dashed border-gray-200'}`}>
                  <div>
                    <h4 className={`font-black text-sm ${isImporting ? 'text-indigo-600' : 'text-gray-900'}`}>Restaurar Dados</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Suba seu arquivo de backup para restaurar a conta</p>
                  </div>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportBackup} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      disabled={isImporting}
                    />
                    <button 
                      className={`bg-white text-black border border-gray-100 px-6 py-2.5 rounded-xl font-black text-[10px] shadow-sm transition-all active:scale-95 ${isImporting ? 'opacity-50' : 'hover:bg-gray-50'}`}
                    >
                      {isImporting ? 'Importando...' : 'Importar JSON'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Sobre */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100/50">
              <h2 className="text-lg font-black mb-6">Sobre o Pocket</h2>
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                  O Pocket é um ecossistema financeiro premium focado em privacidade e soberania de dados. 
                  Todo o processamento de inteligência artificial ocorre localmente, garantindo que suas 
                  informações financeiras nunca saiam do seu controle.
                </p>
                <div className="pt-4 flex items-center gap-4">
                  <span className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-full text-gray-400 uppercase tracking-widest">v1.0.0 Prod</span>
                  <span className="text-[10px] font-black bg-emerald-100 px-3 py-1 rounded-full text-emerald-600 uppercase tracking-widest">Sistema Ativo</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
