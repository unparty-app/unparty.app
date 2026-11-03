import { randomBytes } from 'crypto';

/**
 * Generate a unique SKU for books
 * Adapted from Python implementation to TypeScript
 * @param prefix - Default prefix for the SKU (default: "UNP")
 * @param year - Year to include in SKU (default: current year)
 * @returns Generated SKU in format: PREFIX-XXXX-YYYY
 */
export function generateSKU(prefix: string = "UNP", year?: number): string {
  if (!year) {
    year = new Date().getFullYear();
  }
  
  // Generate a unique 4-character string using crypto
  const uniqueId = randomBytes(2).toString('hex').toUpperCase();
  
  const sku = `${prefix}-${uniqueId}-${year}`;
  return sku;
}

/**
 * Validate SKU format
 * @param sku - SKU to validate
 * @returns boolean indicating if SKU is valid
 */
export function validateSKU(sku: string): boolean {
  const skuPattern = /^[A-Z]{3}-[A-F0-9]{4}-\d{4}$/;
  return skuPattern.test(sku);
}