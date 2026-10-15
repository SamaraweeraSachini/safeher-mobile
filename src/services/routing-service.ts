import type {
  RouteCoordinate,
} from '@/src/types/route';

const GEOAPIFY_ROUTING_URL =
  'https://api.geoapify.com/v1/routing';

const geoapifyApiKey =
  process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

export type RoutingMode =
  | 'walk'
  | 'bicycle'
  | 'drive';

export interface RoutingResult {
  id: string;

  coordinates:
    RouteCoordinate[];

  distanceMeters:
    number;

  durationSeconds:
    number;
}

export type RoutingErrorCode =
  | 'invalid-origin'
  | 'invalid-destination'
  | 'missing-api-key'
  | 'network-error'
  | 'rate-limit'
  | 'no-route'
  | 'invalid-response'
  | 'service-error';

export class RoutingServiceError extends Error {
  code:
    RoutingErrorCode;

  constructor(
    code:
      RoutingErrorCode,

    message:
      string
  ) {
    super(
      message
    );

    this.name =
      'RoutingServiceError';

    this.code =
      code;
  }
}

type ProviderRouteType =
  | 'balanced'
  | 'short';

interface GeoapifyRouteProperties {
  distance?:
    number;

  time?:
    number;
}

interface GeoapifyRouteGeometry {
  coordinates?:
    unknown;
}

interface GeoapifyRouteFeature {
  properties?:
    GeoapifyRouteProperties;

  geometry?:
    GeoapifyRouteGeometry;
}

interface GeoapifyRoutingResponse {
  features?:
    GeoapifyRouteFeature[];
}

/**
 * Checks that a coordinate is usable before sending it to
 * the routing provider.
 */
function isValidCoordinate(
  coordinate:
    RouteCoordinate
): boolean {
  return (
    Number.isFinite(
      coordinate.latitude
    ) &&
    Number.isFinite(
      coordinate.longitude
    ) &&
    coordinate.latitude >=
      -90 &&
    coordinate.latitude <=
      90 &&
    coordinate.longitude >=
      -180 &&
    coordinate.longitude <=
      180
  );
}

/**
 * Geoapify returns GeoJSON coordinates as:
 *
 * [longitude, latitude]
 *
 * and route geometry may contain nested arrays.
 */
function flattenGeoJsonCoordinates(
  value:
    unknown
): RouteCoordinate[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  const coordinates:
    RouteCoordinate[] = [];

  const visit =
    (
      item:
        unknown
    ): void => {
      if (
        !Array.isArray(
          item
        )
      ) {
        return;
      }

      if (
        item.length >=
          2 &&
        typeof item[0] ===
          'number' &&
        typeof item[1] ===
          'number'
      ) {
        const longitude =
          item[0];

        const latitude =
          item[1];

        const coordinate:
          RouteCoordinate = {
          latitude,
          longitude,
        };

        if (
          isValidCoordinate(
            coordinate
          )
        ) {
          coordinates.push(
            coordinate
          );
        }

        return;
      }

      item.forEach(
        visit
      );
    };

  visit(
    value
  );

  return coordinates;
}

/**
 * Creates a shaping point to one side of the direct line.
 *
 * IMPORTANT:
 * This does NOT create a fake route.
 *
 * The point is only supplied to Geoapify as a pass-through waypoint.
 * Geoapify still calculates a legal walking route through real roads.
 */
function buildDetourPoint(
  origin:
    RouteCoordinate,

  destination:
    RouteCoordinate,

  side:
    1 | -1,

  offsetDegrees:
    number
): RouteCoordinate {
  const midpointLatitude =
    (
      origin.latitude +
      destination.latitude
    ) /
    2;

  const midpointLongitude =
    (
      origin.longitude +
      destination.longitude
    ) /
    2;

  const dx =
    destination.longitude -
    origin.longitude;

  const dy =
    destination.latitude -
    origin.latitude;

  const length =
    Math.sqrt(
      dx * dx +
        dy * dy
    ) || 1;

  return {
    latitude:
      midpointLatitude +
      side *
        (
          -dx /
          length
        ) *
        offsetDegrees,

    longitude:
      midpointLongitude +
      side *
        (
          dy /
          length
        ) *
        offsetDegrees,
  };
}

/**
 * Builds the Geoapify request.
 *
 * When an intermediate point exists,
 * pass_through is used so it shapes the route
 * rather than becoming a separate journey stop.
 */
function buildRoutingUrl(
  waypoints:
    RouteCoordinate[],

  mode:
    RoutingMode,

  type:
    ProviderRouteType
): string {
  if (
    !geoapifyApiKey
  ) {
    throw new RoutingServiceError(
      'missing-api-key',

      'Routing service configuration is missing.'
    );
  }

  const waypointText =
    waypoints
      .map(
        point =>
          `${point.latitude},${point.longitude}`
      )
      .join(
        '|'
      );

  return (
    GEOAPIFY_ROUTING_URL +

    `?waypoints=${encodeURIComponent(
      waypointText
    )}` +

    `&mode=${encodeURIComponent(
      mode
    )}` +

    `&type=${encodeURIComponent(
      type
    )}` +

    '&intermediate_waypoint_mode=pass_through' +

    `&apiKey=${encodeURIComponent(
      geoapifyApiKey
    )}`
  );
}

function convertFeatureToRoute(
  feature:
    GeoapifyRouteFeature,

  id:
    string
): RoutingResult | null {
  const distanceMeters =
    feature.properties
      ?.distance;

  const durationSeconds =
    feature.properties
      ?.time;

  const coordinates =
    flattenGeoJsonCoordinates(
      feature.geometry
        ?.coordinates
    );

  if (
    typeof distanceMeters !==
      'number' ||
    !Number.isFinite(
      distanceMeters
    ) ||
    distanceMeters <=
      0 ||
    typeof durationSeconds !==
      'number' ||
    !Number.isFinite(
      durationSeconds
    ) ||
    durationSeconds <=
      0 ||
    coordinates.length <
      2
  ) {
    return null;
  }

  return {
    id,

    coordinates,

    distanceMeters,

    durationSeconds,
  };
}

async function requestRoute(
  waypoints:
    RouteCoordinate[],

  mode:
    RoutingMode,

  type:
    ProviderRouteType,

  id:
    string
): Promise<
  RoutingResult | null
> {
  let response:
    Response;

  try {
    response =
      await fetch(
        buildRoutingUrl(
          waypoints,
          mode,
          type
        )
      );
  } catch {
    throw new RoutingServiceError(
      'network-error',

      'Unable to connect to the routing service. Check your internet connection and try again.'
    );
  }

  if (
    response.status ===
    429
  ) {
    throw new RoutingServiceError(
      'rate-limit',

      'The routing service request limit has been reached. Please try again later.'
    );
  }

  /*
   * Some shaping points might be impossible to route through.
   *
   * One failed alternative should not make all other routes fail.
   */
  if (
    !response.ok
  ) {
    return null;
  }

  let data:
    GeoapifyRoutingResponse;

  try {
    data =
      (await response.json()) as
        GeoapifyRoutingResponse;
  } catch {
    return null;
  }

  if (
    !Array.isArray(
      data.features
    ) ||
    data.features.length ===
      0
  ) {
    return null;
  }

  return convertFeatureToRoute(
    data.features[0],
    id
  );
}

/**
 * Prevents almost identical provider results from appearing
 * as separate Fastest / Safest / Balanced choices.
 */
function routesAreEquivalent(
  first:
    RoutingResult,

  second:
    RoutingResult
): boolean {
  const distanceDifference =
    Math.abs(
      first.distanceMeters -
        second.distanceMeters
    );

  const durationDifference =
    Math.abs(
      first.durationSeconds -
        second.durationSeconds
    );

  /*
   * Also compare a point around the middle of both routes.
   * Two routes with similar duration can still travel different streets.
   */
  const firstMiddle =
    first.coordinates[
      Math.floor(
        first.coordinates.length /
          2
      )
    ];

  const secondMiddle =
    second.coordinates[
      Math.floor(
        second.coordinates.length /
          2
      )
    ];

  const middleDifference =
    Math.abs(
      firstMiddle.latitude -
        secondMiddle.latitude
    ) +
    Math.abs(
      firstMiddle.longitude -
        secondMiddle.longitude
    );

  return (
    distanceDifference <
      20 &&
    durationDifference <
      15 &&
    middleDifference <
      0.00015
  );
}

function deduplicateRoutes(
  routes:
    RoutingResult[]
): RoutingResult[] {
  const unique:
    RoutingResult[] = [];

  for (
    const route
    of routes
  ) {
    const duplicate =
      unique.some(
        existing =>
          routesAreEquivalent(
            existing,
            route
          )
      );

    if (
      !duplicate
    ) {
      unique.push(
        route
      );
    }
  }

  return unique;
}

/**
 * Retrieves real provider-routed alternatives.
 *
 * We deliberately ask Geoapify for several candidates:
 *
 * 1. Direct balanced route
 * 2. Direct shortest-distance route
 * 3. Small detour on one side
 * 4. Small detour on the other side
 * 5. Wider detour on one side
 * 6. Wider detour on the other side
 *
 * Geoapify calculates every geometry.
 *
 * SafeHer never fabricates a route by simply drawing points.
 */
export async function getRoutes(
  origin:
    RouteCoordinate,

  destination:
    RouteCoordinate,

  mode:
    RoutingMode =
      'walk'
): Promise<
  RoutingResult[]
> {
  if (
    !isValidCoordinate(
      origin
    )
  ) {
    throw new RoutingServiceError(
      'invalid-origin',

      'The selected origin location is invalid.'
    );
  }

  if (
    !isValidCoordinate(
      destination
    )
  ) {
    throw new RoutingServiceError(
      'invalid-destination',

      'The selected destination location is invalid.'
    );
  }

  const smallDetourA =
    buildDetourPoint(
      origin,
      destination,
      1,
      0.003
    );

  const smallDetourB =
    buildDetourPoint(
      origin,
      destination,
      -1,
      0.003
    );

  const wideDetourA =
    buildDetourPoint(
      origin,
      destination,
      1,
      0.006
    );

  const wideDetourB =
    buildDetourPoint(
      origin,
      destination,
      -1,
      0.006
    );

  const candidates =
    await Promise.all([
      requestRoute(
        [
          origin,
          destination,
        ],
        mode,
        'balanced',
        'route-direct-balanced'
      ),

      requestRoute(
        [
          origin,
          destination,
        ],
        mode,
        'short',
        'route-direct-short'
      ),

      requestRoute(
        [
          origin,
          smallDetourA,
          destination,
        ],
        mode,
        'balanced',
        'route-detour-a'
      ),

      requestRoute(
        [
          origin,
          smallDetourB,
          destination,
        ],
        mode,
        'balanced',
        'route-detour-b'
      ),

      requestRoute(
        [
          origin,
          wideDetourA,
          destination,
        ],
        mode,
        'balanced',
        'route-wide-a'
      ),

      requestRoute(
        [
          origin,
          wideDetourB,
          destination,
        ],
        mode,
        'balanced',
        'route-wide-b'
      ),
    ]);

  const validRoutes =
    candidates.filter(
      (
        route
      ): route is RoutingResult =>
        route !== null
    );

  const distinctRoutes =
    deduplicateRoutes(
      validRoutes
    );

  if (
    distinctRoutes.length ===
    0
  ) {
    throw new RoutingServiceError(
      'no-route',

      'No valid walking route could be found between the selected locations.'
    );
  }

  /*
   * Three choices are enough for the UI:
   *
   * Fastest
   * Safest
   * Balanced
   */
  return distinctRoutes.slice(
    0,
    3
  );
}

/**
 * Convenience method for screens that need only one route.
 */
export async function getRoute(
  origin:
    RouteCoordinate,

  destination:
    RouteCoordinate,

  mode:
    RoutingMode =
      'walk'
): Promise<
  RoutingResult
> {
  const routes =
    await getRoutes(
      origin,
      destination,
      mode
    );

  return routes[0];
}