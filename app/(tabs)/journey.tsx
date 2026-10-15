import { Ionicons } from '@expo/vector-icons';

import {
  type Href,
  useRouter,
} from 'expo-router';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Brand,
} from '@/constants/brand';

import {
  CHECK_IN_INTERVALS,
} from '@/constants/safe-journey';

import {
  useActiveSafeJourney,
} from '@/src/hooks/useActiveSafeJourney';

import {
  useCurrentLocation,
} from '@/src/hooks/useCurrentLocation';

import {
  useLocationPermission,
} from '@/src/hooks/useLocationPermission';

import {
  getLocationSuggestions,
  type LocationSuggestion,
} from '@/src/services/route-location-service';

import {
  createSafeJourney,
  SafeJourneyError,
} from '@/src/services/safe-journey-service';

import {
  subscribeToTrustedContacts,
} from '@/src/services/trusted-contact-service';

import type {
  CheckInInterval,
  SafeJourneyConfiguration,
} from '@/src/types/safe-journey';

import type {
  TrustedContact,
} from '@/src/types/trusted-contact';

const ARRIVAL_OPTIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '1.5 hours', minutes: 90 },
  { label: '2 hours', minutes: 120 },
];

function createArrivalTime(minutesFromNow: number): Date {
  return new Date(Date.now() + minutesFromNow * 60 * 1000);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? value.toFixed(5) : 'Unavailable';
}

export default function JourneyScreen() {
  const router = useRouter();

  const {
    journey: activeJourney,
    isLoading: activeJourneyLoading,
    error: activeJourneyError,
    refresh: refreshActiveJourney,
  } = useActiveSafeJourney();

  const {
    permissionState,
    errorMessage: permissionError,
    retry: retryPermission,
  } = useLocationPermission();

  const {
    location,
    isLocationLoading,
    locationError,
    retryLocation,
  } = useCurrentLocation(permissionState);

  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [isStartingJourney, setIsStartingJourney] = useState(false);
  const [destination, setDestination] = useState('');
  const [selectedDestination, setSelectedDestination] =
    useState<LocationSuggestion | null>(null);
  const [destinationSuggestions, setDestinationSuggestions] =
    useState<LocationSuggestion[]>([]);
  const [isSearchingDestination, setIsSearchingDestination] =
    useState(false);
  const [destinationSearchError, setDestinationSearchError] =
    useState<string | null>(null);
  const [arrivalMinutes, setArrivalMinutes] = useState<number | null>(
    null
  );
  const [selectedContactIds, setSelectedContactIds] = useState<
    string[]
  >([]);
  const [checkInInterval, setCheckInInterval] =
    useState<CheckInInterval>(30);
  const [shareJourney, setShareJourney] = useState(true);
  const [contactsVisible, setContactsVisible] = useState(false);

  useEffect(() => {
    try {
      const unsubscribe = subscribeToTrustedContacts(
        setContacts,
        () => setContacts([])
      );
      return unsubscribe;
    } catch {
      setContacts([]);
    }
  }, []);

  useEffect(() => {
    if (selectedDestination || destination.trim().length < 3) {
      setDestinationSuggestions([]);
      setIsSearchingDestination(false);
      setDestinationSearchError(null);
      return;
    }

    const controller = new AbortController();

    setIsSearchingDestination(true);
    setDestinationSearchError(null);

    const timer = setTimeout(() => {
      getLocationSuggestions(destination, controller.signal)
        .then(suggestions => {
          if (!controller.signal.aborted) {
            setDestinationSuggestions(suggestions);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setDestinationSearchError(
              'Could not find locations. Check your connection and try typing again.'
            );
            setDestinationSuggestions([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearchingDestination(false);
          }
        });
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destination, selectedDestination]);

  const expectedArrivalTime = useMemo(
    () =>
      arrivalMinutes === null
        ? null
        : createArrivalTime(arrivalMinutes),
    [arrivalMinutes]
  );

  const selectedContacts = useMemo(
    () =>
      contacts.filter(contact =>
        selectedContactIds.includes(contact.id)
      ),
    [contacts, selectedContactIds]
  );

  const canStartJourney =
    selectedDestination !== null &&
    expectedArrivalTime !== null &&
    location !== null &&
    (!shareJourney || selectedContactIds.length > 0) &&
    !isStartingJourney &&
    !activeJourney;

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    setSelectedDestination(null);
    setDestinationSearchError(null);
  };

  const handleSelectDestination = (place: LocationSuggestion) => {
    setSelectedDestination(place);
    setDestination(place.name);
    setDestinationSuggestions([]);
  };

  const handleUseCurrentLocation = async () => {
    if (permissionState !== 'granted') {
      await retryPermission();
      return;
    }
    await retryLocation();
  };

  const toggleContact = (contact: TrustedContact) => {
    setSelectedContactIds(current =>
      current.includes(contact.id)
        ? current.filter(id => id !== contact.id)
        : [...current, contact.id]
    );
  };

  const handleStartJourney = async () => {
    if (activeJourney) {
      Alert.alert(
        'Journey already active',
        'Resume, complete or cancel your current Safe Journey before starting another one.'
      );
      return;
    }

    if (!selectedDestination) {
      Alert.alert(
        'Select destination',
        'Search for and select a destination from the suggestions.'
      );
      return;
    }

    if (!location) {
      Alert.alert(
        'Current location required',
        isLocationLoading
          ? 'SafeHer is still retrieving your current location.'
          : 'Use your current location before starting the journey.'
      );
      return;
    }

    if (!expectedArrivalTime) {
      Alert.alert(
        'Arrival time required',
        'Select your expected arrival time.'
      );
      return;
    }

    if (shareJourney && selectedContactIds.length === 0) {
      Alert.alert(
        'Trusted contact required',
        'Select at least one saved trusted contact when Share Journey is enabled.'
      );
      return;
    }

    const configuration: SafeJourneyConfiguration = {
      destination: selectedDestination.name,
      destinationLocation: {
        latitude: selectedDestination.latitude,
        longitude: selectedDestination.longitude,
      },
      currentLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      expectedArrivalTime,
      trustedContactIds: selectedContactIds,
      checkInIntervalMinutes: checkInInterval,
      shareJourney,
    };

    try {
      setIsStartingJourney(true);
      await createSafeJourney(configuration);
      await refreshActiveJourney();

      Alert.alert(
        'Safe Journey started',
        `Your journey to ${configuration.destination} is now active.`,
        [
          {
            text: 'Open Journey',
            onPress: () => {
              router.replace('/active-journey' as Href);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Could not start journey',
        error instanceof SafeJourneyError
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsStartingJourney(false);
    }
  };

  if (activeJourneyLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Brand.burgundy} />
          <Text style={styles.stateText}>
            Checking for an active journey...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="navigate" size={24} color={Brand.white} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Safe Journey</Text>
            <Text style={styles.subtitle}>
              Start, resume and review your Safe Journeys.
            </Text>
          </View>
        </View>

        {activeJourneyError ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#B42318"
            />
            <Text style={styles.errorText}>{activeJourneyError}</Text>
          </View>
        ) : null}

        {/* ---------- Active Journey ---------- */}
        {activeJourney ? (
          <View style={styles.activeJourneyCard}>
            <View style={styles.activeTopRow}>
              <View style={styles.activeBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>

              <Ionicons
                name="radio-outline"
                size={22}
                color="#287550"
              />
            </View>

            <Text style={styles.activeDestination}>
              {activeJourney.destination}
            </Text>

            <Text style={styles.activeHint}>
              You already have a Safe Journey in progress.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.resumeButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/active-journey' as Href)}
            >
              <Ionicons
                name="navigate-outline"
                size={19}
                color={Brand.white}
              />
              <Text style={styles.resumeButtonText}>
                Resume Active Journey
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ---------- Starting location ---------- */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Starting location</Text>

              <View style={styles.locationCard}>
                <View style={styles.locationTopRow}>
                  <View style={styles.locationPinWrap}>
                    <Ionicons
                      name="location"
                      size={18}
                      color={Brand.burgundy}
                    />
                  </View>
                  <Text style={styles.locationTitle}>
                    Current Location
                  </Text>
                </View>

                <Text style={styles.locationValue}>
                  {location
                    ? `${formatCoordinate(
                        location.latitude
                      )}, ${formatCoordinate(location.longitude)}`
                    : 'Location not available yet'}
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.outlineButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleUseCurrentLocation}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={17}
                    color={Brand.burgundy}
                  />
                  <Text style={styles.outlineButtonText}>
                    {isLocationLoading
                      ? 'Getting Location...'
                      : location
                        ? 'Refresh Current Location'
                        : 'Use Current Location'}
                  </Text>
                </Pressable>
              </View>

              {permissionError ? (
                <Text style={styles.errorText}>{permissionError}</Text>
              ) : null}

              {locationError ? (
                <Text style={styles.errorText}>{locationError}</Text>
              ) : null}
            </View>

            {/* ---------- Destination ---------- */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Destination</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="search-outline"
                  size={19}
                  color={Brand.burgundy}
                />
                <TextInput
                  value={destination}
                  onChangeText={handleDestinationChange}
                  placeholder="Start typing a destination"
                  placeholderTextColor={Brand.muted}
                  style={styles.input}
                />
              </View>

              {isSearchingDestination ? (
                <ActivityIndicator
                  style={{ marginTop: 8 }}
                  color={Brand.burgundy}
                />
              ) : null}

              {destinationSearchError ? (
                <Text style={styles.errorText}>
                  {destinationSearchError}
                </Text>
              ) : null}

              {destinationSuggestions.length > 0 ? (
                <View style={styles.suggestions}>
                  {destinationSuggestions.map(place => (
                    <Pressable
                      key={place.id}
                      style={({ pressed }) => [
                        styles.suggestion,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleSelectDestination(place)}
                    >
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color={Brand.burgundy}
                      />
                      <Text style={styles.suggestionText}>
                        {place.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            {/* ---------- Arrival ---------- */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expected arrival</Text>

              <View style={styles.optionGrid}>
                {ARRIVAL_OPTIONS.map(option => {
                  const selected =
                    arrivalMinutes === option.minutes;

                  return (
                    <Pressable
                      key={option.minutes}
                      style={[
                        styles.optionButton,
                        selected && styles.optionButtonSelected,
                      ]}
                      onPress={() =>
                        setArrivalMinutes(option.minutes)
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {expectedArrivalTime ? (
                <View style={styles.helperRow}>
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color={Brand.burgundy}
                  />
                  <Text style={styles.helperText}>
                    Expected arrival:{' '}
                    {formatTime(expectedArrivalTime)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* ---------- Trusted contacts ---------- */}
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>
                  Trusted contacts
                </Text>
                <Pressable
                  onPress={() =>
                    router.push('/trusted-contacts' as Href)
                  }
                >
                  <Text style={styles.manageText}>Manage</Text>
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.selector,
                  pressed && styles.pressed,
                ]}
                onPress={() => setContactsVisible(true)}
              >
                <View style={styles.selectorIconWrap}>
                  <Ionicons
                    name="people-outline"
                    size={19}
                    color={Brand.burgundy}
                  />
                </View>

                <Text style={styles.selectorText}>
                  {selectedContacts.length === 0
                    ? 'Select saved contacts'
                    : `${selectedContacts.length} selected`}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={Brand.muted}
                />
              </Pressable>

              {contacts.length === 0 ? (
                <Text style={styles.helperText}>
                  No saved contacts yet. Tap Manage to add one.
                </Text>
              ) : null}
            </View>

            {/* ---------- Check-in interval ---------- */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Check-in interval
              </Text>

              <View style={styles.optionGrid}>
                {CHECK_IN_INTERVALS.map(interval => (
                  <Pressable
                    key={interval}
                    style={[
                      styles.optionButton,
                      checkInInterval === interval &&
                        styles.optionButtonSelected,
                    ]}
                    onPress={() => setCheckInInterval(interval)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        checkInInterval === interval &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {interval} min
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ---------- Share Journey ---------- */}
            <View style={styles.shareCard}>
              <View style={styles.shareIconWrap}>
                <Ionicons
                  name="share-social-outline"
                  size={19}
                  color={Brand.burgundy}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.shareTitle}>Share Journey</Text>
                <Text style={styles.shareDescription}>
                  Attach your selected trusted contacts to this journey.
                </Text>
              </View>

              <Switch
                value={shareJourney}
                onValueChange={setShareJourney}
                trackColor={{
                  false: Brand.line,
                  true: Brand.roseSoft,
                }}
                thumbColor={
                  shareJourney ? Brand.burgundy : Brand.white
                }
              />
            </View>

            {/* ---------- Start Button ---------- */}
            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                !canStartJourney && styles.disabled,
                pressed && canStartJourney && styles.pressed,
              ]}
              onPress={handleStartJourney}
              disabled={!canStartJourney}
            >
              {isStartingJourney ? (
                <ActivityIndicator color={Brand.white} />
              ) : (
                <Ionicons
                  name="navigate"
                  size={19}
                  color={Brand.white}
                />
              )}
              <Text style={styles.startButtonText}>
                {isStartingJourney
                  ? 'Starting Journey...'
                  : 'Start Journey'}
              </Text>
            </Pressable>
          </>
        )}

        {/* ---------- History ---------- */}
        <Pressable
          style={({ pressed }) => [
            styles.historyButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/journey-history' as Href)}
        >
          <View style={styles.historyIconWrap}>
            <Ionicons
              name="time-outline"
              size={19}
              color={Brand.burgundy}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.historyTitle}>Journey History</Text>
            <Text style={styles.historyHint}>
              Active, completed and cancelled journeys
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={Brand.burgundy}
          />
        </Pressable>
      </ScrollView>

      {/* ---------- Contacts Modal ---------- */}
      <Modal
        visible={contactsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContactsVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select Trusted Contacts
              </Text>

              <Pressable
                onPress={() => setContactsVisible(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="close" size={20} color={Brand.ink} />
              </Pressable>
            </View>

            {contacts.length === 0 ? (
              <>
                <Text style={styles.helperText}>
                  No trusted contacts have been saved yet.
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.startButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    setContactsVisible(false);
                    router.push('/trusted-contacts' as Href);
                  }}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={18}
                    color={Brand.white}
                  />
                  <Text style={styles.startButtonText}>
                    Add Trusted Contact
                  </Text>
                </Pressable>
              </>
            ) : (
              contacts.map(contact => {
                const selected = selectedContactIds.includes(
                  contact.id
                );

                return (
                  <Pressable
                    key={contact.id}
                    style={({ pressed }) => [
                      styles.contactRow,
                      selected && styles.contactRowSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => toggleContact(contact)}
                  >
                    <Ionicons
                      name={
                        selected ? 'checkbox' : 'square-outline'
                      }
                      size={23}
                      color={Brand.burgundy}
                    />

                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactName}>
                        {contact.name}
                      </Text>
                      <Text style={styles.contactMeta}>
                        {contact.relationship || contact.phone}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            {contacts.length > 0 ? (
              <Pressable
                style={({ pressed }) => [
                  styles.startButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => setContactsVisible(false)}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={Brand.white}
                />
                <Text style={styles.startButtonText}>Done</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.cream,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  stateText: {
    marginTop: 12,
    color: Brand.muted,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 44,
  },

  /* ---------- Header ---------- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },

  headerIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Brand.burgundy,
    shadowColor: Brand.burgundy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },

  title: {
    color: Brand.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 3,
    color: Brand.muted,
    fontSize: 12.5,
  },

  /* ---------- Error ---------- */
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
    padding: 13,
    borderRadius: 14,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#F8CFCB',
  },

  errorText: {
    marginTop: 7,
    color: '#B42318',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },

  /* ---------- Active Journey ---------- */
  activeJourneyCard: {
    marginBottom: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#B7DEC9',
    borderRadius: 20,
    backgroundColor: '#E8F5ED',
    shadowColor: '#287550',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  activeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#287550',
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  activeDestination: {
    marginTop: 12,
    color: Brand.ink,
    fontSize: 18,
    fontWeight: '900',
  },

  activeHint: {
    marginTop: 5,
    color: Brand.muted,
    fontSize: 12,
  },

  resumeButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#287550',
    shadowColor: '#287550',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },

  resumeButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14.5,
  },

  /* ---------- Section ---------- */
  section: {
    marginBottom: 18,
  },

  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    marginBottom: 8,
    color: Brand.ink,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.1,
  },

  manageText: {
    color: Brand.burgundy,
    fontWeight: '800',
    fontSize: 13,
  },

  /* ---------- Location Card ---------- */
  locationCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 16,
    backgroundColor: Brand.white,
  },

  locationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  locationPinWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },

  locationTitle: {
    color: Brand.ink,
    fontWeight: '800',
    fontSize: 14,
  },

  locationValue: {
    marginTop: 8,
    color: Brand.muted,
    fontSize: 12,
    letterSpacing: 0.1,
  },

  outlineButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: Brand.burgundy,
    borderRadius: 13,
    backgroundColor: '#FFF9FB',
  },

  outlineButtonText: {
    color: Brand.burgundy,
    fontWeight: '800',
    fontSize: 13,
  },

  /* ---------- Input ---------- */
  inputContainer: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 15,
    backgroundColor: Brand.white,
  },

  input: {
    flex: 1,
    color: Brand.ink,
    fontSize: 14,
  },

  /* ---------- Suggestions ---------- */
  suggestions: {
    marginTop: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 15,
    backgroundColor: Brand.white,
  },

  suggestion: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
  },

  suggestionText: {
    flex: 1,
    color: Brand.ink,
    fontSize: 13,
  },

  /* ---------- Option Grid ---------- */
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  optionButton: {
    minWidth: 82,
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Brand.line,
    borderRadius: 13,
    backgroundColor: Brand.white,
  },

  optionButtonSelected: {
    borderColor: Brand.burgundy,
    backgroundColor: Brand.burgundy,
    shadowColor: Brand.burgundy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 2,
  },

  optionText: {
    color: Brand.burgundy,
    fontWeight: '800',
    fontSize: 13,
  },

  optionTextSelected: {
    color: Brand.white,
  },

  /* ---------- Helpers ---------- */
  helperText: {
    marginTop: 7,
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },

  /* ---------- Selector ---------- */
  selector: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 15,
    backgroundColor: Brand.white,
  },

  selectorIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },

  selectorText: {
    flex: 1,
    color: Brand.ink,
    fontWeight: '700',
    fontSize: 13.5,
  },

  /* ---------- Share Card ---------- */
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 18,
    backgroundColor: Brand.white,
  },

  shareIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },

  shareTitle: {
    color: Brand.ink,
    fontWeight: '800',
    fontSize: 14,
  },

  shareDescription: {
    marginTop: 4,
    color: Brand.muted,
    fontSize: 11.5,
    lineHeight: 16,
  },

  /* ---------- Start Button ---------- */
  startButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    backgroundColor: Brand.burgundy,
    shadowColor: Brand.burgundy,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },

  startButtonText: {
    color: Brand.white,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },

  pressed: {
    opacity: 0.82,
  },

  /* ---------- History ---------- */
  historyButton: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 17,
    backgroundColor: Brand.white,
    shadowColor: '#4E1026',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  historyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },

  historyTitle: {
    color: Brand.burgundy,
    fontWeight: '800',
    fontSize: 14,
  },

  historyHint: {
    marginTop: 3,
    color: Brand.muted,
    fontSize: 11.5,
  },

  /* ---------- Modal ---------- */
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(41,24,32,0.45)',
  },

  modalSheet: {
    maxHeight: '78%',
    padding: 20,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: Brand.white,
  },

  modalHandle: {
    width: 44,
    height: 5,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 3,
    backgroundColor: '#D9C9D0',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  modalTitle: {
    color: Brand.ink,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },

  /* ---------- Contact Row ---------- */
  contactRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
  },

  contactRowSelected: {
    backgroundColor: 'transparent',
  },

  contactName: {
    color: Brand.ink,
    fontWeight: '800',
    fontSize: 14,
  },

  contactMeta: {
    marginTop: 3,
    color: Brand.muted,
    fontSize: 11.5,
  },
});