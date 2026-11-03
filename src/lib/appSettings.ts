import { prisma } from '@/lib/prisma';

export const KEYWORD_HIGHLIGHTING_KEY = 'keywordHighlightingEnabled';

export async function getAppSetting(key: string): Promise<string | null> {
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

// Defaults to enabled (matches the app's prior always-on behavior) until an
// admin explicitly turns it off. The root layout calls this on every page, so
// a missing or unreachable database (a fresh copy before setup, or an outage)
// falls back to that default instead of failing every page.
export async function getKeywordHighlightingEnabled(): Promise<boolean> {
  try {
    const value = await getAppSetting(KEYWORD_HIGHLIGHTING_KEY);
    return value !== 'false';
  } catch (error) {
    console.warn('Could not read keyword highlighting setting; using default (on):', error instanceof Error ? error.message.split('\n')[0] : error);
    return true;
  }
}
