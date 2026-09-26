import {
  INCIDENT_RISK_WEIGHTS,
  ROUTE_SCORING_RULES,
} from '@/constants/risk-weights';
import type {
  Incident,
  IncidentCoordinates,
} from '@/src/types/incident';
import { distanceToRouteMetres } from '@/src/utils/distance-calculation';

export type SafetyLevel =
  | 'lower-reported-risk'
  | 'moderate-reported-risk'
  | 'higher-reported-risk';

export interface RouteSafetyScore {
  score: number;
  level: SafetyLevel;
  nearbyIncidentCount: number;
  seriousIncidentCount: number;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function getSafetyLevel(score: number): SafetyLevel {
  if (score >= 80) {
    return 'lower-reported-risk';
  }

  if (score >= 60) {
    return 'moderate-reported-risk';
  }

  return 'higher-reported-risk';
}

function getAgeMultiplier(
  incident: Incident,
  now: Date
): number {
  if (!incident.createdAt) {
    return 0;
  }

  const incidentDate = incident.createdAt.toDate();
  const ageInDays = Math.max(
    0,
    (now.getTime() - incidentDate.getTime()) /
      MILLISECONDS_PER_DAY
  );

  if (ageInDays <= ROUTE_SCORING_RULES.recentDays) {
    return 1;
  }

  if (ageInDays <= ROUTE_SCORING_RULES.olderDays) {
    return ROUTE_SCORING_RULES.olderIncidentMultiplier;
  }

  return 0;
}

/**
 * Scores one route against active, recent incidents.
 *
 * Each incident is considered once, even when it is close to several
 * coordinates or segments of the same route.
 */
export function calculateRouteSafetyScore(
  routeCoordinates: readonly IncidentCoordinates[],
  incidents: readonly Incident[],
  now: Date = new Date()
): RouteSafetyScore {
  if (routeCoordinates.length === 0) {
    throw new Error('Cannot score a route without coordinates.');
  }

  let totalPenalty = 0;
  let nearbyIncidentCount = 0;
  let seriousIncidentCount = 0;
  const countedIncidentIds = new Set<string>();

  for (const incident of incidents) {
    if (
      incident.status !== 'active' ||
      countedIncidentIds.has(incident.id)
    ) {
      continue;
    }

    const ageMultiplier = getAgeMultiplier(incident, now);

    if (ageMultiplier === 0) {
      continue;
    }

    const distance = distanceToRouteMetres(
      incident.coordinates,
      routeCoordinates
    );

    if (distance > ROUTE_SCORING_RULES.nearbyDistanceMetres) {
      continue;
    }

    countedIncidentIds.add(incident.id);
    nearbyIncidentCount += 1;

    if (incident.type === 'assault') {
      seriousIncidentCount += 1;
    }

    totalPenalty +=
      INCIDENT_RISK_WEIGHTS[incident.type] * ageMultiplier;
  }

  const score = Math.max(
    0,
    Math.round(
      ROUTE_SCORING_RULES.startingScore - totalPenalty
    )
  );

  return {
    score,
    level: getSafetyLevel(score),
    nearbyIncidentCount,
    seriousIncidentCount,
  };
}