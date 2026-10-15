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
  {
    label: '30 min',
    minutes: 30,
  },
  {
    label: '1 hour',
    minutes: 60,
  },
  {
    label: '1.5 hours',
    minutes: 90,
  },
  {
    label: '2 hours',
    minutes: 120,
  },
];

function createArrivalTime(
  minutesFromNow: number
): Date {
  return new Date(
    Date.now() +
      minutesFromNow *
        60 *
        1000
  );
}

function formatTime(
  date: Date
): string {
  return date.toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

function formatCoordinate(
  value: number
): string {
  return Number.isFinite(value)
    ? value.toFixed(5)
    : 'Unavailable';
}

export default function JourneyScreen() {
  const router =
    useRouter();

  const {
    journey: activeJourney,
    isLoading: activeJourneyLoading,
    error: activeJourneyError,
    refresh: refreshActiveJourney,
  } =
    useActiveSafeJourney();

  const {
    permissionState,
    errorMessage: permissionError,
    retry: retryPermission,
  } =
    useLocationPermission();

  const {
    location,
    isLocationLoading,
    locationError,
    retryLocation,
  } =
    useCurrentLocation(
      permissionState
    );

  const [
    contacts,
    setContacts,
  ] =
    useState<TrustedContact[]>(
      []
    );

  const [
    isStartingJourney,
    setIsStartingJourney,
  ] =
    useState(false);

  const [
    destination,
    setDestination,
  ] =
    useState('');

  const [
    selectedDestination,
    setSelectedDestination,
  ] =
    useState<LocationSuggestion | null>(
      null
    );

  const [
    destinationSuggestions,
    setDestinationSuggestions,
  ] =
    useState<LocationSuggestion[]>(
      []
    );

  const [
    isSearchingDestination,
    setIsSearchingDestination,
  ] =
    useState(false);

  const [
    destinationSearchError,
    setDestinationSearchError,
  ] =
    useState<string | null>(
      null
    );

  const [
    arrivalMinutes,
    setArrivalMinutes,
  ] =
    useState<number | null>(
      null
    );

  const [
    selectedContactIds,
    setSelectedContactIds,
  ] =
    useState<string[]>(
      []
    );

  const [
    checkInInterval,
    setCheckInInterval,
  ] =
    useState<CheckInInterval>(
      30
    );

  const [
    shareJourney,
    setShareJourney,
  ] =
    useState(true);

  const [
    contactsVisible,
    setContactsVisible,
  ] =
    useState(false);

  useEffect(() => {
    try {
      const unsubscribe =
        subscribeToTrustedContacts(
          setContacts,
          () =>
            setContacts([])
        );

      return unsubscribe;
    } catch {
      setContacts([]);
    }
  }, []);

  useEffect(() => {
    if (
      selectedDestination ||
      destination
        .trim()
        .length <
        3
    ) {
      setDestinationSuggestions(
        []
      );

      setIsSearchingDestination(
        false
      );

      setDestinationSearchError(
        null
      );

      return;
    }

    const controller =
      new AbortController();

    setIsSearchingDestination(
      true
    );

    setDestinationSearchError(
      null
    );

    const timer =
      setTimeout(
        () => {
          getLocationSuggestions(
            destination,
            controller.signal
          )
            .then(
              suggestions => {
                if (
                  !controller
                    .signal
                    .aborted
                ) {
                  setDestinationSuggestions(
                    suggestions
                  );
                }
              }
            )
            .catch(
              () => {
                if (
                  !controller
                    .signal
                    .aborted
                ) {
                  setDestinationSearchError(
                    'Could not find locations. Check your connection and try typing again.'
                  );

                  setDestinationSuggestions(
                    []
                  );
                }
              }
            )
            .finally(
              () => {
                if (
                  !controller
                    .signal
                    .aborted
                ) {
                  setIsSearchingDestination(
                    false
                  );
                }
              }
            );
        },
        400
      );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    destination,
    selectedDestination,
  ]);

  const expectedArrivalTime =
    useMemo(
      () =>
        arrivalMinutes ===
        null
          ? null
          : createArrivalTime(
              arrivalMinutes
            ),
      [
        arrivalMinutes,
      ]
    );

  const selectedContacts =
    useMemo(
      () =>
        contacts.filter(
          contact =>
            selectedContactIds.includes(
              contact.id
            )
        ),
      [
        contacts,
        selectedContactIds,
      ]
    );

  const canStartJourney =
    selectedDestination !==
      null &&
    expectedArrivalTime !==
      null &&
    location !==
      null &&
    (
      !shareJourney ||
      selectedContactIds.length >
        0
    ) &&
    !isStartingJourney &&
    !activeJourney;

  const handleDestinationChange =
    (
      value: string
    ) => {
      setDestination(
        value
      );

      setSelectedDestination(
        null
      );

      setDestinationSearchError(
        null
      );
    };

  const handleSelectDestination =
    (
      place: LocationSuggestion
    ) => {
      setSelectedDestination(
        place
      );

      setDestination(
        place.name
      );

      setDestinationSuggestions(
        []
      );
    };

  const handleUseCurrentLocation =
    async () => {
      if (
        permissionState !==
        'granted'
      ) {
        await retryPermission();
        return;
      }

      await retryLocation();
    };

  const toggleContact =
    (
      contact: TrustedContact
    ) => {
      setSelectedContactIds(
        current =>
          current.includes(
            contact.id
          )
            ? current.filter(
                id =>
                  id !==
                  contact.id
              )
            : [
                ...current,
                contact.id,
              ]
      );
    };

  const handleStartJourney =
    async () => {
      if (
        activeJourney
      ) {
        Alert.alert(
          'Journey already active',
          'Resume, complete or cancel your current Safe Journey before starting another one.'
        );

        return;
      }

      if (
        !selectedDestination
      ) {
        Alert.alert(
          'Select destination',
          'Search for and select a destination from the suggestions.'
        );

        return;
      }

      if (
        !location
      ) {
        Alert.alert(
          'Current location required',
          isLocationLoading
            ? 'SafeHer is still retrieving your current location.'
            : 'Use your current location before starting the journey.'
        );

        return;
      }

      if (
        !expectedArrivalTime
      ) {
        Alert.alert(
          'Arrival time required',
          'Select your expected arrival time.'
        );

        return;
      }

      if (
        shareJourney &&
        selectedContactIds.length ===
          0
      ) {
        Alert.alert(
          'Trusted contact required',
          'Select at least one saved trusted contact when Share Journey is enabled.'
        );

        return;
      }

      const configuration:
        SafeJourneyConfiguration = {
        destination:
          selectedDestination.name,

        destinationLocation: {
          latitude:
            selectedDestination.latitude,

          longitude:
            selectedDestination.longitude,
        },

        currentLocation: {
          latitude:
            location.latitude,

          longitude:
            location.longitude,
        },

        expectedArrivalTime,

        trustedContactIds:
          selectedContactIds,

        checkInIntervalMinutes:
          checkInInterval,

        shareJourney,
      };

      try {
        setIsStartingJourney(
          true
        );

        await createSafeJourney(
          configuration
        );

        await refreshActiveJourney();

        Alert.alert(
          'Safe Journey started',
          `Your journey to ${configuration.destination} is now active.`,
          [
            {
              text:
                'Open Journey',

              onPress:
                () => {
                  router.replace(
                    '/active-journey' as Href
                  );
                },
            },
          ]
        );
      } catch (
        error
      ) {
        Alert.alert(
          'Could not start journey',
          error instanceof
            SafeJourneyError
            ? error.message
            : 'Something went wrong. Please try again.'
        );
      } finally {
        setIsStartingJourney(
          false
        );
      }
    };

  if (
    activeJourneyLoading
  ) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <View
          style={
            styles.centerState
          }
        >
          <ActivityIndicator
            size="large"
            color={
              Brand.burgundy
            }
          />

          <Text
            style={
              styles.stateText
            }
          >
            Checking for an active
            journey...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
      edges={[
        'top',
      ]}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerIcon
            }
          >
            <Ionicons
              name="navigate"
              size={
                25
              }
              color={
                Brand.white
              }
            />
          </View>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.title
              }
            >
              Safe Journey
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Start, resume and review
              your Safe Journeys.
            </Text>
          </View>
        </View>

        {activeJourneyError ? (
          <View
            style={
              styles.errorCard
            }
          >
            <Text
              style={
                styles.errorText
              }
            >
              {
                activeJourneyError
              }
            </Text>
          </View>
        ) : null}

        {activeJourney ? (
          <View
            style={
              styles.activeJourneyCard
            }
          >
            <View
              style={
                styles.activeTopRow
              }
            >
              <View
                style={
                  styles.activeBadge
                }
              >
                <Text
                  style={
                    styles.activeBadgeText
                  }
                >
                  ACTIVE
                </Text>
              </View>

              <Ionicons
                name="radio-outline"
                size={
                  24
                }
                color="#287550"
              />
            </View>

            <Text
              style={
                styles.activeDestination
              }
            >
              {
                activeJourney.destination
              }
            </Text>

            <Text
              style={
                styles.activeHint
              }
            >
              You already have a Safe
              Journey in progress.
            </Text>

            <Pressable
              style={
                styles.resumeButton
              }
              onPress={() =>
                router.push(
                  '/active-journey' as Href
                )
              }
            >
              <Ionicons
                name="navigate-outline"
                size={
                  20
                }
                color={
                  Brand.white
                }
              />

              <Text
                style={
                  styles.resumeButtonText
                }
              >
                Resume Active Journey
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View
              style={
                styles.section
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Starting location
              </Text>

              <View
                style={
                  styles.locationCard
                }
              >
                <Text
                  style={
                    styles.locationTitle
                  }
                >
                  Current Location
                </Text>

                <Text
                  style={
                    styles.locationValue
                  }
                >
                  {location
                    ? `${formatCoordinate(
                        location.latitude
                      )}, ${formatCoordinate(
                        location.longitude
                      )}`
                    : 'Location not available yet'}
                </Text>

                <Pressable
                  style={
                    styles.outlineButton
                  }
                  onPress={
                    handleUseCurrentLocation
                  }
                >
                  <Text
                    style={
                      styles.outlineButtonText
                    }
                  >
                    {isLocationLoading
                      ? 'Getting Location...'
                      : location
                        ? 'Refresh Current Location'
                        : 'Use Current Location'}
                  </Text>
                </Pressable>
              </View>

              {permissionError ? (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {permissionError}
                </Text>
              ) : null}

              {locationError ? (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {locationError}
                </Text>
              ) : null}
            </View>

            <View
              style={
                styles.section
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Destination
              </Text>

              <View
                style={
                  styles.inputContainer
                }
              >
                <Ionicons
                  name="search-outline"
                  size={
                    20
                  }
                  color={
                    Brand.burgundy
                  }
                />

                <TextInput
                  value={
                    destination
                  }
                  onChangeText={
                    handleDestinationChange
                  }
                  placeholder="Start typing a destination"
                  placeholderTextColor={
                    Brand.muted
                  }
                  style={
                    styles.input
                  }
                />
              </View>

              {isSearchingDestination ? (
                <ActivityIndicator
                  style={{
                    marginTop: 8,
                  }}
                  color={
                    Brand.burgundy
                  }
                />
              ) : null}

              {destinationSearchError ? (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {
                    destinationSearchError
                  }
                </Text>
              ) : null}

              {destinationSuggestions.length >
              0 ? (
                <View
                  style={
                    styles.suggestions
                  }
                >
                  {destinationSuggestions.map(
                    place => (
                      <Pressable
                        key={
                          place.id
                        }
                        style={
                          styles.suggestion
                        }
                        onPress={() =>
                          handleSelectDestination(
                            place
                          )
                        }
                      >
                        <Ionicons
                          name="location-outline"
                          size={
                            18
                          }
                          color={
                            Brand.burgundy
                          }
                        />

                        <Text
                          style={
                            styles.suggestionText
                          }
                        >
                          {
                            place.name
                          }
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              ) : null}
            </View>

            <View
              style={
                styles.section
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Expected arrival
              </Text>

              <View
                style={
                  styles.optionGrid
                }
              >
                {ARRIVAL_OPTIONS.map(
                  option => {
                    const selected =
                      arrivalMinutes ===
                      option.minutes;

                    return (
                      <Pressable
                        key={
                          option.minutes
                        }
                        style={[
                          styles.optionButton,
                          selected &&
                            styles.optionButtonSelected,
                        ]}
                        onPress={() =>
                          setArrivalMinutes(
                            option.minutes
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selected &&
                              styles.optionTextSelected,
                          ]}
                        >
                          {
                            option.label
                          }
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>

              {expectedArrivalTime ? (
                <Text
                  style={
                    styles.helperText
                  }
                >
                  Expected arrival:{' '}
                  {formatTime(
                    expectedArrivalTime
                  )}
                </Text>
              ) : null}
            </View>

            <View
              style={
                styles.section
              }
            >
              <View
                style={
                  styles.sectionHeading
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Trusted contacts
                </Text>

                <Pressable
                  onPress={() =>
                    router.push(
                      '/trusted-contacts' as Href
                    )
                  }
                >
                  <Text
                    style={
                      styles.manageText
                    }
                  >
                    Manage
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={
                  styles.selector
                }
                onPress={() =>
                  setContactsVisible(
                    true
                  )
                }
              >
                <Ionicons
                  name="people-outline"
                  size={
                    21
                  }
                  color={
                    Brand.burgundy
                  }
                />

                <Text
                  style={
                    styles.selectorText
                  }
                >
                  {selectedContacts.length ===
                  0
                    ? 'Select saved contacts'
                    : `${selectedContacts.length} selected`}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={
                    20
                  }
                  color={
                    Brand.muted
                  }
                />
              </Pressable>

              {contacts.length ===
              0 ? (
                <Text
                  style={
                    styles.helperText
                  }
                >
                  No saved contacts yet.
                  Tap Manage to add one.
                </Text>
              ) : null}
            </View>

            <View
              style={
                styles.section
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Check-in interval
              </Text>

              <View
                style={
                  styles.optionGrid
                }
              >
                {CHECK_IN_INTERVALS.map(
                  interval => (
                    <Pressable
                      key={
                        interval
                      }
                      style={[
                        styles.optionButton,

                        checkInInterval ===
                          interval &&
                          styles.optionButtonSelected,
                      ]}
                      onPress={() =>
                        setCheckInInterval(
                          interval
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,

                          checkInInterval ===
                            interval &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {interval} min
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </View>

            <View
              style={
                styles.shareCard
              }
            >
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.shareTitle
                  }
                >
                  Share Journey
                </Text>

                <Text
                  style={
                    styles.shareDescription
                  }
                >
                  Attach your selected
                  trusted contacts to this
                  journey.
                </Text>
              </View>

              <Switch
                value={
                  shareJourney
                }
                onValueChange={
                  setShareJourney
                }
              />
            </View>

            <Pressable
              style={[
                styles.startButton,

                !canStartJourney &&
                  styles.disabled,
              ]}
              onPress={
                handleStartJourney
              }
              disabled={
                !canStartJourney
              }
            >
              {isStartingJourney ? (
                <ActivityIndicator
                  color={
                    Brand.white
                  }
                />
              ) : (
                <Ionicons
                  name="navigate"
                  size={
                    20
                  }
                  color={
                    Brand.white
                  }
                />
              )}

              <Text
                style={
                  styles.startButtonText
                }
              >
                {isStartingJourney
                  ? 'Starting Journey...'
                  : 'Start Journey'}
              </Text>
            </Pressable>
          </>
        )}

        <Pressable
          style={
            styles.historyButton
          }
          onPress={() =>
            router.push(
              '/journey-history' as Href
            )
          }
        >
          <Ionicons
            name="time-outline"
            size={
              20
            }
            color={
              Brand.burgundy
            }
          />

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.historyTitle
              }
            >
              Journey History
            </Text>

            <Text
              style={
                styles.historyHint
              }
            >
              Active, completed and
              cancelled journeys
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={
              19
            }
            color={
              Brand.burgundy
            }
          />
        </Pressable>
      </ScrollView>

      <Modal
        visible={
          contactsVisible
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setContactsVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.modalSheet
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Select Trusted Contacts
              </Text>

              <Pressable
                onPress={() =>
                  setContactsVisible(
                    false
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={
                    24
                  }
                  color={
                    Brand.ink
                  }
                />
              </Pressable>
            </View>

            {contacts.length ===
            0 ? (
              <>
                <Text
                  style={
                    styles.helperText
                  }
                >
                  No trusted contacts have
                  been saved yet.
                </Text>

                <Pressable
                  style={
                    styles.startButton
                  }
                  onPress={() => {
                    setContactsVisible(
                      false
                    );

                    router.push(
                      '/trusted-contacts' as Href
                    );
                  }}
                >
                  <Text
                    style={
                      styles.startButtonText
                    }
                  >
                    Add Trusted Contact
                  </Text>
                </Pressable>
              </>
            ) : (
              contacts.map(
                contact => {
                  const selected =
                    selectedContactIds.includes(
                      contact.id
                    );

                  return (
                    <Pressable
                      key={
                        contact.id
                      }
                      style={
                        styles.contactRow
                      }
                      onPress={() =>
                        toggleContact(
                          contact
                        )
                      }
                    >
                      <Ionicons
                        name={
                          selected
                            ? 'checkbox'
                            : 'square-outline'
                        }
                        size={
                          24
                        }
                        color={
                          Brand.burgundy
                        }
                      />

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={
                            styles.contactName
                          }
                        >
                          {
                            contact.name
                          }
                        </Text>

                        <Text
                          style={
                            styles.contactMeta
                          }
                        >
                          {contact.relationship ||
                            contact.phone}
                        </Text>
                      </View>
                    </Pressable>
                  );
                }
              )
            )}

            {contacts.length >
            0 ? (
              <Pressable
                style={
                  styles.startButton
                }
                onPress={() =>
                  setContactsVisible(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.startButtonText
                  }
                >
                  Done
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        Brand.cream,
    },

    centerState: {
      flex: 1,
      alignItems:
        'center',
      justifyContent:
        'center',
      padding: 30,
    },

    stateText: {
      marginTop: 12,
      color:
        Brand.muted,
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 40,
    },

    header: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 12,
      marginBottom: 18,
    },

    headerIcon: {
      width: 48,
      height: 48,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderRadius: 15,
      backgroundColor:
        Brand.burgundy,
    },

    title: {
      color:
        Brand.ink,
      fontSize: 24,
      fontWeight: '900',
    },

    subtitle: {
      marginTop: 3,
      color:
        Brand.muted,
      fontSize: 12,
    },

    errorCard: {
      marginBottom: 15,
      padding: 13,
      borderRadius: 14,
      backgroundColor:
        '#FEF3F2',
    },

    errorText: {
      marginTop: 7,
      color:
        '#B42318',
      fontSize: 12,
      lineHeight: 18,
    },

    activeJourneyCard: {
      marginBottom: 18,
      padding: 18,
      borderWidth: 1,
      borderColor:
        '#B7DEC9',
      borderRadius: 18,
      backgroundColor:
        '#E8F5ED',
    },

    activeTopRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    activeBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor:
        '#287550',
    },

    activeBadgeText: {
      color:
        '#FFFFFF',
      fontSize: 10,
      fontWeight: '900',
    },

    activeDestination: {
      marginTop: 12,
      color:
        Brand.ink,
      fontSize: 18,
      fontWeight: '900',
    },

    activeHint: {
      marginTop: 5,
      color:
        Brand.muted,
      fontSize: 12,
    },

    resumeButton: {
      minHeight: 50,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 8,
      marginTop: 14,
      borderRadius: 14,
      backgroundColor:
        '#287550',
    },

    resumeButtonText: {
      color:
        '#FFFFFF',
      fontWeight: '900',
    },

    section: {
      marginBottom: 18,
    },

    sectionHeading: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
    },

    sectionTitle: {
      marginBottom: 8,
      color:
        Brand.ink,
      fontSize: 15,
      fontWeight: '800',
    },

    manageText: {
      color:
        Brand.burgundy,
      fontWeight: '800',
    },

    locationCard: {
      padding: 14,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 15,
      backgroundColor:
        Brand.white,
    },

    locationTitle: {
      color:
        Brand.ink,
      fontWeight: '800',
    },

    locationValue: {
      marginTop: 3,
      color:
        Brand.muted,
      fontSize: 12,
    },

    outlineButton: {
      minHeight: 44,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginTop: 10,
      borderWidth: 1,
      borderColor:
        Brand.burgundy,
      borderRadius: 12,
    },

    outlineButtonText: {
      color:
        Brand.burgundy,
      fontWeight: '800',
    },

    inputContainer: {
      minHeight: 52,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 9,
      paddingHorizontal: 13,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 14,
      backgroundColor:
        Brand.white,
    },

    input: {
      flex: 1,
      color:
        Brand.ink,
    },

    suggestions: {
      marginTop: 6,
      overflow:
        'hidden',
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 14,
      backgroundColor:
        Brand.white,
    },

    suggestion: {
      minHeight: 50,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 8,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        Brand.line,
    },

    suggestionText: {
      flex: 1,
      color:
        Brand.ink,
      fontSize: 12,
    },

    optionGrid: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 8,
    },

    optionButton: {
      minWidth: 78,
      minHeight: 42,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 12,
      backgroundColor:
        Brand.white,
    },

    optionButtonSelected: {
      borderColor:
        Brand.burgundy,
      backgroundColor:
        Brand.burgundy,
    },

    optionText: {
      color:
        Brand.burgundy,
      fontWeight: '700',
    },

    optionTextSelected: {
      color:
        Brand.white,
    },

    helperText: {
      marginTop: 7,
      color:
        Brand.muted,
      fontSize: 12,
    },

    selector: {
      minHeight: 55,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 9,
      paddingHorizontal: 13,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 14,
      backgroundColor:
        Brand.white,
    },

    selectorText: {
      flex: 1,
      color:
        Brand.ink,
      fontWeight: '700',
    },

    shareCard: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 12,
      marginBottom: 18,
      padding: 15,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 16,
      backgroundColor:
        Brand.white,
    },

    shareTitle: {
      color:
        Brand.ink,
      fontWeight: '800',
    },

    shareDescription: {
      marginTop: 4,
      color:
        Brand.muted,
      fontSize: 12,
    },

    startButton: {
      minHeight: 52,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 8,
      borderRadius: 14,
      backgroundColor:
        Brand.burgundy,
    },

    startButtonText: {
      color:
        Brand.white,
      fontWeight: '900',
    },

    disabled: {
      opacity: 0.5,
    },

    historyButton: {
      minHeight: 62,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 10,
      marginTop: 14,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 15,
      backgroundColor:
        Brand.white,
    },

    historyTitle: {
      color:
        Brand.burgundy,
      fontWeight: '800',
    },

    historyHint: {
      marginTop: 3,
      color:
        Brand.muted,
      fontSize: 11,
    },

    modalBackdrop: {
      flex: 1,
      justifyContent:
        'flex-end',
      backgroundColor:
        'rgba(41,24,32,0.4)',
    },

    modalSheet: {
      maxHeight: '75%',
      padding: 20,
      paddingBottom: 34,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor:
        Brand.white,
    },

    modalHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      marginBottom: 14,
    },

    modalTitle: {
      color:
        Brand.ink,
      fontSize: 20,
      fontWeight: '900',
    },

    contactRow: {
      minHeight: 58,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        Brand.line,
    },

    contactName: {
      color:
        Brand.ink,
      fontWeight: '800',
    },

    contactMeta: {
      marginTop: 2,
      color:
        Brand.muted,
      fontSize: 11,
    },
  });