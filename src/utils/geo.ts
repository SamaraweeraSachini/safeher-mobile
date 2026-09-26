import type { RouteCoordinate } from '@/src/types/route';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceMeters(
  first: RouteCoordinate,
  second: RouteCoordinate
): number {
  const deltaLatitude = toRadians(second.latitude - first.latitude);
  const deltaLongitude = toRadians(second.longitude - first.longitude);

  const firstLatitudeRadians = toRadians(first.latitude);
  const secondLatitudeRadians = toRadians(second.latitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(firstLatitudeRadians) *
      Math.cos(secondLatitudeRadians) *
      Math.sin(deltaLongitude / 2) ** 2;

  const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * centralAngle;
}

function projectToLocalPlane(
  point: RouteCoordinate,
  referenceLatitude: number
): { x: number; y: number } {
  const metersPerDegreeLatitude = 111320;
  const metersPerDegreeLongitude =
    111320 * Math.cos(toRadians(referenceLatitude));

  return {
    x: point.longitude * metersPerDegreeLongitude,
    y: point.latitude * metersPerDegreeLatitude,
  };
}

function distanceToSegmentMeters(
  point: RouteCoordinate,
  segmentStart: RouteCoordinate,
  segmentEnd: RouteCoordinate
): number {
  const referenceLatitude = segmentStart.latitude;

  const projectedPoint = projectToLocalPlane(point, referenceLatitude);
  const projectedStart = projectToLocalPlane(segmentStart, referenceLatitude);
  const projectedEnd = projectToLocalPlane(segmentEnd, referenceLatitude);

  const segmentDeltaX = projectedEnd.x - projectedStart.x;
  const segmentDeltaY = projectedEnd.y - projectedStart.y;

  const segmentLengthSquared =
    segmentDeltaX * segmentDeltaX + segmentDeltaY * segmentDeltaY;

  if (segmentLengthSquared === 0) {
    return haversineDistanceMeters(point, segmentStart);
  }

  const projectionRatio = Math.max(
    0,
    Math.min(
      1,
      ((projectedPoint.x - projectedStart.x) * segmentDeltaX +
        (projectedPoint.y - projectedStart.y) * segmentDeltaY) /
        segmentLengthSquared
    )
  );

  const closestX = projectedStart.x + projectionRatio * segmentDeltaX;
  const closestY = projectedStart.y + projectionRatio * segmentDeltaY;

  const distanceX = projectedPoint.x - closestX;
  const distanceY = projectedPoint.y - closestY;

  return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
}

export function distanceToRouteMeters(
  point: RouteCoordinate,
  routeCoordinates: RouteCoordinate[]
): number | null {
  if (routeCoordinates.length === 0) {
    return null;
  }

  if (routeCoordinates.length === 1) {
    return haversineDistanceMeters(point, routeCoordinates[0]);
  }

  let shortestDistanceMeters = Infinity;

  for (let index = 0; index < routeCoordinates.length - 1; index += 1) {
    const segmentDistanceMeters = distanceToSegmentMeters(
      point,
      routeCoordinates[index],
      routeCoordinates[index + 1]
    );

    if (segmentDistanceMeters < shortestDistanceMeters) {
      shortestDistanceMeters = segmentDistanceMeters;
    }
  }

  return shortestDistanceMeters;
}