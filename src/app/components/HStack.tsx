
interface HStackProps {
  children: React.ReactNode;
  alignment?: "start" | "center" | "end" | "stretch"; // Similar to SwiftUI's alignment parameter
  spacing?: number; // Space between items in pixels
  height?: string; // Optional height of the stack
  padding?: string | number; // Optional padding
  className?: string; // Additional custom classes
  style?: React.CSSProperties; // Additional inline styles
}

/**
 * HStack - A React component that mimics SwiftUI's HStack behavior
 * 
 * @param alignment - Vertical alignment of children (start/center/end/stretch)
 * @param spacing - Space between children in pixels (defaults to 0)
 * @param height - Optional height of the stack
 * @param padding - Optional padding (can be string like "1rem" or number in pixels)
 * @param className - Additional CSS classes
 * @param style - Additional inline styles
 */
const HStack: React.FC<HStackProps> = ({
  children,
  alignment = "center",
  spacing = 0,
  height,
  padding,
  className = "",
  style = {},
}) => {
  // Map SwiftUI-like alignments to Flexbox alignments
  const alignmentMap = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch"
  };

  // Convert padding to CSS if needed
  const paddingStyle = padding !== undefined ? {
    padding: typeof padding === "number" ? `${padding}px` : padding
  } : {};

  // Combine styles
  const combinedStyle = {
    ...style,
    ...paddingStyle,
    height: height,
    gap: `${spacing}px`,
  };

  return (
    <div 
      className={`flex flex-row ${alignmentMap[alignment]} ${className}`}
      style={combinedStyle}
    >
      {children}
    </div>
  );
};

export default HStack;