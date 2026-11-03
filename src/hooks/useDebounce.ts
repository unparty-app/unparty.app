import { useCallback, useRef, useEffect } from 'react'

/**
 * Creates a debounced version of a callback function that delays execution
 * until after the specified delay has elapsed since the last invocation.
 * 
 * @param callback - The function to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns A debounced version of the callback
 * 
 * @example
 * const debouncedSearch = useDebounce((query: string) => {
 *   fetchResults(query)
 * }, 300)
 */
export function useDebounce<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const callbackRef = useRef(callback)

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )
}

/**
 * Creates a throttled version of a callback function that only executes
 * at most once per specified delay period.
 * 
 * @param callback - The function to throttle
 * @param delay - The throttle delay in milliseconds
 * @returns A throttled version of the callback
 * 
 * @example
 * const throttledScroll = useThrottle(() => {
 *   updateScrollPosition()
 * }, 100)
 */
export function useThrottle<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef(0) // 0 so the first call runs immediately (leading edge)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const callbackRef = useRef(callback)

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastRun = now - lastRun.current

      if (timeSinceLastRun >= delay) {
        callbackRef.current(...args)
        lastRun.current = now
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args)
          lastRun.current = Date.now()
        }, delay - timeSinceLastRun)
      }
    },
    [delay]
  )
}
