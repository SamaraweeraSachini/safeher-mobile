import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  subscribeToActiveIncidents,
} from '@/src/services/incident-service';

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

  return {
    incidents,
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