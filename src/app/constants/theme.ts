/**
 * Single switch for the site's color scheme.
 *
 *   true  → every visitor gets dark mode, regardless of OS setting
 *           (light mode is still a work in progress)
 *   false → follows the visitor's OS preference (auto), live-updating
 *           when the OS theme changes
 *
 * Consumed by src/app/layout.tsx, which sets the `dark` class on <html>;
 * both Tailwind `dark:` utilities (tailwind.config.ts darkMode: 'selector')
 * and the `:where(.dark)` rules in globals.css key off that class.
 */
export const FORCE_DARK_MODE = true;
