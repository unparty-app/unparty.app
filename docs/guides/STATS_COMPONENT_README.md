# Stats Component Documentation

## Overview
The `Stats.tsx` component is a dynamic and visual indicator for displaying the status of theunpartyapp community statistics. It provides a clean, theme-aware display of waitlist count and beta timeline information.

## Features
- **Dynamic Content**: Customizable waitlist count and beta date
- **Theme Integration**: Uses the app's theme system for dynamic coloring
- **Dark Mode Support**: Automatic light/dark mode styling
- **Responsive Design**: Clean grid layout that works on all screen sizes
- **TypeScript Support**: Full type safety with prop interfaces

## Props
```typescript
interface StatsProps {
  waitlistCount?: number;  // Default: 150
  betaDate?: string;       // Default: "Q1 2025"  
  className?: string;      // Additional CSS classes
}
```

## Usage Examples

### Basic Usage
```tsx
import Stats from '../components/Stats';

// Use default values
<Stats />
```

### Custom Values
```tsx
// Custom waitlist count and beta date
<Stats waitlistCount={275} betaDate="Q2 2025" />

// With additional styling
<Stats 
  waitlistCount={500} 
  betaDate="2025" 
  className="shadow-lg" 
/>
```

## Design System
The component follows the app's design patterns:
- Uses `font-mono` for consistent typography
- Integrates with the theme system via `useTheme()` hook
- Applies dynamic coloring based on selected theme color
- Supports dark mode with appropriate contrast ratios

## Component Structure
```tsx
<div className="rounded-xl border bg-gray-50 p-6 dark:bg-black/10">
  <h3 className="font-mono text-sm font-bold">COMMUNITY</h3>
  <div className="grid grid-cols-2 gap-4">
    <div className="text-center">
      <div style={{color: colorValue}}>{waitlistCount}+</div>
      <div className="text-xs">WAITLIST</div>
    </div>
    <div className="text-center">
      <div style={{color: colorValue}}>{betaDate}</div>
      <div className="text-xs">BETA</div>
    </div>
  </div>
</div>
```

## Implementation Notes
- Built with Next.js 15.3.1 and React 18
- Requires the app's ThemeContext for color values
- Fully accessible with semantic HTML structure
- No external dependencies beyond the existing theme system

## Integration
The component is ready to be used anywhere in the app where community status needs to be displayed. It automatically adapts to the current theme and provides a consistent visual experience across different contexts.