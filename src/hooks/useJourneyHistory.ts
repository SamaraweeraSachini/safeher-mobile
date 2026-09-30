import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  getSafeJourneyHistory,
  SafeJourneyError,
} from '@/src/services/safe-journey-service';

import type {
  StoredSafeJourney,
} from '@/src/types/safe-journey';

export function useJourneyHistory() {
  const [
    journeys,
    setJourneys,
  ] = useState<
    StoredSafeJourney[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const loadHistory =
    useCallback(
      async () => {
        setIsLoading(true);
        setError(null);

        try {
          const history =
            await getSafeJourneyHistory();

          setJourneys(
            history
          );
        } catch (
          loadError
        ) {
          if (
            loadError instanceof
            SafeJourneyError
          ) {
            setError(
              loadError.message
            );
          } else {
            setError(
              'Journey history could not be loaded.'
            );
          }
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    journeys,
    isLoading,
    error,
    retry:
      loadHistory,
  };
}