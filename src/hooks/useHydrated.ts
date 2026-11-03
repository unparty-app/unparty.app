import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * False on the server and during hydration, true once rendering on the client.
 * Replaces the `useEffect(() => setMounted(true), [])` idiom for client-only
 * UI (portals, window/localStorage reads) without setting state in an effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
