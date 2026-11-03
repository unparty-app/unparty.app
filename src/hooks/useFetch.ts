import { useCallback, useEffect, useEffectEvent, useState } from 'react'

type Result<T> = { key: string; requestKey: string; data?: T; error?: string }

export interface AsyncData<T> {
  /** Last successful result for this key; kept while it refetches */
  data: T | undefined
  /** Error from the current request, if it failed */
  error: string | undefined
  /** True until the current key's request settles */
  loading: boolean
  /** Load the current key again, e.g. after a mutation */
  refetch: () => void
}

/**
 * Loads data for a client component whenever `key` changes.
 *
 * `loading` is derived from whether the current key has settled, so nothing
 * calls setState synchronously inside the effect. Responses that arrive after
 * the key has moved on (or the component unmounted) are dropped via an
 * AbortSignal. Pass `key: null` to skip loading.
 */
export function useAsyncData<T>(
  key: string | null,
  load: (key: string, signal: AbortSignal) => Promise<T>
): AsyncData<T> {
  const [result, setResult] = useState<Result<T> | null>(null)
  const [version, setVersion] = useState(0)
  const requestKey = key === null ? null : `${version}\u0000${key}`
  const runLoad = useEffectEvent(load)

  useEffect(() => {
    if (key === null || requestKey === null) return
    const controller = new AbortController()
    runLoad(key, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, requestKey, data })
      },
      (err: unknown) => {
        if (controller.signal.aborted) return
        console.error(`[useAsyncData] ${key}:`, err)
        const error = err instanceof Error ? err.message : String(err)
        setResult((prev) => ({ key, requestKey, data: prev?.key === key ? prev.data : undefined, error }))
      }
    )
    return () => controller.abort()
  }, [key, requestKey])

  const refetch = useCallback(() => setVersion((v) => v + 1), [])
  const settled = requestKey !== null && result?.requestKey === requestKey

  return {
    data: result?.key === key ? result.data : undefined,
    error: settled ? result?.error : undefined,
    loading: requestKey !== null && !settled,
    refetch,
  }
}

/** GET a JSON endpoint, throwing on a non-2xx response */
export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Request to ${url} failed (${response.status})`)
  return response.json() as Promise<T>
}

/** useAsyncData for a single JSON GET. Pass `null` to skip loading. */
export function useFetch<T>(url: string | null): AsyncData<T> {
  return useAsyncData<T>(url, (u, signal) => fetchJson<T>(u, signal))
}
