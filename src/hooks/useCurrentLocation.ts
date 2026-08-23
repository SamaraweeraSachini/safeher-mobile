import * as Location from 'expo-location';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import type {
  LocationPermissionState,
} from '@/src/hooks/useLocationPermission';

export type CurrentLocation = {
  latitude: number;
  longitude: number;
};

export function useCurrentLocation(
  permissionState: LocationPermissionState
) {
  const [
    location,
    setLocation,
  ] =
    useState<CurrentLocation | null>(
      null
    );

  const [
    isLocationLoading,
    setIsLocationLoading,
  ] = useState(false);

  const [
    locationError,
    setLocationError,
  ] =
    useState<string | null>(
      null
    );

  const getCurrentLocation =
    useCallback(async () => {
      if (
        permissionState !==
        'granted'
      ) {
        return;
      }

      try {
        setIsLocationLoading(
          true
        );

        setLocationError(null);

        const position =
          await Location
            .getCurrentPositionAsync(
              {
                accuracy:
                  Location
                    .Accuracy
                    .Balanced,
              }
            );

        setLocation({
          latitude:
            position.coords
              .latitude,

          longitude:
            position.coords
              .longitude,
        });
      } catch (error) {
        console.error(
          'Current location error:',
          error
        );

        setLocation(null);

        setLocationError(
          'SafeHer could not retrieve your current location. Please make sure location services are enabled and try again.'
        );
      } finally {
        setIsLocationLoading(
          false
        );
      }
    }, [permissionState]);

  useEffect(() => {
    if (
      permissionState ===
      'granted'
    ) {
      getCurrentLocation();
    } else {
      setLocation(null);

      setLocationError(null);

      setIsLocationLoading(
        false
      );
    }
  }, [
    permissionState,
    getCurrentLocation,
  ]);

  return {
    location,
    isLocationLoading,
    locationError,
    retryLocation:
      getCurrentLocation,
  };
}