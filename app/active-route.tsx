import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SAFETY_LEVEL_STYLES } from '@/constants/safety-levels';
import RouteWarningsList from '@/src/components/route/RouteWarningsList';
import { useLocationPermission } from '@/src/hooks/useLocationPermission';
import { useActiveIncidents } from '@/src/hooks/useRecentIncidents';
import { useRouteWarnings } from '@/src/hooks/useRouteWarnings';
import { calculateRouteSafetyScore, getSafetyLevel } from '@/src/services/safety-score-service';
import {
  setSelectedRouteReview,
  useSelectedRouteReview,
} from '@/src/state/selected-route';

import { remainingDistanceAlongRoute } from '@/src/utils/geo';

import type { RouteType } from '@/src/types/route';

const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  fastest: 'Fastest route',
  safest: 'Safest route',
  balanced: 'Balanced route',
};

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatDuration(durationSeconds: number): string {
  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

export default function ActiveRouteScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const selectedRoute = useSelectedRouteReview();
  const { permissionState } = useLocationPermission();
  const { incidents } = useActiveIncidents();
  const [isMapReady, setIsMapReady] = useState(false);
  const [remainingMeters, setRemainingMeters] = useState<number | null>(null);

  const guidanceRoute = useMemo(() => {
    if (!selectedRoute) {
      return null;
    }

    const coordinates = selectedRoute.route.coordinates;
    const safety =
      coordinates.length > 0
        ? calculateRouteSafetyScore(coordinates, incidents)
        : null;

    return {
      ...selectedRoute.route,
      coordinates,
      safetyScore: safety?.score ?? selectedRoute.route.safetyScore,
      nearbyIncidentCount:
        safety?.nearbyIncidentCount ?? selectedRoute.route.nearbyIncidentCount,
    };
  }, [incidents, selectedRoute]);

  const { warnings, isLoading, error, retry } = useRouteWarnings(guidanceRoute);

  const routeFitKey = guidanceRoute
    ? `${guidanceRoute.coordinates.length}:${guidanceRoute.coordinates[0]?.latitude}:${guidanceRoute.coordinates.at(-1)?.latitude}`
    : '';

  useEffect(() => {
    if (!isMapReady || !guidanceRoute || guidanceRoute.coordinates.length < 2) {
      return;
    }

    mapRef.current?.fitToCoordinates(guidanceRoute.coordinates, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: false,
    });
  }, [guidanceRoute, isMapReady, routeFitKey]);

  const routeCoordinatesRef = useRef(guidanceRoute?.coordinates ?? []);
  routeCoordinatesRef.current = guidanceRoute?.coordinates ?? [];

  useEffect(() => {
    if (permissionState !== 'granted' || !routeFitKey) {
      return;
    }

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 25,
      },
      (position) => {
        setRemainingMeters(
          remainingDistanceAlongRoute(
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            routeCoordinatesRef.current
          )
        );
      }
    ).then((nextSubscription) => {
      if (cancelled) {
        nextSubscription.remove();
        return;
      }

      subscription = nextSubscription;
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [permissionState, routeFitKey]);

  const leaveRoute = (destination: Href) => {
    setSelectedRouteReview(null);
    router.replace(destination);
  };

  const endRoute = () => {
    setSelectedRouteReview(null);
    Alert.alert(
      'Route complete',
      'You have ended this route. Stay aware of your surroundings.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)' as Href),
        },
      ],
      { cancelable: false }
    );
  };

  const cancelRoute = () => {
    Alert.alert(
      'Cancel route',
      'This stops the current route and returns you to the route choices.',
      [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'Cancel route',
          style: 'destructive',
          onPress: () => leaveRoute('/(tabs)/safe-route' as Href),
        },
      ]
    );
  };

  if (!selectedRoute) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.heading}>No route in progress</Text>
          <Text style={styles.body}>
            Review a route and tap Start Route to see it here.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.replace('/(tabs)/safe-route' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Go to Safe Route"
          >
            <Text style={styles.primaryButtonText}>Go to Safe Route</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { route, destinationLabel, originLabel } = selectedRoute;
  const origin = route.coordinates[0];
  const destination = route.coordinates[route.coordinates.length - 1];
  const levelStyle = SAFETY_LEVEL_STYLES[getSafetyLevel(guidanceRoute?.safetyScore ?? route.safetyScore)];
  const shownRoute = guidanceRoute ?? route;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>On your way</Text>
        <Text style={styles.routeType}>{ROUTE_TYPE_LABELS[route.type]}</Text>

        <View style={styles.mapFrame}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: origin.latitude,
              longitude: origin.longitude,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            zoomEnabled
            scrollEnabled
            rotateEnabled
            pitchEnabled
            showsCompass
            showsUserLocation={permissionState === 'granted'}
            showsMyLocationButton={false}
            toolbarEnabled={false}
            onMapReady={() => setIsMapReady(true)}
          >
            {shownRoute.coordinates.length > 1 && (
              <Polyline
                coordinates={shownRoute.coordinates}
                strokeColor="#1A73E8"
                strokeWidth={6}
              />
            )}
            <Marker
              coordinate={origin}
              title={originLabel}
              description="Start"
              pinColor="#1A73E8"
            />
            <Marker
              coordinate={destination}
              title={destinationLabel}
              description="Destination"
              pinColor="#E53935"
            />
          </MapView>
        </View>

        <View style={styles.card}>
          <View style={styles.destinationRow}>
            <Ionicons name="ellipse" size={10} color="#2E6DA4" />
            <Text style={styles.destination}>{originLabel}</Text>
          </View>
          <View style={styles.destinationRow}>
            <Ionicons name="location" size={16} color="#C43D74" />
            <Text style={styles.destination}>{destinationLabel}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatDistance(remainingMeters ?? shownRoute.distanceMeters)}
              </Text>
              <Text style={styles.statLabel}>
                {remainingMeters == null ? 'Total distance' : 'Remaining'}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatDuration(
                  remainingMeters == null || shownRoute.distanceMeters <= 0
                    ? shownRoute.durationSeconds
                    : shownRoute.durationSeconds *
                        (remainingMeters / shownRoute.distanceMeters)
                )}
              </Text>
              <Text style={styles.statLabel}>
                {remainingMeters == null ? 'Estimated duration' : 'Time left'}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: levelStyle.color }]}>
                {shownRoute.safetyScore}/100
              </Text>
              <Text style={styles.statLabel}>Safety score</Text>
            </View>
          </View>
        </View>

        <RouteWarningsList
          warnings={warnings}
          isLoading={isLoading}
          error={error}
          onRetry={retry}
        />

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
          onPress={endRoute}
          accessibilityRole="button"
          accessibilityLabel="End Route"
        >
          <Text style={styles.primaryButtonText}>End Route</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
          onPress={cancelRoute}
          accessibilityRole="button"
          accessibilityLabel="Cancel Route"
        >
          <Text style={styles.secondaryButtonText}>Cancel Route</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8FB' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  heading: { color: '#32252B', fontSize: 24, fontWeight: '900' },
  routeType: {
    marginTop: 4,
    marginBottom: 14,
    color: '#5D4B53',
    fontSize: 14,
    fontWeight: '700',
  },
  map: {
    height: 280,
  },
  mapFrame: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#E7EEF2',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  destination: {
    flex: 1,
    color: '#32252B',
    fontSize: 16,
    fontWeight: '800',
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: '#32252B', fontSize: 16, fontWeight: '800' },
  statLabel: { marginTop: 2, color: '#5D4B53', fontSize: 12 },
  primaryButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#C43D74',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(93, 75, 83, 0.3)',
  },
  secondaryButtonText: { color: '#32252B', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  body: {
    marginTop: 8,
    marginBottom: 8,
    color: '#5D4B53',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
