# BuildStatus Component

A comprehensive, interactive build status dashboard for The UNPARTY App that displays all routes with filtering, searching, and detailed statistics.

## Features

### 🎨 Visual Design
- Consistent with app styling patterns (font-mono, rounded-xl borders, theme colors)
- Dark mode support with CSS variables
- Responsive layout for mobile and desktop
- Smooth transitions and hover effects

### 🔍 Interactive Navigation
- Filter by route type: ALL, Static, SSG, Dynamic, Lambda, ISR
- Real-time search across all route paths
- Active state indicators with theme colors
- Route count badges for each filter

### 📊 Statistics Dashboard
- Total routes counter
- Shared bundle size
- Middleware size
- Current filter count
- Color-coded route type legend

### 📋 Comprehensive Route Table
- **Clickable route names** - Navigate directly to static pages
- Smart route indicators: API badge for API routes, [] for dynamic routes
- Color-coded route type badges
- Hover states with theme colors
- External link icon on hover for navigable routes
- Empty state for no results
- Displays filtered count vs total

### ⚡ Performance
- Memoized filtering and calculations
- Client-side rendering for instant updates
- Efficient search implementation

## Usage

### Basic Implementation

```tsx
import BuildStatus from '@/app/components/BuildStatus';
import { loadBuildStatus } from '@/utils/buildStatusParser';

export default async function StatusPage() {
  const buildData = await loadBuildStatus();

  return <BuildStatus data={buildData} />;
}
```

### With Custom Styling

```tsx
<BuildStatus
  data={buildData}
  showNavigation={true}
  className="max-w-7xl mx-auto"
/>
```

### API Route Usage

```tsx
// Fetch from API route
const response = await fetch('/api/status');
const { data } = await response.json();

<BuildStatus data={data} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `BuildStatusData` | Required | Build status data containing routes and stats |
| `showNavigation` | `boolean` | `true` | Show/hide the navigation filter bar |
| `className` | `string` | `""` | Additional CSS classes for container |

## Data Structure

### BuildStatusData

```typescript
interface BuildStatusData {
  routes: RouteInfo[];
  stats: BuildStats;
  timestamp: string;
}
```

### RouteInfo

```typescript
interface RouteInfo {
  route: string;          // e.g., "/about"
  type: RouteType;        // "Static" | "SSG" | "Dynamic" | "Lambda" | "ISR"
  typeSymbol: string;     // "○" | "●" | "ƒ" | "λ" | "◐"
  size: string;           // e.g., "1.5 kB"
  firstLoadJs: string;    // e.g., "103 kB"
}
```

### BuildStats

```typescript
interface BuildStats {
  total: number;
  static: number;
  ssg: number;
  dynamic: number;
  lambda: number;
  isr: number;
  sharedSize?: string;    // e.g., "102 kB"
  middlewareSize?: string; // e.g., "34.1 kB"
}
```

## Generating Data

### Command Line

```bash
# Generate markdown and update data
./unparty-status

# Generate both markdown and JSON
./unparty-status --json

# Or via npm
npm run status
```

### Programmatically

```typescript
import { loadBuildStatus, parseBuildOutput, generateMockData } from '@/utils/buildStatusParser';

// Load from file (server-side only)
const data = await loadBuildStatus();

// Parse build output
const data = parseBuildOutput(buildOutputString);

// Generate mock data for testing
const data = generateMockData();
```

## Route Types

| Symbol | Type | Color | Description |
|--------|------|-------|-------------|
| ○ | Static | Green | Pre-rendered as static content |
| ● | SSG | Blue | Pre-rendered as static HTML (uses generateStaticParams) |
| ƒ | Dynamic | Amber | Server-rendered on demand |
| λ | Lambda | Purple | Serverless function |
| ◐ | ISR | Pink | Incremental Static Regeneration |

## Styling Patterns

### Theme Integration

The component uses the app's theme context:

```tsx
const { colorValue } = useTheme();

// Applied to active states, borders, and highlights
style={{ backgroundColor: colorValue, borderColor: colorValue }}
```

### CSS Variables

Uses app-wide CSS variables for consistency:

- `--background` - Main background color
- `--foreground` - Main text color
- `--text-muted` - Muted/secondary text
- `--background-highlight` - Hover/highlight background

### Design Patterns

Follows these app conventions:
- `font-mono` for all text
- `rounded-xl` for cards/containers
- `border border-gray-200 dark:border-gray-700` for borders
- `bg-gray-50 dark:bg-black/10` for card backgrounds
- Responsive text sizes: `text-sm`, `md:text-lg`, etc.
- Transition effects: `transition-colors duration-200`

## Example Pages

### Full Page Layout

```tsx
// src/app/status/page.tsx
import BuildStatus from '../components/BuildStatus';
import { loadBuildStatus } from '../../utils/buildStatusParser';

export default async function StatusPage() {
  const buildData = await loadBuildStatus();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 font-mono text-4xl font-bold">
          BUILD STATUS
        </h1>
        <BuildStatus data={buildData} />
      </div>
    </div>
  );
}
```

### Modal Usage

```tsx
'use client';

import { useState } from 'react';
import BuildStatus from './BuildStatus';
import type { BuildStatusData } from '@/types/BuildStatus';

export default function StatusModal({ data }: { data: BuildStatusData }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm">
      <div className="mx-4 my-8 rounded-xl border bg-white dark:bg-black">
        <BuildStatus data={data} />
        <button onClick={() => setIsOpen(false)}>Close</button>
      </div>
    </div>
  );
}
```

### Embedded Widget

```tsx
<div className="rounded-xl border p-6">
  <h3 className="mb-4 font-mono text-lg font-bold">
    Recent Build
  </h3>
  <BuildStatus
    data={buildData}
    showNavigation={false}
    className="max-h-96 overflow-y-auto"
  />
</div>
```

## API Routes

### GET /api/status

Returns current build status data:

```typescript
// Response format
{
  success: true,
  data: BuildStatusData,
  message?: string  // Optional, e.g., "Using mock data"
}
```

### Error Handling

```typescript
try {
  const response = await fetch('/api/status');
  const { success, data, error } = await response.json();

  if (!success) {
    console.error('Failed to load status:', error);
    // data will contain mock data as fallback
  }
} catch (err) {
  console.error('Request failed:', err);
}
```

## Utilities

### buildStatusParser.ts

| Function | Purpose | Environment |
|----------|---------|-------------|
| `parseBuildOutput(output)` | Parse Next.js build stdout | Any |
| `parseStatusMarkdown(md)` | Parse unparty-status.md | Any |
| `loadBuildStatus()` | Load from file | Server-side only |
| `generateMockData()` | Create sample data | Any |

## Testing

### Mock Data

```typescript
import { generateMockData } from '@/utils/buildStatusParser';

const mockData = generateMockData();
// Returns sample BuildStatusData with 4 routes
```

### Component Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import BuildStatus from './BuildStatus';
import { generateMockData } from '@/utils/buildStatusParser';

test('filters routes by type', () => {
  const data = generateMockData();
  render(<BuildStatus data={data} />);

  const staticButton = screen.getByText(/STATIC/i);
  fireEvent.click(staticButton);

  // Assert filtered results
});
```

## Related Files

- **Component:** `src/app/components/BuildStatus.tsx`
- **Types:** `src/types/BuildStatus.ts`
- **Parser:** `src/utils/buildStatusParser.ts`
- **Page:** `src/app/status/page.tsx`
- **API:** `src/app/api/status/route.ts`
- **Generator:** `scripts/unparty-status.js`

## Future Enhancements

Potential additions:
- [ ] Export filtered results to CSV
- [ ] Historical comparison view
- [ ] Bundle size trend charts
- [ ] Performance score integration
- [ ] Route performance metrics
- [ ] Lighthouse scores per route
- [ ] Deploy preview comparisons

---

**Generated for The UNPARTY App**
Part of the UNPARTY build tooling system
