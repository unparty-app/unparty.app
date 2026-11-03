'use client';
import React from 'react';

import { useTheme } from '../contexts/ThemeContext';

export interface StrikeProps {
  text?: string;        // For inline text (single line)
  content?: string;     // For block content (multiple lines/paragraphs)
  font?: 'vt323' | 'mono' | 'default';
  variant?: 'standard' | 'bold' | 'double' | 'animated' | 'glitch';
  color?: string;
  animate?: boolean;
  thickness?: number;
}

/**
 * Strike Component
 *
 * A flexible strikethrough component with vt323 font support and multiple visual styles.
 * Integrates with ThemeContext for color consistency.
 *
 * Supports both inline (text prop) and block-level (content prop) strikethrough.
 *
 * @example
 * ```tsx
 * // Inline usage
 * <Strike text="old way of thinking" font="vt323" variant="animated" />
 *
 * // Block usage
 * <Strike content="Multiple paragraphs\nof struck through text" font="vt323" variant="animated" />
 * ```
 */
const Strike: React.FC<StrikeProps> = ({
  text,
  content,
  font = 'vt323',
  variant = 'standard',
  color,
  animate = false,
  thickness = 2
}) => {
  const { colorValue } = useTheme();
  const [isAnimated, setIsAnimated] = React.useState(false);

  // Determine display text (text for inline, content for block)
  const displayText = text || content || '';
  const isBlock = !!content; // Block mode if content prop is used

  // Trigger animation on mount if animate is true
  React.useEffect(() => {
    if (animate || variant === 'animated') {
      const timer = setTimeout(() => setIsAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animate, variant]);

  // Determine font class
  const fontClass = font === 'vt323' 
    ? 'font-vt323' 
    : font === 'mono' 
      ? 'font-mono' 
      : '';

  // Determine color (use theme color if 'theme' or no color provided)
  const strikeColor = color === 'theme' || !color ? colorValue : color;

  // Base styles for all variants
  const baseStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    color: 'inherit',
  };

  // Variant-specific styles
  const getVariantStyles = (): React.CSSProperties => {
    const isAnimating = (animate || variant === 'animated') && !isAnimated;

    switch (variant) {
      case 'bold':
        return {
          textDecoration: 'line-through',
          textDecorationColor: strikeColor,
          textDecorationThickness: `${thickness * 2}px`,
        };

      case 'double':
        return {
          textDecoration: 'line-through',
          textDecorationColor: strikeColor,
          textDecorationStyle: 'double',
          textDecorationThickness: `${thickness}px`,
        };

      case 'animated':
        return {
          textDecoration: 'line-through',
          textDecorationColor: strikeColor,
          textDecorationThickness: `${thickness}px`,
          clipPath: isAnimating ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)',
          transition: isAnimating ? 'clip-path 0.8s ease-out' : 'none',
        };

      case 'glitch':
        return {
          textDecoration: 'line-through',
          textDecorationColor: strikeColor,
          textDecorationThickness: `${thickness}px`,
        };

      case 'standard':
      default:
        return {
          textDecoration: 'line-through',
          textDecorationColor: strikeColor,
          textDecorationThickness: `${thickness}px`,
        };
    }
  };

  // Glitch animation keyframes (inline for simplicity)
  const glitchStyles = variant === 'glitch' ? (
    <style jsx>{`
      @keyframes glitch-strike {
        0% {
          text-decoration-color: ${strikeColor};
        }
        20% {
          text-decoration-color: transparent;
        }
        21% {
          text-decoration-color: ${strikeColor};
        }
        100% {
          text-decoration-color: ${strikeColor};
        }
      }
      .glitch-strike {
        animation: glitch-strike 3s infinite;
      }
    `}</style>
  ) : null;

  const combinedStyles = {
    ...baseStyles,
    ...getVariantStyles(),
  };

  const glitchClass = variant === 'glitch' ? 'glitch-strike' : '';

  // Use div for block content, span for inline text
  const Component = isBlock ? 'div' : 'span';
  const displayClass = isBlock
    ? `${fontClass} ${glitchClass} block whitespace-pre-wrap transition-opacity duration-200`
    : `${fontClass} ${glitchClass} inline-block transition-opacity duration-200`;

  return (
    <>
      {glitchStyles}
      <Component
        className={displayClass}
        style={combinedStyles}
      >
        {displayText}
      </Component>
    </>
  );
};

export default Strike;
