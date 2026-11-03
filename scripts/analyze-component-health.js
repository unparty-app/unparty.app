#!/usr/bin/env node

/**
 * Component Health Analyzer
 * Evaluates component code quality and design system compliance
 * Includes WCAG AAA accessibility checks
 */

import fs from 'fs';
import { pathToFileURL } from 'url';

/**
 * Design system patterns from globals.css to check for
 */
const DESIGN_SYSTEM_PATTERNS = {
  cssVariables: [
    '--background', '--foreground', '--text-muted', '--brand-shadow',
    '--depth-raised', '--depth-elevated', '--transition-standard',
    '--hover-lift', '--brand-accent', '--theme-color'
  ],
  visualHierarchyClasses: [
    'vh-primary-interactive', 'vh-secondary-interactive', 'vh-content-container',
    'vh-supporting-element', 'vh-supporting-element-brand', 'vh-brand-glow'
  ],
  responsiveClasses: [
    'sm:', 'md:', 'lg:', 'xl:', 'max-w-', 'min-w-', 'grid-cols-'
  ],
  accessibilityPatterns: [
    'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
    'aria-expanded', 'aria-controls', 'aria-live', 'aria-atomic',
    'role=', 'alt=', 'sr-only', 'focus:', 'focus-visible:', 'tabIndex'
  ],
  wcagAAA: {
    // Perceivable
    textAlternatives: ['alt=', 'aria-label', 'aria-labelledby'],
    // Operable  
    keyboardAccessible: ['onKeyDown', 'onKeyUp', 'onKeyPress', 'tabIndex', 'focus:'],
    focusVisible: ['focus:', 'focus-visible:', 'focus:outline', 'focus:ring'],
    // Understandable
    inputLabels: ['htmlFor', 'aria-labelledby', '<label'],
    // Robust
    ariaRoles: ['role=', 'aria-']
  },
  brandColors: [
    '#F9C22E', '#E7B12E', '#000605', 'unparty', 'unpartyyellow'
  ],
  modernPatterns: [
    'use client', 'useState', 'useEffect', 'interface ', 'type ', 'React.FC'
  ],
  themeColorPatterns: [
    'useTheme', 'colorValue', 'selectedColor', '--theme-color'
  ]
};

/**
 * Analyze a single component file
 */
function analyzeComponentFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const analysis = {
      // File metrics
      linesOfCode: lines.length,
      hasTypeScript: filePath.endsWith('.tsx') || filePath.endsWith('.ts'),
      hasMDX: filePath.endsWith('.mdx'),
      
      // Design system compliance
      designSystemCompliance: analyzeDesignSystemCompliance(content),
      
      // Accessibility
      accessibility: analyzeAccessibility(content),
      
      // Performance indicators
      performance: analyzePerformance(content),
      
      // Code quality
      codeQuality: analyzeCodeQuality(content),
      
      // Responsive design
      responsiveDesign: analyzeResponsiveDesign(content)
    };
    
    // Calculate overall health score
    analysis.overallScore = calculateOverallScore(analysis);
    
    return analysis;
  } catch (error) {
    console.warn(`Error analyzing ${filePath}:`, error.message);
    return {
      error: error.message,
      overallScore: 0
    };
  }
}

/**
 * Analyze design system compliance
 */
function analyzeDesignSystemCompliance(content) {
  const metrics = {
    usesCSSVariables: false,
    usesVisualHierarchyClasses: false,
    usesBrandColors: false,
    followsTailwindPatterns: false,
    score: 0
  };
  
  // Check for CSS variables
  const cssVariableCount = DESIGN_SYSTEM_PATTERNS.cssVariables.filter(
    variable => content.includes(`var(${variable})`)
  ).length;
  metrics.usesCSSVariables = cssVariableCount > 0;
  
  // Check for visual hierarchy classes
  const vhClassCount = DESIGN_SYSTEM_PATTERNS.visualHierarchyClasses.filter(
    className => content.includes(className)
  ).length;
  metrics.usesVisualHierarchyClasses = vhClassCount > 0;
  
  // Check for brand colors
  const brandColorCount = DESIGN_SYSTEM_PATTERNS.brandColors.filter(
    color => content.includes(color)
  ).length;
  metrics.usesBrandColors = brandColorCount > 0;
  
  // Check for Tailwind patterns
  metrics.followsTailwindPatterns = content.includes('className=') && 
    (content.includes('px-') || content.includes('py-') || content.includes('text-'));
  
  // Calculate score
  const checks = [
    metrics.usesCSSVariables,
    metrics.usesVisualHierarchyClasses,
    metrics.usesBrandColors,
    metrics.followsTailwindPatterns
  ];
  metrics.score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  
  return metrics;
}

/**
 * Analyze accessibility features (WCAG AAA targeted)
 */
function analyzeAccessibility(content) {
  const metrics = {
    // Basic accessibility
    hasSemanticHTML: false,
    hasARIAAttributes: false,
    hasFocusManagement: false,
    hasAltText: false,
    
    // WCAG AAA specific
    wcagAAA: {
      // 1.1.1 Non-text Content
      hasTextAlternatives: false,
      missingAltOnImages: false,
      
      // 1.3.1 Info and Relationships
      usesSemanticStructure: false,
      hasProperHeadings: false,
      
      // 2.1.1 Keyboard
      hasKeyboardHandlers: false,
      
      // 2.4.7 Focus Visible
      hasFocusIndicators: false,
      
      // 2.5.5 Target Size (AAA - 44x44 CSS pixels)
      hasMinTouchTargets: false,
      
      // 4.1.2 Name, Role, Value
      hasAriaRoles: false,
      
      // Theme color accessibility
      usesThemeColors: false,
      hasContrastConsiderations: false
    },
    
    issues: [],
    score: 0
  };
  
  // Check for semantic HTML elements using regex for more accurate matching
  // Matches opening tags like <header>, <header className=...>, etc.
  const semanticElementRegex = /<(header|nav|main|section|article|aside|footer|figure|figcaption)[\s>]/;
  metrics.hasSemanticHTML = semanticElementRegex.test(content);
  metrics.wcagAAA.usesSemanticStructure = metrics.hasSemanticHTML;
  
  // Check for proper heading structure
  const headingRegex = /<h[1-6][\s>]/;
  metrics.wcagAAA.hasProperHeadings = headingRegex.test(content);
  
  // Check for ARIA attributes
  metrics.hasARIAAttributes = DESIGN_SYSTEM_PATTERNS.accessibilityPatterns.some(
    pattern => content.includes(pattern)
  );
  metrics.wcagAAA.hasAriaRoles = content.includes('role=') || content.includes('aria-');
  
  // Check for focus management
  metrics.hasFocusManagement = content.includes('focus:') || 
    content.includes('focus-visible:') || content.includes('tabIndex');
  metrics.wcagAAA.hasFocusIndicators = content.includes('focus:') || content.includes('focus-visible:');
  
  // Check for keyboard handlers
  metrics.wcagAAA.hasKeyboardHandlers = 
    content.includes('onKeyDown') || 
    content.includes('onKeyUp') || 
    content.includes('onKeyPress');
  
  // Check for alt text on images
  metrics.hasAltText = content.includes('alt=');
  metrics.wcagAAA.hasTextAlternatives = 
    content.includes('alt=') || 
    content.includes('aria-label') || 
    content.includes('aria-labelledby');
  
  // Check for potential missing alt on images
  // Note: This is a heuristic - empty alt="" is valid for decorative images
  // We flag for manual review if images exist but no alt attribute is detected
  const imgTagRegex = /<(?:img|Image)\s/gi;
  const imgMatches = content.match(imgTagRegex);
  const hasImages = imgMatches && imgMatches.length > 0;
  
  // Check if any image-like pattern exists without nearby alt attribute
  // Heuristic: looks for any alt= pattern (quotes or JSX expression)
  // Detects both static alt="..." and dynamic alt={...} patterns
  if (hasImages) {
    // Look for any alt attribute pattern - simple presence check
    const altPattern = /alt\s*=/;
    const hasAnyAlt = altPattern.test(content);
    if (!hasAnyAlt) {
      metrics.wcagAAA.missingAltOnImages = true;
      metrics.issues.push('Images may be missing alt text - manual verification needed (WCAG 1.1.1)');
    }
  }
  
  // Check for touch target size indicators
  // HEURISTIC: This checks for Tailwind classes that commonly achieve 44x44px targets
  // Actual compliance requires runtime measurement; this is an indicator only
  // w-11/h-11 = 44px (exact minimum), w-12/h-12 = 48px (exceeds minimum)
  metrics.wcagAAA.hasMinTouchTargets = 
    content.includes('min-w-11') || 
    content.includes('min-h-11') ||
    (content.includes('w-11') && content.includes('h-11')) ||
    content.includes('w-12') || content.includes('h-12') ||
    content.includes('min-w-[44px]') ||
    content.includes('min-h-[44px]');
  
  // Check for theme color usage (known problem area)
  metrics.wcagAAA.usesThemeColors = DESIGN_SYSTEM_PATTERNS.themeColorPatterns.some(
    pattern => content.includes(pattern)
  );
  
  // Check if component has contrast-related text color classes
  // HEURISTIC: Checks for PRESENCE of contrast-aware classes, not actual contrast compliance
  // Manual verification still required for proper contrast ratio validation
  if (metrics.wcagAAA.usesThemeColors) {
    // Look for text color classes that indicate contrast awareness
    metrics.wcagAAA.hasContrastConsiderations = 
      content.includes('text-white') || 
      content.includes('text-black') ||
      content.includes('text-foreground') ||
      content.includes('var(--foreground)');
    
    if (!metrics.wcagAAA.hasContrastConsiderations) {
      metrics.issues.push('Uses theme colors - verify text contrast manually');
    }
  }
  
  // Calculate score (weighted for WCAG AAA importance)
  // Note: This is a simplified scoring system for static analysis
  // Scores are indicators only - actual WCAG compliance requires runtime testing
  const checks = [
    { check: metrics.hasSemanticHTML, weight: 1 },
    { check: metrics.hasARIAAttributes, weight: 1.5 },
    { check: metrics.wcagAAA.hasFocusIndicators, weight: 2 }, // Focus style indicators (focus:/focus-visible:)
    { check: !metrics.wcagAAA.missingAltOnImages, weight: 2 }, // No detected images without alt
    { check: metrics.wcagAAA.hasProperHeadings, weight: 1 },
    { check: !metrics.wcagAAA.usesThemeColors || metrics.wcagAAA.hasContrastConsiderations, weight: 1.5 }
  ];
  
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earnedWeight = checks.reduce((sum, c) => sum + (c.check ? c.weight : 0), 0);
  metrics.score = Math.round((earnedWeight / totalWeight) * 100);
  
  return metrics;
}

/**
 * Analyze performance indicators
 */
function analyzePerformance(content) {
  const metrics = {
    usesNextImage: false,
    hasLazyLoading: false,
    hasOptimizedImages: false,
    avoidsDOMQueries: false,
    score: 0
  };
  
  // Check for Next.js Image component
  metrics.usesNextImage = content.includes('next/image') || content.includes('Image from');
  
  // Check for lazy loading patterns
  metrics.hasLazyLoading = content.includes('loading="lazy"') || 
    content.includes('lazy') || metrics.usesNextImage;
  
  // Check for image optimization
  metrics.hasOptimizedImages = metrics.usesNextImage || 
    content.includes('srcSet') || content.includes('sizes=');
  
  // Check for DOM query avoidance (React patterns)
  metrics.avoidsDOMQueries = !content.includes('getElementById') && 
    !content.includes('querySelector') && 
    (content.includes('useRef') || content.includes('useState'));
  
  // Calculate score
  const checks = [
    metrics.usesNextImage,
    metrics.hasLazyLoading,
    metrics.hasOptimizedImages,
    metrics.avoidsDOMQueries
  ];
  metrics.score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  
  return metrics;
}

/**
 * Analyze code quality
 */
function analyzeCodeQuality(content) {
  const metrics = {
    hasTypeScript: false,
    hasProperTypes: false,
    usesModernReact: false,
    hasErrorHandling: false,
    score: 0
  };
  
  // Check for TypeScript usage
  metrics.hasTypeScript = content.includes('interface ') || 
    content.includes('type ') || content.includes(': React.FC');
  
  // Check for proper typing
  metrics.hasProperTypes = content.includes('Props') || 
    content.includes(': string') || content.includes(': number');
  
  // Check for modern React patterns
  metrics.usesModernReact = DESIGN_SYSTEM_PATTERNS.modernPatterns.some(
    pattern => content.includes(pattern)
  );
  
  // Check for error handling
  metrics.hasErrorHandling = content.includes('try {') || 
    content.includes('catch') || content.includes('error');
  
  // Calculate score
  const checks = [
    metrics.hasTypeScript,
    metrics.hasProperTypes,
    metrics.usesModernReact,
    metrics.hasErrorHandling
  ];
  metrics.score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  
  return metrics;
}

/**
 * Analyze responsive design
 */
function analyzeResponsiveDesign(content) {
  const metrics = {
    hasResponsiveClasses: false,
    hasMobileFirst: false,
    usesFlexboxGrid: false,
    hasBreakpoints: false,
    score: 0
  };
  
  // Check for responsive classes
  metrics.hasResponsiveClasses = DESIGN_SYSTEM_PATTERNS.responsiveClasses.some(
    pattern => content.includes(pattern)
  );
  
  // Check for mobile-first approach (sm: before lg:)
  const smIndex = content.indexOf('sm:');
  const lgIndex = content.indexOf('lg:');
  metrics.hasMobileFirst = smIndex !== -1 && (lgIndex === -1 || smIndex < lgIndex);
  
  // Check for modern layout
  metrics.usesFlexboxGrid = content.includes('flex') || 
    content.includes('grid') || content.includes('grid-cols');
  
  // Check for multiple breakpoints
  const breakpoints = ['sm:', 'md:', 'lg:', 'xl:'];
  const usedBreakpoints = breakpoints.filter(bp => content.includes(bp));
  metrics.hasBreakpoints = usedBreakpoints.length >= 2;
  
  // Calculate score
  const checks = [
    metrics.hasResponsiveClasses,
    metrics.hasMobileFirst,
    metrics.usesFlexboxGrid,
    metrics.hasBreakpoints
  ];
  metrics.score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  
  return metrics;
}

/**
 * Calculate overall health score
 */
function calculateOverallScore(analysis) {
  if (analysis.error) return 0;
  
  const scores = [
    analysis.designSystemCompliance.score,
    analysis.accessibility.score,
    analysis.performance.score,
    analysis.codeQuality.score,
    analysis.responsiveDesign.score
  ];
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

/**
 * Get health status based on score
 */
function getHealthStatus(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'poor';
  return 'critical';
}

/**
 * Export functions for use by other scripts
 */
export { 
  analyzeComponentFile, 
  getHealthStatus,
  DESIGN_SYSTEM_PATTERNS 
};

/**
 * CLI execution
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node analyze-component-health.js <component-file-path>');
    process.exit(1);
  }
  
  const analysis = analyzeComponentFile(filePath);
  console.log('📊 Component Health Analysis:');
  console.log(JSON.stringify(analysis, null, 2));
  console.log(`\n🏥 Overall Health: ${getHealthStatus(analysis.overallScore)} (${analysis.overallScore}%)`);
}