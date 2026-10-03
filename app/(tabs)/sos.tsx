import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SosHoldButton from '@/src/components/sos/SosHoldButton';
import { firestore } from '@/src/config/firebase';
import { useAuth } from '@/src/context/AuthContext';
import {
  createSosPreparation,
  retrieveSosLocation,
  type PreparedSos,
  type SosTrustedContact,
} from '@/src/services/sos-preparation-service';

type LocationStatus =
  | 'checking'
  | 'available'
  | 'permission-needed'
  | 'unavailable';

const locationMessages: Record<LocationStatus, string> = {
  checking: 'Checking location availability...',
  available:
    'Location permission is available. Your coordinates will be retrieved after you confirm SOS.',
  'permission-needed':
    'Location permission is needed to include your position. Emergency calling remains available.',
  unavailable:
    'Location is unavailable right now. Emergency calling remains available.',
};

export default function SosScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid ?? null;

  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>('checking');
  const [contacts, setContacts] = useState<SosTrustedContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [activation, setActivation] = useState<PreparedSos | null>(null);
  const [isRetrievingLocation, setIsRetrievingLocation] = useState(false);

  const operation = useRef(0);
  const locationBusy = useRef(false);
  const activationStarted = useRef(false);

  // Invalidate pending location work when the account changes or screen closes.
  useEffect(() => {
    operation.current += 1;
    locationBusy.current = false;
    activationStarted.current = false;

    setActivation(null);
    setIsRetrievingLocation(false);
    setSelectedIds([]);

    return () => {
      operation.current += 1;
    };
  }, [userId]);

  const checkLocation = useCallback(async () => {
    setLocationStatus('checking');

    try {
      const enabled = await Location.hasServicesEnabledAsync();

      if (!enabled) {
        setLocationStatus('unavailable');
        return;
      }

      const permission = await Location.getForegroundPermissionsAsync();

      setLocationStatus(
        permission.granted ? 'available' : 'permission-needed',
      );
    } catch {
      setLocationStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    void checkLocation();
  }, [checkLocation]);

  useEffect(() => {
    let active = true;

    setContacts([]);
    setSelectedIds([]);
    setContactsError(null);

    if (authLoading || !user || user.isAnonymous) {
      setContactsLoading(false);
      return;
    }

    setContactsLoading(true);

    getDocs(collection(firestore, 'users', user.uid, 'trustedContacts'))
      .then((snapshot) => {
        if (!active) return;

        const items: SosTrustedContact[] = snapshot.docs
          .map((document) => {
            const data = document.data();

            return {
              id: document.id,
              name: typeof data.name === 'string' ? data.name.trim() : '',
              relationship:
                typeof data.relationship === 'string'
                  ? data.relationship.trim()
                  : '',
              phoneNumber:
                typeof data.phoneNumber === 'string'
                  ? data.phoneNumber.trim()
                  : '',
            };
          })
          .filter((contact) => contact.name.length > 0);

        setContacts(items);
      })
      .catch(() => {
        if (!active) return;

        setContactsError(
          'Could not load trusted contacts. Check your connection and try again. Emergency calling remains available.',
        );
      })
      .finally(() => {
        if (active) setContactsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, authLoading, refresh]);

  const toggleContact = (id: string) => {
    if (activationStarted.current) return;

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  };

  const loadActivationLocation = async () => {
    if (locationBusy.current) return;

    locationBusy.current = true;
    setIsRetrievingLocation(true);

    const currentOperation = ++operation.current;

    try {
      const location = await retrieveSosLocation();

      if (operation.current !== currentOperation) return;

      setActivation((current) =>
        current ? { ...current, location } : current,
      );
    } finally {
      if (operation.current === currentOperation) {
        locationBusy.current = false;
        setIsRetrievingLocation(false);
      }
    }
  };

  const handleConfirmSos = () => {
    if (activationStarted.current) return;

    activationStarted.current = true;

    const selectedContacts = contacts.filter((contact) =>
      selectedIds.includes(contact.id),
    );

    // Capture the confirmation time before requesting permission or GPS.
    setActivation(createSosPreparation(selectedContacts));

    void loadActivationLocation();
  };

  const openMaps = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Could not open Maps',
        'Use the coordinates shown on this screen instead.',
      );
    }
  };

  const openPoliceDialer = async () => {
    try {
      await Linking.openURL('tel:119');
    } catch {
      Alert.alert(
        'Could not open the phone dialer',
        'Open your phone dialer manually and enter 119 for Sri Lanka Police emergency assistance.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={styles.back}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#5A3D4D" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>SOS assistance</Text>

        <Text style={styles.body}>
          Select trusted contacts, then hold SOS and confirm. If you are
          in immediate danger, contact emergency services directly.
        </Text>

        <View style={styles.hero}>
          <SosHoldButton
            key={userId ?? 'guest'}
            onConfirm={handleConfirmSos}
          />
        </View>

        {activation && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Prototype SOS details</Text>

            <Text selectable style={styles.body}>
              Activated: {new Date(activation.activatedAt).toLocaleString()}
            </Text>

            <Text selectable style={styles.small}>
              Recorded time: {activation.activatedAt}
            </Text>

            <Text style={styles.body}>
              Selected contacts:{' '}
              {activation.selectedContacts.length > 0
                ? activation.selectedContacts
                    .map((contact) => contact.name)
                    .join(', ')
                : 'None'}
            </Text>

            {isRetrievingLocation ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#C43D74" />
                <Text style={styles.body}>
                  Retrieving current location...
                </Text>
              </View>
            ) : activation.location ? (
              <>
                <Text style={styles.body}>
                  {activation.location.message}
                </Text>

                {activation.location.coordinates && (
                  <Text selectable style={styles.body}>
                    Latitude: {activation.location.coordinates.latitude}
                    {'\n'}
                    Longitude: {activation.location.coordinates.longitude}
                  </Text>
                )}

                {activation.location.mapsLink && (
                  <>
                    <Text selectable style={styles.small}>
                      {activation.location.mapsLink}
                    </Text>

                    <Pressable
                      style={styles.action}
                      onPress={() => {
                        const link = activation.location?.mapsLink;
                        if (link) void openMaps(link);
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={styles.actionText}>
                        Open location in Google Maps
                      </Text>
                    </Pressable>
                  </>
                )}

                {!activation.location.coordinates && (
                  <Pressable
                    style={styles.action}
                    onPress={() => void loadActivationLocation()}
                    accessibilityRole="button"
                  >
                    <Text style={styles.actionText}>
                      Retry location
                    </Text>
                  </Pressable>
                )}
              </>
            ) : null}

            <Text style={styles.small}>
              These details are held in this screen only. No message has
              been sent and no SOS record has been saved yet.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current location</Text>

          <Text style={styles.body}>
            {locationMessages[locationStatus]}
          </Text>

          {locationStatus === 'checking' && (
            <ActivityIndicator color="#C43D74" />
          )}

          <Pressable
            style={styles.action}
            onPress={() => void checkLocation()}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>Check availability</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trusted contacts</Text>

          <Text style={styles.body}>
            {activation
              ? 'The selected contacts were captured when you confirmed SOS.'
              : 'Select one or more contacts to include in your SOS preparation.'}
          </Text>

          {authLoading || contactsLoading ? (
            <ActivityIndicator color="#C43D74" />
          ) : contactsError ? (
            <>
              <Text style={styles.body}>{contactsError}</Text>

              {!activation && (
                <Pressable
                  style={styles.action}
                  onPress={() => setRefresh((current) => current + 1)}
                  accessibilityRole="button"
                >
                  <Text style={styles.actionText}>Try again</Text>
                </Pressable>
              )}
            </>
          ) : !user || user.isAnonymous ? (
            <Text style={styles.body}>
              Sign in with a registered account to see saved contacts.
              Emergency calling remains available.
            </Text>
          ) : contacts.length === 0 ? (
            <Text style={styles.body}>
              No trusted contacts have been added. You can still activate
              the prototype and access emergency calling.
            </Text>
          ) : (
            contacts.map((contact) => {
              const selected = activation
                ? activation.selectedContacts.some(
                    (item) => item.id === contact.id,
                  )
                : selectedIds.includes(contact.id);

              return (
                <Pressable
                  key={contact.id}
                  style={[
                    styles.contact,
                    selected && styles.selectedContact,
                  ]}
                  onPress={() => toggleContact(contact.id)}
                  disabled={activation !== null}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Select ${contact.name}`}
                  accessibilityState={{
                    checked: selected,
                    disabled: activation !== null,
                  }}
                >
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={24}
                    color="#A92F61"
                  />

                  <View style={styles.contactDetails}>
                    <Text style={styles.contactName}>{contact.name}</Text>

                    {contact.relationship ? (
                      <Text style={styles.small}>
                        {contact.relationship}
                      </Text>
                    ) : null}

                    <Text style={styles.small}>
                      {contact.phoneNumber || 'No phone number saved'}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emergency services</Text>

          <Text style={styles.body}>
            Sri Lanka Police emergency assistance: 119. This action opens
            your phone dialer and does not depend on location permission
            or saved contacts.
          </Text>

          <Pressable
            style={styles.callButton}
            onPress={() => void openPoliceDialer()}
            accessibilityRole="button"
            accessibilityLabel="Open phone dialer for Police 119"
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.callText}>Open Police dialer - 119</Text>
          </Pressable>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            SafeHer SOS is an academic prototype. Confirming SOS prepares
            details on this screen; it does not automatically notify
            trusted contacts or emergency services. Do not rely on
            SafeHer as your only way to get help.
          </Text>
        </View>
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
    paddingBottom: 36,
    gap: 12,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
  },
  backText: {
    color: '#5A3D4D',
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    color: '#32252B',
    fontSize: 28,
    fontWeight: '900',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  cardTitle: {
    color: '#32252B',
    fontSize: 17,
    fontWeight: '800',
  },
  body: {
    color: '#5D4B53',
    fontSize: 14,
    lineHeight: 21,
  },
  small: {
    color: '#5D4B53',
    fontSize: 12,
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5DCE1',
    borderRadius: 12,
  },
  selectedContact: {
    borderColor: '#A92F61',
    backgroundColor: '#FFF0F6',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    color: '#32252B',
    fontSize: 15,
    fontWeight: '700',
  },
  action: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionText: {
    color: '#A92F61',
    fontSize: 14,
    fontWeight: '700',
  },
  callButton: {
    minHeight: 48,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 12,
    backgroundColor: '#A92F61',
  },
  callText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimer: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFF3D6',
  },
  disclaimerText: {
    color: '#5D4B53',
    fontSize: 12,
    lineHeight: 18,
  },
});