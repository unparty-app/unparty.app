'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Lets the /watch lightbox (rendered in the root @modal slot, see #956) tell
// every ambient CoverVideo loop on the page underneath it to pause for as
// long as it's open — otherwise a muted background loop keeps playing behind
// the modal's own unmuted video. Same publish-upward pattern as CoverContext.

type WatchModalContextType = {
  isWatchModalOpen: boolean;
  setWatchModalOpen: (open: boolean) => void;
};

const WatchModalContext = createContext<WatchModalContextType | undefined>(undefined);

export function WatchModalProvider({ children }: { children: React.ReactNode }) {
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);

  const setWatchModalOpen = useCallback((open: boolean) => {
    setIsWatchModalOpen(open);
  }, []);

  return (
    <WatchModalContext.Provider value={{ isWatchModalOpen, setWatchModalOpen }}>
      {children}
    </WatchModalContext.Provider>
  );
}

export function useWatchModal() {
  const context = useContext(WatchModalContext);
  if (context === undefined) {
    throw new Error('useWatchModal must be used within a WatchModalProvider');
  }
  return context;
}
