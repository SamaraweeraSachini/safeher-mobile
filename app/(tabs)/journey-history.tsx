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
  Brand,
} from '@/constants/brand';

import ScreenBackButton from '@/src/components/navigation/ScreenBackButton';

import {
  useJourneyHistory,
} from '@/src/hooks/useJourneyHistory';

import {
  subscribeToTrustedContacts,
} from '@/src/services/trusted-contact-service';

import type {
  StoredSafeJourney,
} from '@/src/types/safe-journey';

import type {
  TrustedContact,
} from '@/src/types/trusted-contact';

function formatDateTime(date: Date | null): string {
  if (!date) {
    return 'Not available';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusText(status: StoredSafeJourney['status']): string {
  if (status === 'active') {
    return 'Active';
  }
  if (status === 'completed') {
    return 'Completed';
  }
  return 'Cancelled';
}

function statusIcon(
  status: StoredSafeJourney['status']
): keyof typeof Ionicons.glyphMap {
  if (status === 'active') {
    return 'navigate';
  }
  if (status === 'completed') {
    return 'checkmark-circle';
  }
  return 'close-circle';
}

export default function JourneyHistoryScreen() {
  const router = useRouter();

  const { journeys, isLoading, error, retry } = useJourneyHistory();

  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [selectedJourney, setSelectedJourney] =
    useState<StoredSafeJourney | null>(null);

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

  const contactNames = useMemo(
    () => new Map(contacts.map(contact => [contact.id, contact.name])),
    [contacts]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.burgundy} />
          <Text style={styles.helperText}>
            Loading journey history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBackButton label="Journey" />

        {/* ---------- Header ---------- */}
        <View style={styles.headerBlock}>
          <View style={styles.headerIconWrap}>
            <Ionicons
              name="time-outline"
              size={24}
              color={Brand.burgundy}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Journey History</Text>
            <Text style={styles.subtitle}>
              Active, completed and cancelled Safe Journeys.
            </Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#B42318"
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.errorText}>{error}</Text>

              <Pressable
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.pressed,
                ]}
                onPress={retry}
              >
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Brand.burgundy}
                />
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {!error && journeys.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="time-outline"
                size={34}
                color={Brand.burgundy}
              />
            </View>

            <Text style={styles.emptyTitle}>No journeys yet</Text>
            <Text style={styles.helperText}>
              Your Safe Journeys will appear here.
            </Text>
          </View>
        ) : null}

        {journeys.map(journey => {
          const isActive = journey.status === 'active';

          return (
            <Pressable
              key={journey.id}
              style={({ pressed }) => [
                styles.card,
                isActive && styles.activeCard,
                pressed && styles.pressed,
              ]}
              onPress={() => setSelectedJourney(journey)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[
                      styles.statusIconWrap,
                      isActive
                        ? styles.statusIconActive
                        : journey.status === 'completed'
                          ? styles.statusIconCompleted
                          : styles.statusIconCancelled,
                    ]}
                  >
                    <Ionicons
                      name={statusIcon(journey.status)}
                      size={16}
                      color={
                        isActive
                          ? '#287550'
                          : journey.status === 'completed'
                            ? '#2E6DA4'
                            : '#B42318'
                      }
                    />
                  </View>

                  <Text style={styles.destination} numberOfLines={2}>
                    {journey.destination}
                  </Text>
                </View>

                <View
                  style={[
                    styles.badge,
                    isActive
                      ? styles.activeBadge
                      : journey.status === 'completed'
                        ? styles.completedBadge
                        : styles.cancelledBadge,
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {statusText(journey.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Ionicons
                  name="play-outline"
                  size={13}
                  color={Brand.muted}
                />
                <Text style={styles.meta}>
                  Started: {formatDateTime(journey.createdAt)}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons
                  name={
                    journey.status === 'active'
                      ? 'time-outline'
                      : journey.status === 'completed'
                        ? 'checkmark-outline'
                        : 'close-outline'
                  }
                  size={13}
                  color={Brand.muted}
                />
                <Text style={styles.meta}>
                  {journey.status === 'active'
                    ? 'Expected'
                    : journey.status === 'completed'
                      ? 'Completed'
                      : 'Cancelled'}
                  :{' '}
                  {formatDateTime(
                    journey.status === 'active'
                      ? journey.expectedArrivalTime
                      : journey.status === 'completed'
                        ? journey.completedAt
                        : journey.cancelledAt
                  )}
                </Text>
              </View>

              <View style={styles.openRow}>
                <Text style={styles.openText}>
                  {isActive ? 'Tap to resume' : 'Tap for details'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Brand.burgundy}
                />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal
        visible={selectedJourney !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedJourney(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selectedJourney ? (
              <>
                <View style={styles.modalHandle} />

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Journey Details</Text>

                  <Pressable
                    onPress={() => setSelectedJourney(null)}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons name="close" size={20} color={Brand.ink} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Detail
                    label="Destination"
                    value={selectedJourney.destination}
                  />

                  <Detail
                    label="Status"
                    value={statusText(selectedJourney.status)}
                  />

                  <Detail
                    label="Started"
                    value={formatDateTime(selectedJourney.createdAt)}
                  />

                  <Detail
                    label="Expected arrival"
                    value={formatDateTime(
                      selectedJourney.expectedArrivalTime
                    )}
                  />

                  <Detail
                    label="Last check-in"
                    value={formatDateTime(selectedJourney.lastCheckInAt)}
                  />

                  {selectedJourney.status === 'completed' ? (
                    <Detail
                      label="Completed"
                      value={formatDateTime(selectedJourney.completedAt)}
                    />
                  ) : null}

                  {selectedJourney.status === 'cancelled' ? (
                    <Detail
                      label="Cancelled"
                      value={formatDateTime(selectedJourney.cancelledAt)}
                    />
                  ) : null}

                  <Detail
                    label="Trusted contacts"
                    value={
                      selectedJourney.trustedContactIds
                        .map(
                          id =>
                            contactNames.get(id) ?? 'Saved contact'
                        )
                        .join(', ') || 'None'
                    }
                  />

                  <Detail
                    label="Check-in interval"
                    value={`${selectedJourney.checkInIntervalMinutes} minutes`}
                  />

                  {selectedJourney.status === 'active' ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.resumeButton,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        setSelectedJourney(null);
                        router.push('/active-journey' as Href);
                      }}
                    >
                      <Ionicons
                        name="navigate"
                        size={17}
                        color="#FFFFFF"
                      />
                      <Text style={styles.resumeText}>
                        Resume Active Journey
                      </Text>
                    </Pressable>
                  ) : null}
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
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

  /* ---------- Header ---------- */
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 18,
  },

  headerIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
    borderWidth: 1,
    borderColor: Brand.roseSoft,
  },

  title: {
    color: Brand.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 4,
    color: Brand.muted,
    fontSize: 13,
    lineHeight: 18,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  helperText: {
    marginTop: 8,
    color: Brand.muted,
    textAlign: 'center',
    fontSize: 12.5,
  },

  /* ---------- Error ---------- */
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#F8CFCB',
    marginBottom: 14,
  },

  errorText: {
    color: '#B42318',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },

  retryText: {
    color: Brand.burgundy,
    fontWeight: '800',
    fontSize: 12.5,
    textDecorationLine: 'underline',
  },

  /* ---------- Empty ---------- */
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
  },

  emptyIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },

  emptyTitle: {
    marginTop: 14,
    color: Brand.ink,
    fontWeight: '800',
    fontSize: 17,
  },

  /* ---------- Card ---------- */
  card: {
    marginBottom: 12,
    padding: 16,
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

  activeCard: {
    borderColor: '#B7DEC9',
    backgroundColor: '#F5FBF7',
    shadowColor: '#287550',
    shadowOpacity: 0.08,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  statusIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusIconActive: {
    backgroundColor: '#DDF4E6',
  },

  statusIconCompleted: {
    backgroundColor: '#E7F1FA',
  },

  statusIconCancelled: {
    backgroundColor: '#FDECEC',
  },

  destination: {
    flex: 1,
    color: Brand.ink,
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.1,
  },

  badge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  activeBadge: {
    backgroundColor: '#DDF4E6',
  },

  completedBadge: {
    backgroundColor: '#E7F1FA',
  },

  cancelledBadge: {
    backgroundColor: '#FDECEC',
  },

  badgeText: {
    color: Brand.ink,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },

  meta: {
    color: Brand.muted,
    fontSize: 11.5,
  },

  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    alignSelf: 'flex-start',
  },

  openText: {
    color: Brand.burgundy,
    fontWeight: '800',
    fontSize: 12.5,
  },

  /* ---------- Modal ---------- */
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(41,24,32,0.45)',
  },

  modalSheet: {
    maxHeight: '82%',
    padding: 20,
    paddingTop: 12,
    paddingBottom: 32,
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
    marginBottom: 18,
  },

  modalTitle: {
    color: Brand.ink,
    fontSize: 20,
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

  /* ---------- Detail ---------- */
  detailRow: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
  },

  detailLabel: {
    color: Brand.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  detailValue: {
    marginTop: 5,
    color: Brand.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },

  resumeButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    borderRadius: 15,
    backgroundColor: '#287550',
    shadowColor: '#287550',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },

  resumeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14.5,
  },

  pressed: {
    opacity: 0.8,
  },
});