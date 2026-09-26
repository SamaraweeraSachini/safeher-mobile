import {
    getWarningGuidance,
    getWarningLevel,
    getWarningMessage,
} from '@/constants/route-warnings';

import { isIncidentNearRoute } from '@/src/services/safety-score-service';
import { distanceToRouteMetres } from '@/src/utils/distance-calculation';

import type {
    Incident,
    IncidentCategoryId,
} from '@/src/types/incident';

import type {
    RouteOption,
    RouteWarning,
    RouteWarningLevel,
} from '@/src/types/route';

const WARNING_LEVEL_PRIORITY: Record<RouteWarningLevel, number> = {
  concern: 0,
  caution: 1,
  info: 2,
};

interface NearbyIncidentGroup {
  count: number;
  nearestDistanceMeters: number;
}

function groupNearbyIncidentsByType(
  route: RouteOption,
  incidents: Incident[]
): Map<IncidentCategoryId, NearbyIncidentGroup> {
  const groups = new Map<IncidentCategoryId, NearbyIncidentGroup>();

  incidents.forEach((incident) => {
    if (!isIncidentNearRoute(incident, route.coordinates)) {
      return;
    }

    const distanceMeters = distanceToRouteMetres(
      incident.coordinates,
      route.coordinates
    );

    const existingGroup = groups.get(incident.type);

    if (!existingGroup) {
      groups.set(incident.type, {
        count: 1,
        nearestDistanceMeters: distanceMeters,
      });

      return;
    }

    groups.set(incident.type, {
      count: existingGroup.count + 1,
      nearestDistanceMeters: Math.min(
        existingGroup.nearestDistanceMeters,
        distanceMeters
      ),
    });
  });

  return groups;
}

/**
 * Builds the safety warnings for a selected route using actual nearby
 * active-incident data (the same Firestore incidents shown on the Safety
 * Map).
 *
 * Only incidents within ROUTE_WARNING_RADIUS_METERS of the route generate a
 * warning. Warnings are grouped by incident category, so several reports of
 * the same type near a route produce a single warning with a report count
 * rather than a repeated card. Results are sorted with the more serious
 * levels first, then by how close the nearest report is.
 */
export function getRouteWarnings(
  route: RouteOption,
  incidents: Incident[]
): RouteWarning[] {
  const groupedIncidents = groupNearbyIncidentsByType(route, incidents);

  const warnings: RouteWarning[] = Array.from(
    groupedIncidents.entries()
  ).map(([incidentType, group]) => ({
    id: `${route.id}-${incidentType}`,
    incidentType,
    level: getWarningLevel(incidentType),
    message: getWarningMessage(incidentType),
    approximateDistanceMeters: Math.round(group.nearestDistanceMeters),
    recentReportCount: group.count,
    guidance: getWarningGuidance(incidentType),
  }));

  return warnings.sort((first, second) => {
    const levelDifference =
      WARNING_LEVEL_PRIORITY[first.level] -
      WARNING_LEVEL_PRIORITY[second.level];

    if (levelDifference !== 0) {
      return levelDifference;
    }

    return first.approximateDistanceMeters - second.approximateDistanceMeters;
  });
}