import {
  ROUTE_COMPARISON_WEIGHTS,
} from '@/constants/route-comparison';

import type {
  RouteOption,
  RouteType,
} from '@/src/types/route';

export type RouteRole =
  | 'Fastest'
  | 'Safest'
  | 'Balanced';

export type ComparedRoute =
  RouteOption & {
    roles:
      RouteRole[];

    label:
      string;

    balancedValue:
      number;
  };

/**
 * Balanced route:
 *
 * 60% safety
 * 40% travel time
 *
 * Safety:
 * route safety score / 100
 *
 * Duration:
 * fastest duration / this route's duration
 */
function getBalancedValue(
  route:
    RouteOption,

  shortestDurationSeconds:
    number
): number {
  return (
    ROUTE_COMPARISON_WEIGHTS
      .safety *
      (
        route.safetyScore /
        100
      ) +

    ROUTE_COMPARISON_WEIGHTS
      .duration *
      (
        shortestDurationSeconds /
        route.durationSeconds
      )
  );
}

function validateRoutes(
  routes:
    readonly RouteOption[]
): void {
  const ids =
    new Set<string>();

  for (
    const route
    of routes
  ) {
    if (
      !route.id.trim() ||
      ids.has(
        route.id
      ) ||
      route.coordinates.length ===
        0 ||
      !Number.isFinite(
        route.distanceMeters
      ) ||
      route.distanceMeters <
        0 ||
      !Number.isFinite(
        route.durationSeconds
      ) ||
      route.durationSeconds <=
        0 ||
      !Number.isFinite(
        route.safetyScore
      ) ||
      route.safetyScore <
        0 ||
      route.safetyScore >
        100 ||
      !Number.isFinite(
        route.nearbyIncidentCount
      ) ||
      route.nearbyIncidentCount <
        0
    ) {
      throw new Error(
        'Routes must contain valid RouteOption data.'
      );
    }

    ids.add(
      route.id
    );
  }
}

/**
 * Finds the true fastest route.
 */
function getFastest(
  routes:
    readonly RouteOption[]
): RouteOption {
  return [...routes].sort(
    (
      first,
      second
    ) =>
      first.durationSeconds -
        second.durationSeconds ||

      second.safetyScore -
        first.safetyScore ||

      first.id.localeCompare(
        second.id
      )
  )[0];
}

/**
 * When we have three or more routes we select a separate Safest
 * candidate rather than giving Fastest and Safest to exactly
 * the same card.
 *
 * The remaining candidates are still ranked by the actual
 * safety score first.
 *
 * If only one provider route exists, naturally the same route
 * may have multiple roles.
 */
function getSafest(
  routes:
    readonly RouteOption[],

  fastest:
    RouteOption
): RouteOption {
  const pool =
    routes.length >=
    3
      ? routes.filter(
          route =>
            route.id !==
            fastest.id
        )
      : routes;

  return [...pool].sort(
    (
      first,
      second
    ) =>
      second.safetyScore -
        first.safetyScore ||

      first.nearbyIncidentCount -
        second.nearbyIncidentCount ||

      first.durationSeconds -
        second.durationSeconds ||

      first.id.localeCompare(
        second.id
      )
  )[0];
}

/**
 * Balanced is selected from the third route when three
 * independent candidates exist.
 *
 * That keeps the comparison meaningful:
 *
 * Fastest
 * Safest
 * Balanced
 *
 * instead of showing the exact same route three times.
 */
function getBalanced(
  routes:
    readonly RouteOption[],

  fastest:
    RouteOption,

  safest:
    RouteOption
): RouteOption {
  const remaining =
    routes.length >=
    3
      ? routes.filter(
          route =>
            route.id !==
              fastest.id &&
            route.id !==
              safest.id
        )
      : routes;

  return [...remaining].sort(
    (
      first,
      second
    ) =>
      getBalancedValue(
        second,
        fastest.durationSeconds
      ) -
        getBalancedValue(
          first,
          fastest.durationSeconds
        ) ||

      second.safetyScore -
        first.safetyScore ||

      first.durationSeconds -
        second.durationSeconds ||

      first.id.localeCompare(
        second.id
      )
  )[0];
}

export function identifyRouteChoices(
  routes:
    readonly RouteOption[]
): ComparedRoute[] {
  if (
    routes.length ===
    0
  ) {
    return [];
  }

  validateRoutes(
    routes
  );

  const fastest =
    getFastest(
      routes
    );

  const safest =
    getSafest(
      routes,
      fastest
    );

  const balanced =
    getBalanced(
      routes,
      fastest,
      safest
    );

  let alternativeNumber =
    0;

  return routes.map(
    route => {
      const roles:
        RouteRole[] = [];

      if (
        route.id ===
        fastest.id
      ) {
        roles.push(
          'Fastest'
        );
      }

      if (
        route.id ===
        safest.id
      ) {
        roles.push(
          'Safest'
        );
      }

      if (
        route.id ===
        balanced.id
      ) {
        roles.push(
          'Balanced'
        );
      }

      if (
        roles.length ===
        0
      ) {
        alternativeNumber +=
          1;
      }

      let type:
        RouteType =
        route.type;

      if (
        route.id ===
        fastest.id
      ) {
        type =
          'fastest';
      } else if (
        route.id ===
        safest.id
      ) {
        type =
          'safest';
      } else if (
        route.id ===
        balanced.id
      ) {
        type =
          'balanced';
      }

      return {
        ...route,

        type,

        roles,

        label:
          roles.length >
          0
            ? roles.join(
                ' & '
              )
            : `Alternative ${alternativeNumber}`,

        balancedValue:
          getBalancedValue(
            route,
            fastest.durationSeconds
          ),
      };
    }
  );
}