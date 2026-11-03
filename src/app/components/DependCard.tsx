'use client';
import { useTheme } from '../contexts/ThemeContext';
import type { PayFrequency } from '@/utils/dependCosts';

interface DependItem {
  id: string;
  name: string;
  cost: number;
  payFrequency: PayFrequency;
  stepTitle?: string;
  required?: boolean;
}

interface DependCardScrollProps {
  title?: string;
  items?: DependItem[];
  /** When set, cards become clickable toggles (a stack builder) instead of a static display. */
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
}

const DependCardScroll: React.FC<DependCardScrollProps> = ({ title, items = [], selectable = false, selectedIds, onToggle }) => {
  const { colorValue } = useTheme();

  if (items.length === 0) return null;

  return (
    <div className="w-full my-8 overflow-hidden">
      {title && (
        <p className="font-vt323 text-xl uppercase tracking-widest px-4 mb-4" style={{ color: colorValue }}>
          {title}
        </p>
      )}
      <div className="flex gap-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
        {items.map((item) => {
          const selected = selectedIds?.has(item.id) ?? false;
          const isToggle = selectable && onToggle;

          const card = (
            <div
              className="w-[280px] flex-shrink-0 snap-start flex flex-col gap-3 rounded-lg p-4 border transition-all"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: isToggle && selected ? colorValue : `${colorValue}40`,
                borderWidth: isToggle && selected ? '2px' : '1px',
                opacity: isToggle && !selected ? 0.55 : 1,
              }}
            >
              {/* Label */}
              <div className="flex items-start justify-between gap-2">
                <p
                  className="font-vt323 text-base uppercase tracking-wide leading-tight"
                  style={{ color: colorValue }}
                >
                  {item.name}
                </p>
                {isToggle && (
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-vt323 text-xs"
                    style={{
                      borderColor: colorValue,
                      backgroundColor: selected ? colorValue : 'transparent',
                      color: selected ? 'var(--background)' : colorValue,
                    }}
                  >
                    {selected ? '✓' : '+'}
                  </span>
                )}
              </div>

              {/* Cost with accent bar */}
              <div className="relative flex-1 pl-4">
                <div
                  className="absolute inset-y-0 left-0 w-0.5 rounded-full"
                  style={{ backgroundColor: colorValue }}
                />
                <p
                  className="font-google-sans-code uppercase text-sm leading-relaxed"
                  style={{ color: 'var(--foreground)' }}
                >
                  ${item.cost.toLocaleString()} / {item.payFrequency}
                </p>
              </div>

              {/* The SETUP. step that adds it */}
              {item.stepTitle && (
                <p className="font-google-sans-code text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {item.required ? 'step' : 'optional step'} · {item.stepTitle}
                </p>
              )}
            </div>
          );

          return isToggle ? (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              aria-pressed={selected}
              className="text-left"
            >
              {card}
            </button>
          ) : (
            <div key={item.id}>{card}</div>
          );
        })}
      </div>
    </div>
  );
};

export default DependCardScroll;
