import * as Location from 'expo-location';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { usePrivacyPreferences } from '@/src/context/PrivacyPreferencesContext';

export type LocationPermissionState =
  | 'loading'
  | 'granted'
  | 'denied'
  | 'unavailable';

const LOCATION_DISABLED_MESSAGE =
  'Location use is turned off in Privacy Settings. Turn it on there if you want SafeHer to use your location.';

export function useLocationPermission() {
  const { preferences, isReady } = usePrivacyPreferences();
  const [
    permissionState,
    setPermissionState,
  ] =
    useState<LocationPermissionState>(
      'loading'
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(null);

  const requestPermission =
    useCallback(async () => {
      if (!preferences.allowLocationUse) {
        setPermissionState('denied');
        setErrorMessage(LOCATION_DISABLED_MESSAGE);
        return;
      }

      try {
        setPermissionState(
          'loading'
        );

        setErrorMessage(null);

        const serviceEnabled =
          await Location.hasServicesEnabledAsync();

        if (!serviceEnabled) {
          setPermissionState(
            'unavailable'
          );

          setErrorMessage(
            'Location services are turned off. You can still use the Safety Map, but SafeHer cannot access your location until location services are enabled.'
          );

          return;
        }

        const permission =
          await Location
            .requestForegroundPermissionsAsync();

        if (
          permission.status ===
          'granted'
        ) {
          setPermissionState(
            'granted'
          );

          return;
        }

        setPermissionState(
          'denied'
        );

        setErrorMessage(
          'SafeHer uses your location to support safety-map and safer-journey features. You can still use the map without sharing your location.'
        );
      } catch (error) {
        console.error(
          'Location permission error:',
          error
        );

        setPermissionState(
          'unavailable'
        );

        setErrorMessage(
          'SafeHer could not check your location permission. Please try again.'
        );
      }
    }, [preferences.allowLocationUse]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!preferences.allowLocationUse) {
      setPermissionState('denied');
      setErrorMessage(LOCATION_DISABLED_MESSAGE);
      return;
    }

    requestPermission();
  }, [isReady, preferences.allowLocationUse, requestPermission]);

  return {
    permissionState,
    errorMessage,
    retry:
      requestPermission,
  };
}