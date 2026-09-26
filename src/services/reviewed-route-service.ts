import * as Location from 'expo-location';

import {
  calculateRouteSafetyScore,
  isIncidentNearRoute,
} from '@/src/services/safety-score-service';
import type { Incident } from '@/src/types/incident';
import type { RouteCoordinate, RouteOption } from '@/src/types/route';
import { haversineDistanceMeters } from '@/src/utils/geo';

const ROUTE_REQUEST_TIMEOUT_MS = 8000;
const NEAREST_REPORT_LIMIT_METERS = 8000;
const LOCAL_TRIP_METERS = 2000;

type RoadRoute = {
  coordinates: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
};

function offsetMeters(
  origin: RouteCoordinate,
  northMeters: number,
  eastMeters: number
): RouteCoordinate {
  const metersPerDegreeLatitude = 111320;
  const metersPerDegreeLongitude =
    metersPerDegreeLatitude * Math.cos((origin.latitude * Math.PI) / 180);

  return {
    latitude: origin.latitude + northMeters / metersPerDegreeLatitude,
    longitude:
      origin.longitude +
      eastMeters / (metersPerDegreeLongitude || metersPerDegreeLatitude),
  };
}

function pointBeyond(
  origin: RouteCoordinate,
  target: RouteCoordinate,
  extraMeters: number
): RouteCoordinate {
  const northMeters = (target.latitude - origin.latitude) * 111320;
  const eastMeters =
    (target.longitude - origin.longitude) *
    111320 *
    Math.cos((origin.latitude * Math.PI) / 180);
  const lengthMeters = Math.hypot(northMeters, eastMeters) || 1;
  const totalMeters = lengthMeters + extraMeters;

  return offsetMeters(
    origin,
    (northMeters / lengthMeters) * totalMeters,
    (eastMeters / lengthMeters) * totalMeters
  );
}

function routeEnd(origin: RouteCoordinate, incidents: Incident[]): RouteCoordinate[] {
  const nearestReport = incidents
    .map((incident) => ({
      coordinate: incident.coordinates,
      distanceMeters: haversineDistanceMeters(origin, incident.coordinates),
    }))
    .filter((report) => report.distanceMeters <= NEAREST_REPORT_LIMIT_METERS)
    .sort((first, second) => first.distanceMeters - second.distanceMeters)[0];

  if (!nearestReport) {
    return [origin, offsetMeters(origin, LOCAL_TRIP_METERS, 0)];
  }

  return [
    origin,
    nearestReport.coordinate,
    pointBeyond(origin, nearestReport.coordinate, 400),
  ];
}

async function fetchRoadRoute(points: RouteCoordinate[]): Promise<RoadRoute> {
  const path = points
    .map((point) => `${point.longitude},${point.latitude}`)
    .join(';');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ROUTE_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${path}?overview=simplified&geometries=geojson`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error('Road route request failed.');
    }

    const body = (await response.json()) as {
      routes?: Array<{
        distance: number;
        duration: number;
        geometry?: { coordinates?: Array<[number, number]> };
      }>;
    };
    const route = body.routes?.[0];
    const coordinates =
      route?.geometry?.coordinates?.map(([longitude, latitude]) => ({
        latitude,
        longitude,
      })) ?? [];

    if (!route || coordinates.length < 2) {
      throw new Error('No road route was returned.');
    }

    return {
      coordinates,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function placeLabel(
  point: RouteCoordinate,
  fallback: string
): Promise<string> {
  try {
    const places = await Location.reverseGeocodeAsync(point);
    const place = places[0];

    if (!place) {
      return fallback;
    }

    const parts = [place.street, place.district, place.city].filter(
      (part, index, all): part is string =>
        Boolean(part) && all.indexOf(part) === index
    );

    return parts.slice(0, 2).join(', ') || fallback;
  } catch {
    return fallback;
  }
}

function nearbyIncidentCount(
  coordinates: RouteCoordinate[],
  incidents: Incident[]
): number {
  return incidents.filter((incident) =>
    isIncidentNearRoute(incident, coordinates)
  ).length;
}

export type ReviewedRoad = RoadRoute;

export function buildLocalRoad(
  origin: RouteCoordinate,
  incidents: Incident[]
): ReviewedRoad {
  const coordinates = routeEnd(origin, incidents);
  let distanceMeters = 0;

  for (let index = 1; index < coordinates.length; index += 1) {
    distanceMeters += haversineDistanceMeters(
      coordinates[index - 1],
      coordinates[index]
    );
  }

  return {
    coordinates,
    distanceMeters,
    durationSeconds: Math.max(60, Math.round(distanceMeters / 7)),
  };
}

export async function loadReviewedRoad(
  origin: RouteCoordinate,
  incidents: Incident[]
): Promise<ReviewedRoad> {
  return fetchRoadRoute(routeEnd(origin, incidents));
}

export function toReviewedRoute(
  road: ReviewedRoad,
  incidents: Incident[]
): RouteOption {
  const safety = calculateRouteSafetyScore(road.coordinates, incidents);

  return {
    id: 'reviewed-route',
    type: 'balanced',
    coordinates: road.coordinates,
    distanceMeters: Math.round(road.distanceMeters),
    durationSeconds: Math.round(road.durationSeconds),
    safetyScore: safety.score,
    nearbyIncidentCount: nearbyIncidentCount(road.coordinates, incidents),
  };
}
