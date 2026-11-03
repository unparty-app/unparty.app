# Component Health Analysis System

A comprehensive system for analyzing and maintaining component health in the theunpartyapp project. This system helps ensure all components align with the established UI/UX standards from `globals.css` and core layout components.

## Overview

The Component Health Analysis System provides:

- **Component Tracking**: Git history analysis (first/last commits)
- **Health Metrics**: Design system compliance, accessibility, performance, and code quality
- **Automated Reporting**: Comprehensive reports and focused component analysis
- **Actionable Insights**: Specific recommendations for improvement

## Quick Start

### 1. Generate Component Health Analysis

```bash
npm run analyze-components
```

This creates `component-health.json` with complete analysis data.

### 2. View Health Report

```bash
npm run component-health
```

Shows a comprehensive health report with recommendations.

### 3. Focus on Specific Components

```bash
npm run component-health -- --component Header Badge Banner
```

Generates detailed report for specific components.

## Component Health Metrics

### Design System Compliance (0-100%)
- **CSS Variables**: Uses design tokens from `globals.css`
- **Visual Hierarchy**: Uses `vh-*` classes for consistent depth/shadows
- **Brand Colors**: Incorporates unparty yellow (#F9C22E) and brand patterns
- **Tailwind Patterns**: Follows established CSS class conventions

### Accessibility (0-100%)
- **Semantic HTML**: Uses proper HTML5 semantic elements
- **ARIA Attributes**: Has accessibility attributes and labels
- **Focus Management**: Proper focus states and keyboard navigation
- **Alt Text**: Images have descriptive alt text

### Performance (0-100%)
- **Next.js Image**: Uses optimized Image component
- **Lazy Loading**: Implements lazy loading patterns
- **Optimized Images**: Proper image sizing and formats
- **DOM Queries**: Avoids direct DOM manipulation (uses React patterns)

### Code Quality (0-100%)
- **TypeScript**: Proper TypeScript usage and interfaces
- **Type Safety**: Components have proper type definitions
- **Modern React**: Uses hooks, functional components, modern patterns
- **Error Handling**: Includes error boundaries and try/catch blocks

### Responsive Design (0-100%)
- **Responsive Classes**: Uses Tailwind responsive prefixes (sm:, md:, lg:)
- **Mobile First**: Follows mobile-first design approach
- **Flexbox/Grid**: Uses modern layout systems
- **Breakpoints**: Supports multiple screen sizes

## Health Score Classification

- **🟢 Excellent (80-100%)**: Best practices, use as templates
- **🟡 Good (60-79%)**: Minor improvements needed
- **🟠 Fair (40-59%)**: Moderate updates required
- **🔴 Poor (20-39%)**: Significant improvements needed
- **🚨 Critical (0-19%)**: Immediate attention required

## File Structure

```
component-health.json          # Complete analysis data
scripts/
├── analyze-component-history.js   # Git history analysis
├── analyze-component-health.js    # Health metrics analysis
├── generate-component-health.js   # Main generator
└── report-component-health.js     # Report generator
```

## Usage Examples

### Basic Health Check
```bash
npm run analyze-components && npm run component-health
```

### Focus on Critical Components
```bash
npm run component-health | grep "🚨\|🔴"
```

### Check Specific Component Details
```bash
npm run component-health -- --component PageAsterisk
```

### View Components by Health Status
```bash
# View excellent components (use as templates)
cat component-health.json | jq '.health[] | select(.metrics.healthStatus == "excellent") | .component'

# View critical components (need immediate attention)
cat component-health.json | jq '.health[] | select(.metrics.healthStatus == "critical") | .component'
```

## Integration with Development Workflow

### 1. **Pre-Development**: Check existing similar components
```bash
npm run component-health -- --component Header Navigation
```

### 2. **During Development**: Follow patterns from excellent components
- Use Header.tsx as template for navigation components
- Follow globals.css design token patterns
- Implement responsive design with mobile-first approach

### 3. **Post-Development**: Verify new component health
```bash
npm run analyze-components
npm run component-health -- --component NewComponent
```

### 4. **Regular Maintenance**: Weekly/bi-weekly health checks
```bash
npm run analyze-components && npm run component-health
```

## Design System Standards

Components should follow these established patterns from `globals.css`:

### CSS Variables
```css
var(--background)
var(--foreground) 
var(--text-muted)
var(--brand-shadow)
var(--depth-elevated)
var(--transition-standard)
```

### Visual Hierarchy Classes
```css
.vh-primary-interactive
.vh-secondary-interactive  
.vh-content-container
.vh-supporting-element-brand
```

### Brand Colors
```css
#F9C22E  /* unparty yellow */
#E7B12E  /* champion yellow */
#000605  /* unparty black */
```

### Responsive Patterns
```jsx
className="px-4 sm:px-6 lg:px-8 xl:px-12"
className="text-sm sm:text-base lg:text-lg"
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
```

## Best Practices

### Excellent Component Example: Header.tsx
- ✅ Uses CSS variables: `var(--foreground)`, `var(--background)`
- ✅ Visual hierarchy: `vh-primary-interactive` classes
- ✅ Brand colors: `#F9C22E` for accents
- ✅ Next.js Image: Optimized image loading
- ✅ Responsive: Mobile-first with multiple breakpoints
- ✅ TypeScript: Proper interfaces and types

### Common Issues to Avoid
- ❌ Hard-coded colors instead of CSS variables
- ❌ Missing responsive classes
- ❌ Direct DOM manipulation
- ❌ Images without optimization
- ❌ Missing accessibility attributes

## Contributing

When creating or updating components:

1. **Follow Design System**: Use established patterns from `globals.css`
2. **Target 70%+ Health Score**: Aim for "good" or better classification
3. **Use Templates**: Base new components on excellent-rated components
4. **Test Health**: Run analysis after significant changes
5. **Document Patterns**: Update this README with new patterns

## Troubleshooting

### "component-health.json not found"
Run the analysis first:
```bash
npm run analyze-components
```

### Low Health Scores
Check the detailed report for specific issues:
```bash
npm run component-health -- --component YourComponent
```

### Git History Issues
Ensure you're in the project root and have git history:
```bash
git log --oneline | head -5
```

## Future Enhancements

- [ ] CI/CD integration for automated health checks
- [ ] Health score trends over time
- [ ] Component dependency analysis
- [ ] Automated fix suggestions
- [ ] Integration with design system documentation