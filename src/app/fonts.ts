// Next.js optimized Google Fonts loader
import { 
  Nunito,
  Space_Grotesk,
  VT323,
  Major_Mono_Display,
  Geist_Mono
} from 'next/font/google';

// Nunito (rounded)
export const nunito = Nunito({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
});

// Space Grotesk (modern editorial)
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

// VT323 (retro terminal)
export const vt323 = VT323({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-vt323',
  display: 'swap',
});

// Major Mono Display
export const majorMono = Major_Mono_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-major-mono',
  display: 'swap',
});

// Geist Mono
export const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-geist-mono-google',
  display: 'swap',
});

// Note: Some fonts like Datatype, Flow Rounded, and Google Sans Code 
// are not available in next/font/google and need to be loaded via @import or <link>
