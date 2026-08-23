import { Ionicons } from '@expo/vector-icons';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import MapView, {
  Region,
} from 'react-native-maps';

import {
  useCurrentLocation,
} from '@/src/hooks/useCurrentLocation';

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

const USER_REGION_DELTA = 0.015;

const MINIMUM_LOADING_TIME = 700;

export default function SafetyMap() {
  const mapRef =
    useRef<MapView | null>(null);

  const [
    isMapLoading,
    setIsMapLoading,
  ] = useState(true);

  const [
    isMapReady,
    setIsMapReady,
  ] = useState(false);

  const {
    permissionState,
    errorMessage,
    retry,
  } = useLocationPermission();

  const {
    location,
    isLocationLoading,
    locationError,
    retryLocation,
  } = useCurrentLocation(
    permissionState
  );

  const handleMapReady = () => {
    setIsMapReady(true);

    mapRef.current?.animateToRegion(
      DEFAULT_REGION,
      0
    );

    setTimeout(() => {
      setIsMapLoading(false);
    }, MINIMUM_LOADING_TIME);
  };

  const centreOnCurrentLocation = () => {
    if (!location) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude:
          location.latitude,

        longitude:
          location.longitude,

        latitudeDelta:
          USER_REGION_DELTA,

        longitudeDelta:
          USER_REGION_DELTA,
      },
      700
    );
  };

  useEffect(() => {
    if (
      !isMapReady ||
      !location
    ) {
      return;
    }

    centreOnCurrentLocation();
  }, [
    isMapReady,
    location,
  ]);

  const handleMyLocationPress =
    async () => {
      if (
        permissionState ===
        'denied'
      ) {
        Alert.alert(
          'Location permission required',
          'Allow SafeHer to access your location before using My Location.'
        );

        return;
      }

      if (
        permissionState ===
        'unavailable'
      ) {
        Alert.alert(
          'Location unavailable',
          'Your location is currently unavailable. Make sure location services are enabled and try again.'
        );

        return;
      }

      if (
        permissionState !==
        'granted'
      ) {
        return;
      }

      if (location) {
        centreOnCurrentLocation();

        return;
      }

      await retryLocation();
    };

  const showPermissionMessage =
    permissionState === 'denied' ||
    permissionState ===
      'unavailable';

  const permissionTitle =
    permissionState === 'denied'
      ? 'Location permission denied'
      : 'Location unavailable';

  const canShowUserLocation =
    permissionState === 'granted' &&
    location !== null;

  const isMyLocationLoading =
    permissionState === 'loading' ||
    isLocationLoading;

  return (
    <View style={styles.container}>
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
        toolbarEnabled={false}
        showsUserLocation={
          canShowUserLocation
        }
        showsMyLocationButton={
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
            styles.statusCard
          }
        >
          <ActivityIndicator
            size="small"
            color="#C43D74"
          />

          <Text
            style={
              styles.statusText
            }
          >
            Checking location permission...
          </Text>
        </View>
      ) : null}

      {!isMapLoading &&
      permissionState ===
        'granted' &&
      isLocationLoading ? (
        <View
          style={
            styles.statusCard
          }
        >
          <ActivityIndicator
            size="small"
            color="#C43D74"
          />

          <Text
            style={
              styles.statusText
            }
          >
            Getting your location...
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

      {!isMapLoading &&
      permissionState ===
        'granted' &&
      !isLocationLoading &&
      locationError ? (
        <LocationPermissionMessage
          title="Location unavailable"
          message={
            locationError
          }
          onRetry={
            retryLocation
          }
        />
      ) : null}

      {!isMapLoading ? (
        <Pressable
          style={({
            pressed,
          }) => [
            styles.myLocationButton,

            pressed &&
              styles.myLocationButtonPressed,

            isMyLocationLoading &&
              styles.myLocationButtonDisabled,
          ]}
          onPress={
            handleMyLocationPress
          }
          disabled={
            isMyLocationLoading
          }
          accessibilityRole="button"
          accessibilityLabel="My Location"
          accessibilityHint="Returns the map to your current location"
        >
          {isMyLocationLoading ? (
            <ActivityIndicator
              size="small"
              color="#C43D74"
            />
          ) : (
            <Ionicons
              name="locate"
              size={24}
              color="#C43D74"
            />
          )}
        </Pressable>
      ) : null}

      {!isMapLoading &&
      location &&
      !isLocationLoading ? (
        <View
          style={
            styles.locationReadyCard
          }
          pointerEvents="none"
        >
          <View
            style={
              styles.locationIconContainer
            }
          >
            <Ionicons
              name="navigate"
              size={14}
              color="#FFFFFF"
            />
          </View>

          <View>
            <Text
              style={
                styles.locationReadyTitle
              }
            >
              Your location
            </Text>

            <Text
              style={
                styles.locationReadyText
              }
            >
              Current position found
            </Text>
          </View>
        </View>
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

    statusCard: {
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

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.1,

      shadowRadius: 6,
    },

    statusText: {
      color: '#667085',

      fontSize: 14,

      fontWeight: '500',
    },

    myLocationButton: {
      position: 'absolute',

      right: 16,

      bottom: 88,

      width: 52,

      height: 52,

      borderRadius: 26,

      alignItems: 'center',

      justifyContent:
        'center',

      zIndex: 20,

      elevation: 8,

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        '#F1DDE6',

      shadowColor:
        '#5A3D4D',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.16,

      shadowRadius: 6,
    },

    myLocationButtonPressed: {
      backgroundColor:
        '#FFF1F6',

      transform: [
        {
          scale: 0.96,
        },
      ],
    },

    myLocationButtonDisabled: {
      opacity: 0.65,
    },

    locationReadyCard: {
      position: 'absolute',

      bottom: 18,

      alignSelf: 'center',

      flexDirection: 'row',

      alignItems: 'center',

      gap: 10,

      zIndex: 15,

      elevation: 15,

      minWidth: 180,

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        '#F1DDE6',

      borderRadius: 16,

      paddingVertical: 10,

      paddingHorizontal: 14,

      shadowColor:
        '#5A3D4D',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.1,

      shadowRadius: 6,
    },

    locationIconContainer: {
      width: 32,

      height: 32,

      borderRadius: 16,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        '#C43D74',
    },

    locationReadyTitle: {
      color: '#24151C',

      fontSize: 13,

      fontWeight: '700',
    },

    locationReadyText: {
      color: '#667085',

      fontSize: 12,

      fontWeight: '500',

      marginTop: 1,
    },
  });