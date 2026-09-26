import { ROUTE_COMPARISON_WEIGHTS } from '@/constants/route-comparison';

import type {
  RouteOption,
  RouteType,
} from '@/src/types/route';

export type RouteRole =
  | 'Fastest'
  | 'Safest'
  | 'Balanced';

export type ComparedRoute = RouteOption & {
  roles: RouteRole[];
  label: string;
  balancedValue: number;
};

function getBalancedValue(
  route: RouteOption,
  shortestDurationSeconds: number
): number {
  return (
    ROUTE_COMPARISON_WEIGHTS.safety *
      (route.safetyScore / 100) +
    ROUTE_COMPARISON_WEIGHTS.duration *
      (shortestDurationSeconds /
        route.durationSeconds)
  );
}

/**
 * Compares RouteOption objects and identifies the fastest,
 * safest and balanced choices.
 *
 * Fastest:
 * Lowest travel duration.
 *
 * Safest:
 * Highest incident-based safety score.
 *
 * Balanced:
 * 60% safety score and 40% relative travel time.
 *
 * Every routing feature therefore uses the shared RouteOption model.
 */
export function identifyRouteChoices(
  routes: readonly RouteOption[]
): ComparedRoute[] {
  if (routes.length === 0) {
    return [];
  }

  const ids = new Set<string>();

  for (const route of routes) {
    if (
      !route.id.trim() ||
      ids.has(route.id) ||
      route.coordinates.length === 0 ||
      !Number.isFinite(route.distanceMeters) ||
      route.distanceMeters < 0 ||
      !Number.isFinite(route.durationSeconds) ||
      route.durationSeconds <= 0 ||
      !Number.isFinite(route.safetyScore) ||
      route.safetyScore < 0 ||
      route.safetyScore > 100 ||
      !Number.isFinite(route.nearbyIncidentCount) ||
      route.nearbyIncidentCount < 0
    ) {
      throw new Error(
        'Routes must contain valid RouteOption data.'
      );
    }

    ids.add(route.id);
  }

  const fastest = [...routes].sort(
    (a, b) =>
      a.durationSeconds - b.durationSeconds ||
      b.safetyScore - a.safetyScore ||
      a.id.localeCompare(b.id)
  )[0];

  const safest = [...routes].sort(
    (a, b) =>
      b.safetyScore - a.safetyScore ||
      a.durationSeconds - b.durationSeconds ||
      a.id.localeCompare(b.id)
  )[0];

  const shortestDurationSeconds =
    fastest.durationSeconds;

  const balanced = [...routes].sort(
    (a, b) =>
      getBalancedValue(
        b,
        shortestDurationSeconds
      ) -
        getBalancedValue(
          a,
          shortestDurationSeconds
        ) ||
      b.safetyScore - a.safetyScore ||
      a.durationSeconds - b.durationSeconds ||
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

    let type: RouteType = route.type;

    if (route.id === fastest.id) {
      type = 'fastest';
    }

    if (route.id === safest.id) {
      type = 'safest';
    }

    if (route.id === balanced.id) {
      type = 'balanced';
    }

    return {
      ...route,
      type,
      roles,
      label:
        roles.length > 0
          ? roles.join(' & ')
          : `Alternative ${alternativeNumber}`,
      balancedValue: getBalancedValue(
        route,
        shortestDurationSeconds
      ),
    };
  });
}