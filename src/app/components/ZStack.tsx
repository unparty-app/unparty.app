import React from 'react';

interface ZStackProps {
  children: React.ReactNode;
  alignment?: "center" | "start" | "end" | "stretch"; // Similar to SwiftUI's alignment parameter
  width?: string; // Optional width of the stack
  height?: string; // Optional height of the stack
  padding?: string | number; // Optional padding
  className?: string; // Additional custom classes
  style?: React.CSSProperties; // Additional inline styles
}

/**
 * ZStack - A React component that mimics SwiftUI's ZStack behavior
 * Overlays elements on top of each other in the z-axis
 * 
 * @param alignment - Alignment of children (center/start/end/stretch)
 * @param width - Optional width of the stack
 * @param height - Optional height of the stack
 * @param padding - Optional padding (can be string like "1rem" or number in pixels)
 * @param className - Additional CSS classes
 * @param style - Additional inline styles
 */
const ZStack: React.FC<ZStackProps> = ({
  children,
  alignment = "center",
  width,
  height,
  padding,
  className = "",
  style = {},
}) => {
  // Map SwiftUI-like alignments to Tailwind positioning
  const getAlignmentClasses = () => {
    switch (alignment) {
      case "start":
        return "items-start justify-start";
      case "end":
        return "items-end justify-end";
      case "stretch":
        return "items-stretch justify-center";
      case "center":
      default:
        return "items-center justify-center";
    }
  };

  // Convert padding to CSS if needed
  const paddingStyle = padding !== undefined ? {
    padding: typeof padding === "number" ? `${padding}px` : padding
  } : {};

  // Combine styles
  const combinedStyle = {
    ...style,
    ...paddingStyle,
    width: width,
    height: height,
  };

  return (
    <div 
      className={`relative ${getAlignmentClasses()} ${className}`}
      style={combinedStyle}
    >
      {React.Children.map(children, (child, index) => (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: index }}>
          {child}
        </div>
      ))}
    </div>
  );
};

export default ZStack;