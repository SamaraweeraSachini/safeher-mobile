import { Ionicons } from '@expo/vector-icons';
import {
  useRouter,
} from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  useState,
} from 'react';

import {
  Brand,
} from '@/constants/brand';

import {
  JOURNEY_TRUSTED_CONTACTS,
} from '@/constants/safe-journey';

import {
  useJourneyHistory,
} from '@/src/hooks/useJourneyHistory';

import type {
  StoredSafeJourney,
} from '@/src/types/safe-journey';

function formatDateTime(
  date: Date | null
): string {
  if (!date) {
    return 'Not available';
  }

  return date.toLocaleString(
    [],
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

export default function JourneyHistoryScreen() {
  const router =
    useRouter();

  const {
    journeys,
    isLoading,
    error,
    retry,
  } = useJourneyHistory();

  const [
    selectedJourney,
    setSelectedJourney,
  ] =
    useState<StoredSafeJourney | null>(
      null
    );

  if (isLoading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
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
            Loading journey history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.centerState
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={
              Brand.burgundy
            }
          />

          <Text
            style={
              styles.stateTitle
            }
          >
            Could not load history
          </Text>

          <Text
            style={
              styles.stateText
            }
          >
            {error}
          </Text>

          <Pressable
            style={
              styles.primaryButton
            }
            onPress={
              retry
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
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
          style={styles.header}
        >
          <Pressable
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={
                Brand.ink
              }
            />
          </Pressable>

          <View>
            <Text
              style={styles.title}
            >
              Journey History
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Review your previous Safe
              Journeys.
            </Text>
          </View>
        </View>

        {journeys.length ===
        0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <Ionicons
              name="time-outline"
              size={42}
              color={
                Brand.burgundy
              }
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No previous journeys
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Completed or cancelled
              journeys will appear here.
            </Text>
          </View>
        ) : (
          journeys.map(
            journey => {
              const finalTime =
                journey.status ===
                'completed'
                  ? journey.completedAt
                  : journey.cancelledAt;

              return (
                <Pressable
                  key={
                    journey.id
                  }
                  style={
                    styles.journeyCard
                  }
                  onPress={() =>
                    setSelectedJourney(
                      journey
                    )
                  }
                >
                  <View
                    style={
                      styles.cardHeader
                    }
                  >
                    <View
                      style={
                        styles.destinationRow
                      }
                    >
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color={
                          Brand.burgundy
                        }
                      />

                      <Text
                        style={
                          styles.destination
                        }
                      >
                        {
                          journey.destination
                        }
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        journey.status ===
                          'completed'
                          ? styles.completedBadge
                          : styles.cancelledBadge,
                      ]}
                    >
                      <Text
                        style={
                          styles.statusText
                        }
                      >
                        {journey.status ===
                        'completed'
                          ? 'Completed'
                          : 'Cancelled'}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.timeLabel
                    }
                  >
                    Started:{' '}
                    {formatDateTime(
                      journey.createdAt
                    )}
                  </Text>

                  <Text
                    style={
                      styles.timeLabel
                    }
                  >
                    {journey.status ===
                    'completed'
                      ? 'Completed'
                      : 'Cancelled'}
                    :{' '}
                    {formatDateTime(
                      finalTime
                    )}
                  </Text>

                  <View
                    style={
                      styles.openRow
                    }
                  >
                    <Text
                      style={
                        styles.openText
                      }
                    >
                      View details
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={
                        Brand.burgundy
                      }
                    />
                  </View>
                </Pressable>
              );
            }
          )
        )}
      </ScrollView>

      <Modal
        visible={
          selectedJourney !==
          null
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSelectedJourney(
            null
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
            {selectedJourney ? (
              <>
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
                    Journey Details
                  </Text>

                  <Pressable
                    style={
                      styles.closeButton
                    }
                    onPress={() =>
                      setSelectedJourney(
                        null
                      )
                    }
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color={
                        Brand.ink
                      }
                    />
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={
                    false
                  }
                >
                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    Destination
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {
                      selectedJourney.destination
                    }
                  </Text>

                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    Status
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {selectedJourney.status ===
                    'completed'
                      ? 'Completed'
                      : 'Cancelled'}
                  </Text>

                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    Started
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {formatDateTime(
                      selectedJourney.createdAt
                    )}
                  </Text>

                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    Expected arrival
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {formatDateTime(
                      selectedJourney.expectedArrivalTime
                    )}
                  </Text>

                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    {selectedJourney.status ===
                    'completed'
                      ? 'Completed at'
                      : 'Cancelled at'}
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {formatDateTime(
                      selectedJourney.status ===
                      'completed'
                        ? selectedJourney.completedAt
                        : selectedJourney.cancelledAt
                    )}
                  </Text>

                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    Last check-in
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {formatDateTime(
                      selectedJourney.lastCheckInAt
                    )}
                  </Text>

                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    Location
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {formatCoordinate(
                      selectedJourney.currentLocation
                        .latitude
                    )}
                    ,{' '}
                    {formatCoordinate(
                      selectedJourney.currentLocation
                        .longitude
                    )}
                  </Text>

                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    Trusted contacts
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {JOURNEY_TRUSTED_CONTACTS.filter(
                      contact =>
                        selectedJourney.trustedContactIds.includes(
                          contact.id
                        )
                    )
                      .map(
                        contact =>
                          contact.name
                      )
                      .join(', ') ||
                      'None'}
                  </Text>

                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    Check-in interval
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {
                      selectedJourney.checkInIntervalMinutes
                    }{' '}
                    minutes
                  </Text>
                </ScrollView>
              </>
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

    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 40,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24,
    },

    backButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 21,
      backgroundColor:
        Brand.white,
      borderWidth: 1,
      borderColor:
        Brand.line,
    },

    title: {
      color: Brand.ink,
      fontSize: 23,
      fontWeight: '900',
    },

    subtitle: {
      marginTop: 3,
      color: Brand.muted,
      fontSize: 12,
    },

    journeyCard: {
      marginBottom: 13,
      padding: 16,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 17,
      backgroundColor:
        Brand.white,
    },

    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent:
        'space-between',
      gap: 10,
    },

    destinationRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    destination: {
      flex: 1,
      color: Brand.ink,
      fontSize: 16,
      fontWeight: '800',
    },

    statusBadge: {
      paddingVertical: 5,
      paddingHorizontal: 9,
      borderRadius: 12,
    },

    completedBadge: {
      backgroundColor:
        '#E8F5ED',
    },

    cancelledBadge: {
      backgroundColor:
        '#FDECEC',
    },

    statusText: {
      color: Brand.ink,
      fontSize: 10,
      fontWeight: '800',
    },

    timeLabel: {
      marginTop: 10,
      color: Brand.muted,
      fontSize: 11,
    },

    openRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'flex-end',
      gap: 3,
      marginTop: 13,
    },

    openText: {
      color: Brand.burgundy,
      fontSize: 12,
      fontWeight: '700',
    },

    emptyCard: {
      alignItems: 'center',
      padding: 28,
      borderWidth: 1,
      borderColor:
        Brand.line,
      borderRadius: 18,
      backgroundColor:
        Brand.white,
    },

    emptyTitle: {
      marginTop: 12,
      color: Brand.ink,
      fontSize: 17,
      fontWeight: '800',
    },

    emptyText: {
      marginTop: 6,
      color: Brand.muted,
      fontSize: 12,
      textAlign: 'center',
    },

    centerState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },

    stateTitle: {
      marginTop: 10,
      color: Brand.ink,
      fontSize: 18,
      fontWeight: '800',
    },

    stateText: {
      marginTop: 8,
      color: Brand.muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },

    primaryButton: {
      marginTop: 18,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 13,
      backgroundColor:
        Brand.burgundy,
    },

    primaryButtonText: {
      color: Brand.white,
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
      maxHeight: '82%',
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
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 18,
    },

    modalTitle: {
      color: Brand.ink,
      fontSize: 20,
      fontWeight: '900',
    },

    closeButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 19,
      backgroundColor:
        Brand.blush,
    },

    detailLabel: {
      marginTop: 14,
      color: Brand.muted,
      fontSize: 11,
      fontWeight: '700',
    },

    detailValue: {
      marginTop: 4,
      color: Brand.ink,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
    },
  });