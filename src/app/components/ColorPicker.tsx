'use client';

import { useState } from 'react';

import { Plus, Upload } from '@/app/components/icons';
import { useColorSelection } from '../contexts/ColorSelectionContext';
import { useTheme } from '../contexts/ThemeContext';
import InkPalette from './InkPalette';
import ActionPill from './build-yours/ActionPill';
import { InkUnderline } from './depend/ink';
import AddColorsModal from './AddColorsModal';
import ImportColorsCssModal from './ImportColorsCssModal';

// Compact by design: the picker itself only shows the palette in ink (InkPalette)
// plus two triggers. Everything else (hand-picking colors, importing a
// .css) lives behind the shared Modal system so this stays small enough to
// embed inline in an article, not just on the /color page. It reads on the
// page, from the left: a heading with the ink underline, the palette, the
// site's action pills, and the count in its small uppercase (#676).
const ColorPicker = ({ headingLevel: Heading = 'h2' }: { headingLevel?: 'h1' | 'h2' }) => {
  const { colorValue } = useTheme();
  const { selectedColors, setSelectedColors, brand, setBrand } = useColorSelection();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const removeColor = (index: number) => {
    const currentColors = selectedColors.length === 5 ? selectedColors : new Array(5).fill('');
    const newColors = [...currentColors];
    newColors[index] = '';
    setSelectedColors(newColors);
  };

  const resetColors = () => {
    setSelectedColors(new Array(5).fill(''));
    setBrand({});
  };

  // Ensure we always have 5 slots for display
  const displayColors = selectedColors.length === 5 ? selectedColors : new Array(5).fill('');
  const filledCount = displayColors.filter(Boolean).length;

  return (
    <div className="w-full max-w-xl text-left">
      <Heading className="font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]">your colors.</Heading>
      <InkUnderline color={colorValue} className="mt-1 h-2 w-28" />

      {/* The palette as five pen lines, one per role; tap a line to clear it */}
      <div className="mt-5">
        <InkPalette colors={displayColors} onRemove={removeColor} brand={brand} />
      </div>

      {/* The two ways to fill it, as the site's action pills */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <ActionPill verb="add colors" icon={Plus} color={colorValue} label="Add colors to your palette" onClick={() => setIsAddOpen(true)} />
        <ActionPill verb="import .css" icon={Upload} color={colorValue} label="Import a palette from a .css file" onClick={() => setIsImportOpen(true)} variant="line" />
      </div>

      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]" aria-live="polite">
        <span>{filledCount < 5 ? `${5 - filledCount} of 5 left to pick` : 'all five picked. tap a line to clear it'}</span>
        {filledCount > 0 && (
          <button type="button" onClick={resetColors} className="uppercase transition-colors hover:text-[var(--foreground)]">
            start over
          </button>
        )}
      </p>

      <AddColorsModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onImportClick={() => {
          setIsAddOpen(false);
          setIsImportOpen(true);
        }}
      />
      <ImportColorsCssModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onApply={(colors, importedBrand) => {
          setSelectedColors(colors);
          setBrand(importedBrand);
        }}
      />
    </div>
  );
};

export default ColorPicker;
