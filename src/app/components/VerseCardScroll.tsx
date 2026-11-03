'use client';
import { useTheme } from '../contexts/ThemeContext';

interface VerseCard {
  label: string;
  verse: string;
  attribution: string;
}

interface VerseCardScrollProps {
  title?: string;
  cards?: VerseCard[];
}

const VerseCardScroll: React.FC<VerseCardScrollProps> = ({ title, cards = [] }) => {
  const { colorValue } = useTheme();

  if (cards.length === 0) return null;

  return (
    <div className="w-full my-8 overflow-hidden">
      {title && (
        <p className="font-vt323 text-xl uppercase tracking-widest px-4 mb-4" style={{ color: colorValue }}>
          {title}
        </p>
      )}
      <div className="flex gap-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="w-[280px] flex-shrink-0 snap-start flex flex-col gap-3 rounded-lg p-4 border border-gray-200/20 dark:border-gray-700/20"
            style={{ backgroundColor: 'var(--background)' }}
          >
            {/* Label */}
            <p
              className="font-vt323 text-base uppercase tracking-wide leading-tight"
              style={{ color: colorValue }}
            >
              {String(idx + 1)}. {card.label}
            </p>

            {/* Verse with accent bar */}
            <div className="relative flex-1 pl-4">
              <div
                className="absolute inset-y-0 left-0 w-0.5 rounded-full"
                style={{ backgroundColor: colorValue }}
              />
              <p
                className="font-google-sans-code uppercase text-sm leading-relaxed"
                style={{ color: 'var(--foreground)' }}
              >
                &ldquo;{card.verse}&rdquo;
              </p>
            </div>

            {/* Attribution */}
            <p
              className="font-vt323 text-sm tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              — {card.attribution}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerseCardScroll;
