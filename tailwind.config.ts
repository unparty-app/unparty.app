import type { Config } from "tailwindcss";
import scrollbarHide from "tailwind-scrollbar-hide";

const config: Config = {
  // Dark mode is driven by the `dark` class on <html> (see
  // src/app/constants/theme.ts for the FORCE_DARK_MODE flag), not by the OS
  // media query. 'selector' gates dark: utilities on :where(.dark, .dark *).
  darkMode: 'selector',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./mdx-components.tsx",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "background-highlight": "var(--background-highlight)",
        border: "var(--border)",
      },
      fontFamily: {
        rounded: ['var(--font-nunito)', 'sans-serif'],
        'brandon-grotesque': ['"Brandon-Grotesque"', 'sans-serif'],
        'space-grotesk': ['var(--font-space-grotesk)', 'sans-serif'],
        'vt323': ['var(--font-vt323)', 'monospace'],
        'major-mono': ['var(--font-major-mono)', 'monospace'],
        'geist-mono-google': ['var(--font-geist-mono-google)', 'monospace'],
        'datatype': ['"Datatype"', 'sans-serif'],
        'flow-rounded': ['"Flow Rounded"', 'cursive'],
        'google-sans-code': ['"Google Sans Code"', 'monospace'],
      },
    },
  },
  plugins: [scrollbarHide],
};
export default config;
