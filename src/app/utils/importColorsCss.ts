// Parses the custom properties out of a .css file exported by UNCOLOR (see
// ExportManager.generateCSS in the uncolor-ios repo), which writes a
// `:root { --color-primary: #...; --brand-name: "..."; ... }` block. We read
// the color-role vars and the brand text vars (name/tagline/description).
// UNCOLOR's typography *font/size* rules (h1/.brand-name etc.) are still
// intentionally ignored here — that feature is being sunset on the UNCOLOR
// side (unparty-app/uncolor-ios#59), which explicitly keeps the brand text
// strings even as font/size customization goes away. Parsed brand text travels
// with the palette (ColorSelectionContext) and shows on its card, and the site's
// owner can make it who the site says it is (/api/admin/site-identity, #807).

export interface ParsedCssPalette {
  primary?: string;
  secondary?: string;
  accent?: string;
  additional1?: string;
  additional2?: string;
}

export const CSS_COLOR_ROLES: { key: keyof ParsedCssPalette; varName: string; label: string }[] = [
  { key: 'primary', varName: '--color-primary', label: 'Primary' },
  { key: 'secondary', varName: '--color-secondary', label: 'Secondary' },
  { key: 'accent', varName: '--color-accent', label: 'Accent' },
  { key: 'additional1', varName: '--color-additional-1', label: 'Additional 1' },
  { key: 'additional2', varName: '--color-additional-2', label: 'Additional 2' },
];

const HEX_RE = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;

export function parseColorsFromCss(cssText: string): ParsedCssPalette {
  const result: ParsedCssPalette = {};

  for (const { key, varName } of CSS_COLOR_ROLES) {
    const match = cssText.match(new RegExp(`${varName}\\s*:\\s*([^;]+);`, 'i'));
    if (!match) continue;

    const value = match[1].trim();
    if (HEX_RE.test(value)) {
      result[key] = value;
    }
  }

  return result;
}

export function countParsedColors(palette: ParsedCssPalette): number {
  return CSS_COLOR_ROLES.reduce((count, { key }) => count + (palette[key] ? 1 : 0), 0);
}

// Maps the parsed role colors onto the 5-slot array ColorPicker/
// ColorSelectionContext expects, preserving role order (primary first).
export function paletteToColorSlots(palette: ParsedCssPalette): string[] {
  return CSS_COLOR_ROLES.map(({ key }) => palette[key] ?? '');
}

// The other way: 5 slots as the `:root` block parseColorsFromCss reads (and
// UNCOLOR writes), so a palette saved from the brand color setup loads back
// into any copy. Empty slots are left out
export function colorSlotsToCss(slots: string[], title: string): string {
  const lines = CSS_COLOR_ROLES.flatMap(({ varName }, i) => (slots[i] ? [`  ${varName}: ${slots[i]};`] : []));
  return `/* ${title} */\n:root {\n${lines.join('\n')}\n}\n`;
}

/** Hands the browser colorSlotsToCss as a file to save (nothing leaves the page) */
export function downloadColorSlotsCss(slots: string[], title: string, filename = 'brand-colors.css'): void {
  const url = URL.createObjectURL(new Blob([colorSlotsToCss(slots, title)], { type: 'text/css' }));
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

export interface ParsedCssBrandInfo {
  name?: string;
  tagline?: string;
  description?: string;
}

const BRAND_TEXT_VARS: { key: keyof ParsedCssBrandInfo; varName: string }[] = [
  { key: 'name', varName: '--brand-name' },
  { key: 'tagline', varName: '--brand-tagline' },
  { key: 'description', varName: '--brand-description' },
];

// UNCOLOR quotes these values and escapes internal backslashes/quotes
// (ExportManager.cssEscaped) — match the quoted string and unescape it.
export function parseBrandInfoFromCss(cssText: string): ParsedCssBrandInfo {
  const result: ParsedCssBrandInfo = {};

  for (const { key, varName } of BRAND_TEXT_VARS) {
    const match = cssText.match(new RegExp(`${varName}\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"\\s*;`, 'i'));
    if (!match) continue;

    const value = match[1].replace(/\\(.)/g, '$1').trim();
    if (value) {
      result[key] = value;
    }
  }

  return result;
}

export function hasBrandInfo(info: ParsedCssBrandInfo): boolean {
  return Boolean(info.name || info.tagline || info.description);
}
