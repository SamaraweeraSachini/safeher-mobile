import type { IncidentCategoryId } from '@/src/types/incident';

/**
 * The route categories supported by SafeHer.
 */
export type RouteType =
  | 'fastest'
  | 'safest'
  | 'balanced';

/**
 * A geographical point belonging to a route.
 */
export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Common route model used throughout the Safe Route feature.
 *
 * Routing services provide the coordinates, distance and duration.
 * SafeHer then adds the safety score and nearby incident count.
 */
export interface RouteOption {
  id: string;
  type: RouteType;
  coordinates: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
  safetyScore: number;
  nearbyIncidentCount: number;
}

export type RouteWarningLevel =
  | 'info'
  | 'caution'
  | 'concern';

export interface RouteWarning {
  id: string;
  incidentType: IncidentCategoryId;
  level: RouteWarningLevel;
  message: string;
  approximateDistanceMeters: number;
  recentReportCount: number;
  guidance: string;
}