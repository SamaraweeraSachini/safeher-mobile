import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  useCallback,
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
  ] =
    useState<
      StoredSafeJourney[]
    >([]);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

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
        setIsLoading(
          true
        );

        setError(
          null
        );

        try {
          const history =
            await getSafeJourneyHistory();

          setJourneys(
            history
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              SafeJourneyError
              ? loadError.message
              : 'Journey history could not be loaded.'
          );
        } finally {
          setIsLoading(
            false
          );
        }
      },
      []
    );

  useFocusEffect(
    useCallback(
      () => {
        void loadHistory();
      },
      [
        loadHistory,
      ]
    )
  );

  return {
    journeys,

    isLoading,

    error,

    retry:
      loadHistory,
  };
}