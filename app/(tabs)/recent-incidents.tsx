import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type IncidentType =
  | 'Harassment'
  | 'Stalking'
  | 'Poor Lighting'
  | 'Unsafe Transport'
  | 'Suspicious Activity';

type IncidentStatus = 'Active' | 'Resolved';

type Incident = {
  id: string;
  type: IncidentType;
  description: string;
  dateTime: string;
  anonymous: boolean;
  status: IncidentStatus;
};

const COLORS = {
  background: '#FFF9FB',
  surface: '#FFFFFF',
  primary: '#C43D74',
  primarySoft: '#FBEAF1',
  title: '#32252B',
  text: '#5D4B53',
  muted: '#927E87',
  border: '#F1DDE6',

  active: '#A66518',
  activeBackground: '#FFF3D6',

  resolved: '#35735A',
  resolvedBackground: '#E5F4ED',

  overlay: 'rgba(30, 20, 25, 0.48)',
};

const INCIDENTS: Incident[] = [
  {
    id: '1',
    type: 'Harassment',
    description:
      'A person was repeatedly making another passenger uncomfortable near the bus stop.',
    dateTime: 'Today • 10:45 AM',
    anonymous: true,
    status: 'Active',
  },
  {
    id: '2',
    type: 'Suspicious Activity',
    description:
      'Suspicious behaviour was reported close to the entrance of a public area.',
    dateTime: 'Today • 8:20 AM',
    anonymous: true,
    status: 'Active',
  },
  {
    id: '3',
    type: 'Poor Lighting',
    description:
      'Several street lights were not working along this walking route.',
    dateTime: 'Yesterday • 9:10 PM',
    anonymous: false,
    status: 'Resolved',
  },
  {
    id: '4',
    type: 'Unsafe Transport',
    description:
      'Unsafe driving and aggressive behaviour were reported during a public transport journey.',
    dateTime: '20 Aug • 7:30 PM',
    anonymous: true,
    status: 'Resolved',
  },
  {
    id: '5',
    type: 'Stalking',
    description:
      'A person appeared to be repeatedly following someone along the same route.',
    dateTime: '19 Aug • 6:15 PM',
    anonymous: true,
    status: 'Active',
  },
];

function getIncidentIcon(type: IncidentType) {
  switch (type) {
    case 'Harassment':
      return 'hand-left-outline' as const;

    case 'Stalking':
      return 'eye-outline' as const;

    case 'Poor Lighting':
      return 'bulb-outline' as const;

    case 'Unsafe Transport':
      return 'bus-outline' as const;

    case 'Suspicious Activity':
      return 'search-outline' as const;

    default:
      return 'warning-outline' as const;
  }
}

function getIncidentColor(type: IncidentType) {
  switch (type) {
    case 'Harassment':
      return '#A63046';

    case 'Stalking':
      return '#8A3E63';

    case 'Poor Lighting':
      return '#9A6918';

    case 'Unsafe Transport':
      return '#9B4D3F';

    case 'Suspicious Activity':
      return '#6C4A82';

    default:
      return COLORS.primary;
  }
}

function getIncidentBackground(type: IncidentType) {
  switch (type) {
    case 'Harassment':
      return '#FCE8EC';

    case 'Stalking':
      return '#F7E9F0';

    case 'Poor Lighting':
      return '#FFF3D6';

    case 'Unsafe Transport':
      return '#FBEAE6';

    case 'Suspicious Activity':
      return '#F1EAF6';

    default:
      return COLORS.primarySoft;
  }
}

function IncidentCard({
  incident,
  onPress,
}: {
  incident: Incident;
  onPress: () => void;
}) {
  const isActive = incident.status === 'Active';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.incidentHeading}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: getIncidentBackground(
                  incident.type
                ),
              },
            ]}
          >
            <Ionicons
              name={getIncidentIcon(incident.type)}
              size={22}
              color={getIncidentColor(incident.type)}
            />
          </View>

          <View style={styles.headingText}>
            <Text style={styles.incidentType}>
              {incident.type}
            </Text>

            <Text style={styles.dateText}>
              {incident.dateTime}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isActive
                ? COLORS.activeBackground
                : COLORS.resolvedBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: isActive
                  ? COLORS.active
                  : COLORS.resolved,
              },
            ]}
          >
            {incident.status}
          </Text>
        </View>
      </View>

      <Text
        style={styles.description}
        numberOfLines={3}
      >
        {incident.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.reporterRow}>
          <Ionicons
            name={
              incident.anonymous
                ? 'person-outline'
                : 'person-circle-outline'
            }
            size={17}
            color={COLORS.muted}
          />

          <Text style={styles.reporterText}>
            {incident.anonymous
              ? 'Reported anonymously'
              : 'Community report'}
          </Text>
        </View>

        <View style={styles.viewRow}>
          <Text style={styles.viewText}>
            View
          </Text>

          <Ionicons
            name="chevron-forward"
            size={17}
            color={COLORS.primary}
          />
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="shield-checkmark-outline"
          size={42}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        No recent incidents
      </Text>

      <Text style={styles.emptyDescription}>
        There are currently no recent safety incidents to display.
      </Text>
    </View>
  );
}

export default function RecentIncidentsScreen() {
  const [selectedIncident, setSelectedIncident] =
    useState<Incident | null>(null);

  /*
   * SAFE-70 uses temporary local incident data.
   * SAFE-71 will connect this screen to Firestore.
   */
  const incidents = INCIDENTS;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color={COLORS.title}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              Recent Incidents
            </Text>

            <Text style={styles.headerSubtitle}>
              Community safety reports
            </Text>
          </View>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="people-outline"
              size={21}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.infoText}>
            Browse recently reported safety incidents shared by
            the SafeHer community.
          </Text>
        </View>

        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <IncidentCard
              incident={item}
              onPress={() =>
                setSelectedIncident(item)
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            incidents.length === 0 &&
              styles.emptyList,
          ]}
          ListEmptyComponent={<EmptyState />}
        />
      </View>

      <Modal
        visible={selectedIncident !== null}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSelectedIncident(null)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedIncident && (
              <ScrollView
                contentContainerStyle={
                  styles.modalContent
                }
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalHandle} />

                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleArea}>
                    <Text style={styles.modalSmallTitle}>
                      INCIDENT DETAILS
                    </Text>

                    <Text style={styles.modalTitle}>
                      {selectedIncident.type}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      setSelectedIncident(null)
                    }
                    style={styles.closeButton}
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color={COLORS.title}
                    />
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.largeIncidentIcon,
                    {
                      backgroundColor:
                        getIncidentBackground(
                          selectedIncident.type
                        ),
                    },
                  ]}
                >
                  <Ionicons
                    name={getIncidentIcon(
                      selectedIncident.type
                    )}
                    size={32}
                    color={getIncidentColor(
                      selectedIncident.type
                    )}
                  />
                </View>

                <Text style={styles.sectionLabel}>
                  Description
                </Text>

                <Text style={styles.modalDescription}>
                  {selectedIncident.description}
                </Text>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={19}
                      color={COLORS.primary}
                    />
                  </View>

                  <View>
                    <Text style={styles.detailLabel}>
                      REPORTED
                    </Text>

                    <Text style={styles.detailValue}>
                      {selectedIncident.dateTime}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name="person-outline"
                      size={19}
                      color={COLORS.primary}
                    />
                  </View>

                  <View>
                    <Text style={styles.detailLabel}>
                      REPORTER
                    </Text>

                    <Text style={styles.detailValue}>
                      {selectedIncident.anonymous
                        ? 'Anonymous'
                        : 'Community member'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name="information-circle-outline"
                      size={19}
                      color={COLORS.primary}
                    />
                  </View>

                  <View>
                    <Text style={styles.detailLabel}>
                      STATUS
                    </Text>

                    <Text style={styles.detailValue}>
                      {selectedIncident.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.privacyBox}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={COLORS.primary}
                  />

                  <Text style={styles.privacyText}>
                    Reporter information is kept private to help
                    protect community members.
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setSelectedIncident(null)
                  }
                  style={styles.doneButton}
                >
                  <Text style={styles.doneText}>
                    Done
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    backgroundColor: COLORS.surface,
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.title,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.muted,
  },

  headerSpace: {
    width: 42,
  },

  infoBox: {
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 4,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,
  },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 32,
  },

  emptyList: {
    flexGrow: 1,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },

  cardPressed: {
    opacity: 0.8,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  incidentHeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },

  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  headingText: {
    flex: 1,
  },

  incidentType: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.title,
  },

  dateText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  description: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
  },

  cardFooter: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  reporterRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  reporterText: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.muted,
  },

  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
  },

  emptyState: {
    flex: 1,
    minHeight: 350,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.title,
  },

  emptyDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: COLORS.muted,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },

  modalContainer: {
    maxHeight: '88%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  modalContent: {
    paddingHorizontal: 22,
    paddingBottom: 34,
  },

  modalHandle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D9C9D0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  modalTitleArea: {
    flex: 1,
  },

  modalSmallTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.1,
  },

  modalTitle: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.title,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7EFF2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  largeIncidentIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    marginTop: 20,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.title,
  },

  modalDescription: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.text,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },

  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
  },

  detailValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.title,
  },

  privacyBox: {
    marginTop: 5,
    borderRadius: 16,
    padding: 14,
    backgroundColor: COLORS.primarySoft,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  privacyText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.text,
  },

  doneButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  doneText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});

