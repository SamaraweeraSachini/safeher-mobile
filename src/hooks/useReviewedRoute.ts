import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';
import { useLocationPermission } from '@/src/hooks/useLocationPermission';
import { useActiveIncidents } from '@/src/hooks/useRecentIncidents';
import {
  buildLocalRoad,
  loadReviewedRoad,
  placeLabel,
  toReviewedRoute,
  type ReviewedRoad,
} from '@/src/services/reviewed-route-service';
import {
  useSelectedRouteReview,
  type SelectedRouteReview,
} from '@/src/state/selected-route';

import type { Incident } from '@/src/types/incident';
import type { RouteCoordinate } from '@/src/types/route';

type ReviewedRoadCache = {
  originKey: string;
  road: ReviewedRoad;
  originLabel: string;
  destinationLabel: string;
};

let reviewedRoadCache: ReviewedRoadCache | null = null;

function originKeyFor(origin: RouteCoordinate | null): string {
  if (!origin) {
    return '';
  }

  return `${origin.latitude.toFixed(3)},${origin.longitude.toFixed(3)}`;
}

export function useReviewedRoute() {
  const providedRoute = useSelectedRouteReview();
  const { incidents, retry: retryIncidents } = useActiveIncidents();
  const { permissionState, retry: retryPermission } = useLocationPermission();
  const { location, isLocationLoading, locationError, retryLocation } =
    useCurrentLocation(permissionState);
  const [quickOrigin, setQuickOrigin] = useState<RouteCoordinate | null>(null);
  const [roadCache, setRoadCache] = useState<ReviewedRoadCache | null>(
    reviewedRoadCache
  );
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const incidentsRef = useRef<Incident[]>(incidents);
  incidentsRef.current = incidents;

  const origin = location ?? quickOrigin;
  const originKey = originKeyFor(origin);

  useEffect(() => {
    if (permissionState !== 'granted') {
      return;
    }

    let cancelled = false;

    Location.getLastKnownPositionAsync()
      .then((position) => {
        if (cancelled || !position) {
          return;
        }

        setQuickOrigin({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [permissionState]);

  useEffect(() => {
    if (providedRoute || !origin) {
      return;
    }

    if (
      refreshKey === 0 &&
      reviewedRoadCache?.originKey === originKey &&
      reviewedRoadCache.originLabel !== 'Current location'
    ) {
      setRoadCache(reviewedRoadCache);
      return;
    }

    let cancelled = false;
    const localRoad = buildLocalRoad(origin, incidentsRef.current);
    const localCache = {
      originKey,
      road: localRoad,
      originLabel: 'Current location',
      destinationLabel: 'Destination',
    };
    reviewedRoadCache = localCache;
    setRoadCache(localCache);
    setIsRouting(true);
    setRouteError(null);

    const loadReview = async () => {
      try {
        const road = await loadReviewedRoad(origin, incidentsRef.current);
        const destination = road.coordinates[road.coordinates.length - 1];
        const [originLabel, destinationLabel] = await Promise.all([
          placeLabel(origin, 'Current location'),
          placeLabel(destination, 'Destination'),
        ]);

        if (cancelled) {
          return;
        }

        const nextCache = {
          originKey,
          road,
          originLabel,
          destinationLabel,
        };
        reviewedRoadCache = nextCache;
        setRoadCache(nextCache);
      } catch (loadError) {
        console.error('Reviewed route load failed:', loadError);

        if (!cancelled) {
          const destination = localRoad.coordinates[localRoad.coordinates.length - 1];
          const [originLabel, destinationLabel] = await Promise.all([
            placeLabel(origin, 'Current location'),
            placeLabel(destination, 'Destination'),
          ]);

          if (!cancelled) {
            const namedCache = {
              originKey,
              road: localRoad,
              originLabel,
              destinationLabel,
            };
            reviewedRoadCache = namedCache;
            setRoadCache(namedCache);
          }
        }
      } finally {
        if (!cancelled) {
          setIsRouting(false);
        }
      }
    };

    loadReview();

    return () => {
      cancelled = true;
    };
  }, [origin, originKey, providedRoute, refreshKey]);

  const review = useMemo<SelectedRouteReview | null>(() => {
    if (providedRoute) {
      return providedRoute;
    }

    if (!roadCache) {
      return null;
    }

    return {
      originLabel: roadCache.originLabel,
      destinationLabel: roadCache.destinationLabel,
      route: toReviewedRoute(roadCache.road, incidents),
    };
  }, [incidents, providedRoute, roadCache]);

  const retry = () => {
    reviewedRoadCache = null;
    setRoadCache(null);
    retryIncidents();
    retryPermission();
    retryLocation();
    setRefreshKey((current) => current + 1);
  };

  const needsLocation =
    permissionState === 'denied' || permissionState === 'unavailable';
  const error = providedRoute
    ? null
    : review || isRouting
      ? null
      : routeError ??
        locationError ??
        (needsLocation
          ? 'Allow location access so this summary can show where your route starts.'
          : null);

  return {
    review,
    isLoading:
      !providedRoute &&
      !review &&
      !error &&
      (permissionState === 'loading' || isLocationLoading || isRouting || !origin),
    error,
    retry,
  };
}
