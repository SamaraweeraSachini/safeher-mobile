import { Ionicons } from '@expo/vector-icons';
import {
  useCallback,
  useEffect,
  useMemo,
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

import IncidentDetailsModal from '@/src/components/map/IncidentDetailsModal';
import IncidentMapMarker from '@/src/components/map/IncidentMapMarker';
import IncidentTypeFilters from '@/src/components/map/IncidentTypeFilters';

import type {
  IncidentFilterValue,
} from '@/src/components/map/IncidentTypeFilters';

import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';
import { useLocationPermission } from '@/src/hooks/useLocationPermission';
import { useActiveIncidents } from '@/src/hooks/useRecentIncidents';

import type { Incident } from '@/src/types/incident';

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

  const [isMapLoading, setIsMapLoading] =
    useState(true);

  const [isMapReady, setIsMapReady] =
    useState(false);

  const [
    selectedIncident,
    setSelectedIncident,
  ] = useState<Incident | null>(null);

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState<IncidentFilterValue>('all');

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

  const {
    incidents,
    isLoading: incidentsLoading,
    error: incidentsError,
    retry: retryIncidents,
  } = useActiveIncidents();

  const filteredIncidents =
    useMemo(() => {
      if (selectedFilter === 'all') {
        return incidents;
      }

      return incidents.filter(
        incident =>
          incident.type ===
          selectedFilter
      );
    }, [
      incidents,
      selectedFilter,
    ]);

  const handleFilterSelect =
    useCallback(
      (
        filter:
          IncidentFilterValue
      ) => {
        setSelectedFilter(filter);
        setSelectedIncident(null);
      },
      []
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

  const centreOnCurrentLocation =
    useCallback(() => {
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
    }, [location]);

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
    centreOnCurrentLocation,
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
    permissionState === 'unavailable';

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

  const selectedFilterLabel =
    selectedFilter === 'all'
      ? 'All'
      : selectedFilter
          .split('-')
          .map(
            word =>
              word.charAt(0).toUpperCase() +
              word.slice(1)
          )
          .join(' ');

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
        showsUserLocation={canShowUserLocation}
        showsMyLocationButton={false}
        onMapReady={handleMapReady}
      >
        {filteredIncidents.map(
          incident => (
            <IncidentMapMarker
              key={incident.id}
              incident={incident}
              onPress={
                setSelectedIncident
              }
            />
          )
        )}
      </MapView>

      {!isMapLoading ? (
        <View style={styles.filterContainer}>
          <IncidentTypeFilters
            selectedFilter={selectedFilter}
            onSelect={handleFilterSelect}
          />
        </View>
      ) : null}

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

      {!isMapLoading &&
      permissionState === 'loading' ? (
        <View style={styles.statusCard}>
          <ActivityIndicator
            size="small"
            color="#C43D74"
          />

          <Text style={styles.statusText}>
            Checking location permission...
          </Text>
        </View>
      ) : null}

      {!isMapLoading &&
      permissionState === 'granted' &&
      isLocationLoading ? (
        <View style={styles.statusCard}>
          <ActivityIndicator
            size="small"
            color="#C43D74"
          />

          <Text style={styles.statusText}>
            Getting your location...
          </Text>
        </View>
      ) : null}

      {!isMapLoading &&
      !incidentsError &&
      incidentsLoading ? (
        <View style={styles.incidentStatusCard}>
          <ActivityIndicator
            size="small"
            color="#C43D74"
          />

          <Text style={styles.incidentStatusText}>
            Loading active incidents...
          </Text>
        </View>
      ) : null}

      {!isMapLoading &&
      !incidentsLoading &&
      incidentsError ? (
        <View style={styles.incidentErrorCard}>
          <Ionicons
            name="cloud-offline-outline"
            size={20}
            color="#B42318"
          />

          <Text style={styles.incidentErrorText}>
            {incidentsError}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.incidentRetryButton,
              pressed &&
                styles.incidentRetryPressed,
            ]}
            onPress={retryIncidents}
            accessibilityRole="button"
            accessibilityLabel="Retry loading incidents"
          >
            <Ionicons
              name="refresh"
              size={18}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      ) : null}

      {!isMapLoading &&
      !incidentsLoading &&
      !incidentsError &&
      incidents.length > 0 &&
      filteredIncidents.length > 0 ? (
        <View
          style={styles.incidentCountCard}
          pointerEvents="none"
        >
          <Ionicons
            name="warning-outline"
            size={17}
            color="#A92F61"
          />

          <Text style={styles.incidentCountText}>
            {filteredIncidents.length}{' '}
            {filteredIncidents.length === 1
              ? 'visible incident'
              : 'visible incidents'}
          </Text>
        </View>
      ) : null}

      {!isMapLoading &&
      !incidentsLoading &&
      !incidentsError &&
      incidents.length > 0 &&
      filteredIncidents.length === 0 ? (
        <View style={styles.noResultsCard}>
          <View style={styles.noResultsIcon}>
            <Ionicons
              name="search-outline"
              size={22}
              color="#A92F61"
            />
          </View>

          <View style={styles.noResultsTextArea}>
            <Text style={styles.noResultsTitle}>
              No matching incidents
            </Text>

            <Text style={styles.noResultsDescription}>
              No active {selectedFilterLabel} reports are currently available.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.showAllButton,
              pressed &&
                styles.showAllPressed,
            ]}
            onPress={() =>
              handleFilterSelect('all')
            }
            accessibilityRole="button"
            accessibilityLabel="Show all incidents"
          >
            <Text style={styles.showAllText}>
              All
            </Text>
          </Pressable>
        </View>
      ) : null}

      {!isMapLoading &&
      showPermissionMessage &&
      errorMessage ? (
        <LocationPermissionMessage
          title={permissionTitle}
          message={errorMessage}
          onRetry={retry}
        />
      ) : null}

      {!isMapLoading &&
      permissionState === 'granted' &&
      !isLocationLoading &&
      locationError ? (
        <LocationPermissionMessage
          title="Location unavailable"
          message={locationError}
          onRetry={retryLocation}
        />
      ) : null}

      {!isMapLoading ? (
        <Pressable
          style={({ pressed }) => [
            styles.myLocationButton,
            pressed &&
              styles.myLocationButtonPressed,
            isMyLocationLoading &&
              styles.myLocationButtonDisabled,
          ]}
          onPress={handleMyLocationPress}
          disabled={isMyLocationLoading}
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
          style={styles.locationReadyCard}
          pointerEvents="none"
        >
          <View style={styles.locationIconContainer}>
            <Ionicons
              name="navigate"
              size={14}
              color="#FFFFFF"
            />
          </View>

          <View>
            <Text style={styles.locationReadyTitle}>
              Your location
            </Text>

            <Text style={styles.locationReadyText}>
              Current position found
            </Text>
          </View>
        </View>
      ) : null}

      <IncidentDetailsModal
        incident={selectedIncident}
        visible={selectedIncident !== null}
        onClose={() =>
          setSelectedIncident(null)
        }
      />
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

  filterContainer: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    zIndex: 25,
    elevation: 25,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 30,
    backgroundColor: '#FFF8FB',
  },

  loadingText: {
    marginTop: 12,
    color: '#667085',
    fontSize: 15,
    fontWeight: '500',
  },

  statusCard: {
    position: 'absolute',
    top: 75,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
    elevation: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },

  statusText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '500',
  },

  incidentStatusCard: {
    position: 'absolute',
    top: 130,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 18,
    elevation: 18,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },

  incidentStatusText: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '600',
  },

  incidentErrorCard: {
    position: 'absolute',
    top: 130,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    zIndex: 18,
    elevation: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDA29B',
    borderRadius: 16,
    backgroundColor: '#FEF3F2',
  },

  incidentErrorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 12,
    lineHeight: 17,
  },

  incidentRetryButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#C43D74',
  },

  incidentRetryPressed: {
    opacity: 0.75,
  },

  incidentCountCard: {
    position: 'absolute',
    top: 75,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    zIndex: 16,
    elevation: 16,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },

  incidentCountText: {
    color: '#5D4B53',
    fontSize: 12,
    fontWeight: '700',
  },

  noResultsCard: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 22,
    elevation: 22,
    padding: 13,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },

  noResultsIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FBEAF1',
  },

  noResultsTextArea: {
    flex: 1,
  },

  noResultsTitle: {
    color: '#32252B',
    fontSize: 14,
    fontWeight: '800',
  },

  noResultsDescription: {
    marginTop: 3,
    color: '#927E87',
    fontSize: 11,
    lineHeight: 16,
  },

  showAllButton: {
    minWidth: 46,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#C43D74',
  },

  showAllPressed: {
    opacity: 0.72,
  },

  showAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 88,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
  },

  myLocationButtonPressed: {
    backgroundColor: '#FFF1F6',
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },

  locationIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#C43D74',
  },

  locationReadyTitle: {
    color: '#24151C',
    fontSize: 13,
    fontWeight: '700',
  },

  locationReadyText: {
    marginTop: 1,
    color: '#667085',
    fontSize: 12,
    fontWeight: '500',
  },
});