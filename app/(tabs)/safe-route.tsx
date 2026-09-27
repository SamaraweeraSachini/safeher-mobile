import { type Href, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import RouteComparisonCard from '@/src/components/route/RouteComparisonCard';
import {
  calculateRouteSafetyScore,
  getSafetyLevel,
} from '@/src/services/safety-score-service';
import {
  identifyRouteChoices,
  type ComparedRoute,
} from '@/src/services/route-comparison-service';
import { getIncidentsForRouteScoring } from '@/src/services/route-incident-service';
import {
  getLocationSuggestions,
  type LocationSuggestion,
} from '@/src/services/route-location-service';
import { getRoutes } from '@/src/services/routing-service';
import { setSelectedRouteReview } from '@/src/state/selected-route';

function useSuggestions(
  text: string,
  selected: LocationSuggestion | null
) {
  const [suggestions, setSuggestions] =
    useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selected || text.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setError(null);
    setSuggestions([]);

    const timer = setTimeout(() => {
      getLocationSuggestions(text, controller.signal)
        .then((items) => {
          if (!controller.signal.aborted) {
            setSuggestions(items);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setError(
              'Could not find locations. Check your connection and try typing again.'
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, selected]);

  return { suggestions, loading, error };
}

export default function SafeRouteScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const requestVersion = useRef(0);

  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');

  const [origin, setOrigin] =
    useState<LocationSuggestion | null>(null);
  const [destination, setDestination] =
    useState<LocationSuggestion | null>(null);

  const [originError, setOriginError] =
    useState<string | null>(null);
  const [destinationError, setDestinationError] =
    useState<string | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] =
    useState<string | null>(null);

  const [routes, setRoutes] = useState<ComparedRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] =
    useState<string | null>(null);

  const originMatches = useSuggestions(originText, origin);
  const destinationMatches = useSuggestions(
    destinationText,
    destination
  );

  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) ??
    null;

  useEffect(
    () => () => {
      requestVersion.current += 1;
    },
    []
  );

  const invalidateSearch = () => {
    requestVersion.current += 1;
    setRoutes([]);
    setSelectedRouteId(null);
    setSearchError(null);
    setIsSearching(false);
  };

  const changeOrigin = (value: string) => {
    setOriginText(value);
    setOrigin(null);
    setOriginError(null);
    invalidateSearch();
  };

  const changeDestination = (value: string) => {
    setDestinationText(value);
    setDestination(null);
    setDestinationError(null);
    invalidateSearch();
  };

  const selectOrigin = (place: LocationSuggestion) => {
    setOrigin(place);
    setOriginText(place.name);
    setOriginError(null);
    invalidateSearch();
  };

  const selectDestination = (place: LocationSuggestion) => {
    setDestination(place);
    setDestinationText(place.name);
    setDestinationError(null);
    invalidateSearch();
  };

  const useCurrentLocation = async () => {
    setIsLocating(true);
    setOriginError(null);

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        throw new Error(
          'Location permission is required to use your current location. You can also select an origin manually.'
        );
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      selectOrigin({
        id: 'current-location',
        name: 'Current location',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      setOriginError(
        error instanceof Error
          ? error.message
          : 'Could not get your location.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  const swapLocations = () => {
    setOrigin(destination);
    setDestination(origin);

    setOriginText(destinationText);
    setDestinationText(originText);

    setOriginError(null);
    setDestinationError(null);
    invalidateSearch();
  };

  const clearSearch = () => {
    invalidateSearch();

    setOrigin(null);
    setDestination(null);

    setOriginText('');
    setDestinationText('');

    setOriginError(null);
    setDestinationError(null);

    setSelectedRouteReview(null);
  };

  const search = async () => {
    setOriginError(
      origin ? null : 'Select an origin from the suggestions.'
    );
    setDestinationError(
      destination
        ? null
        : 'Select a destination from the suggestions.'
    );

    if (!origin || !destination) {
      return;
    }

    if (
      origin.latitude === destination.latitude &&
      origin.longitude === destination.longitude
    ) {
      setDestinationError('Choose a different destination.');
      return;
    }

    const version = ++requestVersion.current;

    setRoutes([]);
    setSelectedRouteId(null);
    setSearchError(null);
    setIsSearching(true);

    try {
      const [retrievedRoutes, incidents] = await Promise.all([
        getRoutes(origin, destination, 'walk'),
        getIncidentsForRouteScoring(),
      ]);

      if (version !== requestVersion.current) {
        return;
      }

      const scoredRoutes = retrievedRoutes.map((route) => {
        const safety = calculateRouteSafetyScore(
          route.coordinates,
          incidents
        );

        return {
          ...route,
          type: 'balanced' as const,
          safetyScore: safety.score,
          nearbyIncidentCount: safety.nearbyIncidentCount,
        };
      });

      const compared = identifyRouteChoices(scoredRoutes);

      setRoutes(compared);
      setSelectedRouteId(compared[0]?.id ?? null);
    } catch (error) {
      if (version === requestVersion.current) {
        setSearchError(
          error instanceof Error
            ? error.message
            : 'Could not load routes. Please try again.'
        );
      }
    } finally {
      if (version === requestVersion.current) {
        setIsSearching(false);
      }
    }
  };

  const fitRoutes = () => {
    if (routes.length === 0) {
      return;
    }

    mapRef.current?.fitToCoordinates(
      routes.flatMap((route) => route.coordinates),
      {
        edgePadding: {
          top: 50,
          right: 40,
          bottom: 50,
          left: 40,
        },
        animated: true,
      }
    );
  };

  const reviewRoute = () => {
    if (!selectedRoute || !origin || !destination) {
      return;
    }

    setSelectedRouteReview({
      originLabel: origin.name,
      destinationLabel: destination.name,
      route: selectedRoute,
    });

    router.push('/route-summary' as Href);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Safe Route</Text>

        <Text style={styles.subheading}>
          Choose a start and destination to compare walking routes.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Origin</Text>

          <TextInput
            style={styles.input}
            value={originText}
            onChangeText={changeOrigin}
            placeholder="Enter starting location"
            accessibilityLabel="Origin"
          />

          {originError && (
            <Text style={styles.error}>{originError}</Text>
          )}

          {originMatches.loading && (
            <ActivityIndicator color="#C43D74" />
          )}

          {originMatches.error && (
            <Text style={styles.error}>
              {originMatches.error}
            </Text>
          )}

          {originMatches.suggestions.map((place) => (
            <Pressable
              key={place.id}
              onPress={() => selectOrigin(place)}
              style={styles.suggestion}
              accessibilityRole="button"
              accessibilityLabel={`Select ${place.name} as origin`}
            >
              <Text style={styles.body}>{place.name}</Text>
            </Pressable>
          ))}

          <Pressable
            style={styles.outlineButton}
            onPress={useCurrentLocation}
            disabled={isLocating}
            accessibilityRole="button"
            accessibilityLabel="Use current location as origin"
          >
            <Text style={styles.outlineText}>
              {isLocating
                ? 'Getting location...'
                : 'Use Current Location'}
            </Text>
          </Pressable>

          <Pressable
            onPress={swapLocations}
            style={styles.outlineButton}
            accessibilityRole="button"
            accessibilityLabel="Swap origin and destination"
          >
            <Text style={styles.outlineText}>
              Swap origin and destination ⇅
            </Text>
          </Pressable>

          <Text style={styles.label}>Destination</Text>

          <TextInput
            style={styles.input}
            value={destinationText}
            onChangeText={changeDestination}
            placeholder="Enter destination"
            accessibilityLabel="Destination"
          />

          {destinationError && (
            <Text style={styles.error}>
              {destinationError}
            </Text>
          )}

          {destinationMatches.loading && (
            <ActivityIndicator color="#C43D74" />
          )}

          {destinationMatches.error && (
            <Text style={styles.error}>
              {destinationMatches.error}
            </Text>
          )}

          {destinationMatches.suggestions.map((place) => (
            <Pressable
              key={place.id}
              onPress={() => selectDestination(place)}
              style={styles.suggestion}
              accessibilityRole="button"
              accessibilityLabel={`Select ${place.name} as destination`}
            >
              <Text style={styles.body}>{place.name}</Text>
            </Pressable>
          ))}

          <Pressable
            style={[
              styles.primaryButton,
              isSearching && styles.disabled,
            ]}
            onPress={search}
            disabled={isSearching}
            accessibilityRole="button"
            accessibilityLabel="Search Routes"
          >
            <Text style={styles.primaryText}>
              {isSearching
                ? 'Searching routes...'
                : 'Search Routes'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.outlineButton}
            onPress={clearSearch}
            accessibilityRole="button"
            accessibilityLabel="Clear route search"
          >
            <Text style={styles.outlineText}>Clear</Text>
          </Pressable>

          {isSearching && (
            <ActivityIndicator
              style={styles.status}
              color="#C43D74"
            />
          )}

          {searchError && (
            <View style={styles.status}>
              <Text style={styles.error}>{searchError}</Text>

              <Pressable
                style={styles.outlineButton}
                onPress={search}
                accessibilityRole="button"
                accessibilityLabel="Try searching for routes again"
              >
                <Text style={styles.outlineText}>Try Again</Text>
              </Pressable>
            </View>
          )}
        </View>

        {routes.length > 0 && origin && destination && (
          <>
            <Text style={styles.sectionTitle}>
              Compare routes
            </Text>

            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                onMapReady={fitRoutes}
                initialRegion={{
                  latitude: origin.latitude,
                  longitude: origin.longitude,
                  latitudeDelta: 0.04,
                  longitudeDelta: 0.04,
                }}
              >
                {routes.map((route) => (
                  <Polyline
                    key={route.id}
                    coordinates={route.coordinates}
                    strokeWidth={
                      selectedRouteId === route.id ? 6 : 3
                    }
                    strokeColor={
                      selectedRouteId === route.id
                        ? '#C43D74'
                        : '#688197'
                    }
                  />
                ))}

                <Marker
                  coordinate={origin}
                  title="Origin"
                />

                <Marker
                  coordinate={destination}
                  title="Destination"
                />
              </MapView>
            </View>

            {routes.map((route, index) => (
              <RouteComparisonCard
                key={route.id}
                route={{
                  ...route,
                  name: `Route ${index + 1}`,
                  label: route.label,
                  safetyLevel: getSafetyLevel(
                    route.safetyScore
                  ),
                }}
                selected={selectedRouteId === route.id}
                onSelect={setSelectedRouteId}
              />
            ))}

            <Pressable
              style={styles.primaryButton}
              onPress={reviewRoute}
              accessibilityRole="button"
              accessibilityLabel="Review selected route"
            >
              <Text style={styles.primaryText}>
                Review Selected Route
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8FB',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32,
  },
  heading: {
    color: '#32252B',
    fontSize: 28,
    fontWeight: '900',
  },
  subheading: {
    marginTop: 6,
    marginBottom: 18,
    color: '#5D4B53',
    fontSize: 14,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 18,
  },
  label: {
    marginTop: 14,
    marginBottom: 6,
    color: '#32252B',
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D8CBD1',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#32252B',
    backgroundColor: '#FFFFFF',
  },
  body: {
    color: '#32252B',
    fontSize: 14,
  },
  error: {
    color: '#B42356',
    marginTop: 8,
    lineHeight: 19,
  },
  suggestion: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#E8DFE4',
  },
  outlineButton: {
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C43D74',
    borderRadius: 10,
    alignItems: 'center',
  },
  outlineText: {
    color: '#9B2D5A',
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 14,
    marginBottom: 10,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#C43D74',
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  status: {
    marginTop: 12,
  },
  sectionTitle: {
    color: '#32252B',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  mapContainer: {
    height: 250,
    overflow: 'hidden',
    borderRadius: 16,
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
});