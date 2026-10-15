import {
  type Href,
  useRouter,
} from 'expo-router';

import * as Location from 'expo-location';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import MapView, {
  Marker,
  Polyline,
} from 'react-native-maps';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import ScreenBackButton from '@/src/components/navigation/ScreenBackButton';

import RouteComparisonCard from '@/src/components/route/RouteComparisonCard';

import {
  usePrivacyPreferences,
} from '@/src/context/PrivacyPreferencesContext';

import {
  identifyRouteChoices,
  type ComparedRoute,
} from '@/src/services/route-comparison-service';

import {
  getIncidentsForRouteScoring,
} from '@/src/services/route-incident-service';

import {
  getLocationSuggestions,
  type LocationSuggestion,
} from '@/src/services/route-location-service';

import {
  getRoutes,
} from '@/src/services/routing-service';

import {
  calculateRouteSafetyScore,
  getSafetyLevel,
} from '@/src/services/safety-score-service';

import {
  setSelectedRouteReview,
} from '@/src/state/selected-route';

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
        .then(items => {
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

  const { preferences } = usePrivacyPreferences();

  const mapRef = useRef<MapView | null>(null);

  /*
   * Prevents an older request from overwriting
   * the screen after the user starts another search.
   */
  const requestVersion = useRef(0);

  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');

  const [origin, setOrigin] =
    useState<LocationSuggestion | null>(null);

  const [destination, setDestination] =
    useState<LocationSuggestion | null>(null);

  const [originError, setOriginError] = useState<string | null>(null);
  const [destinationError, setDestinationError] =
    useState<string | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [searchError, setSearchError] = useState<string | null>(null);

  const [routes, setRoutes] = useState<ComparedRoute[]>([]);

  const [selectedRouteId, setSelectedRouteId] =
    useState<string | null>(null);

  const originMatches = useSuggestions(originText, origin);
  const destinationMatches = useSuggestions(destinationText, destination);

  const selectedRoute =
    routes.find(route => route.id === selectedRouteId) ?? null;

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
    if (!preferences.allowLocationUse) {
      setOriginError(
        'Location use is turned off in Privacy Settings. Turn it on there, or type an origin instead.'
      );
      return;
    }

    setIsLocating(true);
    setOriginError(null);

    try {
      let permission =
        await Location.getForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        permission =
          await Location.requestForegroundPermissionsAsync();
      }

      if (permission.status !== 'granted') {
        throw new Error(
          'Location permission is required to use your current location. You can also select an origin manually.'
        );
      }

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        throw new Error(
          'Location/GPS is turned off. Turn it on or select an origin manually.'
        );
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      selectOrigin({
        id: 'current-location',
        name: 'Current Location',
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
    const previousOrigin = origin;
    const previousDestination = destination;
    const previousOriginText = originText;
    const previousDestinationText = destinationText;

    setOrigin(previousDestination);
    setDestination(previousOrigin);
    setOriginText(previousDestinationText);
    setDestinationText(previousOriginText);
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
    if (isSearching) {
      return;
    }

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

    /*
     * Prevent searching from and to effectively the same point.
     */
    const latitudeDifference = Math.abs(
      origin.latitude - destination.latitude
    );

    const longitudeDifference = Math.abs(
      origin.longitude - destination.longitude
    );

    if (
      latitudeDifference < 0.00005 &&
      longitudeDifference < 0.00005
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
      /*
       * Route geometry and incident information are independent,
       * so retrieve them together.
       */
      const [retrievedRoutes, incidents] = await Promise.all([
        getRoutes(origin, destination, 'walk'),
        getIncidentsForRouteScoring(),
      ]);

      if (version !== requestVersion.current) {
        return;
      }

      /*
       * Every REAL provider route receives its own safety score.
       */
      const scoredRoutes = retrievedRoutes.map(route => {
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

      /*
       * Prefer Balanced as the initial selected card.
       * If unavailable, fall back to the first result.
       */
      const initialRoute =
        compared.find(route => route.roles.includes('Balanced')) ??
        compared[0] ??
        null;

      setSelectedRouteId(initialRoute?.id ?? null);

      /*
       * Give React Native time to render the polylines,
       * then fit all returned routes into the map.
       */
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          compared.flatMap(route => route.coordinates),
          {
            edgePadding: { top: 55, right: 45, bottom: 55, left: 45 },
            animated: true,
          }
        );
      }, 350);
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
      routes.flatMap(route => route.coordinates),
      {
        edgePadding: { top: 55, right: 45, bottom: 55, left: 45 },
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
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <ScreenBackButton label="Home" />

        {/* ---------- Header ---------- */}
        <View style={styles.headerBlock}>
          <View style={styles.headerIconWrap}>
            <Text style={styles.headerIconGlyph}>🧭</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Safe Route</Text>
            <Text style={styles.subheading}>
              Compare walking routes using travel time and recent community
              safety reports.
            </Text>
          </View>
        </View>

        {/* ---------- Search Card ---------- */}
        <View style={styles.card}>
          {/* Origin */}
          <View style={styles.fieldHeader}>
            <View style={styles.fieldBadgeOrigin}>
              <Text style={styles.fieldBadgeText}>A</Text>
            </View>
            <Text style={styles.label}>Origin</Text>
          </View>

          <TextInput
            style={styles.input}
            value={originText}
            onChangeText={changeOrigin}
            placeholder="Enter starting location"
            placeholderTextColor="#806F77"
            accessibilityLabel="Origin"
          />

          {originError ? (
            <Text style={styles.error}>{originError}</Text>
          ) : null}

          {originMatches.loading ? (
            <ActivityIndicator
              style={styles.smallLoader}
              color="#C43D74"
            />
          ) : null}

          {originMatches.error ? (
            <Text style={styles.error}>{originMatches.error}</Text>
          ) : null}

          {originMatches.suggestions.length > 0 ? (
            <View style={styles.suggestionContainer}>
              {originMatches.suggestions.map(place => (
                <Pressable
                  key={place.id}
                  onPress={() => selectOrigin(place)}
                  style={({ pressed }) => [
                    styles.suggestion,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${place.name} as origin`}
                >
                  <Text style={styles.body}>{place.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Pressable
            style={[styles.outlineButton, isLocating && styles.disabled]}
            onPress={useCurrentLocation}
            disabled={isLocating}
            accessibilityRole="button"
            accessibilityLabel="Use current location as origin"
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#9B2D5A" />
            ) : null}
            <Text style={styles.outlineText}>
              {isLocating ? 'Getting location...' : 'Use Current Location'}
            </Text>
          </Pressable>

          {/* Swap divider */}
          <View style={styles.swapDivider}>
            <View style={styles.swapLine} />

            <Pressable
              onPress={swapLocations}
              style={({ pressed }) => [
                styles.swapButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Swap origin and destination"
            >
              <Text style={styles.swapIcon}>⇅</Text>
            </Pressable>

            <View style={styles.swapLine} />
          </View>

          {/* Destination */}
          <View style={styles.fieldHeader}>
            <View style={styles.fieldBadgeDestination}>
              <Text style={styles.fieldBadgeText}>B</Text>
            </View>
            <Text style={styles.label}>Destination</Text>
          </View>

          <TextInput
            style={styles.input}
            value={destinationText}
            onChangeText={changeDestination}
            placeholder="Enter destination"
            placeholderTextColor="#806F77"
            accessibilityLabel="Destination"
          />

          {destinationError ? (
            <Text style={styles.error}>{destinationError}</Text>
          ) : null}

          {destinationMatches.loading ? (
            <ActivityIndicator
              style={styles.smallLoader}
              color="#C43D74"
            />
          ) : null}

          {destinationMatches.error ? (
            <Text style={styles.error}>{destinationMatches.error}</Text>
          ) : null}

          {destinationMatches.suggestions.length > 0 ? (
            <View style={styles.suggestionContainer}>
              {destinationMatches.suggestions.map(place => (
                <Pressable
                  key={place.id}
                  onPress={() => selectDestination(place)}
                  style={({ pressed }) => [
                    styles.suggestion,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${place.name} as destination`}
                >
                  <Text style={styles.body}>{place.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* Search button */}
          <Pressable
            style={[styles.primaryButton, isSearching && styles.disabled]}
            onPress={search}
            disabled={isSearching}
            accessibilityRole="button"
            accessibilityLabel="Search Routes"
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : null}
            <Text style={styles.primaryText}>
              {isSearching ? 'Searching routes...' : 'Search Routes'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.pressed,
            ]}
            onPress={clearSearch}
            accessibilityRole="button"
            accessibilityLabel="Clear route search"
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>

          {searchError ? (
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
          ) : null}
        </View>

        {/* ---------- Results ---------- */}
        {routes.length > 0 && origin && destination ? (
          <>
            <View style={styles.resultHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Compare routes</Text>
                <Text style={styles.resultDescription}>
                  {routes.length >= 3
                    ? 'Fastest, Safest and Balanced options are available.'
                    : `${routes.length} distinct provider route${
                        routes.length === 1 ? '' : 's'
                      } found for these locations.`}
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {routes.length}
                </Text>
              </View>
            </View>

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
                {routes.map(route => {
                  const selected = selectedRouteId === route.id;

                  const routeColor = route.roles.includes('Safest')
                    ? '#287550'
                    : route.roles.includes('Fastest')
                      ? '#2E6DA4'
                      : '#C43D74';

                  return (
                    <Polyline
                      key={route.id}
                      coordinates={route.coordinates}
                      strokeWidth={selected ? 7 : 4}
                      strokeColor={selected ? routeColor : '#9A8790'}
                    />
                  );
                })}

                <Marker
                  coordinate={{
                    latitude: origin.latitude,
                    longitude: origin.longitude,
                  }}
                  title="Origin"
                  description={origin.name}
                  pinColor="#2E6DA4"
                />

                <Marker
                  coordinate={{
                    latitude: destination.latitude,
                    longitude: destination.longitude,
                  }}
                  title="Destination"
                  description={destination.name}
                  pinColor="#C43D74"
                />
              </MapView>
            </View>

            <View style={styles.legend}>
              <LegendItem label="Fastest" color="#2E6DA4" />
              <LegendItem label="Safest" color="#287550" />
              <LegendItem label="Balanced" color="#C43D74" />
            </View>

            {routes.map((route, index) => (
              <RouteComparisonCard
                key={route.id}
                route={{
                  ...route,
                  name: route.label || `Route ${index + 1}`,
                  label: route.label,
                  safetyLevel: getSafetyLevel(route.safetyScore),
                }}
                selected={selectedRouteId === route.id}
                onSelect={setSelectedRouteId}
              />
            ))}

            <View style={styles.explanationCard}>
              <Text style={styles.explanationTitle}>
                How SafeHer compares routes
              </Text>
              <Text style={styles.explanationText}>
                Fastest prioritizes travel time. Safest prioritizes the
                incident-based safety score. Balanced uses 60% reported
                safety and 40% relative travel time.
              </Text>
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                !selectedRoute && styles.disabled,
              ]}
              onPress={reviewRoute}
              disabled={!selectedRoute}
              accessibilityRole="button"
              accessibilityLabel="Review selected route"
            >
              <Text style={styles.primaryText}>Review Selected Route</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
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
    paddingBottom: 36,
  },

  /* ---------- Header ---------- */
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 18,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FBEAF1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1DDE6',
  },
  headerIconGlyph: {
    fontSize: 24,
  },
  heading: {
    color: '#32252B',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subheading: {
    marginTop: 4,
    color: '#5D4B53',
    fontSize: 13.5,
    lineHeight: 19,
  },

  /* ---------- Card ---------- */
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 18,
    shadowColor: '#7A1F3D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  fieldBadgeOrigin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2E6DA4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBadgeDestination: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#C43D74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  label: {
    color: '#32252B',
    fontWeight: '800',
    fontSize: 14,
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D8CBD1',
    borderRadius: 13,
    paddingHorizontal: 13,
    color: '#32252B',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },

  body: {
    color: '#32252B',
    fontSize: 13,
    lineHeight: 18,
  },

  error: {
    color: '#B42356',
    marginTop: 8,
    lineHeight: 19,
    fontSize: 12.5,
    fontWeight: '600',
  },

  smallLoader: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },

  suggestionContainer: {
    marginTop: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DFE4',
    borderRadius: 13,
  },

  suggestion: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#E8DFE4',
    backgroundColor: '#FFFFFF',
  },

  /* ---------- Use current location ---------- */
  outlineButton: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C43D74',
    borderRadius: 13,
    backgroundColor: '#FFF9FB',
  },
  outlineText: {
    color: '#9B2D5A',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 13.5,
  },

  /* ---------- Swap ---------- */
  swapDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 4,
  },
  swapLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1DDE6',
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F8DAE5',
  },
  swapIcon: {
    color: '#7A1F3D',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },

  /* ---------- Primary ---------- */
  primaryButton: {
    minHeight: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#C43D74',
    shadowColor: '#C43D74',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  clearButton: {
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    color: '#755F6A',
    fontSize: 13,
    fontWeight: '700',
  },

  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.75 },

  status: { marginTop: 12 },

  /* ---------- Results ---------- */
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#32252B',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  resultDescription: {
    marginTop: 4,
    color: '#755F6A',
    fontSize: 12.5,
    lineHeight: 17,
  },
  countBadge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#FBEAF1',
    borderWidth: 1,
    borderColor: '#F1DDE6',
  },
  countBadgeText: {
    color: '#A92F61',
    fontWeight: '900',
    fontSize: 15,
  },

  /* ---------- Map ---------- */
  mapContainer: {
    height: 280,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#7A1F3D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  map: { flex: 1 },

  /* ---------- Legend ---------- */
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1DDE6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#5D4B53',
    fontSize: 11.5,
    fontWeight: '800',
  },

  /* ---------- Explanation ---------- */
  explanationCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFF1F6',
    borderWidth: 1,
    borderColor: '#F8DAE5',
  },
  explanationTitle: {
    color: '#4E1026',
    fontWeight: '800',
    fontSize: 13,
  },
  explanationText: {
    marginTop: 5,
    color: '#725F68',
    fontSize: 12,
    lineHeight: 18,
  },
});