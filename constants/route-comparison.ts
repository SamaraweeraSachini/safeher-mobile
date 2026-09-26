/**
 * Balanced route formula:
 * 60% reported safety and 40% relative travel time.
 *
 * Time value = shortest available duration / this route's duration.
 * Both parts therefore have a value between 0 and 1.
 */
export const ROUTE_COMPARISON_WEIGHTS = {
  safety: 0.6,
  duration: 0.4,
} as const;