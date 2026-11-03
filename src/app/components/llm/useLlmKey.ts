'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * A visitor's own LLM key (BYOK, #396), kept in this tab's sessionStorage
 * only: it leaves with the tab, never reaches the database, and goes to the
 * server only as a header on the requests that use it (src/lib/llm.ts sends
 * it straight to the provider). Every component using this hook sees the
 * same key.
 */
const STORAGE_KEY = 'llm_key';
// Mirrors src/lib/llm.ts VISITOR_KEY_HEADER (a server-only module)
const HEADER = 'x-llm-key';

const listeners = new Set<() => void>();

function read(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function write(value: string) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, value);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the key lasts only until the page reloads
  }
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLlmKey() {
  const key = useSyncExternalStore(subscribe, read, () => '');
  const save = useCallback((value: string) => write(value.trim()), []);
  const forget = useCallback(() => write(''), []);
  // Headers for a request that may use a model: the key when there is one
  const headers = useCallback((): Record<string, string> => (key ? { [HEADER]: key } : {}), [key]);
  return { key, hasKey: Boolean(key), save, forget, headers };
}
