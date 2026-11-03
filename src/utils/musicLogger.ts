// src/utils/musicLogger.ts

// Scoped dev-only logging for the Apple MusicKit integration (useMusicKit.ts,
// MusicBanner.tsx) — debug traces are stripped from production builds via
// NODE_ENV, while genuine errors always log.
export const musicLogger = {
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
