'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useFetch } from '@/hooks/useFetch';
import IconButton from './IconButton';

interface SVGColorProps {
  currentFileName: string | null;
  onColorChange: (hex: string) => void;
}

const SVGColor: React.FC<SVGColorProps> = ({ onColorChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Load the palette on first open, then keep it for later opens
  const [paletteRequested, setPaletteRequested] = useState(false);
  const { data, loading } = useFetch<{ sections?: Record<string, { name: string; hex: string }[]> }>(
    paletteRequested ? '/api/brand-colors' : null
  );
  const palette = Object.values(data?.sections ?? {}).flat();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      <IconButton
        icon="swatch.svg"
        onClick={() => {
          setIsOpen(!isOpen);
          setPaletteRequested(true);
        }}
        label="Color SVG"
        className="hover:bg-gray-100"
      />

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-100 bg-white p-4 shadow-xl">
          <div className="mb-3 font-google-sans-code text-xs uppercase tracking-widest text-gray-400">
            theunpartybrand
          </div>

          {loading ? (
            <div className="py-4 text-center font-google-sans-code text-xs text-gray-400">
              loading palette...
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              <div className="flex flex-wrap gap-2">
                {palette.map(({ name, hex }) => (
                  <button
                    key={hex}
                    onClick={() => { onColorChange(hex); setIsOpen(false); }}
                    className="size-10 rounded-full border border-gray-200 shadow-sm transition-all hover:scale-110 hover:shadow-md"
                    style={{ backgroundColor: hex }}
                    title={`${name}\n${hex}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SVGColor;
