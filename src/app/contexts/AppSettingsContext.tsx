"use client";

import React, { createContext, useContext } from 'react';

type AppSettingsContextType = {
  keywordHighlightingEnabled: boolean;
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// Seeded once from a server-side read in layout.tsx (not fetched client-side)
// so every page - not just the ones a client component happens to mount on -
// reflects the admin's current setting from first paint, with no flash.
export function AppSettingsProvider({
  keywordHighlightingEnabled,
  children,
}: {
  keywordHighlightingEnabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <AppSettingsContext.Provider value={{ keywordHighlightingEnabled }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}
