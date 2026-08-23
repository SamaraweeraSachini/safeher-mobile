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

const DEFAULT_REGION: Region = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const MINIMUM_LOADING_TIME = 700;

export default function SafetyMap() {
  const mapRef = useRef<MapView | null>(null);

  const [
    isMapLoading,
    setIsMapLoading,
  ] = useState(true);

  const handleMapReady = () => {
    /*
     * Explicitly move the map to the SAFE-55 default region.
     * This makes the initial Colombo position reliable on Android.
     */
    mapRef.current?.animateToRegion(
      DEFAULT_REGION,
      0
    );

    /*
     * onMapReady can fire almost immediately.
     * Keep the loading state visible briefly so the user does
     * not see a flash/blank transition.
     */
    setTimeout(() => {
      setIsMapLoading(false);
    }, MINIMUM_LOADING_TIME);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        zoomEnabled
        scrollEnabled
        rotateEnabled
        pitchEnabled
        showsCompass
        showsScale
        toolbarEnabled={false}
        onMapReady={handleMapReady}
      />

      {isMapLoading ? (
        <View
          style={styles.loadingOverlay}
          pointerEvents="none"
        >
          <ActivityIndicator
            size="large"
            color="#C43D74"
          />

          <Text style={styles.loadingText}>
            Loading Safety Map...
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FB',
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#FFF8FB',

    zIndex: 10,
    elevation: 10,
  },

  loadingText: {
    color: '#667085',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 12,
  },
});