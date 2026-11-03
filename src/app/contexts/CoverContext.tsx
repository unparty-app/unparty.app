"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface CoverData {
  coverId: string;
  color?: string;
  name?: string;
}

type CoverContextType = {
  coverData: CoverData | null;
  setCoverData: (data: CoverData) => void;
  clearCoverData: () => void;
};

const CoverContext = createContext<CoverContextType | undefined>(undefined);

export function CoverProvider({ children }: { children: React.ReactNode }) {
  const [coverData, setCoverDataState] = useState<CoverData | null>(null);
  
  const setCoverData = useCallback((data: CoverData) => {
    setCoverDataState(data);
  }, []);

  const clearCoverData = useCallback(() => {
    setCoverDataState(null);
  }, []);

  const value = {
    coverData,
    setCoverData,
    clearCoverData,
  };

  return (
    <CoverContext.Provider value={value}>
      {children}
    </CoverContext.Provider>
  );
}

export function useCover() {
  const context = useContext(CoverContext);
  if (context === undefined) {
    throw new Error('useCover must be used within a CoverProvider');
  }
  return context;
}