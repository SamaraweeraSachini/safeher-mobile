import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect, useRouter } from 'expo-router';

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

import SosEmergencyMessage from '@/src/components/sos/SosEmergencyMessage';
import TrustedContactSelector from '@/src/components/TrustedContactSelector';

import SosHoldButton from '@/src/components/sos/SosHoldButton';

import { firestore } from '@/src/config/firebase';

import { useAuth } from '@/src/context/AuthContext';

import {

  createSosPreparation,

  retrieveSosLocation,

  type PreparedSos,

  type SosTrustedContact,

} from '@/src/services/sos-preparation-service';

import {

  getActiveSosRequest,

  saveActiveSosRequest,

  updateActiveSosLocation,

  type ActiveSosRequest,

} from '@/src/services/sos-request-service';

type ContentProps = {

  userId: string | null;

  registered: boolean;

  authLoading: boolean;

};

export default function SosScreen() {

  const { user, loading } = useAuth();

  return (

    <SosContent

      key={user?.uid ?? 'signed-out'}

      userId={user?.uid ?? null}

      registered={Boolean(user && !user.isAnonymous)}

      authLoading={loading}

    />

  );

}

function SosContent({

  userId,

  registered,

  authLoading,

}: ContentProps) {

  const router = useRouter();

  const [contacts, setContacts] = useState<SosTrustedContact[]>([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [contactsLoading, setContactsLoading] = useState(false);

  const [contactsError, setContactsError] = useState<string | null>(null);

  const [contactsRefresh, setContactsRefresh] = useState(0);

  const [request, setRequest] = useState<ActiveSosRequest | null>(null);

  const [preparation, setPreparation] = useState<PreparedSos | null>(null);

  const [loadingRequest, setLoadingRequest] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [closureMessage, setClosureMessage] = useState<string | null>(null);

  const epoch = useRef(0);

  const busy = useRef(false);

  const loadRequest = useCallback(async () => {

    if (busy.current) return;

    if (authLoading) {

      setLoadingRequest(true);

      return;

    }

    if (!registered || !userId) {

      setLoadingRequest(false);

      setLoadError(null);

      return;

    }

    const token = ++epoch.current;

    setLoadingRequest(true);

    setLoadError(null);

    try {

      const saved = await getActiveSosRequest(userId);

      if (epoch.current !== token) return;

      setRequest(saved);

      if (saved) {

        setPreparation(saved.preparation);

        setActionError(null);

      }

    } catch {

      if (epoch.current !== token) return;

      setLoadError(

        'Could not check your active SOS request. Check your connection and retry. Sharing and emergency calling remain available.',

      );

    } finally {

      if (epoch.current === token) {

        setLoadingRequest(false);

      }

    }

  }, [authLoading, registered, userId]);

  useEffect(() => {
    return () => {
      epoch.current += 1;
    };
  }, []);

  useFocusEffect(

    useCallback(() => {

      void loadRequest();

      return () => {

        epoch.current += 1;

      };

    }, [loadRequest]),

  );

  useEffect(() => {

    let active = true;

    if (authLoading || !registered || !userId) {

      setContacts([]);

      setContactsLoading(false);

      return;

    }

    setContactsLoading(true);

    setContactsError(null);

    getDocs(collection(firestore, 'users', userId, 'trustedContacts'))

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

        if (active) {

          setContactsError(

            'Could not load contacts. You can continue without contacts or retry.',

          );

        }

      })

      .finally(() => {

        if (active) setContactsLoading(false);

      });

    return () => {

      active = false;

    };

  }, [authLoading, registered, userId, contactsRefresh]);

  const savePreparation = async (draft: PreparedSos) => {

    if (!userId || !registered || busy.current) return;

    busy.current = true;

    const token = epoch.current;

    setActionError(null);

    setActionMessage(null);

    setBusyLabel('Retrieving current location...');

    try {

      const complete: PreparedSos = draft.location

        ? draft

        : {

            ...draft,

            location: await retrieveSosLocation(),

          };

      if (epoch.current !== token) return;

      setPreparation(complete);

      setBusyLabel('Saving simulation request to Firestore...');

      const saved = await saveActiveSosRequest(userId, complete);

      if (epoch.current !== token) return;

      setRequest(saved);

      setPreparation(saved.preparation);

      setActionMessage('Active simulation request saved in Firestore.');

    } catch {

      if (epoch.current !== token) return;

      setActionError(

        'Could not confirm the SOS save. Your prepared details remain available here. Check your connection and retry saving or reload the request.',

      );

    } finally {

      busy.current = false;

      if (epoch.current === token) {

        setBusyLabel(null);

      }

    }

  };

  const handleConfirm = () => {

    if (

      busy.current ||

      preparation ||

      request ||

      loadingRequest ||

      loadError

    ) {

      return;

    }

    const selected = contacts.filter((contact) =>

      selectedIds.includes(contact.id),

    );

    setClosureMessage(null);

    const draft = createSosPreparation(selected);

    setPreparation(draft);

    void savePreparation(draft);

  };

  const handleUpdateLocation = async () => {

    if (!request || !userId || busy.current) return;

    busy.current = true;

    const token = epoch.current;

    setActionError(null);

    setActionMessage(null);

    setBusyLabel('Retrieving updated location...');

    try {

      const location = await retrieveSosLocation();

      if (epoch.current !== token) return;

      if (!location.coordinates) {

        setActionError(

          `${location.message} Your previously saved location has been retained.`,

        );

        return;

      }

      setBusyLabel("Saving updated location...");

      const updated = await updateActiveSosLocation(
        userId,
        location,
        request.preparation.activatedAt,
      );

      if (epoch.current !== token) return;

      setRequest(updated);

      setPreparation(updated.preparation);

      setActionMessage(

        'Location updated in Firestore. The original activation time is unchanged.',

      );

    } catch {

      if (epoch.current !== token) return;

      setActionError(

        'Could not confirm the location update. The previously displayed location is retained. Reload the request to check its saved state.',

      );

    } finally {

      busy.current = false;

      if (epoch.current === token) {

        setBusyLabel(null);

      }

    }

  };

  const openLink = async (url: string) => {

    try {

      await Linking.openURL(url);

    } catch {

      Alert.alert(

        'Could not open this action',

        url.startsWith('tel:')

          ? 'Open your phone dialer manually and enter 119.'

          : 'Use the location coordinates displayed on this screen.',

      );

    }

  };

  const canSelectContacts =

    !preparation && !request && !busyLabel && !loadingRequest && !loadError;

  return (

    <SafeAreaView style={styles.safeArea} edges={['top']}>

      <ScrollView contentContainerStyle={styles.content}>

        <Pressable

          style={styles.action}

          onPress={() => {

            if (router.canGoBack()) router.back();

            else router.replace('/');

          }}

          accessibilityRole="button"

        >

          <Text style={styles.actionText}>Back</Text>

        </Pressable>

        <Text style={styles.title}>SOS assistance</Text>

        {closureMessage && !request && (
          <View style={styles.card}>
            <Text accessibilityLiveRegion="polite" style={styles.body}>
              {closureMessage}
            </Text>
          </View>
        )}

        <Text style={styles.body}>

          SafeHer records a prototype simulation request. It does not

          automatically notify contacts or emergency services.

        </Text>

        {loadingRequest ? (

          <View style={styles.card}>

            <ActivityIndicator color="#A92F61" />

            <Text style={styles.body}>Checking active SOS request...</Text>

          </View>

        ) : loadError ? (

          <View style={styles.card}>

            <Text style={styles.error}>{loadError}</Text>

            <Pressable

              style={styles.action}

              onPress={() => void loadRequest()}

              accessibilityRole="button"

            >

              <Text style={styles.actionText}>Retry loading SOS</Text>

            </Pressable>

          </View>

        ) : !registered ? (

          <View style={styles.card}>

            <Text style={styles.body}>

              Sign in with a registered account to save a prototype SOS

              request. Emergency calling remains available.

            </Text>

          </View>

        ) : !preparation && !request ? (

          <View style={styles.hero}>

            <SosHoldButton onConfirm={handleConfirm} />

          </View>

        ) : null}

        {preparation && (

          <View style={styles.card}>

            <Text style={styles.cardTitle}>

              {request

                ? 'Active SOS - simulation'

                : 'SOS preparation - save not confirmed'}

            </Text>

            <Text style={styles.body}>

              {request

                ? 'Status: active. This simulation request is saved in Firestore.'

                : 'These details are prepared locally. An active Firestore save has not been confirmed.'}

            </Text>

            <Text selectable style={styles.body}>

              Activated: {new Date(preparation.activatedAt).toLocaleString()}

            </Text>

            <Text selectable style={styles.small}>

              Recorded time: {preparation.activatedAt}

            </Text>

            <Text style={styles.cardTitle}>Selected contacts</Text>

            {preparation.selectedContacts.length === 0 ? (

              <Text style={styles.body}>None selected.</Text>

            ) : (

              preparation.selectedContacts.map((contact) => (

                <Text key={contact.id} style={styles.body}>

                  {contact.name}

                  {contact.relationship ? ` - ${contact.relationship}` : ''}

                  {'\n'}

                  {contact.phoneNumber || 'No phone number saved'}

                </Text>

              ))

            )}

            <Text style={styles.cardTitle}>Saved location</Text>

            <Text style={styles.body}>

              {preparation.location?.message ??

                'Waiting for the location result...'}

            </Text>

            {preparation.location?.coordinates && (

              <Text selectable style={styles.body}>

                Latitude: {preparation.location.coordinates.latitude}

                {'\n'}

                Longitude: {preparation.location.coordinates.longitude}

              </Text>

            )}

            {preparation.location?.mapsLink && (

              <>

                <Text selectable style={styles.small}>

                  {preparation.location.mapsLink}

                </Text>

                <Pressable

                  style={styles.action}

                  onPress={() => {

                    const link = preparation.location?.mapsLink;

                    if (link) void openLink(link);

                  }}

                  accessibilityRole="button"

                >

                  <Text style={styles.actionText}>

                    Open location in Google Maps

                  </Text>

                </Pressable>

              </>

            )}

            {busyLabel ? (

              <View style={styles.loadingRow}>

                <ActivityIndicator color="#A92F61" />

                <Text style={styles.body}>{busyLabel}</Text>

              </View>

            ) : request ? (

              <Pressable

                style={styles.button}

                onPress={() => void handleUpdateLocation()}

                accessibilityRole="button"

              >

                <Text style={styles.buttonText}>Update Location</Text>

              </Pressable>

            ) : (

              <Pressable

                style={styles.button}

                onPress={() => void savePreparation(preparation)}

                accessibilityRole="button"

              >

                <Text style={styles.buttonText}>Retry saving SOS</Text>

              </Pressable>

            )}

            {actionError ? (

              <Text style={styles.error}>{actionError}</Text>

            ) : null}

            {actionMessage ? (

              <Text style={styles.body}>{actionMessage}</Text>

            ) : null}

            <Pressable

              style={styles.action}

              onPress={() => void loadRequest()}

              disabled={Boolean(busyLabel)}

              accessibilityRole="button"

              accessibilityState={{ disabled: Boolean(busyLabel) }}

            >

              <Text style={styles.actionText}>Reload saved request</Text>

            </Pressable>

            <Text style={styles.small}>

              Location is a snapshot, not live tracking. No message

              delivery or emergency response is confirmed.

            </Text>

          </View>

        )}

        {preparation && (

          <SosEmergencyMessage

            activation={preparation}

            isRetrievingLocation={Boolean(busyLabel)}

          />

        )}

        {request && userId && (
          <SosLifecycleActions
            key={request.preparation.activatedAt}
            userId={userId}
            activatedAt={request.preparation.activatedAt}
            disabled={Boolean(busyLabel) || loadingRequest}
            onBusyChange={(isBusy) => {
              busy.current = isBusy;
              setBusyLabel(isBusy ? 'Updating SOS status...' : null);
            }}
            onClosed={(status) => {
              epoch.current += 1;
              busy.current = false;

              setRequest(null);
              setPreparation(null);
              setSelectedIds([]);
              setBusyLabel(null);
              setActionError(null);
              setActionMessage(null);
              setLoadError(null);
              setLoadingRequest(false);

              setClosureMessage(
                status === 'cancelled'
                  ? 'Prototype SOS cancelled. The cancellation status and time were saved. No SOS request is active.'
                  : 'Prototype SOS resolved. The resolution status and time were saved. No SOS request is active.',
              );
            }}
          />
        )}

        {!preparation && !request && (

          <View style={styles.card}>

            <Text style={styles.cardTitle}>Trusted contacts</Text>

            {contactsLoading ? (

              <ActivityIndicator color="#A92F61" />

            ) : contactsError ? (

              <>

                <Text style={styles.body}>{contactsError}</Text>

                <Pressable

                  style={styles.action}

                  onPress={() => setContactsRefresh((current) => current + 1)}

                  accessibilityRole="button"

                >

                  <Text style={styles.actionText}>Retry contacts</Text>

                </Pressable>

              </>

            ) : (
              <TrustedContactSelector
                contacts={contacts}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                selectionMode="multiple"
                disabled={!canSelectContacts}
                emptyMessage="No saved contacts available. Contacts are optional; emergency calling remains available."
              />
            )}

            <Text style={styles.small}>

              Current location will be requested after you hold SOS and

              confirm. Denial does not block emergency calling.

            </Text>

          </View>

        )}

        <View style={styles.card}>

          <Text style={styles.cardTitle}>Emergency services</Text>

          <Text style={styles.body}>

            Open the phone dialer for Sri Lanka Police emergency

            assistance. Location, contacts, and Firestore access are

            not required for this action.

          </Text>

          <Pressable

            style={styles.button}

            onPress={() => void openLink('tel:119')}

            accessibilityRole="button"

            accessibilityLabel="Open Police dialer for 119"

          >

            <Text style={styles.buttonText}>

              Open Police dialer - 119

            </Text>

          </Pressable>

        </View>

        <View style={styles.disclaimer}>

          <Text style={styles.small}>

            Academic prototype only. An active simulation record does

            not mean that help has been dispatched or anyone has been

            notified. Do not rely on SafeHer as your only way to get help.

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

  error: {

    color: '#9E2637',

    fontSize: 14,

    lineHeight: 21,

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

  button: {

    minHeight: 48,

    padding: 12,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: '#A92F61',

  },

  buttonText: {

    color: '#FFFFFF',

    fontSize: 14,

    fontWeight: '700',

  },

  disclaimer: {

    padding: 16,

    borderRadius: 14,

    backgroundColor: '#FFF3D6',

  },

});
