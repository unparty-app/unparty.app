
interface VStackProps {
  children: React.ReactNode;
  alignment?: "start" | "center" | "end" | "stretch"; // Similar to SwiftUI's alignment parameter
  spacing?: number; // Space between items in pixels
  width?: string; // Optional width of the stack
  padding?: string | number; // Optional padding
  className?: string; // Additional custom classes
  style?: React.CSSProperties; // Additional inline styles
}

/**
 * VStack - A React component that mimics SwiftUI's VStack behavior
 * 
 * @param alignment - Horizontal alignment of children (start/center/end/stretch)
 * @param spacing - Space between children in pixels (defaults to 0)
 * @param width - Optional width of the stack
 * @param padding - Optional padding (can be string like "1rem" or number in pixels)
 * @param className - Additional CSS classes
 * @param style - Additional inline styles
 */
const VStack: React.FC<VStackProps> = ({
  children,
  alignment = "stretch",
  spacing = 0,
  width,
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
    width: width,
    gap: `${spacing}px`,
  };

  return (
    <div 
      className={`flex flex-col ${alignmentMap[alignment]} ${className}`}
      style={combinedStyle}
    >
      {/* Don't automatically wrap children in flex-1 divs, as SwiftUI doesn't do this */}
      {children}
    </div>
  );
};

export default VStack;