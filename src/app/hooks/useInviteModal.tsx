"use client";

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Invite from '../components/Invite';

export const useInviteModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const InviteModal = isOpen ? createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'var(--background)' }}>
      <div className="animate-in fade-in slide-in-from-bottom-4 vh-card-elevated w-full max-w-sm rounded-xl border p-6 duration-200 sm:max-w-md sm:p-8 lg:max-w-lg lg:p-10">
        <div className="mb-6 flex items-center justify-between">
          
          <button
            onClick={closeModal}
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
            style={{ 
              color: 'var(--text-muted)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--background-highlight)';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            aria-label="Close invite modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <Invite />
      </div>
      
      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={closeModal}
        aria-label="Close invite modal"
      />
    </div>,
    document.body
  ) : null;

  return {
    isOpen,
    openModal,
    closeModal,
    InviteModal
  };
};