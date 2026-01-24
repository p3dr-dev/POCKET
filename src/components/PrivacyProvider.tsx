'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PrivacyContextType {
  isBlur: boolean;
  toggleBlur: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isBlur, setIsBlur] = useState(false);

  useEffect(() => {
    // Carregar preferência do localStorage
    const stored = localStorage.getItem('pocket_privacy_blur');
    if (stored) {
      setIsBlur(stored === 'true');
    }
  }, []);

  const toggleBlur = () => {
    const newState = !isBlur;
    setIsBlur(newState);
    localStorage.setItem('pocket_privacy_blur', String(newState));
  };

  return (
    <PrivacyContext.Provider value={{ isBlur, toggleBlur }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
