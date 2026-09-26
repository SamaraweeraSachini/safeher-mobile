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
  coordinates: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
}

interface GeoapifyRouteProperties {
  distance?: number;
  time?: number;
}

interface GeoapifyRouteFeature {
  properties?: GeoapifyRouteProperties;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
}

interface GeoapifyRoutingResponse {
  features?: GeoapifyRouteFeature[];
}

export class RoutingServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoutingServiceError';
  }
}

function validateCoordinate(
  coordinate: RouteCoordinate
): void {
  if (
    !Number.isFinite(coordinate.latitude) ||
    !Number.isFinite(coordinate.longitude) ||
    coordinate.latitude < -90 ||
    coordinate.latitude > 90 ||
    coordinate.longitude < -180 ||
    coordinate.longitude > 180
  ) {
    throw new RoutingServiceError(
      'Invalid route coordinate.'
    );
  }
}

function flattenGeoJsonCoordinates(
  value: unknown
): RouteCoordinate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: RouteCoordinate[] = [];

  const visit = (item: unknown): void => {
    if (!Array.isArray(item)) {
      return;
    }

    if (
      item.length >= 2 &&
      typeof item[0] === 'number' &&
      typeof item[1] === 'number'
    ) {
      result.push({
        longitude: item[0],
        latitude: item[1],
      });

      return;
    }

    item.forEach(visit);
  };

  visit(value);

  return result;
}

/**
 * Requests a route from Geoapify between two coordinates.
 *
 * Geoapify is responsible only for the road/walking route geometry,
 * distance and travel time. SafeHer's own services later calculate
 * incident-based safety scores and compare route choices.
 */
export async function getRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  mode: RoutingMode = 'walk'
): Promise<RoutingResult> {
  validateCoordinate(origin);
  validateCoordinate(destination);

  if (!geoapifyApiKey) {
    throw new RoutingServiceError(
      'Missing EXPO_PUBLIC_GEOAPIFY_API_KEY environment variable.'
    );
  }

  const waypoints =
    `${origin.latitude},${origin.longitude}` +
    `|${destination.latitude},${destination.longitude}`;

  const url =
    `${GEOAPIFY_ROUTING_URL}` +
    `?waypoints=${encodeURIComponent(waypoints)}` +
    `&mode=${encodeURIComponent(mode)}` +
    `&apiKey=${encodeURIComponent(geoapifyApiKey)}`;

  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new RoutingServiceError(
      'Unable to connect to the routing service.'
    );
  }

  if (!response.ok) {
    throw new RoutingServiceError(
      `Routing request failed with status ${response.status}.`
    );
  }

  const data =
    (await response.json()) as GeoapifyRoutingResponse;

  const route = data.features?.[0];

  if (!route) {
    throw new RoutingServiceError(
      'No route was returned for these locations.'
    );
  }

  const distanceMeters = route.properties?.distance;
  const durationSeconds = route.properties?.time;

  if (
    typeof distanceMeters !== 'number' ||
    typeof durationSeconds !== 'number'
  ) {
    throw new RoutingServiceError(
      'Routing service returned incomplete route information.'
    );
  }

  const coordinates =
    flattenGeoJsonCoordinates(
      route.geometry?.coordinates
    );

  if (coordinates.length < 2) {
    throw new RoutingServiceError(
      'Routing service returned invalid route geometry.'
    );
  }

  return {
    coordinates,
    distanceMeters,
    durationSeconds,
  };
}