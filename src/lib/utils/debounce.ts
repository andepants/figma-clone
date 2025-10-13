/**
 * Debounce Utility
 *
 * Creates a debounced version of a function that delays execution
 * until after a specified delay has elapsed since the last invocation.
 */

/**
 * Debounce function type
 */
type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

/**
 * Creates a debounced function that delays invoking fn until after
 * delay milliseconds have elapsed since the last time it was invoked.
 *
 * Useful for optimizing performance by limiting the rate at which
 * a function is executed (e.g., API calls, Firestore writes).
 *
 * @param {Function} fn - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {DebouncedFunction} Debounced function with cancel method
 *
 * @example
 * ```typescript
 * const saveToFirestore = debounce((data) => {
 *   firestore.update(data);
 * }, 500);
 *
 * // Multiple rapid calls
 * saveToFirestore({ x: 1 });
 * saveToFirestore({ x: 2 });
 * saveToFirestore({ x: 3 });
 * // Only the last call executes after 500ms
 *
 * // Cancel pending execution
 * saveToFirestore.cancel();
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = (...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  // Add cancel method to clear pending execution
  debouncedFn.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFn;
}
