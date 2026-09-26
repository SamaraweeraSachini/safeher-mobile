import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RouteChoiceCard from '@/src/components/route/RouteChoiceCard';
import { useActiveIncidents } from '@/src/hooks/useRecentIncidents';
import { placeLabel } from '@/src/services/reviewed-route-service';
import { buildSelectableRoutes } from '@/src/services/route-options-service';
import { setSelectedRouteReview } from '@/src/state/selected-route';

import type { RouteOption } from '@/src/types/route';

type SelectedLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

type LocationSuggestion = SelectedLocation & {
  id: string;
};

export default function SafeRouteScreen() {
  const router = useRouter();

  const { incidents, isLoading, error, retry } = useActiveIncidents();

  const routes = useMemo(
    () => buildSelectableRoutes(incidents),
    [incidents],
  );

  const [openingRouteId, setOpeningRouteId] = useState<string | null>(null);

  // SAFE-86 search form state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originError, setOriginError] = useState('');
  const [destinationError, setDestinationError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [searchError, setSearchError] = useState('');

  // SAFE-87 current location state
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [originCoordinates, setOriginCoordinates] =
    useState<Location.LocationObjectCoords | null>(null);

  // SAFE-88 location suggestion state
  const [originSuggestions, setOriginSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [isLoadingOriginSuggestions, setIsLoadingOriginSuggestions] =
    useState(false);
  const [
    isLoadingDestinationSuggestions,
    setIsLoadingDestinationSuggestions,
  ] = useState(false);

  const [selectedOrigin, setSelectedOrigin] =
    useState<SelectedLocation | null>(null);
  const [selectedDestination, setSelectedDestination] =
    useState<SelectedLocation | null>(null);

  const searchLocations = async (
    query: string,
    type: 'origin' | 'destination',
  ) => {
    if (query.trim().length < 3) {
      if (type === 'origin') {
        setOriginSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }

      return;
    }

    if (type === 'origin') {
      setIsLoadingOriginSuggestions(true);
    } else {
      setIsLoadingDestinationSuggestions(true);
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(
          query.trim(),
        )}`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'SafeHer-Mobile-App',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Location search failed');
      }

      const results = await response.json();

      const suggestions: LocationSuggestion[] = results.map(
        (result: {
          place_id: number;
          display_name: string;
          lat: string;
          lon: string;
        }) => ({
          id: String(result.place_id),
          name: result.display_name,
          latitude: Number(result.lat),
          longitude: Number(result.lon),
        }),
      );

      if (type === 'origin') {
        setOriginSuggestions(suggestions);
      } else {
        setDestinationSuggestions(suggestions);
      }
    } catch {
      if (type === 'origin') {
        setOriginSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
    } finally {
      if (type === 'origin') {
        setIsLoadingOriginSuggestions(false);
      } else {
        setIsLoadingDestinationSuggestions(false);
      }
    }
  };

  const handleOriginChange = (text: string) => {
    setOrigin(text);
    setOriginError('');
    setSearchError('');
    setLocationMessage('');
    setSelectedOrigin(null);
    setOriginCoordinates(null);

    void searchLocations(text, 'origin');
  };

  const handleDestinationChange = (text: string) => {
    setDestination(text);
    setDestinationError('');
    setSearchError('');
    setSelectedDestination(null);

    void searchLocations(text, 'destination');
  };

  const handleSelectOrigin = (suggestion: LocationSuggestion) => {
    const selectedLocation: SelectedLocation = {
      name: suggestion.name,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    };

    setOrigin(selectedLocation.name);
    setSelectedOrigin(selectedLocation);

    setOriginCoordinates({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      altitude: null,
      accuracy: null,
      heading: null,
      speed: null,
      altitudeAccuracy: null,
    });

    setOriginSuggestions([]);
    setOriginError('');
    setSearchError('');
    setLocationMessage('Origin selected.');
  };

  const handleSelectDestination = (
    suggestion: LocationSuggestion,
  ) => {
    const selectedLocation: SelectedLocation = {
      name: suggestion.name,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    };

    setDestination(selectedLocation.name);
    setSelectedDestination(selectedLocation);

    setDestinationSuggestions([]);
    setDestinationError('');
    setSearchError('');
  };

  const handleUseCurrentLocation = async () => {
    setLocationMessage('');
    setSearchError('');
    setOriginError('');
    setOriginSuggestions([]);
    setIsGettingLocation(true);

    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationMessage(
          'Location permission was denied. Please enter your origin manually.',
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      setOriginCoordinates(location.coords);

      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (address) {
          const parts = [
            address.name,
            address.street,
            address.city,
            address.region,
          ].filter(Boolean);

          const locationName = parts.join(', ');

          const selectedLocation: SelectedLocation = {
            name:
              locationName ||
              `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            latitude,
            longitude,
          };

          setOrigin(selectedLocation.name);
          setSelectedOrigin(selectedLocation);
        } else {
          const selectedLocation: SelectedLocation = {
            name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            latitude,
            longitude,
          };

          setOrigin(selectedLocation.name);
          setSelectedOrigin(selectedLocation);
        }
      } catch {
        const selectedLocation: SelectedLocation = {
          name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          latitude,
          longitude,
        };

        setOrigin(selectedLocation.name);
        setSelectedOrigin(selectedLocation);
      }

      setLocationMessage('Current location set as your origin.');
    } catch {
      setLocationMessage(
        'Unable to retrieve your current location. Please enter your origin manually.',
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  // SAFE-89: Validate route-search input
  const handleSearch = () => {
    // Prevent repeated requests while a search is already running.
    if (isSearching) {
      return;
    }

    setOriginError('');
    setDestinationError('');
    setSearchMessage('');
    setSearchError('');

    let hasError = false;

    // Requirement 1:
    // Missing origin must display an error.
    if (!origin.trim()) {
      setOriginError('Please enter your origin.');
      hasError = true;
    }
    // Requirement 3:
    // Typed origin must also be selected from the suggestions.
    else if (!selectedOrigin) {
      setOriginError(
        'Please select your origin from the suggestions.',
      );
      hasError = true;
    }

    // Requirement 2:
    // Missing destination must display an error.
    if (!destination.trim()) {
      setDestinationError('Please enter your destination.');
      hasError = true;
    }
    // Requirement 3:
    // Typed destination must also be selected from the suggestions.
    else if (!selectedDestination) {
      setDestinationError(
        'Please select your destination from the suggestions.',
      );
      hasError = true;
    }

    // Requirement 4:
    // Origin and destination cannot represent the same coordinates.
    if (
      selectedOrigin &&
      selectedDestination &&
      selectedOrigin.latitude === selectedDestination.latitude &&
      selectedOrigin.longitude === selectedDestination.longitude
    ) {
      setDestinationError(
        'Origin and destination cannot be the same location.',
      );
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsSearching(true);

    /*
     * Temporary route-search state.
     *
     * The actual routing service will be connected during route-engine
     * integration. For the current Sprint 3 screen, the existing route
     * options are used to demonstrate the loading/success/failure states.
     */
    setTimeout(() => {
      setIsSearching(false);

      // Requirement 6:
      // Show a failure state when no route options are available.
      if (routes.length === 0) {
        setSearchError(
          'Unable to find routes for these locations. Please try again.',
        );
        return;
      }

      setSearchMessage(
        'Routes found. Available route options are shown below.',
      );
    }, 800);
  };

  // SAFE-89: Try Again after route-search failure
  const handleRetrySearch = () => {
    if (isSearching) {
      return;
    }

    handleSearch();
  };

  const handleClear = () => {
    setOrigin('');
    setDestination('');
    setOriginError('');
    setDestinationError('');
    setSearchMessage('');
    setSearchError('');
    setLocationMessage('');
    setOriginCoordinates(null);

    setSelectedOrigin(null);
    setSelectedDestination(null);

    setOriginSuggestions([]);
    setDestinationSuggestions([]);
  };

  const handleSwap = () => {
    const currentOrigin = origin;
    const currentOriginLocation = selectedOrigin;

    setOrigin(destination);
    setDestination(currentOrigin);

    setSelectedOrigin(selectedDestination);
    setSelectedDestination(currentOriginLocation);

    setOriginError('');
    setDestinationError('');
    setSearchMessage('');
    setSearchError('');
    setLocationMessage('');

    setOriginSuggestions([]);
    setDestinationSuggestions([]);

    if (selectedDestination) {
      setOriginCoordinates({
        latitude: selectedDestination.latitude,
        longitude: selectedDestination.longitude,
        altitude: null,
        accuracy: null,
        heading: null,
        speed: null,
        altitudeAccuracy: null,
      });
    } else {
      setOriginCoordinates(null);
    }
  };

  const reviewRoute = async (route: RouteOption) => {
    setOpeningRouteId(route.id);

    const start = route.coordinates[0];
    const end = route.coordinates[route.coordinates.length - 1];

    const [originLabel, destinationLabel] = await Promise.all([
      placeLabel(start, 'Starting point'),
      placeLabel(end, 'Destination'),
    ]);

    setSelectedRouteReview({
      originLabel,
      destinationLabel,
      route,
    });

    router.push('/route-summary' as Href);
    setOpeningRouteId(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Safe Route</Text>

        <Text style={styles.subheading}>
          Enter your origin and destination to search for suitable routes.
        </Text>

        <View style={styles.searchCard}>
          <Text style={styles.inputLabel}>Origin</Text>

          <View
            style={[
              styles.inputContainer,
              originError ? styles.inputError : null,
            ]}
          >
            <Text style={styles.inputIcon}>●</Text>

            <TextInput
              style={styles.input}
              value={origin}
              onChangeText={handleOriginChange}
              placeholder="Enter starting location"
              placeholderTextColor="#9A8790"
              accessibilityLabel="Origin"
            />
          </View>

          {originError ? (
            <Text style={styles.errorText}>{originError}</Text>
          ) : null}

          {isLoadingOriginSuggestions ? (
            <View style={styles.suggestionState}>
              <ActivityIndicator size="small" color="#C43D74" />

              <Text style={styles.suggestionStateText}>
                Searching locations...
              </Text>
            </View>
          ) : null}

          {originSuggestions.length > 0 ? (
            <View style={styles.suggestionsContainer}>
              {originSuggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.id}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleSelectOrigin(suggestion)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${suggestion.name}`}
                >
                  <Text style={styles.suggestionIcon}>⌖</Text>

                  <Text
                    style={styles.suggestionText}
                    numberOfLines={2}
                  >
                    {suggestion.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.locationButton,
              pressed && styles.pressed,
              isGettingLocation && styles.disabledButton,
            ]}
            onPress={handleUseCurrentLocation}
            disabled={isGettingLocation}
            accessibilityRole="button"
            accessibilityLabel="Use current location as origin"
          >
            {isGettingLocation ? (
              <>
                <ActivityIndicator size="small" color="#C43D74" />

                <Text style={styles.locationButtonText}>
                  Getting Current Location...
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.locationIcon}>⌖</Text>

                <Text style={styles.locationButtonText}>
                  Use Current Location
                </Text>
              </>
            )}
          </Pressable>

          {locationMessage ? (
            <Text style={styles.locationMessage}>
              {locationMessage}
            </Text>
          ) : null}

          <View style={styles.swapRow}>
            <View style={styles.swapLine} />

            <Pressable
              style={({ pressed }) => [
                styles.swapButton,
                pressed && styles.pressed,
              ]}
              onPress={handleSwap}
              accessibilityRole="button"
              accessibilityLabel="Swap origin and destination"
            >
              <Text style={styles.swapText}>⇅</Text>
            </Pressable>

            <View style={styles.swapLine} />
          </View>

          <Text style={styles.inputLabel}>Destination</Text>

          <View
            style={[
              styles.inputContainer,
              destinationError ? styles.inputError : null,
            ]}
          >
            <Text style={styles.inputIcon}>●</Text>

            <TextInput
              style={styles.input}
              value={destination}
              onChangeText={handleDestinationChange}
              placeholder="Enter destination"
              placeholderTextColor="#9A8790"
              accessibilityLabel="Destination"
            />
          </View>

          {destinationError ? (
            <Text style={styles.errorText}>
              {destinationError}
            </Text>
          ) : null}

          {isLoadingDestinationSuggestions ? (
            <View style={styles.suggestionState}>
              <ActivityIndicator size="small" color="#C43D74" />

              <Text style={styles.suggestionStateText}>
                Searching locations...
              </Text>
            </View>
          ) : null}

          {destinationSuggestions.length > 0 ? (
            <View style={styles.suggestionsContainer}>
              {destinationSuggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.id}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    pressed && styles.pressed,
                  ]}
                  onPress={() =>
                    handleSelectDestination(suggestion)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${suggestion.name}`}
                >
                  <Text style={styles.suggestionIcon}>⌖</Text>

                  <Text
                    style={styles.suggestionText}
                    numberOfLines={2}
                  >
                    {suggestion.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.pressed,
              isSearching && styles.disabledButton,
            ]}
            onPress={handleSearch}
            disabled={isSearching}
            accessibilityRole="button"
            accessibilityLabel="Search Routes"
          >
            {isSearching ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />

                <Text style={styles.searchButtonText}>
                  Searching...
                </Text>
              </>
            ) : (
              <Text style={styles.searchButtonText}>
                Search Routes
              </Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.pressed,
            ]}
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel="Clear route search"
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>

          {isSearching ? (
            <Text style={styles.loadingText}>
              Searching for available routes...
            </Text>
          ) : null}

          {searchMessage ? (
            <Text style={styles.messageText}>
              {searchMessage}
            </Text>
          ) : null}

          {searchError ? (
            <View style={styles.searchErrorContainer}>
              <Text style={styles.searchErrorText}>
                {searchError}
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleRetrySearch}
                disabled={isSearching}
                accessibilityRole="button"
                accessibilityLabel="Try searching for routes again"
              >
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {isLoading && routes.length === 0 && (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#C43D74" />

            <Text style={styles.stateText}>
              Loading reported incidents...
            </Text>
          </View>
        )}

        {!isLoading && error && routes.length === 0 && (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{error}</Text>

            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
              onPress={retry}
              accessibilityRole="button"
              accessibilityLabel="Try loading routes again"
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {!isLoading && !error && routes.length === 0 && (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>
              Routes appear here once people have shared recent incident
              reports.
            </Text>
          </View>
        )}

        {routes.map((route) => (
          <View key={route.id}>
            <RouteChoiceCard
              route={route}
              onReview={
                openingRouteId ? () => undefined : reviewRoute
              }
            />
          </View>
        ))}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
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
    lineHeight: 20,
  },

  searchCard: {
    marginBottom: 20,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },

  inputLabel: {
    marginBottom: 8,
    color: '#32252B',
    fontSize: 14,
    fontWeight: '700',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5DCE1',
    borderRadius: 12,
    backgroundColor: '#FFFDFE',
  },

  inputError: {
    borderColor: '#C43D74',
  },

  inputIcon: {
    marginRight: 10,
    color: '#C43D74',
    fontSize: 13,
  },

  input: {
    flex: 1,
    color: '#32252B',
    fontSize: 15,
  },

  errorText: {
    marginTop: 6,
    color: '#C43D74',
    fontSize: 13,
  },

  suggestionsContainer: {
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DFE4',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  suggestionItem: {
    minHeight: 54,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E9ED',
  },

  suggestionIcon: {
    width: 28,
    color: '#C43D74',
    fontSize: 20,
    textAlign: 'center',
  },

  suggestionText: {
    flex: 1,
    marginLeft: 8,
    color: '#4D3B43',
    fontSize: 14,
    lineHeight: 19,
  },

  suggestionState: {
    minHeight: 42,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  suggestionStateText: {
    color: '#75656C',
    fontSize: 13,
  },

  locationButton: {
    minHeight: 46,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E7B7C9',
    borderRadius: 12,
    backgroundColor: '#FFF6F9',
  },

  locationButtonText: {
    color: '#C43D74',
    fontSize: 14,
    fontWeight: '700',
  },

  locationIcon: {
    color: '#C43D74',
    fontSize: 20,
  },

  locationMessage: {
    marginTop: 8,
    color: '#5D4B53',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },

  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },

  swapLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8DFE4',
  },

  swapButton: {
    width: 42,
    height: 42,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#FCECF3',
    borderWidth: 1,
    borderColor: '#F3D1DF',
  },

  swapText: {
    color: '#C43D74',
    fontSize: 24,
    fontWeight: '700',
  },

  searchButton: {
    minHeight: 52,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#C43D74',
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  clearButton: {
    minHeight: 48,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D8CBD1',
    borderRadius: 12,
  },

  clearButtonText: {
    color: '#5A3D4D',
    fontSize: 15,
    fontWeight: '600',
  },

  disabledButton: {
    opacity: 0.7,
  },

  loadingText: {
    marginTop: 12,
    color: '#75656C',
    fontSize: 13,
    textAlign: 'center',
  },

  messageText: {
    marginTop: 12,
    color: '#5A3D4D',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  searchErrorContainer: {
    marginTop: 12,
    alignItems: 'center',
    gap: 10,
  },

  searchErrorText: {
    color: '#C43D74',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  stateCard: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },

  stateText: {
    color: '#5D4B53',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#C43D74',
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.75,
  },
});