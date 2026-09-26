import type { IncidentCategoryId } from '@/src/types/incident';

export type RouteType = 'fastest' | 'safest' | 'balanced';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteOption {
  id: string;
  type: RouteType;
  coordinates: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
  safetyScore: number;
  nearbyIncidentCount: number;
}

export type RouteWarningLevel = 'info' | 'caution' | 'concern';

export interface RouteWarning {
  id: string;
  incidentType: IncidentCategoryId;
  level: RouteWarningLevel;
  message: string;
  approximateDistanceMeters: number;
  recentReportCount: number;
  guidance: string;
}