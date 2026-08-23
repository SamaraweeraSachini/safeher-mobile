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

/**
 * Loads active incidents from Firestore in real time.
 *
 * The existing name is preserved because the Recent Incidents screen
 * already imports this hook.
 */
export function useActiveIncidents() {
  const [incidents, setIncidents] =
    useState<Incident[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const retry = useCallback(() => {
    setRefreshKey(current => current + 1);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe =
      subscribeToActiveIncidents(
        retrievedIncidents => {
          setIncidents(retrievedIncidents);
          setError(null);
          setIsLoading(false);
        },

        retrievalError => {
          setIncidents([]);
          setError(retrievalError.message);
          setIsLoading(false);
        }
      );

    return unsubscribe;
  }, [refreshKey]);

  return {
    incidents,
    isLoading,
    error,
    retry,
  };
}

/**
 * Backward-compatible export for the existing screen.
 */
export const useRecentIncidents =
  useActiveIncidents;