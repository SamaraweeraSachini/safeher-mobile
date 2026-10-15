import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  useCallback,
  useState,
} from 'react';

import {
  getActiveSafeJourney,
  SafeJourneyError,
} from '@/src/services/safe-journey-service';

import type {
  StoredSafeJourney,
} from '@/src/types/safe-journey';

export function useActiveSafeJourney() {
  const [
    journey,
    setJourney,
  ] =
    useState<StoredSafeJourney | null>(
      null
    );

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

  const loadJourney =
    useCallback(
      async () => {
        setIsLoading(
          true
        );

        setError(
          null
        );

        try {
          const activeJourney =
            await getActiveSafeJourney();

          setJourney(
            activeJourney
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              SafeJourneyError
              ? loadError.message
              : 'Active journey could not be loaded.'
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
        void loadJourney();
      },
      [
        loadJourney,
      ]
    )
  );

  return {
    journey,

    isLoading,

    error,

    retry:
      loadJourney,

    refresh:
      loadJourney,
  };
}