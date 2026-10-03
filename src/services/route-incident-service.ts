import {
  collection,
  getDocsFromServer,
  query,
  where,
} from 'firebase/firestore';

import { firestore } from '@/src/config/firebase';
import {
  IncidentRetrievalError,
  visibleActiveIncidents,
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

    return visibleActiveIncidents(
      snapshot.docs.map((documentSnapshot) => ({
        id: documentSnapshot.id,
        data: documentSnapshot.data(),
      }))
    ).filter((incident) => incident.createdAt);
  } catch (error) {
    console.error('Route-scoring incident retrieval failed:', error);

    throw new IncidentRetrievalError(
      'Could not load incident information for route scoring. Check your connection and try again.'
    );
  }
}