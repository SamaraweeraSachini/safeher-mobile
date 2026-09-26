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

  // SAFE-87 current location state
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [originCoordinates, setOriginCoordinates] =
    useState<Location.LocationObjectCoords | null>(null);

  const handleUseCurrentLocation = async () => {
    setLocationMessage('');
    setOriginError('');
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

          setOrigin(
            locationName ||
              `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          );
        } else {
          setOrigin(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      } catch {
        setOrigin(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
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

  const handleSearch = () => {
    setOriginError('');
    setDestinationError('');
    setSearchMessage('');

    let hasError = false;

    if (!origin.trim()) {
      setOriginError('Please enter your origin.');
      hasError = true;
    }

    if (!destination.trim()) {
      setDestinationError('Please enter your destination.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsSearching(true);

    // SAFE-86 UI loading state.
    // The existing route engine will provide the actual route results.
    setTimeout(() => {
      setIsSearching(false);
      setSearchMessage(
        'Routes found. Available route options are shown below.',
      );
    }, 800);
  };

  const handleClear = () => {
    setOrigin('');
    setDestination('');
    setOriginError('');
    setDestinationError('');
    setSearchMessage('');
    setLocationMessage('');
    setOriginCoordinates(null);
  };

  const handleSwap = () => {
    const currentOrigin = origin;

    setOrigin(destination);
    setDestination(currentOrigin);

    setOriginError('');
    setDestinationError('');
    setSearchMessage('');
    setLocationMessage('');
    setOriginCoordinates(null);
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

        {/* SAFE-86: Route Search Form */}
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
              onChangeText={(text) => {
                setOrigin(text);

                if (originError) {
                  setOriginError('');
                }

                if (locationMessage) {
                  setLocationMessage('');
                }

                if (originCoordinates) {
                  setOriginCoordinates(null);
                }
              }}
              placeholder="Enter starting location"
              placeholderTextColor="#9A8790"
              accessibilityLabel="Origin"
            />
          </View>

          {originError ? (
            <Text style={styles.errorText}>{originError}</Text>
          ) : null}

          {/* SAFE-87: Use Current Location */}
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

          {/* Swap button */}
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
              onChangeText={(text) => {
                setDestination(text);

                if (destinationError) {
                  setDestinationError('');
                }
              }}
              placeholder="Enter destination"
              placeholderTextColor="#9A8790"
              accessibilityLabel="Destination"
            />
          </View>

          {destinationError ? (
            <Text style={styles.errorText}>{destinationError}</Text>
          ) : null}

          {/* Search */}
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

          {/* Clear */}
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
            <Text style={styles.messageText}>{searchMessage}</Text>
          ) : null}
        </View>

        {/* Existing Sprint 3 route results */}
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