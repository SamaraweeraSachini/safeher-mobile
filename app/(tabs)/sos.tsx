import { Ionicons } from '@expo/vector-icons';

import * as Location from 'expo-location';

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
  Linking,
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
  reverseGeocodeLocation,
} from '@/src/services/location-address-service';

import {
  createSosEvent,
  finishSosEvent,
} from '@/src/services/sos-service';

import {
  subscribeToTrustedContacts,
} from '@/src/services/trusted-contact-service';

import type {
  TrustedContact,
} from '@/src/types/trusted-contact';

type SosState =
  | 'ready'
  | 'active'
  | 'resolved'
  | 'cancelled';

type EmergencyLocation = {
  latitude: number;
  longitude: number;
  address: string | null;
};

export default function SosScreen() {
  const router = useRouter();

  const [state, setState] = useState<SosState>('ready');
  const [eventId, setEventId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [location, setLocation] = useState<EmergencyLocation | null>(null);

  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'loading' | 'available' | 'unavailable'
  >('idle');

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

  const retrieveLocation = async () => {
    try {
      setLocationStatus('loading');

      let permission = await Location.getForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (permission.status !== 'granted') {
        setLocationStatus('unavailable');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      const address = await reverseGeocodeLocation(coordinate);

      setLocation({ ...coordinate, address });
      setLocationStatus('available');
    } catch (error) {
      console.warn('SOS location failed:', error);
      setLocationStatus('unavailable');
    }
  };

  const activate = async () => {
    if (state === 'active') {
      return;
    }

    setState('active');
    void retrieveLocation();

    try {
      const id = await createSosEvent();
      setEventId(id);
    } catch (error) {
      console.warn('SOS event could not be stored:', error);
    }
  };

  const shareEmergency = async () => {
    const locationLine = location
      ? `Location: ${
          location.address ?? 'Current GPS position'
        }\nhttps://www.google.com/maps?q=${location.latitude},${location.longitude}`
      : 'Location is not available yet.';

    const contactLine =
      contacts.length > 0
        ? `Saved emergency contacts: ${contacts
            .map(contact => contact.name)
            .join(', ')}`
        : 'No saved emergency contacts are available.';

    try {
      await Share.share({
        title: 'SafeHer Emergency Message',
        message: `I need help. This message was prepared by the SafeHer academic prototype.\n\n${locationLine}\n\n${contactLine}\n\nPlease contact me and, if needed, emergency services.`,
      });
    } catch (error) {
      console.error('Emergency share failed:', error);
      Alert.alert('Could not open sharing', 'Please try again.');
    }
  };

  const callNumber = async (number: string) => {
    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      Alert.alert(
        'Dialler unavailable',
        `Please call ${number} manually.`
      );
    }
  };

  const finish = async (result: 'resolved' | 'cancelled') => {
    setState(result);

    if (eventId) {
      try {
        await finishSosEvent(eventId, result);
      } catch (error) {
        console.warn('SOS status could not be stored:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenBackButton label="Home" />

        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>SOS Assistance</Text>
            <View style={styles.prototypePill}>
              <View style={styles.prototypeDot} />
              <Text style={styles.prototypeText}>
                Academic prototype
              </Text>
            </View>
          </View>

          <View style={styles.headerIconWrap}>
            <Ionicons name="alert-circle" size={28} color="#C83B4D" />
          </View>
        </View>

        {/* ---------- Ready / State ---------- */}
        {state === 'ready' ? (
          <View style={styles.hero}>
            <View style={styles.sosRingOuter}>
              <Pressable
                style={({ pressed }) => [
                  styles.sosButton,
                  pressed && styles.sosPressed,
                ]}
                onLongPress={activate}
                delayLongPress={1200}
                accessibilityRole="button"
                accessibilityLabel="Press and hold to activate SOS"
              >
                <Ionicons
                  name="alert-circle"
                  size={46}
                  color="#FFFFFF"
                />
                <Text style={styles.sosText}>HOLD SOS</Text>
              </Pressable>
            </View>

            <Text style={styles.instruction}>
              Press and hold once to activate. Emergency-call buttons
              remain available even before GPS is ready.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.stateCard,
              state === 'active' && styles.activeState,
            ]}
          >
            <View
              style={[
                styles.stateIconWrap,
                state === 'active'
                  ? styles.stateIconActive
                  : styles.stateIconIdle,
              ]}
            >
              <Ionicons
                name={
                  state === 'active'
                    ? 'radio-outline'
                    : 'checkmark-circle-outline'
                }
                size={22}
                color={state === 'active' ? '#B42318' : '#287550'}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.stateTitle}>
                {state === 'active'
                  ? 'SOS active'
                  : state === 'resolved'
                    ? 'SOS resolved'
                    : 'SOS cancelled'}
              </Text>

              <Text style={styles.stateText}>
                {state === 'active'
                  ? 'Use the actions below. Location is loading separately.'
                  : 'No prototype SOS action is active now.'}
              </Text>
            </View>
          </View>
        )}

        {/* ---------- Emergency Calls ---------- */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="call-outline" size={17} color={Brand.burgundy} />
            </View>
            <Text style={styles.cardTitle}>Emergency calls</Text>
          </View>

          <Text style={styles.body}>
            These buttons open the phone dialler. SafeHer does not place
            the call automatically.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.policeButton,
              pressed && styles.pressed,
            ]}
            onPress={() => void callNumber('119')}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.callText}>Police Emergency · 119</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.ambulanceButton,
              pressed && styles.pressed,
            ]}
            onPress={() => void callNumber('1990')}
          >
            <Ionicons name="medkit" size={20} color="#FFFFFF" />
            <Text style={styles.callText}>Ambulance · 1990</Text>
          </Pressable>
        </View>

        {/* ---------- Location ---------- */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons
                name="location-outline"
                size={17}
                color={Brand.burgundy}
              />
            </View>
            <Text style={styles.cardTitle}>Location</Text>
          </View>

          {locationStatus === 'loading' ? (
            <View style={styles.row}>
              <ActivityIndicator color={Brand.burgundy} />
              <Text style={styles.body}>Getting current location...</Text>
            </View>
          ) : location ? (
            <>
              <Text style={styles.locationAddress}>
                {location.address ?? 'Current GPS location'}
              </Text>
              <Text style={styles.body}>
                {location.latitude.toFixed(5)},{' '}
                {location.longitude.toFixed(5)}
              </Text>
            </>
          ) : (
            <Text style={styles.body}>
              {locationStatus === 'unavailable'
                ? 'Location is unavailable. You can still call or share an emergency message.'
                : 'Location will be requested after SOS activation.'}
            </Text>
          )}
        </View>

        {/* ---------- Trusted Contacts ---------- */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons
                name="people-outline"
                size={17}
                color={Brand.burgundy}
              />
            </View>
            <Text style={styles.cardTitle}>Trusted contacts</Text>

            <Pressable
              style={({ pressed }) => [
                styles.changeButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/trusted-contacts' as Href)}
            >
              <Text style={styles.changeText}>Change</Text>
            </Pressable>
          </View>

          {contacts.length === 0 ? (
            <Text style={styles.body}>
              No saved trusted contacts. Add them once and they will be
              ready here.
            </Text>
          ) : (
            contacts.map(contact => (
              <Pressable
                key={contact.id}
                style={({ pressed }) => [
                  styles.contactRow,
                  pressed && styles.pressed,
                ]}
                onPress={() => void callNumber(contact.phone)}
              >
                <View style={styles.contactAvatar}>
                  <Ionicons
                    name="person"
                    size={16}
                    color={Brand.burgundy}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactMeta}>
                    {contact.relationship || 'Trusted contact'}
                    {' · '}
                    {contact.phone}
                  </Text>
                </View>

                <View style={styles.callCircle}>
                  <Ionicons name="call" size={16} color={Brand.burgundy} />
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* ---------- Share Emergency ---------- */}
        <Pressable
          style={({ pressed }) => [
            styles.shareButton,
            pressed && styles.pressed,
          ]}
          onPress={() => void shareEmergency()}
        >
          <Ionicons
            name="share-social-outline"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.shareText}>Share Emergency Message</Text>
        </Pressable>

        {/* ---------- Cancel / Resolve ---------- */}
        {state === 'active' ? (
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
              onPress={() => void finish('cancelled')}
            >
              <Ionicons
                name="close-circle-outline"
                size={17}
                color="#B42318"
              />
              <Text style={styles.cancelText}>Cancel SOS</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.resolveButton,
                pressed && styles.pressed,
              ]}
              onPress={() => void finish('resolved')}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={17}
                color="#FFFFFF"
              />
              <Text style={styles.resolveText}>Resolve</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ---------- Disclaimer ---------- */}
        <View style={styles.disclaimer}>
          <View style={styles.disclaimerIconWrap}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#74552C"
            />
          </View>

          <Text style={styles.disclaimerText}>
            SafeHer is an academic prototype. It cannot verify message
            delivery, emergency dispatch, or that help is on the way.
          </Text>
        </View>
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
    paddingTop: 12,
    paddingBottom: 44,
  },

  /* ---------- Header ---------- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F8CFCB',
  },

  title: {
    color: Brand.ink,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  prototypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9,
    backgroundColor: '#FDECEC',
  },

  prototypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B42318',
  },

  prototypeText: {
    color: '#B42318',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  /* ---------- Hero / SOS ---------- */
  hero: {
    alignItems: 'center',
    paddingVertical: 26,
  },

  sosRingOuter: {
    padding: 14,
    borderRadius: 110,
    backgroundColor: 'rgba(200, 59, 77, 0.12)',
  },

  sosButton: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#C83B4D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C83B4D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },

  sosPressed: {
    transform: [{ scale: 0.96 }],
  },

  sosText: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },

  instruction: {
    marginTop: 18,
    maxWidth: 310,
    color: Brand.ink,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '700',
    fontSize: 13,
  },

  /* ---------- State ---------- */
  stateCard: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 18,
    padding: 15,
    borderRadius: 18,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
  },

  activeState: {
    borderColor: '#FDA29B',
    backgroundColor: '#FEF3F2',
    shadowColor: '#B42318',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },

  stateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stateIconActive: {
    backgroundColor: '#FDECEC',
  },

  stateIconIdle: {
    backgroundColor: '#E8F5ED',
  },

  stateTitle: {
    color: Brand.ink,
    fontWeight: '900',
    fontSize: 14,
  },

  stateText: {
    marginTop: 3,
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  /* ---------- Cards ---------- */
  card: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    shadowColor: '#4E1026',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 8,
  },

  cardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },

  cardTitle: {
    flex: 1,
    color: Brand.ink,
    fontSize: 15.5,
    fontWeight: '800',
  },

  body: {
    color: Brand.muted,
    fontSize: 12.5,
    lineHeight: 18,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  /* ---------- Emergency call buttons ---------- */
  policeButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#9B2D3F',
    shadowColor: '#9B2D3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },

  ambulanceButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 9,
    borderRadius: 14,
    backgroundColor: '#287550',
    shadowColor: '#287550',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },

  callText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14.5,
    letterSpacing: 0.1,
  },

  /* ---------- Location ---------- */
  locationAddress: {
    color: Brand.ink,
    fontWeight: '800',
    lineHeight: 19,
    marginBottom: 4,
    fontSize: 13.5,
  },

  /* ---------- Contacts ---------- */
  changeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: Brand.blush,
  },

  changeText: {
    color: Brand.burgundy,
    fontWeight: '900',
    fontSize: 12,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
  },

  contactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },

  contactName: {
    color: Brand.ink,
    fontWeight: '800',
    fontSize: 13.5,
  },

  contactMeta: {
    marginTop: 3,
    color: Brand.muted,
    fontSize: 11.5,
  },

  callCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },

  /* ---------- Share ---------- */
  shareButton: {
    minHeight: 56,
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

  shareText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  /* ---------- Action Row ---------- */
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
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

  resolveButton: {
    flex: 1,
    minHeight: 50,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#287550',
    shadowColor: '#287550',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 2,
  },

  resolveText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13.5,
  },

  /* ---------- Disclaimer ---------- */
  disclaimer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFF3D6',
    borderWidth: 1,
    borderColor: '#F5DCAE',
  },

  disclaimerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  disclaimerText: {
    flex: 1,
    color: '#74552C',
    fontSize: 12,
    lineHeight: 18,
  },

  pressed: {
    opacity: 0.82,
  },
});