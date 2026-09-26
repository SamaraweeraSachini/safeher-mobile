import { ROUTE_COMPARISON_WEIGHTS } from '@/constants/route-comparison';

export interface RouteChoiceInput {
  id: string;
  durationMinutes: number;
  safetyScore: number;
}

export type RouteRole = 'Fastest' | 'Safest' | 'Balanced';

export type ComparedRoute<T extends RouteChoiceInput> = T & {
  roles: RouteRole[];
  label: string;
  balancedValue: number;
};

/**
 * Identifies route choices from already calculated route durations and
 * incident-based safety scores.
 *
 * Fastest: lowest duration; ties prefer higher safety score, then ID.
 * Safest: highest safety score; ties prefer shorter duration, then ID.
 * Balanced: highest (0.6 × score/100 +
 *                    0.4 × shortest duration/route duration).
 *           Ties prefer higher safety, shorter duration, then ID.
 *
 * A route can win multiple roles. Its label combines those roles.
 * Routes winning no role receive unique Alternative labels.
 */
export function identifyRouteChoices<T extends RouteChoiceInput>(
  routes: readonly T[]
): ComparedRoute<T>[] {
  if (routes.length === 0) {
    return [];
  }

  const ids = new Set<string>();

  for (const route of routes) {
    if (
      !route.id.trim() ||
      ids.has(route.id) ||
      !Number.isFinite(route.durationMinutes) ||
      route.durationMinutes <= 0 ||
      !Number.isFinite(route.safetyScore) ||
      route.safetyScore < 0 ||
      route.safetyScore > 100
    ) {
      throw new Error(
        'Routes need unique IDs, positive durations and safety scores from 0 to 100.'
      );
    }

    ids.add(route.id);
  }

  const fastest = [...routes].sort(
    (a, b) =>
      a.durationMinutes - b.durationMinutes ||
      b.safetyScore - a.safetyScore ||
      a.id.localeCompare(b.id)
  )[0];

  const safest = [...routes].sort(
    (a, b) =>
      b.safetyScore - a.safetyScore ||
      a.durationMinutes - b.durationMinutes ||
      a.id.localeCompare(b.id)
  )[0];

  const shortestDuration = fastest.durationMinutes;

  const balancedValue = (route: T): number =>
    ROUTE_COMPARISON_WEIGHTS.safety *
      (route.safetyScore / 100) +
    ROUTE_COMPARISON_WEIGHTS.duration *
      (shortestDuration / route.durationMinutes);

  const balanced = [...routes].sort(
    (a, b) =>
      balancedValue(b) - balancedValue(a) ||
      b.safetyScore - a.safetyScore ||
      a.durationMinutes - b.durationMinutes ||
      a.id.localeCompare(b.id)
  )[0];

  let alternativeNumber = 0;

  return routes.map((route) => {
    const roles: RouteRole[] = [];

    if (route.id === fastest.id) {
      roles.push('Fastest');
    }

    if (route.id === safest.id) {
      roles.push('Safest');
    }

    if (route.id === balanced.id) {
      roles.push('Balanced');
    }

    if (roles.length === 0) {
      alternativeNumber += 1;
    }

    return {
      ...route,
      roles,
      label:
        roles.length > 0
          ? roles.join(' & ')
          : `Alternative ${alternativeNumber}`,
      balancedValue: balancedValue(route),
    };
  });
}