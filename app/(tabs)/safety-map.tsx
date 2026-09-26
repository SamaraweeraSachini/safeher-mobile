import {
  useLocalSearchParams,
} from 'expo-router';

import {
  StyleSheet,
  View,
} from 'react-native';

import MapErrorBoundary from '@/src/components/map/MapErrorBoundary';
import SafetyMap from '@/src/components/map/SafetyMap';

import type {
  RouteCoordinate,
} from '@/src/types/route';

function getNumber(
  value: string | string[] | undefined
): number | undefined {
  const rawValue =
    Array.isArray(value)
      ? value[0]
      : value;

  if (!rawValue) {
    return undefined;
  }

  const number =
    Number(rawValue);

  return Number.isFinite(number)
    ? number
    : undefined;
}

export default function SafetyMapScreen() {
  const params =
    useLocalSearchParams<{
      originLat?: string;
      originLng?: string;
      destinationLat?: string;
      destinationLng?: string;
    }>();

  const originLatitude =
    getNumber(params.originLat);

  const originLongitude =
    getNumber(params.originLng);

  const destinationLatitude =
    getNumber(
      params.destinationLat
    );

  const destinationLongitude =
    getNumber(
      params.destinationLng
    );

  let origin:
    RouteCoordinate | undefined;

  let destination:
    RouteCoordinate | undefined;

  if (
    originLatitude !== undefined &&
    originLongitude !== undefined
  ) {
    origin = {
      latitude: originLatitude,
      longitude: originLongitude,
    };
  }

  if (
    destinationLatitude !== undefined &&
    destinationLongitude !== undefined
  ) {
    destination = {
      latitude: destinationLatitude,
      longitude: destinationLongitude,
    };
  }

  return (
    <View style={styles.container}>
      <MapErrorBoundary>
        <SafetyMap
          origin={origin}
          destination={destination}
        />
      </MapErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});