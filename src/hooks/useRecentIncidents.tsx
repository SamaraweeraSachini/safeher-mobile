import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useAuth } from '@/src/context/AuthContext';
import {
  subscribeToActiveIncidents,
} from '@/src/services/incident-service';
import { subscribeToRemovedReportIds } from '@/src/services/report-withdrawal-service';

import type {
  Incident,
} from '@/src/types/incident';

export type IncidentConnectionStatus =
  | 'connecting'
  | 'live'
  | 'error';

let sharedIncidents: Incident[] | null = null;
let sharedError: string | null = null;
let sharedConnectionStatus: IncidentConnectionStatus = 'connecting';
let sharedLastUpdatedAt: Date | null = null;

/**
 * Maintains a real-time subscription to active Firestore incidents.
 */
export function useActiveIncidents() {
  const { user, isRegisteredUser } = useAuth();
  const [removedReportIds, setRemovedReportIds] = useState<string[]>([]);
  const [incidents, setIncidents] =
    useState<Incident[]>(sharedIncidents ?? []);

  const [isLoading, setIsLoading] =
    useState(sharedIncidents === null);

  const [error, setError] =
    useState<string | null>(sharedError);

  const [
    connectionStatus,
    setConnectionStatus,
  ] =
    useState<IncidentConnectionStatus>(
      sharedIncidents === null ? 'connecting' : sharedConnectionStatus
    );

  const [
    lastUpdatedAt,
    setLastUpdatedAt,
  ] =
    useState<Date | null>(sharedLastUpdatedAt);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const retry = useCallback(() => {
    setRefreshKey(
      current => current + 1
    );
  }, []);

  useEffect(() => {
    if (!isRegisteredUser || !user) {
      setRemovedReportIds([]);
      return;
    }

    return subscribeToRemovedReportIds(user.uid, setRemovedReportIds);
  }, [isRegisteredUser, user]);

  useEffect(() => {
    let listenerIsActive = true;

    if (sharedIncidents === null) {
      setIsLoading(true);
      setError(null);
      setConnectionStatus('connecting');
    }

    const unsubscribe =
      subscribeToActiveIncidents(
        retrievedIncidents => {
          if (!listenerIsActive) {
            return;
          }

          const updatedAt = new Date();
          sharedIncidents = retrievedIncidents;
          sharedError = null;
          sharedConnectionStatus = 'live';
          sharedLastUpdatedAt = updatedAt;

          setIncidents(retrievedIncidents);
          setError(null);
          setConnectionStatus('live');
          setLastUpdatedAt(updatedAt);
          setIsLoading(false);
        },

        retrievalError => {
          if (!listenerIsActive) {
            return;
          }

          /*
           * Existing markers remain visible during a temporary listener
           * failure instead of removing previously retrieved safety data.
           */
          sharedError = retrievalError.message;
          sharedConnectionStatus = 'error';

          setError(retrievalError.message);
          setConnectionStatus('error');
          setIsLoading(false);
        }
      );

    return () => {
      listenerIsActive = false;
      unsubscribe();
    };
  }, [refreshKey]);

  const removedIds = new Set(removedReportIds);

  return {
    incidents: incidents.filter((incident) => !removedIds.has(incident.id)),
    isLoading,
    error,
    retry,
    connectionStatus,
    lastUpdatedAt,
  };
}

/**
 * Backward-compatible export for the existing Recent Incidents screen.
 */
export const useRecentIncidents =
  useActiveIncidents;