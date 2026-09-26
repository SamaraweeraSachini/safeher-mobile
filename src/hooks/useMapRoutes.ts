import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  identifyRouteChoices,
} from '@/src/services/route-comparison-service';

import {
  getRoutes,
  RoutingServiceError,
  type RoutingResult,
} from '@/src/services/routing-service';

import {
  calculateRouteSafetyScore,
} from '@/src/services/safety-score-service';

import type { Incident } from '@/src/types/incident';

import type {
  RouteCoordinate,
  RouteOption,
} from '@/src/types/route';

interface UseMapRoutesOptions {
  origin?: RouteCoordinate | null;
  destination?: RouteCoordinate | null;
  incidents: readonly Incident[];
}

export function useMapRoutes({
  origin,
  destination,
  incidents,
}: UseMapRoutesOptions) {
  const [rawRoutes, setRawRoutes] =
    useState<RoutingResult[]>([]);

  const [
    selectedRouteId,
    setSelectedRouteId,
  ] = useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!origin || !destination) {
      setRawRoutes([]);
      setSelectedRouteId(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadRoutes() {
      setIsLoading(true);
      setError(null);

      try {
        const retrievedRoutes =
          await getRoutes(
            origin!,
            destination!,
            'walk'
          );

        if (cancelled) {
          return;
        }

        setRawRoutes(retrievedRoutes);
      } catch (routeError) {
        if (cancelled) {
          return;
        }

        setRawRoutes([]);

        if (
          routeError instanceof RoutingServiceError
        ) {
          setError(routeError.message);
        } else {
          setError(
            'Routes could not be loaded. Please try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRoutes();

    return () => {
      cancelled = true;
    };
  }, [
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
  ]);

  const routes = useMemo(() => {
    if (rawRoutes.length === 0) {
      return [];
    }

    const routeOptions: RouteOption[] =
      rawRoutes.map((route) => {
        const safety =
          calculateRouteSafetyScore(
            route.coordinates,
            incidents
          );

        return {
          id: route.id,
          type: 'balanced',
          coordinates:
            route.coordinates,
          distanceMeters:
            route.distanceMeters,
          durationSeconds:
            route.durationSeconds,
          safetyScore:
            safety.score,
          nearbyIncidentCount:
            safety.nearbyIncidentCount,
        };
      });

    return identifyRouteChoices(
      routeOptions
    );
  }, [
    rawRoutes,
    incidents,
  ]);

  useEffect(() => {
    if (routes.length === 0) {
      setSelectedRouteId(null);
      return;
    }

    const selectedStillExists =
      routes.some(
        route =>
          route.id === selectedRouteId
      );

    if (!selectedStillExists) {
      setSelectedRouteId(
        routes[0].id
      );
    }
  }, [
    routes,
    selectedRouteId,
  ]);

  const selectedRoute =
    useMemo(
      () =>
        routes.find(
          route =>
            route.id ===
            selectedRouteId
        ) ?? null,
      [
        routes,
        selectedRouteId,
      ]
    );

  return {
    routes,
    selectedRoute,
    selectedRouteId,
    selectRoute:
      setSelectedRouteId,
    isLoading,
    error,
  };
}