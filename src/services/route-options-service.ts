import { calculateRouteSafetyScore } from '@/src/services/safety-score-service';
import type { Incident } from '@/src/types/incident';
import type { RouteCoordinate, RouteOption, RouteType } from '@/src/types/route';
import { haversineDistanceMeters } from '@/src/utils/geo';

const METERS_PER_DEGREE_LATITUDE = 111320;

function offsetCoordinate(
  point: RouteCoordinate,
  northMeters: number,
  eastMeters: number
): RouteCoordinate {
  const metersPerDegreeLongitude =
    METERS_PER_DEGREE_LATITUDE *
    Math.cos((point.latitude * Math.PI) / 180);

  return {
    latitude: point.latitude + northMeters / METERS_PER_DEGREE_LATITUDE,
    longitude:
      point.longitude +
      eastMeters / (metersPerDegreeLongitude || METERS_PER_DEGREE_LATITUDE),
  };
}

function pathDistanceMeters(coordinates: RouteCoordinate[]): number {
  let totalMeters = 0;

  for (let index = 1; index < coordinates.length; index += 1) {
    totalMeters += haversineDistanceMeters(
      coordinates[index - 1],
      coordinates[index]
    );
  }

  return Math.max(Math.round(totalMeters), 200);
}

function toRouteOption(
  type: RouteType,
  coordinates: RouteCoordinate[],
  speedMetersPerSecond: number
): RouteOption {
  const distanceMeters = pathDistanceMeters(coordinates);

  return {
    id: `selected-${type}`,
    type,
    coordinates,
    distanceMeters,
    durationSeconds: Math.max(
      180,
      Math.round(distanceMeters / speedMetersPerSecond)
    ),
    safetyScore: 100,
    nearbyIncidentCount: 0,
  };
}

function geometriesFromIncidents(incidents: Incident[]): RouteOption[] {
  const reportedPoints = [...incidents]
    .sort((first, second) => {
      const latitudeDifference =
        first.coordinates.latitude - second.coordinates.latitude;

      if (latitudeDifference !== 0) {
        return latitudeDifference;
      }

      return first.coordinates.longitude - second.coordinates.longitude;
    })
    .map((incident) => ({
      latitude: incident.coordinates.latitude,
      longitude: incident.coordinates.longitude,
    }));

  const directPath =
    reportedPoints.length === 1
      ? [reportedPoints[0], offsetCoordinate(reportedPoints[0], 0, 1500)]
      : reportedPoints;

  const midpoint = {
    latitude:
      (directPath[0].latitude + directPath[directPath.length - 1].latitude) / 2,
    longitude:
      (directPath[0].longitude + directPath[directPath.length - 1].longitude) /
      2,
  };

  const balancedPath =
    directPath.length < 3
      ? [directPath[0], offsetCoordinate(midpoint, 700, 0), directPath[directPath.length - 1]]
      : directPath.map((point, index) =>
          index === 0 || index === directPath.length - 1
            ? point
            : offsetCoordinate(point, 550, 0)
        );

  const clearedPath = directPath.map((point) => offsetCoordinate(point, 750, 750));
  const safestPath = [
    clearedPath[0],
    offsetCoordinate(clearedPath[Math.floor(clearedPath.length / 2)], 500, 0),
    clearedPath[clearedPath.length - 1],
  ];

  return [
    toRouteOption('fastest', directPath, 9),
    toRouteOption('safest', safestPath, 5),
    toRouteOption('balanced', balancedPath, 6.5),
  ];
}

export function buildSelectableRoutes(incidents: Incident[]): RouteOption[] {
  if (incidents.length === 0) {
    return [];
  }

  return geometriesFromIncidents(incidents).map((route) => {
    const safety = calculateRouteSafetyScore(route.coordinates, incidents);

    return {
      ...route,
      safetyScore: safety.score,
      nearbyIncidentCount: safety.nearbyIncidentCount,
    };
  });
}
