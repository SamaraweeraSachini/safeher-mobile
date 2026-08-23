import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";

import {
  getIncidentCategory,
  getIncidentCategoryLabel,
} from "@/constants/incident-categories";

import { useRecentIncidents } from "@/src/hooks/useRecentIncidents";

import type {
  Incident,
  IncidentStatus,
} from "@/src/types/incident";

const COLORS = {
  background: "#FFF9FB",
  surface: "#FFFFFF",
  primary: "#C43D74",
  primarySoft: "#FBEAF1",

  title: "#32252B",
  text: "#5D4B53",
  muted: "#927E87",
  border: "#F1DDE6",

  active: "#A66518",
  activeBackground: "#FFF3D6",

  resolved: "#35735A",
  resolvedBackground: "#E5F4ED",

  removed: "#8B5555",
  removedBackground: "#F6E7E7",

  overlay: "rgba(30, 20, 25, 0.48)",
};

function formatIncidentDate(
  createdAt: Incident["createdAt"],
): string {
  if (!createdAt) {
    return "Date unavailable";
  }

  const incidentDate =
    createdAt.toDate();

  const now = new Date();

  const isToday =
    incidentDate.getDate() ===
      now.getDate() &&
    incidentDate.getMonth() ===
      now.getMonth() &&
    incidentDate.getFullYear() ===
      now.getFullYear();

  const yesterday = new Date(now);

  yesterday.setDate(
    now.getDate() - 1,
  );

  const isYesterday =
    incidentDate.getDate() ===
      yesterday.getDate() &&
    incidentDate.getMonth() ===
      yesterday.getMonth() &&
    incidentDate.getFullYear() ===
      yesterday.getFullYear();

  const time =
    incidentDate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );

  if (isToday) {
    return `Today • ${time}`;
  }

  if (isYesterday) {
    return `Yesterday • ${time}`;
  }

  const date =
    incidentDate.toLocaleDateString(
      [],
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    );

  return `${date} • ${time}`;
}

function getStatusDetails(
  status: IncidentStatus,
) {
  switch (status) {
    case "resolved":
      return {
        label: "Resolved",
        color: COLORS.resolved,
        backgroundColor:
          COLORS.resolvedBackground,
      };

    case "removed":
      return {
        label: "Removed",
        color: COLORS.removed,
        backgroundColor:
          COLORS.removedBackground,
      };

    case "active":
    default:
      return {
        label: "Active",
        color: COLORS.active,
        backgroundColor:
          COLORS.activeBackground,
      };
  }
}

function IncidentCard({
  incident,
  onPress,
}: {
  incident: Incident;
  onPress: () => void;
}) {
  const category =
    getIncidentCategory(
      incident.type,
    );

  const status =
    getStatusDetails(
      incident.status,
    );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${getIncidentCategoryLabel(
        incident.type,
      )} incident details`}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={
            styles.incidentHeading
          }
        >
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor:
                  category?.backgroundColor ??
                  COLORS.primarySoft,
              },
            ]}
          >
            <Ionicons
              name={
                category?.icon ??
                "alert-circle-outline"
              }
              size={22}
              color={
                category?.color ??
                COLORS.primary
              }
            />
          </View>

          <View
            style={
              styles.headingText
            }
          >
            <Text
              style={
                styles.incidentType
              }
            >
              {getIncidentCategoryLabel(
                incident.type,
              )}
            </Text>

            <Text
              style={styles.dateText}
            >
              {formatIncidentDate(
                incident.createdAt,
              )}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                status.backgroundColor,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  status.color,
              },
            ]}
          >
            {status.label}
          </Text>
        </View>
      </View>

      <Text
        style={styles.description}
        numberOfLines={3}
      >
        {incident.description ||
          "No description provided."}
      </Text>

      <View
        style={styles.cardFooter}
      >
        <View
          style={styles.reporterRow}
        >
          <Ionicons
            name={
              incident.anonymous
                ? "person-outline"
                : "person-circle-outline"
            }
            size={17}
            color={COLORS.muted}
          />

          <Text
            style={
              styles.reporterText
            }
          >
            {incident.anonymous
              ? "Reported anonymously"
              : "Community report"}
          </Text>
        </View>

        <View style={styles.viewRow}>
          <Text
            style={styles.viewText}
          >
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
    <View
      style={styles.stateContainer}
    >
      <View
        style={styles.stateIcon}
      >
        <Ionicons
          name="shield-checkmark-outline"
          size={42}
          color={COLORS.primary}
        />
      </View>

      <Text
        style={styles.stateTitle}
      >
        No recent incidents
      </Text>

      <Text
        style={
          styles.stateDescription
        }
      >
        There are currently no
        community safety incidents
        to display.
      </Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View
      style={styles.stateContainer}
    >
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
      />

      <Text
        style={[
          styles.stateTitle,
          styles.loadingTitle,
        ]}
      >
        Loading incidents
      </Text>

      <Text
        style={
          styles.stateDescription
        }
      >
        Retrieving the latest
        community safety reports.
      </Text>
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View
      style={styles.stateContainer}
    >
      <View
        style={styles.errorIcon}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={40}
          color={COLORS.primary}
        />
      </View>

      <Text
        style={styles.stateTitle}
      >
        Unable to load incidents
      </Text>

      <Text
        style={
          styles.stateDescription
        }
      >
        {message}
      </Text>

      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry loading incidents"
        style={({ pressed }) => [
          styles.retryButton,
          pressed &&
            styles.retryButtonPressed,
        ]}
      >
        <Ionicons
          name="refresh-outline"
          size={18}
          color="#FFFFFF"
        />

        <Text
          style={styles.retryText}
        >
          Try Again
        </Text>
      </Pressable>
    </View>
  );
}

export default function RecentIncidentsScreen() {
  const [
    selectedIncident,
    setSelectedIncident,
  ] = useState<Incident | null>(
    null,
  );

  const {
    incidents,
    isLoading,
    error,
    retry,
  } = useRecentIncidents();

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          COLORS.background
        }
      />

      <View
        style={styles.container}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.back()
            }
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color={COLORS.title}
            />
          </Pressable>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.headerTitle
              }
            >
              Recent Incidents
            </Text>

            <Text
              style={
                styles.headerSubtitle
              }
            >
              Community safety
              reports
            </Text>
          </View>

          <View
            style={styles.headerSpace}
          />
        </View>

        <View style={styles.infoBox}>
          <View
            style={styles.infoIcon}
          >
            <Ionicons
              name="people-outline"
              size={21}
              color={COLORS.primary}
            />
          </View>

          <Text
            style={styles.infoText}
          >
            Browse recently reported
            safety incidents shared by
            the SafeHer community.
          </Text>
        </View>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={retry}
          />
        ) : (
          <FlatList
            data={incidents}
            keyExtractor={(item) =>
              item.id
            }
            renderItem={({ item }) => (
              <IncidentCard
                incident={item}
                onPress={() =>
                  setSelectedIncident(
                    item,
                  )
                }
              />
            )}
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={[
              styles.listContent,
              incidents.length === 0 &&
                styles.emptyList,
            ]}
            ListEmptyComponent={
              <EmptyState />
            }
          />
        )}
      </View>

      <Modal
        visible={
          selectedIncident !== null
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSelectedIncident(null)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={
              styles.modalContainer
            }
          >
            {selectedIncident ? (
              <ScrollView
                contentContainerStyle={
                  styles.modalContent
                }
                showsVerticalScrollIndicator={
                  false
                }
              >
                <View
                  style={
                    styles.modalHandle
                  }
                />

                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <View
                    style={
                      styles.modalTitleArea
                    }
                  >
                    <Text
                      style={
                        styles.modalSmallTitle
                      }
                    >
                      INCIDENT DETAILS
                    </Text>

                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      {getIncidentCategoryLabel(
                        selectedIncident.type,
                      )}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      setSelectedIncident(
                        null,
                      )
                    }
                    style={
                      styles.closeButton
                    }
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color={
                        COLORS.title
                      }
                    />
                  </Pressable>
                </View>

                {(() => {
                  const category =
                    getIncidentCategory(
                      selectedIncident.type,
                    );

                  return (
                    <View
                      style={[
                        styles.largeIncidentIcon,
                        {
                          backgroundColor:
                            category?.backgroundColor ??
                            COLORS.primarySoft,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          category?.icon ??
                          "alert-circle-outline"
                        }
                        size={32}
                        color={
                          category?.color ??
                          COLORS.primary
                        }
                      />
                    </View>
                  );
                })()}

                <Text
                  style={
                    styles.sectionLabel
                  }
                >
                  Description
                </Text>

                <Text
                  style={
                    styles.modalDescription
                  }
                >
                  {selectedIncident.description ||
                    "No description provided."}
                </Text>

                <View
                  style={styles.divider}
                />

                <View
                  style={styles.detailRow}
                >
                  <View
                    style={
                      styles.detailIcon
                    }
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={19}
                      color={
                        COLORS.primary
                      }
                    />
                  </View>

                  <View>
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      REPORTED
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {formatIncidentDate(
                        selectedIncident.createdAt,
                      )}
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.detailRow}
                >
                  <View
                    style={
                      styles.detailIcon
                    }
                  >
                    <Ionicons
                      name="person-outline"
                      size={19}
                      color={
                        COLORS.primary
                      }
                    />
                  </View>

                  <View>
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      REPORTER
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {selectedIncident.anonymous
                        ? "Anonymous"
                        : "Community member"}
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.detailRow}
                >
                  <View
                    style={
                      styles.detailIcon
                    }
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={19}
                      color={
                        COLORS.primary
                      }
                    />
                  </View>

                  <View>
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      STATUS
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {
                        getStatusDetails(
                          selectedIncident.status,
                        ).label
                      }
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.detailRow}
                >
                  <View
                    style={
                      styles.detailIcon
                    }
                  >
                    <Ionicons
                      name="location-outline"
                      size={19}
                      color={
                        COLORS.primary
                      }
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      LOCATION
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {selectedIncident.coordinates.latitude.toFixed(
                        6,
                      )}
                      {", "}
                      {selectedIncident.coordinates.longitude.toFixed(
                        6,
                      )}
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.privacyBox}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={
                      COLORS.primary
                    }
                  />

                  <Text
                    style={
                      styles.privacyText
                    }
                  >
                    Reporter information
                    is kept private to help
                    protect community
                    members.
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setSelectedIncident(
                      null,
                    )
                  }
                  style={({ pressed }) => [
                    styles.doneButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.doneText
                    }
                  >
                    Done
                  </Text>
                </Pressable>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  header: {
    backgroundColor:
      COLORS.surface,

    minHeight: 72,

    paddingHorizontal: 18,
    paddingVertical: 12,

    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,

    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor:
      COLORS.primarySoft,

    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
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

  buttonPressed: {
    opacity: 0.7,
  },

  infoBox: {
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 4,

    padding: 14,

    borderRadius: 16,

    backgroundColor:
      COLORS.primarySoft,

    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor:
      COLORS.surface,

    alignItems: "center",
    justifyContent: "center",

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
    backgroundColor:
      COLORS.surface,

    borderWidth: 1,
    borderColor:
      COLORS.border,

    borderRadius: 18,

    padding: 16,
    marginBottom: 14,

    elevation: 2,
  },

  cardPressed: {
    opacity: 0.8,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
  },

  incidentHeading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },

  iconBox: {
    width: 45,
    height: 45,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,
  },

  headingText: {
    flex: 1,
  },

  incidentType: {
    fontSize: 16,
    fontWeight: "800",
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
    fontWeight: "800",
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
    borderTopColor:
      COLORS.border,

    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  reporterRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  reporterText: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.muted,
  },

  viewRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  viewText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
    marginRight: 2,
  },

  stateContainer: {
    flex: 1,

    minHeight: 350,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 32,
  },

  stateIcon: {
    width: 82,
    height: 82,

    borderRadius: 41,

    backgroundColor:
      COLORS.primarySoft,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 18,
  },

  errorIcon: {
    width: 82,
    height: 82,

    borderRadius: 41,

    backgroundColor:
      COLORS.primarySoft,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 18,
  },

  stateTitle: {
    fontSize: 20,
    fontWeight: "800",

    color: COLORS.title,

    textAlign: "center",
  },

  loadingTitle: {
    marginTop: 18,
  },

  stateDescription: {
    marginTop: 8,

    fontSize: 14,
    lineHeight: 21,

    textAlign: "center",

    color: COLORS.muted,
  },

  retryButton: {
    marginTop: 20,

    minHeight: 46,

    paddingHorizontal: 20,

    borderRadius: 14,

    backgroundColor:
      COLORS.primary,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  retryButtonPressed: {
    opacity: 0.75,
  },

  retryText: {
    marginLeft: 7,

    fontSize: 14,
    fontWeight: "700",

    color: "#FFFFFF",
  },

  modalOverlay: {
    flex: 1,

    backgroundColor:
      COLORS.overlay,

    justifyContent: "flex-end",
  },

  modalContainer: {
    maxHeight: "88%",

    backgroundColor:
      COLORS.surface,

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

    backgroundColor: "#D9C9D0",

    alignSelf: "center",

    marginTop: 10,
    marginBottom: 14,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
  },

  modalTitleArea: {
    flex: 1,
  },

  modalSmallTitle: {
    fontSize: 11,
    fontWeight: "800",

    color: COLORS.primary,

    letterSpacing: 1.1,
  },

  modalTitle: {
    marginTop: 4,

    fontSize: 24,
    fontWeight: "900",

    color: COLORS.title,
  },

  closeButton: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: "#F7EFF2",

    alignItems: "center",
    justifyContent: "center",
  },

  largeIncidentIcon: {
    width: 62,
    height: 62,

    borderRadius: 20,

    marginTop: 22,

    alignItems: "center",
    justifyContent: "center",
  },

  sectionLabel: {
    marginTop: 20,

    fontSize: 13,
    fontWeight: "800",

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

    backgroundColor:
      COLORS.border,

    marginVertical: 20,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 17,
  },

  detailIcon: {
    width: 40,
    height: 40,

    borderRadius: 13,

    backgroundColor:
      COLORS.primarySoft,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 12,
  },

  detailLabel: {
    fontSize: 11,
    fontWeight: "700",

    color: COLORS.muted,
  },

  detailValue: {
    marginTop: 2,

    fontSize: 14,
    fontWeight: "600",

    color: COLORS.title,
  },

  privacyBox: {
    marginTop: 5,

    borderRadius: 16,

    padding: 14,

    backgroundColor:
      COLORS.primarySoft,

    flexDirection: "row",
    alignItems: "flex-start",
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

    backgroundColor:
      COLORS.primary,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 22,
  },

  doneText: {
    color: "#FFFFFF",

    fontWeight: "800",
    fontSize: 15,
  },
});

