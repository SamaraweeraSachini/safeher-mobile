import type { IncidentCategoryId } from '@/src/types/incident';

/**
 * Points deducted when an active incident is close to a route.
 * Keep these values in one place so scoring stays consistent.
 */
export const INCIDENT_RISK_WEIGHTS: Record<IncidentCategoryId, number> = {
  assault: 20,
  harassment: 15,
  stalking: 15,
  'suspicious-activity': 10,
  'unsafe-transport': 10,
  'poor-lighting': 5,
  other: 5,
};

export const ROUTE_SCORING_RULES = {
  startingScore: 100,
  nearbyDistanceMetres: 250,
  recentDays: 7,
  olderDays: 30,
  olderIncidentMultiplier: 0.5,
} as const;