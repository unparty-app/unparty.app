'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';
import mermaid from 'mermaid';

interface DiagramModalProps {
  fileName: string;
  title: string;
  content: string;
  isOpen: boolean;
  onClose: () => void;
}

const DiagramModal: React.FC<DiagramModalProps> = ({ fileName, title, content, isOpen, onClose }) => {
  const { colorValue } = useTheme();
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // Detect dark mode from CSS variables
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkDarkMode = () => {
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
        // If background is dark (hex values starting with 0-7), it's dark mode
        setIsDarkMode(bgColor.startsWith('#0') || bgColor.startsWith('#1') || bgColor.startsWith('#2'));
      };
      checkDarkMode();
      // Re-check when theme changes
      const observer = new MutationObserver(checkDarkMode);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
      return () => observer.disconnect();
    }
  }, []);

  // Initialize and render mermaid diagram
  useEffect(() => {
    if (!isOpen || !content || !diagramRef.current) return;

    const renderDiagram = async () => {
      try {
        // Initialize mermaid with theme
        mermaid.initialize({ 
          startOnLoad: false, 
          theme: isDarkMode ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'monospace'
        });

        // Clear previous diagram
        if (diagramRef.current) {
          diagramRef.current.innerHTML = '';
        }

        // Generate unique ID for this diagram
        const id = `mermaid-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, content);
        
        if (diagramRef.current) {
          diagramRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Error rendering mermaid diagram:', error);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = `
            <div class="p-4 text-center" style="color: var(--text-muted)">
              <p class="font-google-sans-code">Error rendering diagram</p>
              <pre class="mt-2 text-xs text-left overflow-auto">${content}</pre>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [isOpen, content, fileName, isDarkMode]);

  // ESC key & body scroll management
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 backdrop-blur-sm" 
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div 
        className="animate-in fade-in slide-in-from-top-4 vh-card-elevated my-8 w-full max-w-6xl rounded-xl border duration-200"
        style={{ 
          borderColor: `${colorValue}40`,
          backgroundColor: 'var(--background)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b p-6"
             style={{ borderColor: `${colorValue}30` }}>
          <div>
            <h2 className="font-google-sans-code text-lg font-bold" style={{ color: colorValue }}>
              {title}
            </h2>
            <p className="mt-1 font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
              {fileName}
            </p>
          </div>
          <button
            onClick={onClose}
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
            aria-label="Close diagram"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="max-h-[80vh] overflow-y-auto p-8">
          <div 
            ref={diagramRef} 
            className="flex items-center justify-center font-google-sans-code"
            style={{ minHeight: '200px' }}
          />
        </div>
      </div>
      
      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
        aria-label="Close diagram modal"
      />
    </div>,
    document.body
  );
};

export default DiagramModal;
