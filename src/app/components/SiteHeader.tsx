'use client';
import { useTheme } from '../contexts/ThemeContext';

interface SiteHeaderProps {
  title: string;
  subtitle: string;
  description?: string;
  color?: string;
}

const PatternBackground = () => {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-5">
      <svg
        className="size-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="dots"
            x="0"
            y="0"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="15" cy="15" r="7.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>
  );
};

const SiteHeader: React.FC<SiteHeaderProps> = ({
  title,
  subtitle,
  description,
  color
}) => {
  const { colorValue } = useTheme();
  const themeColor = color || colorValue;

  return (
    <div className="relative w-full">
      <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all hover:bg-gray-100 dark:border-gray-700 dark:bg-black/10 dark:hover:bg-black/20">
        {/* Background Pattern for visual texture */}
        <div className="pointer-events-none absolute inset-0 opacity-5" style={{ color: themeColor }}>
          <PatternBackground />
        </div>
        
        {/* Icon/Accent with pattern background */}
        <div className="relative mb-4 flex items-center gap-3">
          <div 
            className="relative flex size-10 items-center justify-center overflow-hidden rounded-lg border"
            style={{ 
              backgroundColor: `${themeColor}15`,
              borderColor: `${themeColor}30`
            }}
          >
            {/* Pattern in icon */}
            <div className="absolute inset-0 opacity-20" style={{ color: themeColor }}>
              <PatternBackground />
            </div>
            <div 
              className="relative z-10 size-3 rounded-full"
              style={{ backgroundColor: themeColor }}
            />
          </div>
        </div>

        {/* Title and Subtitle on separate lines */}
        <div className="relative mb-4 space-y-2">
          <h3 
            className="font-google-sans-code text-lg font-bold leading-tight"
            style={{ color: themeColor }}
          >
            {title}
          </h3>
          <h4 className="font-google-sans-code text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">
            {subtitle}
          </h4>
        </div>

        {/* Description */}
        {description && (
          <p className="relative font-google-sans-code leading-relaxed text-gray-600 dark:text-gray-300">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default SiteHeader;