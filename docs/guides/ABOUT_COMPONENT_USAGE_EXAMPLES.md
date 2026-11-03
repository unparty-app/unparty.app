// Example: How to use AboutComponent in layout.tsx
// This demonstrates the UI-only component that can be added to any layout

import AboutComponent from './app/components/AboutComponent';

// Example 1: Basic usage - automatically detects unppp from current pathname
function ExampleLayoutUsage() {
  return (
    <div>
      <AboutComponent />
    </div>
  );
}

// Example 2: Specific unppp ID usage
function ExampleWithSpecificUnppp() {
  return (
    <div>
      <AboutComponent unpppId="theunpartyapi" />
    </div>
  );
}

// Example 3: Without navigation (pure UI component)
function ExampleUIOnly() {
  return (
    <div>
      <AboutComponent showNavigation={false} className="custom-styling" />
    </div>
  );
}

// Example 4: Multiple instances for different unppp data
function ExampleMultipleInstances() {
  return (
    <div className="grid grid-cols-2 gap-8">
      <AboutComponent unpppId="theunpartyapp" showNavigation={false} />
      <AboutComponent unpppId="theunpartyapi" showNavigation={false} />
    </div>
  );
}