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
  JOURNEY_TRUSTED_CONTACTS,
} from '@/constants/safe-journey';

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

import type {
  CheckInInterval,
  JourneyTrustedContact,
  SafeJourneyConfiguration,
} from '@/src/types/safe-journey';

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
      minutesFromNow * 60 * 1000
  );
}

function formatTime(
  date: Date
): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
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
    permissionState,
    errorMessage:
      permissionError,
    retry:
      retryPermission,
  } = useLocationPermission();

  const {
    location,
    isLocationLoading,
    locationError,
    retryLocation,
  } = useCurrentLocation(
    permissionState
  );

  const [
    isStartingJourney,
    setIsStartingJourney,
  ] = useState(false);

  const [
    destination,
    setDestination,
  ] = useState('');

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
    useState<LocationSuggestion[]>([]);

  const [
    isSearchingDestination,
    setIsSearchingDestination,
  ] = useState(false);

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
    useState<string[]>([]);

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
    if (
      selectedDestination ||
      destination.trim().length < 3
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
      setTimeout(() => {
        getLocationSuggestions(
          destination,
          controller.signal
        )
          .then(
            suggestions => {
              if (
                !controller.signal
                  .aborted
              ) {
                setDestinationSuggestions(
                  suggestions
                );
              }
            }
          )
          .catch(() => {
            if (
              !controller.signal
                .aborted
            ) {
              setDestinationSearchError(
                'Could not find locations. Check your connection and try typing again.'
              );

              setDestinationSuggestions(
                []
              );
            }
          })
          .finally(() => {
            if (
              !controller.signal
                .aborted
            ) {
              setIsSearchingDestination(
                false
              );
            }
          });
      }, 400);

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
      [arrivalMinutes]
    );

  const selectedContacts =
    useMemo(
      () =>
        JOURNEY_TRUSTED_CONTACTS.filter(
          contact =>
            selectedContactIds.includes(
              contact.id
            )
        ),
      [selectedContactIds]
    );

  const canStartJourney =
    selectedDestination !==
      null &&
    expectedArrivalTime !==
      null &&
    location !== null &&
    (
      !shareJourney ||
      selectedContactIds.length >
        0
    ) &&
    !isStartingJourney;

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

      setDestinationSearchError(
        null
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

  const toggleContact = (
    contact: JourneyTrustedContact
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
        destination.trim()
          .length === 0
      ) {
        Alert.alert(
          'Destination required',
          'Search for and select your destination before starting the journey.'
        );

        return;
      }

      if (
        !selectedDestination
      ) {
        Alert.alert(
          'Select destination',
          'Please select a destination from the search suggestions.'
        );

        return;
      }

      if (!location) {
        Alert.alert(
          'Current location required',
          isLocationLoading
            ? 'SafeHer is still getting your current location. Please wait a moment and try again.'
            : 'Tap Use Current Location before starting your Safe Journey.'
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
        expectedArrivalTime.getTime() <=
        Date.now()
      ) {
        Alert.alert(
          'Invalid arrival time',
          'Expected arrival time must be in the future.'
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
          'Select at least one trusted contact when Share Journey is enabled.'
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

        const journeyId =
          await createSafeJourney(
            configuration
          );

        console.log(
          'Safe Journey stored:',
          journeyId
        );

        Alert.alert(
          'Safe Journey started',
          `Your journey to ${configuration.destination} is now active.`,
          [
            {
              text:
                'OK',

              onPress:
                () => {
                  router.replace(
                    '/active-journey' as Href
                  );
                },
            },
          ]
        );
      } catch (error) {
        if (
          error instanceof
          SafeJourneyError
        ) {
          Alert.alert(
            'Could not start journey',
            error.message
          );

          return;
        }

        Alert.alert(
          'Could not start journey',
          'Something went wrong. Please try again.'
        );
      } finally {
        setIsStartingJourney(
          false
        );
      }
    };

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
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
              size={25}
              color={
                Brand.white
              }
            />
          </View>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Start Safe Journey
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Choose a real destination
              and configure your journey
              safety preferences.
            </Text>
          </View>
        </View>

        <Pressable
          style={
            styles.historyButton
          }
          onPress={() => {
            router.push(
              '/journey-history' as Href
            );
          }}
          accessibilityRole="button"
          accessibilityLabel="Open journey history"
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={
              Brand.burgundy
            }
          />

          <View
            style={
              styles.historyTextContainer
            }
          >
            <Text
              style={
                styles.historyButtonText
              }
            >
              Journey History
            </Text>

            <Text
              style={
                styles.historyButtonHint
              }
            >
              View your completed and
              cancelled journeys.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={
              Brand.burgundy
            }
          />
        </Pressable>

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
            <View
              style={
                styles.locationCardTop
              }
            >
              <View
                style={
                  styles.locationIcon
                }
              >
                <Ionicons
                  name="locate"
                  size={20}
                  color={
                    Brand.burgundy
                  }
                />
              </View>

              <View
                style={
                  styles.locationTextContainer
                }
              >
                <Text
                  style={
                    styles.locationTitle
                  }
                >
                  Current Location
                </Text>

                {location ? (
                  <Text
                    style={
                      styles.locationValue
                    }
                  >
                    {formatCoordinate(
                      location.latitude
                    )}
                    ,{' '}
                    {formatCoordinate(
                      location.longitude
                    )}
                  </Text>
                ) : (
                  <Text
                    style={
                      styles.locationValue
                    }
                  >
                    Location not available
                    yet
                  </Text>
                )}
              </View>

              {location ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#38785A"
                />
              ) : null}
            </View>

            <Pressable
              style={
                styles.currentLocationButton
              }
              onPress={
                handleUseCurrentLocation
              }
              disabled={
                isLocationLoading
              }
              accessibilityRole="button"
              accessibilityLabel="Use current location"
            >
              {isLocationLoading ? (
                <ActivityIndicator
                  size="small"
                  color={
                    Brand.burgundy
                  }
                />
              ) : (
                <Ionicons
                  name="navigate-circle-outline"
                  size={20}
                  color={
                    Brand.burgundy
                  }
                />
              )}

              <Text
                style={
                  styles.currentLocationButtonText
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
              size={20}
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
              placeholder="Search destination"
              placeholderTextColor={
                Brand.muted
              }
              style={
                styles.input
              }
              autoCorrect={false}
              accessibilityLabel="Journey destination"
            />

            {destination.length >
            0 ? (
              <Pressable
                onPress={() => {
                  setDestination('');
                  setSelectedDestination(
                    null
                  );
                  setDestinationSuggestions(
                    []
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear destination"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={
                    Brand.muted
                  }
                />
              </Pressable>
            ) : null}
          </View>

          {isSearchingDestination ? (
            <View
              style={
                styles.searchStatus
              }
            >
              <ActivityIndicator
                size="small"
                color={
                  Brand.burgundy
                }
              />

              <Text
                style={
                  styles.searchStatusText
                }
              >
                Searching locations...
              </Text>
            </View>
          ) : null}

          {destinationSearchError ? (
            <Text
              style={
                styles.errorText
              }
            >
              {destinationSearchError}
            </Text>
          ) : null}

          {destinationSuggestions.length >
          0 ? (
            <View
              style={
                styles.suggestionsContainer
              }
            >
              {destinationSuggestions.map(
                place => (
                  <Pressable
                    key={
                      place.id
                    }
                    style={
                      styles.suggestionRow
                    }
                    onPress={() =>
                      handleSelectDestination(
                        place
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${place.name} as destination`}
                  >
                    <View
                      style={
                        styles.suggestionIcon
                      }
                    >
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color={
                          Brand.burgundy
                        }
                      />
                    </View>

                    <Text
                      style={
                        styles.suggestionText
                      }
                    >
                      {place.name}
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color={
                        Brand.muted
                      }
                    />
                  </Pressable>
                )
              )}
            </View>
          ) : null}

          {selectedDestination ? (
            <View
              style={
                styles.selectedDestination
              }
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#38785A"
              />

              <Text
                style={
                  styles.selectedDestinationText
                }
              >
                Selected:{' '}
                {
                  selectedDestination.name
                }
              </Text>
            </View>
          ) : destination.trim().length >=
            3 &&
            !isSearchingDestination &&
            destinationSuggestions.length ===
              0 &&
            !destinationSearchError ? (
            <Text
              style={
                styles.helperText
              }
            >
              Select a location from the
              suggestions before starting
              your journey.
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
                    accessibilityRole="button"
                    accessibilityState={{
                      selected,
                    }}
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
          <Text
            style={
              styles.sectionTitle
            }
          >
            Trusted contacts
          </Text>

          <Pressable
            style={
              styles.selector
            }
            onPress={() =>
              setContactsVisible(
                true
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Select trusted contacts"
          >
            <View
              style={
                styles.selectorLeft
              }
            >
              <Ionicons
                name="people-outline"
                size={21}
                color={
                  Brand.burgundy
                }
              />

              <View>
                <Text
                  style={
                    styles.selectorTitle
                  }
                >
                  Select contacts
                </Text>

                <Text
                  style={
                    styles.selectorValue
                  }
                >
                  {selectedContacts.length ===
                  0
                    ? 'No contacts selected'
                    : `${selectedContacts.length} selected`}
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={
                Brand.muted
              }
            />
          </Pressable>

          {selectedContacts.length >
          0 ? (
            <View
              style={
                styles.selectedContacts
              }
            >
              {selectedContacts.map(
                contact => (
                  <View
                    key={
                      contact.id
                    }
                    style={
                      styles.contactChip
                    }
                  >
                    <Ionicons
                      name="person"
                      size={13}
                      color={
                        Brand.burgundy
                      }
                    />

                    <Text
                      style={
                        styles.contactChipText
                      }
                    >
                      {
                        contact.name
                      }
                    </Text>
                  </View>
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
            Check-in interval
          </Text>

          <Text
            style={
              styles.sectionHint
            }
          >
            SafeHer will remind you to
            confirm that you are safe.
          </Text>

          <View
            style={
              styles.optionGrid
            }
          >
            {CHECK_IN_INTERVALS.map(
              interval => {
                const selected =
                  checkInInterval ===
                  interval;

                return (
                  <Pressable
                    key={
                      interval
                    }
                    style={[
                      styles.optionButton,

                      selected &&
                        styles.optionButtonSelected,
                    ]}
                    onPress={() =>
                      setCheckInInterval(
                        interval
                      )
                    }
                    accessibilityRole="button"
                    accessibilityState={{
                      selected,
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,

                        selected &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {interval} min
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>
        </View>

        <View
          style={
            styles.shareCard
          }
        >
          <View
            style={
              styles.shareText
            }
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
              Share your journey
              information with the
              selected trusted contacts.
            </Text>
          </View>

          <Switch
            value={
              shareJourney
            }
            onValueChange={
              setShareJourney
            }
            trackColor={{
              false:
                Brand.line,

              true:
                Brand.roseSoft,
            }}
            thumbColor={
              shareJourney
                ? Brand.burgundy
                : Brand.white
            }
            accessibilityLabel="Share Journey"
          />
        </View>

        <Pressable
          style={({
            pressed,
          }) => [
            styles.startButton,

            !canStartJourney &&
              styles.startButtonDisabled,

            pressed &&
              canStartJourney &&
              styles.startButtonPressed,
          ]}
          onPress={
            handleStartJourney
          }
          disabled={
            !canStartJourney
          }
          accessibilityRole="button"
          accessibilityLabel="Start Journey"
        >
          {isStartingJourney ? (
            <ActivityIndicator
              size="small"
              color={
                Brand.white
              }
            />
          ) : (
            <Ionicons
              name="navigate"
              size={20}
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
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Trusted Contacts
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Select who should
                  receive your journey
                  information.
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={() =>
                  setContactsVisible(
                    false
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Close trusted contacts"
              >
                <Ionicons
                  name="close"
                  size={23}
                  color={
                    Brand.ink
                  }
                />
              </Pressable>
            </View>

            {JOURNEY_TRUSTED_CONTACTS.map(
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
                    style={[
                      styles.contactRow,

                      selected &&
                        styles.contactRowSelected,
                    ]}
                    onPress={() =>
                      toggleContact(
                        contact
                      )
                    }
                    accessibilityRole="checkbox"
                    accessibilityState={{
                      checked:
                        selected,
                    }}
                  >
                    <View
                      style={
                        styles.contactAvatar
                      }
                    >
                      <Ionicons
                        name="person"
                        size={19}
                        color={
                          Brand.burgundy
                        }
                      />
                    </View>

                    <Text
                      style={
                        styles.contactName
                      }
                    >
                      {
                        contact.name
                      }
                    </Text>

                    <Ionicons
                      name={
                        selected
                          ? 'checkbox'
                          : 'square-outline'
                      }
                      size={23}
                      color={
                        selected
                          ? Brand.burgundy
                          : Brand.muted
                      }
                    />
                  </Pressable>
                );
              }
            )}

            <Pressable
              style={
                styles.doneButton
              }
              onPress={() =>
                setContactsVisible(
                  false
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Done selecting trusted contacts"
            >
              <Text
                style={
                  styles.doneButtonText
                }
              >
                Done
              </Text>
            </Pressable>
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

    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 40,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },

    headerIcon: {
      width: 50,
      height: 50,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 16,
      backgroundColor:
        Brand.burgundy,
    },

    headerText: {
      flex: 1,
      marginLeft: 13,
    },

    title: {
      color: Brand.ink,
      fontSize: 24,
      fontWeight: '900',
    },

    subtitle: {
      marginTop: 4,
      color: Brand.muted,
      fontSize: 12,
      lineHeight: 17,
    },

    historyButton: {
      minHeight: 62,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      marginBottom: 24,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 15,
      backgroundColor:
        Brand.white,
    },

    historyTextContainer: {
      flex: 1,
    },

    historyButtonText: {
      color:
        Brand.burgundy,
      fontSize: 14,
      fontWeight: '800',
    },

    historyButtonHint: {
      marginTop: 2,
      color: Brand.muted,
      fontSize: 11,
      lineHeight: 15,
    },

    section: {
      marginBottom: 24,
    },

    sectionTitle: {
      marginBottom: 9,
      color: Brand.ink,
      fontSize: 15,
      fontWeight: '800',
    },

    sectionHint: {
      marginBottom: 10,
      color: Brand.muted,
      fontSize: 12,
      lineHeight: 17,
    },

    locationCard: {
      padding: 14,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 16,
      backgroundColor:
        Brand.white,
    },

    locationCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    locationIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 20,
      backgroundColor:
        Brand.blush,
    },

    locationTextContainer: {
      flex: 1,
      marginLeft: 10,
    },

    locationTitle: {
      color: Brand.ink,
      fontSize: 14,
      fontWeight: '800',
    },

    locationValue: {
      marginTop: 3,
      color: Brand.muted,
      fontSize: 11,
    },

    currentLocationButton: {
      minHeight: 43,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 7,
      marginTop: 13,
      borderWidth: 1,
      borderColor:
        Brand.burgundy,
      borderRadius: 12,
    },

    currentLocationButtonText: {
      color:
        Brand.burgundy,
      fontSize: 12,
      fontWeight: '800',
    },

    inputContainer: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 15,
      backgroundColor:
        Brand.white,
    },

    input: {
      flex: 1,
      marginLeft: 9,
      marginRight: 8,
      color: Brand.ink,
      fontSize: 15,
    },

    searchStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 9,
    },

    searchStatusText: {
      color: Brand.muted,
      fontSize: 11,
    },

    suggestionsContainer: {
      marginTop: 7,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 14,
      backgroundColor:
        Brand.white,
    },

    suggestionRow: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        Brand.line,
    },

    suggestionIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 17,
      backgroundColor:
        Brand.blush,
    },

    suggestionText: {
      flex: 1,
      marginHorizontal: 10,
      color: Brand.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
    },

    selectedDestination: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 9,
    },

    selectedDestinationText: {
      flex: 1,
      color: '#38785A',
      fontSize: 11,
      fontWeight: '700',
    },

    errorText: {
      marginTop: 8,
      color: '#B42318',
      fontSize: 11,
      lineHeight: 16,
    },

    optionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
    },

    optionButton: {
      minWidth: 78,
      minHeight: 42,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 13,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 13,
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
      fontSize: 13,
      fontWeight: '700',
    },

    optionTextSelected: {
      color:
        Brand.white,
    },

    helperText: {
      marginTop: 9,
      color: Brand.muted,
      fontSize: 12,
      lineHeight: 17,
    },

    selector: {
      minHeight: 62,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 15,
      backgroundColor:
        Brand.white,
    },

    selectorLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    selectorTitle: {
      color: Brand.ink,
      fontSize: 14,
      fontWeight: '700',
    },

    selectorValue: {
      marginTop: 2,
      color: Brand.muted,
      fontSize: 11,
    },

    selectedContacts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 9,
    },

    contactChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor:
        Brand.blush,
    },

    contactChipText: {
      color:
        Brand.burgundy,
      fontSize: 11,
      fontWeight: '700',
    },

    shareCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 25,
      padding: 16,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 17,
      backgroundColor:
        Brand.white,
    },

    shareText: {
      flex: 1,
      paddingRight: 16,
    },

    shareTitle: {
      color: Brand.ink,
      fontSize: 15,
      fontWeight: '800',
    },

    shareDescription: {
      marginTop: 4,
      color: Brand.muted,
      fontSize: 11,
      lineHeight: 16,
    },

    startButton: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
      borderRadius: 15,
      backgroundColor:
        Brand.burgundy,
    },

    startButtonDisabled: {
      opacity: 0.45,
    },

    startButtonPressed: {
      opacity: 0.82,
    },

    startButtonText: {
      color:
        Brand.white,
      fontSize: 15,
      fontWeight: '800',
    },

    modalBackdrop: {
      flex: 1,
      justifyContent:
        'flex-end',
      backgroundColor:
        'rgba(41, 24, 32, 0.35)',
    },

    modalSheet: {
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 30,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor:
        Brand.white,
    },

    modalHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      marginBottom: 20,
    },

    modalTitle: {
      color: Brand.ink,
      fontSize: 20,
      fontWeight: '900',
    },

    modalSubtitle: {
      maxWidth: 270,
      marginTop: 4,
      color: Brand.muted,
      fontSize: 11,
      lineHeight: 16,
    },

    closeButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 20,
      backgroundColor:
        Brand.blush,
    },

    contactRow: {
      minHeight: 60,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 9,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 14,
    },

    contactRowSelected: {
      borderColor:
        Brand.rose,
      backgroundColor:
        Brand.blush,
    },

    contactAvatar: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 19,
      backgroundColor:
        Brand.blush,
    },

    contactName: {
      flex: 1,
      marginLeft: 10,
      color: Brand.ink,
      fontSize: 14,
      fontWeight: '700',
    },

    doneButton: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: 10,
      borderRadius: 14,
      backgroundColor:
        Brand.burgundy,
    },

    doneButtonText: {
      color:
        Brand.white,
      fontSize: 14,
      fontWeight: '800',
    },
  });