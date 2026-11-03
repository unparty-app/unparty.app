import { useSyncExternalStore } from 'react'

type StorageArea = 'local' | 'session'

const listeners = new Set<() => void>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  // Other tabs writing the same origin's localStorage
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

function storageFor(area: StorageArea): Storage {
  return area === 'local' ? localStorage : sessionStorage
}

function read(area: StorageArea, key: string): string | null {
  try {
    return storageFor(area).getItem(key)
  } catch {
    // Storage blocked (privacy mode, disabled cookies): behave as unset
    return null
  }
}

function write(area: StorageArea, key: string, value: string | null): void {
  try {
    if (value === null) storageFor(area).removeItem(key)
    else storageFor(area).setItem(key, value)
  } catch {
    // Persisting is best-effort
  }
  listeners.forEach((listener) => listener())
}

function useStorageValue(area: StorageArea, key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => read(area, key),
    () => null
  )
}

/**
 * The raw localStorage string for `key`, or null when unset. It is also null
 * on the server and during hydration, so client-only preferences never cause
 * a hydration mismatch; parse the string at the call site.
 */
export function useLocalStorageValue(key: string): string | null {
  return useStorageValue('local', key)
}

/**
 * Write (or with `null`, remove) a localStorage key and re-render every
 * component reading it through useLocalStorageValue. Best-effort: if storage
 * is unavailable the write is skipped.
 */
export function writeLocalStorage(key: string, value: string | null): void {
  write('local', key, value)
}

/** sessionStorage counterpart of useLocalStorageValue */
export function useSessionStorageValue(key: string): string | null {
  return useStorageValue('session', key)
}

/** Current sessionStorage value, for reading outside render (e.g. in an effect) */
export function readSessionStorage(key: string): string | null {
  return read('session', key)
}

/** sessionStorage counterpart of writeLocalStorage */
export function writeSessionStorage(key: string, value: string | null): void {
  write('session', key, value)
}
