import {
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import MapView, {
  Region,
} from 'react-native-maps';

import {
  useLocationPermission,
} from '@/src/hooks/useLocationPermission';

import LocationPermissionMessage from './LocationPermissionMessage';

const DEFAULT_REGION: Region = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const MINIMUM_LOADING_TIME =
  700;

export default function SafetyMap() {
  const mapRef =
    useRef<MapView | null>(
      null
    );

  const [
    isMapLoading,
    setIsMapLoading,
  ] = useState(true);

  const {
    permissionState,
    errorMessage,
    retry,
  } =
    useLocationPermission();

  const handleMapReady =
    () => {
      mapRef.current
        ?.animateToRegion(
          DEFAULT_REGION,
          0
        );

      setTimeout(() => {
        setIsMapLoading(
          false
        );
      }, MINIMUM_LOADING_TIME);
    };

  const showPermissionMessage =
    permissionState ===
      'denied' ||
    permissionState ===
      'unavailable';

  const permissionTitle =
    permissionState ===
    'denied'
      ? 'Location permission denied'
      : 'Location unavailable';

  return (
    <View
      style={styles.container}
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={
          DEFAULT_REGION
        }
        zoomEnabled
        scrollEnabled
        rotateEnabled
        pitchEnabled
        showsCompass
        showsScale
        toolbarEnabled={
          false
        }
        onMapReady={
          handleMapReady
        }
      />

      {isMapLoading ? (
        <View
          style={
            styles.loadingOverlay
          }
          pointerEvents="none"
        >
          <ActivityIndicator
            size="large"
            color="#C43D74"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading Safety Map...
          </Text>
        </View>
      ) : null}

      {!isMapLoading &&
      permissionState ===
        'loading' ? (
        <View
          style={
            styles.permissionLoading
          }
        >
          <ActivityIndicator
            size="small"
            color="#C43D74"
          />

          <Text
            style={
              styles.permissionLoadingText
            }
          >
            Checking location permission...
          </Text>
        </View>
      ) : null}

      {!isMapLoading &&
      showPermissionMessage &&
      errorMessage ? (
        <LocationPermissionMessage
          title={
            permissionTitle
          }
          message={
            errorMessage
          }
          onRetry={retry}
        />
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#FFF8FB',
    },

    map: {
      ...StyleSheet
        .absoluteFillObject,
    },

    loadingOverlay: {
      ...StyleSheet
        .absoluteFillObject,

      alignItems: 'center',
      justifyContent:
        'center',

      backgroundColor:
        '#FFF8FB',

      zIndex: 30,
      elevation: 30,
    },

    loadingText: {
      color: '#667085',
      fontSize: 15,
      fontWeight: '500',
      marginTop: 12,
    },

    permissionLoading: {
      position: 'absolute',

      top: 16,

      alignSelf: 'center',

      flexDirection: 'row',

      alignItems: 'center',

      gap: 8,

      zIndex: 20,
      elevation: 20,

      backgroundColor:
        '#FFFFFF',

      paddingVertical: 10,

      paddingHorizontal: 16,

      borderRadius: 20,

      shadowColor:
        '#5A3D4D',

      shadowOpacity: 0.1,

      shadowRadius: 6,
    },

    permissionLoadingText: {
      color: '#667085',
      fontSize: 14,
      fontWeight: '500',
    },
  });