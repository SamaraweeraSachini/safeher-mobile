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

/**
 * Maintains a real-time subscription to active Firestore incidents.
 */
export function useActiveIncidents() {
  const [incidents, setIncidents] =
    useState<Incident[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    connectionStatus,
    setConnectionStatus,
  ] =
    useState<IncidentConnectionStatus>(
      'connecting'
    );

  const [
    lastUpdatedAt,
    setLastUpdatedAt,
  ] =
    useState<Date | null>(null);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const retry = useCallback(() => {
    setRefreshKey(
      current => current + 1
    );
  }, []);

  useEffect(() => {
    let listenerIsActive = true;

    setIsLoading(true);
    setError(null);
    setConnectionStatus(
      'connecting'
    );

    const unsubscribe =
      subscribeToActiveIncidents(
        retrievedIncidents => {
          if (!listenerIsActive) {
            return;
          }

          setIncidents(
            retrievedIncidents
          );

          setError(null);

          setConnectionStatus(
            'live'
          );

          setLastUpdatedAt(
            new Date()
          );

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
          setError(
            retrievalError.message
          );

          setConnectionStatus(
            'error'
          );

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