/**
 * Throttle Utility
 *
 * Limits function execution to once per specified delay.
 * Used for cursor position updates (50ms throttle).
 *
 * Unlike debounce, throttle ensures the function executes at regular intervals
 * during continuous calls, providing consistent updates.
 */

/**
 * Throttle a function to execute at most once per delay period
 *
 * @param fn - Function to throttle
 * @param delay - Minimum time in milliseconds between executions
 * @returns Throttled function
 *
 * @example
 * const throttledUpdate = throttle((x, y) => updateCursor(x, y), 50)
 * // Called every 50ms max, even if invoked more frequently
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function throttled(...args: Parameters<T>) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    // Clear any pending timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    if (timeSinceLastCall >= delay) {
      // Enough time has passed, execute immediately
      lastCall = now
      fn(...args)
    } else {
      // Schedule execution for when delay period completes
      const remainingTime = delay - timeSinceLastCall
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        fn(...args)
        timeoutId = null
      }, remainingTime)
    }
  }
}
