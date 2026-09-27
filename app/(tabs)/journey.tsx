import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import {
  CHECK_IN_INTERVALS,
  JOURNEY_TRUSTED_CONTACTS,
} from '@/constants/safe-journey';

import {
  createSafeJourney,
  SafeJourneyError,
} from '@/src/services/safe-journey-service';

import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';
import { useLocationPermission } from '@/src/hooks/useLocationPermission';

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

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function JourneyScreen() {
  const {
    permissionState,
  } = useLocationPermission();

  const {
    location,
    isLocationLoading,
  } = useCurrentLocation(
    permissionState
  );

  const [
    isStartingJourney,
    setIsStartingJourney,
  ] = useState(false);

  const [destination, setDestination] =
    useState('');

  const [
    arrivalMinutes,
    setArrivalMinutes,
  ] = useState<number | null>(null);

  const [
    selectedContactIds,
    setSelectedContactIds,
  ] = useState<string[]>([]);

  const [
    checkInInterval,
    setCheckInInterval,
  ] = useState<CheckInInterval>(30);

  const [
    shareJourney,
    setShareJourney,
  ] = useState(true);

  const [
    contactsVisible,
    setContactsVisible,
  ] = useState(false);

  const expectedArrivalTime =
    useMemo(
      () =>
        arrivalMinutes === null
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
    destination.trim().length > 0 &&
    expectedArrivalTime !== null &&
    location !== null &&
    (
      !shareJourney ||
      selectedContactIds.length > 0
    ) &&
    !isStartingJourney;

  const toggleContact = (
    contact: JourneyTrustedContact
  ) => {
    setSelectedContactIds(
      current =>
        current.includes(contact.id)
          ? current.filter(
              id => id !== contact.id
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
        destination.trim().length === 0
      ) {
        Alert.alert(
          'Destination required',
          'Enter your destination before starting the journey.'
        );

        return;
      }

      if (!location) {
        Alert.alert(
          'Current location required',
          isLocationLoading
            ? 'SafeHer is still getting your current location. Please wait a moment and try again.'
            : 'SafeHer needs your current location before starting a Safe Journey.'
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
        selectedContactIds.length === 0
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
          destination.trim(),

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
        setIsStartingJourney(true);

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
          `Your journey to ${configuration.destination} is now active.`
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
        setIsStartingJourney(false);
      }
    };

  return (
    <SafeAreaView
      style={styles.safeArea}
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
        <View style={styles.header}>
          <View
            style={styles.headerIcon}
          >
            <Ionicons
              name="navigate"
              size={25}
              color={Brand.white}
            />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Start Safe Journey
            </Text>

            <Text
              style={styles.subtitle}
            >
              Configure your journey and
              check-in preferences before
              you leave.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={styles.sectionTitle}
          >
            Destination
          </Text>

          <View
            style={styles.inputContainer}
          >
            <Ionicons
              name="location-outline"
              size={20}
              color={Brand.burgundy}
            />

            <TextInput
              value={destination}
              onChangeText={
                setDestination
              }
              placeholder="Enter destination"
              placeholderTextColor={
                Brand.muted
              }
              style={styles.input}
              accessibilityLabel="Journey destination"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={styles.sectionTitle}
          >
            Expected arrival
          </Text>

          <View
            style={styles.optionGrid}
          >
            {ARRIVAL_OPTIONS.map(
              option => {
                const selected =
                  arrivalMinutes ===
                  option.minutes;

                return (
                  <Pressable
                    key={option.minutes}
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
                      {option.label}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>

          {expectedArrivalTime ? (
            <Text
              style={styles.helperText}
            >
              Expected arrival:{' '}
              {formatTime(
                expectedArrivalTime
              )}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text
            style={styles.sectionTitle}
          >
            Trusted contacts
          </Text>

          <Pressable
            style={styles.selector}
            onPress={() =>
              setContactsVisible(true)
            }
            accessibilityRole="button"
            accessibilityLabel="Select trusted contacts"
          >
            <View
              style={styles.selectorLeft}
            >
              <Ionicons
                name="people-outline"
                size={21}
                color={Brand.burgundy}
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
              color={Brand.muted}
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
                    key={contact.id}
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
                      {contact.name}
                    </Text>
                  </View>
                )
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text
            style={styles.sectionTitle}
          >
            Check-in interval
          </Text>

          <Text
            style={styles.sectionHint}
          >
            SafeHer will remind you to
            confirm that you are safe.
          </Text>

          <View
            style={styles.optionGrid}
          >
            {CHECK_IN_INTERVALS.map(
              interval => {
                const selected =
                  checkInInterval ===
                  interval;

                return (
                  <Pressable
                    key={interval}
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

        <View style={styles.shareCard}>
          <View style={styles.shareText}>
            <Text
              style={styles.shareTitle}
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
            value={shareJourney}
            onValueChange={
              setShareJourney
            }
            trackColor={{
              false: Brand.line,
              true: Brand.roseSoft,
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
          style={({ pressed }) => [
            styles.startButton,
            !canStartJourney &&
              styles.startButtonDisabled,
            pressed &&
              canStartJourney &&
              styles.startButtonPressed,
          ]}
          onPress={handleStartJourney}
          disabled={!canStartJourney}
          accessibilityRole="button"
          accessibilityLabel="Start Journey"
        >
          {isStartingJourney ? (
            <ActivityIndicator
              size="small"
              color={Brand.white}
            />
          ) : (
            <Ionicons
              name="navigate"
              size={20}
              color={Brand.white}
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
        visible={contactsVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setContactsVisible(false)
        }
      >
        <View
          style={styles.modalBackdrop}
        >
          <View
            style={styles.modalSheet}
          >
            <View
              style={styles.modalHeader}
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
                  color={Brand.ink}
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
                    key={contact.id}
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
                      checked: selected,
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
                      {contact.name}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.cream,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
  },

  headerIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Brand.burgundy,
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

  inputContainer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 15,
    backgroundColor: Brand.white,
  },

  input: {
    flex: 1,
    marginLeft: 9,
    color: Brand.ink,
    fontSize: 15,
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
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 13,
    backgroundColor: Brand.white,
  },

  optionButtonSelected: {
    borderColor: Brand.burgundy,
    backgroundColor: Brand.burgundy,
  },

  optionText: {
    color: Brand.burgundy,
    fontSize: 13,
    fontWeight: '700',
  },

  optionTextSelected: {
    color: Brand.white,
  },

  helperText: {
    marginTop: 9,
    color: Brand.muted,
    fontSize: 12,
  },

  selector: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 15,
    backgroundColor: Brand.white,
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
    backgroundColor: Brand.blush,
  },

  contactChipText: {
    color: Brand.burgundy,
    fontSize: 11,
    fontWeight: '700',
  },

  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    padding: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 17,
    backgroundColor: Brand.white,
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
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    backgroundColor: Brand.burgundy,
  },

  startButtonDisabled: {
    opacity: 0.45,
  },

  startButtonPressed: {
    opacity: 0.82,
  },

  startButtonText: {
    color: Brand.white,
    fontSize: 15,
    fontWeight: '800',
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor:
      'rgba(41, 24, 32, 0.35)',
  },

  modalSheet: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Brand.white,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Brand.blush,
  },

  contactRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 14,
  },

  contactRowSelected: {
    borderColor: Brand.rose,
    backgroundColor: Brand.blush,
  },

  contactAvatar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: Brand.blush,
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
    justifyContent: 'center',
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: Brand.burgundy,
  },

  doneButtonText: {
    color: Brand.white,
    fontSize: 14,
    fontWeight: '800',
  },
});