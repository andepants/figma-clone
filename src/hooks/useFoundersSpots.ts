/**
 * useFoundersSpots Hook
 *
 * Tracks remaining founders tier spots.
 * Simple stub implementation - can be connected to backend later.
 */

/**
 * Hook to get founders tier availability info
 * @returns Object with spotsLeft and total spots
 */
export function useFoundersSpots() {
  // TODO: Connect to backend to track real spots
  // For now, return static value
  return {
    spotsLeft: 3,
    totalSpots: 10,
  };
}
