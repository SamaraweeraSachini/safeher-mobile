import {
  collection,
  getDocsFromServer,
  query,
  where,
} from 'firebase/firestore';

import { firestore } from '@/src/config/firebase';
import {
  convertIncidentDocument,
  IncidentRetrievalError,
} from '@/src/services/incident-service';
import type { Incident } from '@/src/types/incident';

/**
 * Retrieves active Firestore incidents for route scoring.
 *
 * The existing incident converter validates each document. Incidents without
 * a valid creation date are excluded because their age cannot be scored.
 * The returned Incident[] can be passed directly to
 * calculateRouteSafetyScore(routeCoordinates, incidents).
 */
export async function getIncidentsForRouteScoring(): Promise<Incident[]> {
  try {
    const activeIncidentsQuery = query(
      collection(firestore, 'incidents'),
      where('status', '==', 'active')
    );

    // Request server data so route scores use the current incident records.
    const snapshot = await getDocsFromServer(activeIncidentsQuery);
    const incidentsById = new Map<string, Incident>();

    for (const documentSnapshot of snapshot.docs) {
      const incident = convertIncidentDocument(
        documentSnapshot.id,
        documentSnapshot.data()
      );

      // A missing timestamp cannot be evaluated against the age rules.
      if (!incident?.createdAt) {
        continue;
      }

      incidentsById.set(incident.id, incident);
    }

    return Array.from(incidentsById.values());
  } catch (error) {
    console.error('Route-scoring incident retrieval failed:', error);

    throw new IncidentRetrievalError(
      'Could not load incident information for route scoring. Check your connection and try again.'
    );
  }
}