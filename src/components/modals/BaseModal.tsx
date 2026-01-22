'use client';

import { useEffect, ReactNode } from 'react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerAction?: ReactNode;
  maxWidth?: string; // e.g., 'max-w-lg', 'max-w-2xl'
}

export default function BaseModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  headerAction,
  maxWidth = 'max-w-md'
}: BaseModalProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className={`relative bg-white w-full ${maxWidth} max-h-[95dvh] md:max-h-[90vh] overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-2xl transform animate-in zoom-in-95 duration-300 flex flex-col`}>
        
        {/* Header */}
        <div className="flex-none p-6 md:p-8 pb-4 flex justify-between items-center border-b border-gray-50 bg-white z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            <button 
              onClick={onClose} 
              className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors active:scale-90"
              aria-label="Fechar modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
