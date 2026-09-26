import type { IncidentCoordinates } from '@/src/types/incident';

const EARTH_RADIUS_METRES = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Estimates the shortest distance from a location to one route segment.
 */
function distanceToSegmentMetres(
  point: IncidentCoordinates,
  start: IncidentCoordinates,
  end: IncidentCoordinates
): number {
  const referenceLatitude = toRadians(point.latitude);

  function project(coordinates: IncidentCoordinates) {
    return {
      x:
        toRadians(coordinates.longitude - point.longitude) *
        EARTH_RADIUS_METRES *
        Math.cos(referenceLatitude),
      y:
        toRadians(coordinates.latitude - point.latitude) *
        EARTH_RADIUS_METRES,
    };
  }

  const a = project(start);
  const b = project(end);
  const segmentLengthSquared =
    (b.x - a.x) ** 2 + (b.y - a.y) ** 2;

  if (segmentLengthSquared === 0) {
    return Math.hypot(a.x, a.y);
  }

  const position = Math.max(
    0,
    Math.min(
      1,
      (-a.x * (b.x - a.x) - a.y * (b.y - a.y)) /
        segmentLengthSquared
    )
  );

  const closestX = a.x + position * (b.x - a.x);
  const closestY = a.y + position * (b.y - a.y);

  return Math.hypot(closestX, closestY);
}

/**
 * Returns the distance to the closest point along the route.
 * The route coordinates must follow the actual route shape.
 */
export function distanceToRouteMetres(
  point: IncidentCoordinates,
  routeCoordinates: readonly IncidentCoordinates[]
): number {
  if (routeCoordinates.length === 0) {
    return Infinity;
  }

  if (routeCoordinates.length === 1) {
    return distanceToSegmentMetres(
      point,
      routeCoordinates[0],
      routeCoordinates[0]
    );
  }

  let shortestDistance = Infinity;

  for (let index = 0; index < routeCoordinates.length - 1; index++) {
    shortestDistance = Math.min(
      shortestDistance,
      distanceToSegmentMetres(
        point,
        routeCoordinates[index],
        routeCoordinates[index + 1]
      )
    );
  }

  return shortestDistance;
}