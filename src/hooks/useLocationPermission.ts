import * as Location from 'expo-location';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

export type LocationPermissionState =
  | 'loading'
  | 'granted'
  | 'denied'
  | 'unavailable';

export function useLocationPermission() {
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
    }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return {
    permissionState,
    errorMessage,
    retry:
      requestPermission,
  };
}