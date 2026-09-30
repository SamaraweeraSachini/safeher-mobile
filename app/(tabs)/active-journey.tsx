import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Brand,
} from '@/constants/brand';

import {
  JOURNEY_TRUSTED_CONTACTS,
} from '@/constants/safe-journey';

import {
  usePrivacyPreferences,
} from '@/src/context/PrivacyPreferencesContext';

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
  cancelSafeJourney,
  completeSafeJourney,
  recordSafeJourneyCheckIn,
  SafeJourneyError,
} from '@/src/services/safe-journey-service';

function formatDateTime(
  date: Date
): string {
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
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

export default function ActiveJourneyScreen() {
  const router =
    useRouter();

  const [
    isCheckingIn,
    setIsCheckingIn,
  ] = useState(false);

  const [
    isEndingJourney,
    setIsEndingJourney,
  ] = useState(false);

  const {
    journey,
    isLoading,
    error,
    retry,
    refresh,
  } = useActiveSafeJourney();

  const {
    preferences,
  } = usePrivacyPreferences();

  const {
    permissionState,
  } = useLocationPermission();

  const {
    location,
  } = useCurrentLocation(
    permissionState
  );

  const handleSafePress =
    async () => {
      if (!journey) {
        return;
      }

      try {
        setIsCheckingIn(
          true
        );

        await recordSafeJourneyCheckIn(
          journey.id
        );

        await refresh();

        Alert.alert(
          "You're checked in",
          'Your safety check-in was recorded successfully.'
        );
      } catch (
        checkInError
      ) {
        if (
          checkInError instanceof
          SafeJourneyError
        ) {
          Alert.alert(
            'Check-in failed',
            checkInError.message
          );

          return;
        }

        Alert.alert(
          'Check-in failed',
          'Your safety check-in could not be recorded. Please try again.'
        );
      } finally {
        setIsCheckingIn(
          false
        );
      }
    };

  const handleEndJourney =
    () => {
      if (!journey) {
        return;
      }

      Alert.alert(
        'End Journey?',
        'Are you sure you have reached your destination and want to complete this journey?',
        [
          {
            text:
              'Keep Journey Active',

            style:
              'cancel',
          },
          {
            text:
              'End Journey',

            onPress:
              async () => {
                try {
                  setIsEndingJourney(
                    true
                  );

                  await completeSafeJourney(
                    journey.id
                  );

                  Alert.alert(
                    'Journey completed',
                    'Your Safe Journey has been completed successfully.',
                    [
                      {
                        text:
                          'OK',

                        onPress:
                          () => {
                            router.replace(
                              '/journey'
                            );
                          },
                      },
                    ]
                  );
                } catch (
                  endError
                ) {
                  if (
                    endError instanceof
                    SafeJourneyError
                  ) {
                    Alert.alert(
                      'Could not end journey',
                      endError.message
                    );

                    return;
                  }

                  Alert.alert(
                    'Could not end journey',
                    'Something went wrong. Please try again.'
                  );
                } finally {
                  setIsEndingJourney(
                    false
                  );
                }
              },
          },
        ]
      );
    };

  const handleCancelJourney =
    () => {
      if (!journey) {
        return;
      }

      Alert.alert(
        'Cancel Journey?',
        'Are you sure you want to cancel this Safe Journey?',
        [
          {
            text:
              'Keep Journey Active',

            style:
              'cancel',
          },
          {
            text:
              'Cancel Journey',

            style:
              'destructive',

            onPress:
              async () => {
                try {
                  setIsEndingJourney(
                    true
                  );

                  await cancelSafeJourney(
                    journey.id
                  );

                  Alert.alert(
                    'Journey cancelled',
                    'Your Safe Journey has been cancelled.',
                    [
                      {
                        text:
                          'OK',

                        onPress:
                          () => {
                            router.replace(
                              '/journey'
                            );
                          },
                      },
                    ]
                  );
                } catch (
                  cancelError
                ) {
                  if (
                    cancelError instanceof
                    SafeJourneyError
                  ) {
                    Alert.alert(
                      'Could not cancel journey',
                      cancelError.message
                    );

                    return;
                  }

                  Alert.alert(
                    'Could not cancel journey',
                    'Something went wrong. Please try again.'
                  );
                } finally {
                  setIsEndingJourney(
                    false
                  );
                }
              },
          },
        ]
      );
    };

  const handleSosPress =
    () => {
      router.push(
        '/sos'
      );
    };

  const handleShareLocation =
    async () => {
      if (!journey) {
        return;
      }

      const latitude =
        location?.latitude ??
        journey.currentLocation
          .latitude;

      const longitude =
        location?.longitude ??
        journey.currentLocation
          .longitude;

      if (
        !Number.isFinite(
          latitude
        ) ||
        !Number.isFinite(
          longitude
        )
      ) {
        Alert.alert(
          'Location unavailable',
          'Your current location could not be shared.'
        );

        return;
      }

      const googleMapsLink =
        `https://www.google.com/maps?q=${latitude},${longitude}`;

      try {
        await Share.share({
          title:
            'SafeHer Journey Location',

          message:
            `My current SafeHer journey location:\n${googleMapsLink}`,
        });
      } catch (
        shareError
      ) {
        console.error(
          'Location sharing failed:',
          shareError
        );

        Alert.alert(
          'Sharing failed',
          'Your location could not be shared. Please try again.'
        );
      }
    };

  if (isLoading) {
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
            Loading active journey...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
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
          <Ionicons
            name="cloud-offline-outline"
            size={38}
            color="#B42318"
          />

          <Text
            style={
              styles.errorTitle
            }
          >
            Journey unavailable
          </Text>

          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>

          <Pressable
            style={
              styles.retryButton
            }
            onPress={
              retry
            }
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!journey) {
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
          <Ionicons
            name="navigate-outline"
            size={44}
            color={
              Brand.burgundy
            }
          />

          <Text
            style={
              styles.errorTitle
            }
          >
            No active journey
          </Text>

          <Text
            style={
              styles.stateText
            }
          >
            Start a Safe Journey first
            to view its status here.
          </Text>

          <Pressable
            style={
              styles.retryButton
            }
            onPress={() =>
              router.replace(
                '/journey'
              )
            }
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Start Journey
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const lastCheckInReference =
    journey.lastCheckInAt ??
    journey.createdAt;

  const nextCheckIn =
    new Date(
      lastCheckInReference.getTime() +
        journey.checkInIntervalMinutes *
          60 *
          1000
    );

  const contacts =
    JOURNEY_TRUSTED_CONTACTS.filter(
      contact =>
        journey.trustedContactIds.includes(
          contact.id
        )
    );

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
              size={24}
              color={
                Brand.white
              }
            />
          </View>

          <View>
            <Text
              style={
                styles.title
              }
            >
              Active Journey
            </Text>

            <Text
              style={
                styles.activeText
              }
            >
              Journey in progress
            </Text>
          </View>
        </View>

        <View
          style={
            styles.destinationCard
          }
        >
          <Text
            style={
              styles.smallLabel
            }
          >
            Destination
          </Text>

          <View
            style={
              styles.destinationRow
            }
          >
            <Ionicons
              name="location"
              size={22}
              color={
                Brand.burgundy
              }
            />

            <Text
              style={
                styles.destinationText
              }
            >
              {
                journey.destination
              }
            </Text>
          </View>
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
            Current location
          </Text>

          <View
            style={
              styles.infoCard
            }
          >
            <Ionicons
              name="locate-outline"
              size={21}
              color={
                Brand.burgundy
              }
            />

            <View>
              <Text
                style={
                  styles.infoPrimary
                }
              >
                {formatCoordinate(
                  location?.latitude ??
                    journey
                      .currentLocation
                      .latitude
                )}
                ,{' '}
                {formatCoordinate(
                  location?.longitude ??
                    journey
                      .currentLocation
                      .longitude
                )}
              </Text>

              <Text
                style={
                  styles.infoSecondary
                }
              >
                {location
                  ? 'Current device location'
                  : 'Journey starting location'}
              </Text>
            </View>
          </View>
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
            Journey times
          </Text>

          <View
            style={
              styles.timeGrid
            }
          >
            <View
              style={
                styles.timeCard
              }
            >
              <Ionicons
                name="play-outline"
                size={19}
                color={
                  Brand.burgundy
                }
              />

              <Text
                style={
                  styles.smallLabel
                }
              >
                Started
              </Text>

              <Text
                style={
                  styles.timeValue
                }
              >
                {formatDateTime(
                  journey.createdAt
                )}
              </Text>
            </View>

            <View
              style={
                styles.timeCard
              }
            >
              <Ionicons
                name="flag-outline"
                size={19}
                color={
                  Brand.burgundy
                }
              />

              <Text
                style={
                  styles.smallLabel
                }
              >
                Expected arrival
              </Text>

              <Text
                style={
                  styles.timeValue
                }
              >
                {formatDateTime(
                  journey.expectedArrivalTime
                )}
              </Text>
            </View>
          </View>
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
            Next check-in
          </Text>

          {preferences.safetyAlerts ? (
            <View
              style={
                styles.checkInCard
              }
            >
              <View
                style={
                  styles.checkInIcon
                }
              >
                <Ionicons
                  name="timer-outline"
                  size={23}
                  color={
                    Brand.white
                  }
                />
              </View>

              <View>
                <Text
                  style={
                    styles.checkInTime
                  }
                >
                  {formatDateTime(
                    nextCheckIn
                  )}
                </Text>

                <Text
                  style={
                    styles.infoSecondary
                  }
                >
                  Every{' '}
                  {
                    journey
                      .checkInIntervalMinutes
                  }{' '}
                  minutes
                </Text>
              </View>
            </View>
          ) : (
            <View
              style={
                styles.infoCard
              }
            >
              <Ionicons
                name="notifications-off-outline"
                size={21}
                color={
                  Brand.muted
                }
              />

              <Text
                style={
                  styles.infoSecondary
                }
              >
                Safety check-in alerts are
                turned off in Privacy
                Settings.
              </Text>
            </View>
          )}
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

          {!preferences.shareJourneys ? (
            <View
              style={
                styles.infoCard
              }
            >
              <Ionicons
                name="eye-off-outline"
                size={21}
                color={
                  Brand.muted
                }
              />

              <Text
                style={
                  styles.infoSecondary
                }
              >
                Journey sharing is turned
                off, so trusted contacts
                are not shown.
              </Text>
            </View>
          ) : contacts.length > 0 ? (
            contacts.map(
              contact => (
                <View
                  key={
                    contact.id
                  }
                  style={
                    styles.contactCard
                  }
                >
                  <View
                    style={
                      styles.contactAvatar
                    }
                  >
                    <Ionicons
                      name="person"
                      size={18}
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
                </View>
              )
            )
          ) : (
            <View
              style={
                styles.infoCard
              }
            >
              <Ionicons
                name="people-outline"
                size={21}
                color={
                  Brand.muted
                }
              />

              <Text
                style={
                  styles.infoSecondary
                }
              >
                No trusted contacts
                selected.
              </Text>
            </View>
          )}
        </View>

        <Pressable
          style={
            styles.shareLocationButton
          }
          onPress={
            handleShareLocation
          }
          accessibilityRole="button"
          accessibilityLabel="Share current location"
        >
          <Ionicons
            name="share-social-outline"
            size={21}
            color={
              Brand.burgundy
            }
          />

          <Text
            style={
              styles.shareLocationButtonText
            }
          >
            Share Current Location
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.safeButton,

            isCheckingIn &&
              styles.safeButtonDisabled,
          ]}
          onPress={
            handleSafePress
          }
          disabled={
            isCheckingIn
          }
          accessibilityRole="button"
          accessibilityLabel="I'm Safe"
        >
          {isCheckingIn ? (
            <ActivityIndicator
              size="small"
              color={
                Brand.white
              }
            />
          ) : (
            <Ionicons
              name="shield-checkmark"
              size={22}
              color={
                Brand.white
              }
            />
          )}

          <Text
            style={
              styles.primaryButtonText
            }
          >
            {isCheckingIn
              ? 'Checking In...'
              : "I'm Safe"}
          </Text>
        </Pressable>

        <View
          style={
            styles.actionRow
          }
        >
          <Pressable
            style={[
              styles.secondaryButton,

              isEndingJourney &&
                styles.actionButtonDisabled,
            ]}
            onPress={
              handleEndJourney
            }
            disabled={
              isEndingJourney
            }
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={
                Brand.burgundy
              }
            />

            <Text
              style={
                styles.secondaryButtonText
              }
            >
              End Journey
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButton,

              isEndingJourney &&
                styles.actionButtonDisabled,
            ]}
            onPress={
              handleCancelJourney
            }
            disabled={
              isEndingJourney
            }
          >
            <Ionicons
              name="close-circle-outline"
              size={20}
              color={
                Brand.burgundy
              }
            />

            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Cancel Journey
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={
            styles.sosButton
          }
          onPress={
            handleSosPress
          }
        >
          <Ionicons
            name="alert-circle"
            size={22}
            color={
              Brand.white
            }
          />

          <Text
            style={
              styles.primaryButtonText
            }
          >
            SOS
          </Text>
        </Pressable>
      </ScrollView>
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
      gap: 12,
      marginBottom: 22,
    },

    headerIcon: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 15,
      backgroundColor:
        Brand.burgundy,
    },

    title: {
      color: Brand.ink,
      fontSize: 24,
      fontWeight: '900',
    },

    activeText: {
      marginTop: 2,
      color: '#38785A',
      fontSize: 12,
      fontWeight: '700',
    },

    destinationCard: {
      marginBottom: 22,
      padding: 17,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 18,
      backgroundColor:
        Brand.white,
    },

    destinationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginTop: 7,
    },

    destinationText: {
      flex: 1,
      color: Brand.ink,
      fontSize: 18,
      fontWeight: '800',
    },

    section: {
      marginBottom: 22,
    },

    sectionTitle: {
      marginBottom: 9,
      color: Brand.ink,
      fontSize: 15,
      fontWeight: '800',
    },

    infoCard: {
      minHeight: 60,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      padding: 14,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 15,
      backgroundColor:
        Brand.white,
    },

    infoPrimary: {
      color: Brand.ink,
      fontSize: 14,
      fontWeight: '700',
    },

    infoSecondary: {
      flex: 1,
      marginTop: 2,
      color: Brand.muted,
      fontSize: 11,
      lineHeight: 16,
    },

    timeGrid: {
      flexDirection: 'row',
      gap: 10,
    },

    timeCard: {
      flex: 1,
      minHeight: 105,
      padding: 13,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 15,
      backgroundColor:
        Brand.white,
    },

    smallLabel: {
      marginTop: 6,
      color: Brand.muted,
      fontSize: 11,
      fontWeight: '600',
    },

    timeValue: {
      marginTop: 4,
      color: Brand.ink,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 17,
    },

    checkInCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 15,
      borderRadius: 17,
      backgroundColor:
        Brand.blush,
    },

    checkInIcon: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 22,
      backgroundColor:
        Brand.burgundy,
    },

    checkInTime: {
      color: Brand.ink,
      fontSize: 15,
      fontWeight: '800',
    },

    contactCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      padding: 12,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 14,
      backgroundColor:
        Brand.white,
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
      marginLeft: 10,
      color: Brand.ink,
      fontSize: 14,
      fontWeight: '700',
    },

    shareLocationButton: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
      marginBottom: 11,
      borderWidth: 1,
      borderColor:
        Brand.burgundy,
      borderRadius: 15,
      backgroundColor:
        Brand.white,
    },

    shareLocationButtonText: {
      color:
        Brand.burgundy,
      fontSize: 14,
      fontWeight: '800',
    },

    safeButton: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
      borderRadius: 15,
      backgroundColor:
        '#38785A',
    },

    safeButtonDisabled: {
      opacity: 0.6,
    },

    primaryButtonText: {
      color:
        Brand.white,
      fontSize: 15,
      fontWeight: '800',
    },

    actionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 11,
    },

    secondaryButton: {
      flex: 1,
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 6,
      borderWidth: 1,
      borderColor:
        Brand.burgundy,
      borderRadius: 14,
      backgroundColor:
        Brand.white,
    },

    actionButtonDisabled: {
      opacity: 0.5,
    },

    secondaryButtonText: {
      color:
        Brand.burgundy,
      fontSize: 12,
      fontWeight: '800',
    },

    sosButton: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
      marginTop: 11,
      borderRadius: 15,
      backgroundColor:
        '#B42318',
    },

    centerState: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 30,
    },

    stateText: {
      marginTop: 10,
      color: Brand.muted,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
    },

    errorTitle: {
      marginTop: 10,
      color: Brand.ink,
      fontSize: 18,
      fontWeight: '800',
    },

    errorText: {
      marginTop: 6,
      color: Brand.muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },

    retryButton: {
      marginTop: 18,
      paddingVertical: 11,
      paddingHorizontal: 20,
      borderRadius: 13,
      backgroundColor:
        Brand.burgundy,
    },

    retryButtonText: {
      color:
        Brand.white,
      fontSize: 13,
      fontWeight: '800',
    },
  });