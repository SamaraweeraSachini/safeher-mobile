import { useCallback, useEffect, useState } from 'react';

import {
  IncidentRetrievalError,
  subscribeToUserReports,
} from '@/src/services/incident-service';

import type { Incident } from '@/src/types/incident';

export function useMyReports(userId: string | null, enabled: boolean) {
  const [reports, setReports] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const retry = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !userId) {
      setReports([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToUserReports(
      userId,
      (nextReports) => {
        if (!active) {
          return;
        }

        setReports(nextReports);
        setError(null);
        setIsLoading(false);
      },
      (retrievalError: IncidentRetrievalError) => {
        if (!active) {
          return;
        }

        setError(retrievalError.message);
        setIsLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [enabled, refreshKey, userId]);

  return { reports, isLoading, error, retry };
}
