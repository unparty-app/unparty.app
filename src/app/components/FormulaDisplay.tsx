'use client';

/**
 * FormulaDisplay - A lightweight component for displaying math formulas
 * 
 * Designed to make business math accessible and approachable for
 * non-technical founders, entrepreneurs, and small business owners.
 * 
 * Features:
 * - Minimalistic, sleek styling with themeContext integration
 * - font-rounded (Nunito) for text labels
 * - font-vt323 for numbers and operators
 * - Dark mode support
 * 
 * Used in stories via: :::formula[steps=step1|step2|step3,result=RESULT NAME]:::
 * 
 * Example:
 * :::formula[steps=STARTING INVENTORY|+ PURCHASES|- ENDING INVENTORY|/ BY SALES,result=COGS (Cost of Goods)]:::
 */

import { useTheme } from '../contexts/ThemeContext';

export interface FormulaStep {
  operator?: '+' | '-' | '*' | '/' | '=';
  label: string;
  value?: string | number;
}

export interface FormulaDisplayProps {
  /** Array of formula steps, can be pipe-separated string or step objects */
  steps?: string | FormulaStep[];
  /** The result label (what the formula calculates) */
  result?: string;
  /** Optional title for the formula */
  title?: string;
  /** Alignment of the formula display */
  align?: 'left' | 'center' | 'right';
}

/**
 * Parse a pipe-separated string into formula steps
 * Handles formats like:
 * - "STARTING INVENTORY|+ PURCHASES|- ENDING INVENTORY"
 * - Steps can start with operators: +, -, *, /, =
 */

/** Delimiter used to separate formula steps in the steps string */
const STEP_DELIMITER = '|';

function parseSteps(stepsString: string): FormulaStep[] {
  if (!stepsString) return [];
  
  const parts = stepsString.split(STEP_DELIMITER).map(s => s.trim()).filter(Boolean);
  
  return parts.map(part => {
    // Check if the step starts with an operator
    const operatorMatch = part.match(/^([+\-*/=])\s*(.*)$/);
    
    if (operatorMatch) {
      const [, operator, label] = operatorMatch;
      return {
        operator: operator as FormulaStep['operator'],
        label: label.trim()
      };
    }
    
    return { label: part };
  });
}

const FormulaDisplay: React.FC<FormulaDisplayProps> = ({
  steps = [],
  result,
  title,
  align = 'left'
}) => {
  const { colorValue } = useTheme();
  
  // Parse steps if provided as string
  const parsedSteps: FormulaStep[] = typeof steps === 'string' 
    ? parseSteps(steps) 
    : steps;
  
  // Determine alignment classes
  const alignmentClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right'
  }[align];

  return (
    <div 
      className={`my-8 flex flex-col ${alignmentClasses}`}
      role="math"
      aria-label={title || 'Formula'}
    >
      {/* Title (optional) */}
      {title && (
        <h3 
          className="mb-4 font-vt323 text-lg uppercase tracking-wide text-gray-600 dark:text-gray-400"
          style={{ color: colorValue }}
        >
          {title}
        </h3>
      )}
      
      {/* Formula Container */}
      <div 
        className="inline-block rounded-lg border border-gray-200  px-6 py-4 dark:border-gray-700 "
        style={{ borderLeftColor: colorValue, borderLeftWidth: '4px' }}
      >
        {/* Formula Steps */}
        <div className="flex flex-col space-y-2">
          {parsedSteps.map((step, index) => (
            <div 
              key={index}
              className="flex items-baseline gap-3"
            >
              {/* Operator (using vt323 for retro terminal look) */}
              {step.operator && (
                <span 
                  className="inline-block w-6 text-right font-vt323 text-2xl font-bold"
                  style={{ color: colorValue }}
                  aria-hidden="true"
                >
                  {step.operator}
                </span>
              )}
              
              {/* Empty space for alignment if no operator */}
              {!step.operator && index > 0 && (
                <span className="inline-block w-6" aria-hidden="true" />
              )}
              
              {/* Label (using Nunito/rounded for friendly text) */}
              <span className="font-vt323 text-base font-medium uppercase tracking-wide text-gray-700 dark:text-gray-200">
                {step.label}
              </span>
              
              {/* Value (optional, using vt323 for numbers) */}
              {step.value !== undefined && (
                <span 
                  className="ml-auto font-vt323 text-xl text-gray-600 dark:text-gray-400"
                >
                  {step.value}
                </span>
              )}
            </div>
          ))}
          
          {/* Result line (if provided) */}
          {result && (
            <>
              {/* Divider line */}
              <div 
                className="my-2 h-px w-full"
                style={{ backgroundColor: colorValue }}
                aria-hidden="true"
              />
              
              {/* Result */}
              <div className="flex items-baseline gap-3">
                <span 
                  className="inline-block w-6 text-right font-vt323 text-2xl font-bold"
                  style={{ color: colorValue }}
                  aria-hidden="true"
                >
                  =
                </span>
                <span 
                  className="font-vt323 text-base  uppercase tracking-wide"
                  style={{ color: colorValue }}
                >
                  {result}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormulaDisplay;
