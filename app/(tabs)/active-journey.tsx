import { Ionicons } from '@expo/vector-icons';

import {
  type Href,
  useRouter,
} from 'expo-router';

import {
  useEffect,
  useState,
} from 'react';

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

import ScreenBackButton from '@/src/components/navigation/ScreenBackButton';

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

import {
  subscribeToTrustedContacts,
} from '@/src/services/trusted-contact-service';

import type {
  TrustedContact,
} from '@/src/types/trusted-contact';

function formatDateTime(date: Date): string {
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? value.toFixed(5) : 'Unavailable';
}

export default function ActiveJourneyScreen() {
  const router = useRouter();

  const { journey, isLoading, error, retry, refresh } =
    useActiveSafeJourney();

  const { preferences } = usePrivacyPreferences();

  const { permissionState } = useLocationPermission();

  const { location } = useCurrentLocation(permissionState);

  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isEndingJourney, setIsEndingJourney] = useState(false);

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

  const handleSafePress = async () => {
    if (!journey) {
      return;
    }

    try {
      setIsCheckingIn(true);
      await recordSafeJourneyCheckIn(journey.id);
      await refresh();

      Alert.alert(
        "You're checked in",
        'Your safety check-in was recorded successfully.'
      );
    } catch (checkInError) {
      Alert.alert(
        'Check-in failed',
        checkInError instanceof SafeJourneyError
          ? checkInError.message
          : 'Your safety check-in could not be recorded.'
      );
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleEndJourney = () => {
    if (!journey) {
      return;
    }

    Alert.alert(
      'End Journey?',
      'Are you sure you have reached your destination?',
      [
        { text: 'Keep Journey Active', style: 'cancel' },
        {
          text: 'End Journey',
          onPress: async () => {
            try {
              setIsEndingJourney(true);
              await completeSafeJourney(journey.id);

              Alert.alert(
                'Journey completed',
                'This journey is now marked as completed.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/journey' as Href),
                  },
                ]
              );
            } catch (endError) {
              Alert.alert(
                'Could not end journey',
                endError instanceof SafeJourneyError
                  ? endError.message
                  : 'Please try again.'
              );
            } finally {
              setIsEndingJourney(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelJourney = () => {
    if (!journey) {
      return;
    }

    Alert.alert(
      'Cancel Journey?',
      'The journey will remain in history with a Cancelled status.',
      [
        { text: 'Keep Journey Active', style: 'cancel' },
        {
          text: 'Cancel Journey',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsEndingJourney(true);
              await cancelSafeJourney(journey.id);

              Alert.alert(
                'Journey cancelled',
                'The journey was retained in history.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/journey' as Href),
                  },
                ]
              );
            } catch (cancelError) {
              Alert.alert(
                'Could not cancel journey',
                cancelError instanceof SafeJourneyError
                  ? cancelError.message
                  : 'Please try again.'
              );
            } finally {
              setIsEndingJourney(false);
            }
          },
        },
      ]
    );
  };

  const handleShareLocation = async () => {
    if (!journey) {
      return;
    }

    const latitude = location?.latitude ?? journey.currentLocation.latitude;
    const longitude =
      location?.longitude ?? journey.currentLocation.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      Alert.alert(
        'Location unavailable',
        'Your current location could not be shared.'
      );
      return;
    }

    const link = `https://www.google.com/maps?q=${latitude},${longitude}`;

    try {
      await Share.share({
        title: 'SafeHer Journey Location',
        message: `My current SafeHer journey location:\n${link}`,
      });
    } catch {
      Alert.alert(
        'Sharing failed',
        'Your location could not be shared.'
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.burgundy} />
          <Text style={styles.helperText}>
            Loading active journey...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.stateIconWrap}>
            <Ionicons
              name="alert-circle-outline"
              size={36}
              color={Brand.burgundy}
            />
          </View>
          <Text style={styles.heading}>Journey unavailable</Text>
          <Text style={styles.helperText}>{error}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            onPress={retry}
          >
            <Text style={styles.primaryText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!journey) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.stateIconWrap}>
            <Ionicons
              name="navigate-outline"
              size={36}
              color={Brand.burgundy}
            />
          </View>
          <Text style={styles.heading}>No active journey</Text>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.replace('/journey' as Href)}
          >
            <Text style={styles.primaryText}>Back to Journey</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const referenceTime = journey.lastCheckInAt ?? journey.createdAt;

  const nextCheckIn = new Date(
    referenceTime.getTime() +
      journey.checkInIntervalMinutes * 60 * 1000
  );

  const journeyContacts = contacts.filter(contact =>
    journey.trustedContactIds.includes(contact.id)
  );

  const latitude = location?.latitude ?? journey.currentLocation.latitude;
  const longitude =
    location?.longitude ?? journey.currentLocation.longitude;

  const busy = isCheckingIn || isEndingJourney;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBackButton label="Journey" />

        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="navigate" size={22} color={Brand.white} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Active Journey</Text>

            <View style={styles.activeStatusRow}>
              <View style={styles.liveDot} />
              <Text style={styles.activeText}>Journey in progress</Text>
            </View>
          </View>
        </View>

        {/* ---------- Destination ---------- */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons
              name="flag-outline"
              size={20}
              color={Brand.burgundy}
            />
          </View>

          <Text style={styles.label}>DESTINATION</Text>
          <Text style={styles.destination}>{journey.destination}</Text>
        </View>

        {/* ---------- Location ---------- */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons
                name="location-outline"
                size={18}
                color={Brand.burgundy}
              />
            </View>
            <Text style={styles.label}>CURRENT LOCATION</Text>
          </View>

          <Text style={styles.value}>
            {formatCoordinate(latitude)}, {formatCoordinate(longitude)}
          </Text>
        </View>

        {/* ---------- Started / Expected ---------- */}
        <View style={styles.twoColumns}>
          <View style={styles.smallCard}>
            <View style={styles.cardIconWrapSmall}>
              <Ionicons
                name="play-outline"
                size={15}
                color={Brand.burgundy}
              />
            </View>
            <Text style={styles.label}>STARTED</Text>
            <Text style={styles.value}>
              {formatDateTime(journey.createdAt)}
            </Text>
          </View>

          <View style={styles.smallCard}>
            <View style={styles.cardIconWrapSmall}>
              <Ionicons
                name="time-outline"
                size={15}
                color="#287550"
              />
            </View>
            <Text style={styles.label}>EXPECTED</Text>
            <Text style={styles.value}>
              {formatDateTime(journey.expectedArrivalTime)}
            </Text>
          </View>
        </View>

        {/* ---------- Next Check-in ---------- */}
        {preferences.safetyAlerts ? (
          <View style={styles.checkInCard}>
            <View style={styles.checkInIconWrap}>
              <Ionicons
                name="timer-outline"
                size={22}
                color="#287550"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.checkInTitle}>Next check-in</Text>
              <Text style={styles.checkInValue}>
                {formatDateTime(nextCheckIn)}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ---------- Trusted Contacts ---------- */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons
                name="people-outline"
                size={18}
                color={Brand.burgundy}
              />
            </View>
            <Text style={styles.label}>TRUSTED CONTACTS</Text>
          </View>

          {preferences.shareJourneys && journey.shareJourney ? (
            journeyContacts.length > 0 ? (
              journeyContacts.map(contact => (
                <View key={contact.id} style={styles.contactRow}>
                  <View style={styles.contactAvatar}>
                    <Ionicons
                      name="person"
                      size={14}
                      color={Brand.burgundy}
                    />
                  </View>

                  <Text style={styles.contact}>
                    {contact.name}
                    {contact.relationship
                      ? ` · ${contact.relationship}`
                      : ''}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.helperText}>
                Saved contact names are unavailable.
              </Text>
            )
          ) : (
            <Text style={styles.helperText}>
              Journey sharing is hidden by your privacy settings.
            </Text>
          )}
        </View>

        {/* ---------- Share Location ---------- */}
        <Pressable
          style={({ pressed }) => [
            styles.shareButton,
            pressed && styles.pressed,
          ]}
          onPress={handleShareLocation}
        >
          <Ionicons
            name="share-social-outline"
            size={20}
            color={Brand.burgundy}
          />
          <Text style={styles.shareText}>Share Current Location</Text>
        </Pressable>

        {/* ---------- I'm Safe ---------- */}
        <Pressable
          style={({ pressed }) => [
            styles.safeButton,
            busy && styles.disabled,
            pressed && !busy && styles.pressed,
          ]}
          disabled={busy}
          onPress={handleSafePress}
        >
          {isCheckingIn ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons
              name="shield-checkmark"
              size={21}
              color="#FFFFFF"
            />
          )}

          <Text style={styles.safeText}>
            {isCheckingIn ? 'Checking In...' : "I'm Safe"}
          </Text>
        </Pressable>

        {/* ---------- End / Cancel ---------- */}
        <View style={styles.twoColumns}>
          <Pressable
            style={({ pressed }) => [
              styles.endButton,
              busy && styles.disabled,
              pressed && !busy && styles.pressed,
            ]}
            disabled={busy}
            onPress={handleEndJourney}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={17}
              color={Brand.burgundy}
            />
            <Text style={styles.endText}>End Journey</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              busy && styles.disabled,
              pressed && !busy && styles.pressed,
            ]}
            disabled={busy}
            onPress={handleCancelJourney}
          >
            <Ionicons
              name="close-circle-outline"
              size={17}
              color="#B42318"
            />
            <Text style={styles.cancelText}>Cancel Journey</Text>
          </Pressable>
        </View>

        {/* ---------- SOS ---------- */}
        <Pressable
          style={({ pressed }) => [
            styles.sosButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/sos' as Href)}
        >
          <Ionicons name="alert-circle" size={21} color="#FFFFFF" />
          <Text style={styles.sosText}>SOS Assistance</Text>
        </Pressable>
      </ScrollView>
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
    paddingTop: 14,
    paddingBottom: 44,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  stateIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
    marginBottom: 14,
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

  heading: {
    color: Brand.ink,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  activeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#287550',
  },

  activeText: {
    color: '#287550',
    fontWeight: '800',
    fontSize: 12.5,
  },

  /* ---------- Hero card ---------- */
  heroCard: {
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Brand.roseSoft,
    borderRadius: 18,
    backgroundColor: Brand.blush,
  },

  heroIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.white,
    marginBottom: 10,
  },

  /* ---------- Cards ---------- */
  card: {
    marginBottom: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 18,
    backgroundColor: Brand.white,
    shadowColor: '#4E1026',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  cardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },

  cardIconWrapSmall: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
    marginBottom: 8,
  },

  label: {
    color: Brand.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  destination: {
    marginTop: 8,
    color: Brand.ink,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.1,
  },

  value: {
    marginTop: 8,
    color: Brand.ink,
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  helperText: {
    marginTop: 8,
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  twoColumns: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  smallCard: {
    flex: 1,
    padding: 13,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 16,
    backgroundColor: Brand.white,
  },

  /* ---------- Check-in ---------- */
  checkInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#E8F5ED',
    borderWidth: 1,
    borderColor: '#B7DEC9',
  },

  checkInIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  checkInTitle: {
    color: '#287550',
    fontWeight: '900',
    fontSize: 14,
  },

  checkInValue: {
    marginTop: 3,
    color: '#392631',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* ---------- Contacts ---------- */
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 9,
  },

  contactAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },

  contact: {
    color: Brand.ink,
    fontWeight: '700',
    fontSize: 13,
  },

  /* ---------- Buttons ---------- */
  shareButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Brand.burgundy,
    borderRadius: 15,
    backgroundColor: Brand.white,
  },

  shareText: {
    color: Brand.burgundy,
    fontWeight: '900',
    fontSize: 14.5,
  },

  safeButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    borderRadius: 15,
    backgroundColor: '#287550',
    shadowColor: '#287550',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },

  safeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  endButton: {
    flex: 1,
    minHeight: 50,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Brand.burgundy,
    borderRadius: 14,
    backgroundColor: Brand.white,
  },

  endText: {
    color: Brand.burgundy,
    fontWeight: '800',
    fontSize: 13.5,
  },

  cancelButton: {
    flex: 1,
    minHeight: 50,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#B42318',
    borderRadius: 14,
    backgroundColor: Brand.white,
  },

  cancelText: {
    color: '#B42318',
    fontWeight: '800',
    fontSize: 13.5,
  },

  sosButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    backgroundColor: '#B42318',
    shadowColor: '#B42318',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },

  sosText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  primaryButton: {
    marginTop: 18,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Brand.burgundy,
    shadowColor: Brand.burgundy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },

  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14.5,
  },

  disabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },

  pressed: {
    opacity: 0.82,
  },
});