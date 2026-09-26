import type { RouteCoordinate } from '@/src/types/route';

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
  coordinates: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
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
  code: RoutingErrorCode;

  constructor(
    code: RoutingErrorCode,
    message: string
  ) {
    super(message);

    this.name = 'RoutingServiceError';
    this.code = code;
  }
}

interface GeoapifyRouteProperties {
  distance?: number;
  time?: number;
}

interface GeoapifyRouteGeometry {
  type?: string;
  coordinates?: unknown;
}

interface GeoapifyRouteFeature {
  properties?: GeoapifyRouteProperties;
  geometry?: GeoapifyRouteGeometry;
}

interface GeoapifyRoutingResponse {
  features?: GeoapifyRouteFeature[];
}

function isValidCoordinate(
  coordinate: RouteCoordinate
): boolean {
  return (
    Number.isFinite(coordinate.latitude) &&
    Number.isFinite(coordinate.longitude) &&
    coordinate.latitude >= -90 &&
    coordinate.latitude <= 90 &&
    coordinate.longitude >= -180 &&
    coordinate.longitude <= 180
  );
}

function validateCoordinates(
  origin: RouteCoordinate,
  destination: RouteCoordinate
): void {
  if (!isValidCoordinate(origin)) {
    throw new RoutingServiceError(
      'invalid-origin',
      'The selected origin location is invalid.'
    );
  }

  if (!isValidCoordinate(destination)) {
    throw new RoutingServiceError(
      'invalid-destination',
      'The selected destination location is invalid.'
    );
  }
}

function flattenGeoJsonCoordinates(
  value: unknown
): RouteCoordinate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const coordinates: RouteCoordinate[] = [];

  const visit = (item: unknown): void => {
    if (!Array.isArray(item)) {
      return;
    }

    if (
      item.length >= 2 &&
      typeof item[0] === 'number' &&
      typeof item[1] === 'number'
    ) {
      const longitude = item[0];
      const latitude = item[1];

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        coordinates.push({
          latitude,
          longitude,
        });
      }

      return;
    }

    item.forEach(visit);
  };

  visit(value);

  return coordinates;
}

function convertFeatureToRoute(
  feature: GeoapifyRouteFeature,
  index: number
): RoutingResult | null {
  const distanceMeters =
    feature.properties?.distance;

  const durationSeconds =
    feature.properties?.time;

  const coordinates =
    flattenGeoJsonCoordinates(
      feature.geometry?.coordinates
    );

  if (
    typeof distanceMeters !== 'number' ||
    !Number.isFinite(distanceMeters) ||
    distanceMeters <= 0 ||
    typeof durationSeconds !== 'number' ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 ||
    coordinates.length < 2
  ) {
    return null;
  }

  return {
    id: `route-${index + 1}`,
    coordinates,
    distanceMeters,
    durationSeconds,
  };
}

function buildRoutingUrl(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  mode: RoutingMode
): string {
  if (!geoapifyApiKey) {
    throw new RoutingServiceError(
      'missing-api-key',
      'Routing service configuration is missing.'
    );
  }

  const waypoints =
    `${origin.latitude},${origin.longitude}` +
    `|${destination.latitude},${destination.longitude}`;

  return (
    `${GEOAPIFY_ROUTING_URL}` +
    `?waypoints=${encodeURIComponent(waypoints)}` +
    `&mode=${encodeURIComponent(mode)}` +
    `&apiKey=${encodeURIComponent(geoapifyApiKey)}`
  );
}

/**
 * Retrieves possible routes between an origin and destination.
 *
 * Geoapify returns route geometry, distance and estimated travel time.
 * If the provider returns multiple route features, all valid routes are
 * returned so SafeHer can process and compare them later.
 */
export async function getRoutes(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  mode: RoutingMode = 'walk'
): Promise<RoutingResult[]> {
  validateCoordinates(origin, destination);

  const url = buildRoutingUrl(
    origin,
    destination,
    mode
  );

  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new RoutingServiceError(
      'network-error',
      'Unable to connect to the routing service. Check your internet connection and try again.'
    );
  }

  if (response.status === 429) {
    throw new RoutingServiceError(
      'rate-limit',
      'The routing service request limit has been reached. Please try again later.'
    );
  }

  if (!response.ok) {
    throw new RoutingServiceError(
      'service-error',
      'The routing service is temporarily unavailable. Please try again.'
    );
  }

  let data: GeoapifyRoutingResponse;

  try {
    data =
      (await response.json()) as GeoapifyRoutingResponse;
  } catch {
    throw new RoutingServiceError(
      'invalid-response',
      'The routing service returned an invalid response.'
    );
  }

  if (!Array.isArray(data.features)) {
    throw new RoutingServiceError(
      'invalid-response',
      'The routing service returned an invalid response.'
    );
  }

  if (data.features.length === 0) {
    throw new RoutingServiceError(
      'no-route',
      'No route could be found between the selected locations.'
    );
  }

  const routes = data.features
    .map((feature, index) =>
      convertFeatureToRoute(feature, index)
    )
    .filter(
      (route): route is RoutingResult =>
        route !== null
    );

  if (routes.length === 0) {
    throw new RoutingServiceError(
      'no-route',
      'No valid route could be found between the selected locations.'
    );
  }

  return routes;
}

/**
 * Convenience method for features that only need the first available route.
 */
export async function getRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  mode: RoutingMode = 'walk'
): Promise<RoutingResult> {
  const routes = await getRoutes(
    origin,
    destination,
    mode
  );

  return routes[0];
}