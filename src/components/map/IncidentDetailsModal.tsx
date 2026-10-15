import { Ionicons } from '@expo/vector-icons';

import {
  useRef,
} from 'react';

import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getIncidentCategory,
  getIncidentCategoryLabel,
} from '@/constants/incident-categories';

import ReportInappropriateContent from '@/src/components/map/ReportInappropriateContent';

import type {
  Incident,
  IncidentStatus,
} from '@/src/types/incident';

type IncidentDetailsModalProps = {
  incident:
    Incident | null;

  visible:
    boolean;

  onClose:
    () => void;
};

function formatIncidentDate(
  incident:
    Incident
): string {
  if (
    !incident.createdAt
  ) {
    return 'Date and time unavailable';
  }

  try {
    return incident.createdAt
      .toDate()
      .toLocaleString(
        [],
        {
          dateStyle:
            'medium',

          timeStyle:
            'short',
        }
      );
  } catch {
    return 'Date and time unavailable';
  }
}

function getStatusDetails(
  status:
    IncidentStatus
) {
  switch (
    status
  ) {
    case 'under-review':
      return {
        label:
          'Under Review',

        icon:
          'time-outline' as const,

        color:
          '#2E6DA4',

        backgroundColor:
          '#E7F1FA',
      };

    case 'resolved':
      return {
        label:
          'Resolved',

        icon:
          'checkmark-circle-outline' as const,

        color:
          '#35735A',

        backgroundColor:
          '#E5F4ED',
      };

    case 'removed':
      return {
        label:
          'Removed',

        icon:
          'remove-circle-outline' as const,

        color:
          '#8B5555',

        backgroundColor:
          '#F6E7E7',
      };

    case 'active':
    default:
      return {
        label:
          'Active',

        icon:
          'warning-outline' as const,

        color:
          '#A66518',

        backgroundColor:
          '#FFF3D6',
      };
  }
}

export default function IncidentDetailsModal({
  incident,
  visible,
  onClose,
}: IncidentDetailsModalProps) {
  const scrollRef =
    useRef<ScrollView>(
      null
    );

  if (
    !incident
  ) {
    return null;
  }

  const category =
    getIncidentCategory(
      incident.type
    );

  const categoryLabel =
    getIncidentCategoryLabel(
      incident.type
    );

  const categoryColor =
    category?.color ??
    '#C43D74';

  const categoryBackground =
    category?.backgroundColor ??
    '#FBEAF1';

  const categoryIcon =
    category?.icon ??
    'alert-circle-outline';

  const status =
    getStatusDetails(
      incident.status
    );

  const description =
    incident.description.trim() ||
    'No description was provided for this incident.';

  return (
    <Modal
      visible={
        visible
      }
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={
        onClose
      }
    >
      <View
        style={
          styles.overlay
        }
      >
        <Pressable
          style={
            styles.dismissArea
          }
          onPress={
            onClose
          }
          accessibilityRole="button"
          accessibilityLabel="Close incident details"
        />

        <KeyboardAvoidingView
          behavior="padding"
          style={
            styles.modalContainer
          }
        >
          <View
            style={
              styles.handle
            }
          />

          <ScrollView
            ref={
              scrollRef
            }
            contentContainerStyle={
              styles.content
            }
            automaticallyAdjustKeyboardInsets
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
          >
            {/* ---------- Header ---------- */}
            <View
              style={
                styles.header
              }
            >
              <View
                style={
                  styles.headerText
                }
              >
                <View
                  style={
                    styles.smallTitlePill
                  }
                >
                  <View
                    style={
                      styles.smallTitleDot
                    }
                  />

                  <Text
                    style={
                      styles.smallTitle
                    }
                  >
                    INCIDENT DETAILS
                  </Text>
                </View>

                <Text
                  style={
                    styles.title
                  }
                >
                  {
                    categoryLabel
                  }
                </Text>
              </View>

              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.closeIconButton,

                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={
                  onClose
                }
                accessibilityRole="button"
                accessibilityLabel="Close incident details"
              >
                <Ionicons
                  name="close"
                  size={
                    21
                  }
                  color="#32252B"
                />
              </Pressable>
            </View>

            {/* ---------- Category icon ---------- */}
            <View
              style={
                styles.heroRow
              }
            >
              <View
                style={[
                  styles.categoryIcon,

                  {
                    backgroundColor:
                      categoryBackground,
                  },
                ]}
              >
                <Ionicons
                  name={
                    categoryIcon
                  }
                  size={
                    32
                  }
                  color={
                    categoryColor
                  }
                />
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
                <Ionicons
                  name={
                    status.icon
                  }
                  size={
                    15
                  }
                  color={
                    status.color
                  }
                />

                <Text
                  style={[
                    styles.statusText,

                    {
                      color:
                        status.color,
                    },
                  ]}
                >
                  {status.label} report
                </Text>
              </View>
            </View>

            {/* ---------- Description ---------- */}
            <Text
              style={
                styles.sectionLabel
              }
            >
              Description
            </Text>

            <View
              style={
                styles.descriptionCard
              }
            >
              <Text
                style={
                  styles.description
                }
              >
                {
                  description
                }
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            {/* ---------- Details ---------- */}
            <DetailRow
              icon="calendar-outline"
              label="REPORTED"
              value={
                formatIncidentDate(
                  incident
                )
              }
            />

            <DetailRow
              icon={
                incident.anonymous
                  ? 'eye-off-outline'
                  : 'person-outline'
              }
              label="REPORTER"
              value={
                incident.anonymous
                  ? 'Anonymous report'
                  : 'Community member'
              }
            />

            <DetailRow
              icon="information-circle-outline"
              label="STATUS"
              value={
                status.label
              }
            />

            <DetailRow
              icon="location-outline"
              label="LOCATION"
              value={
                incident.address ??
                `${incident.coordinates.latitude.toFixed(
                  6
                )}, ${incident.coordinates.longitude.toFixed(
                  6
                )}`
              }
            />

            {/* ---------- Privacy ---------- */}
            <View
              style={
                styles.privacyBox
              }
            >
              <View
                style={
                  styles.privacyIconWrap
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={
                    20
                  }
                  color="#A92F61"
                />
              </View>

              <View
                style={
                  styles.privacyTextArea
                }
              >
                <Text
                  style={
                    styles.privacyTitle
                  }
                >
                  Privacy protected
                </Text>

                <Text
                  style={
                    styles.privacyText
                  }
                >
                  Private reporter information,
                  account identity and contact
                  details are never displayed.
                </Text>
              </View>
            </View>

            {/* ---------- Report inappropriate content ---------- */}
            <ReportInappropriateContent
              incidentId={
                incident.id
              }
              onExpand={() => {
                setTimeout(
                  () => {
                    scrollRef.current?.scrollToEnd({
                      animated:
                        true,
                    });
                  },
                  250
                );
              }}
            />

            {/* ---------- Close ---------- */}
            <Pressable
              style={({
                pressed,
              }) => [
                styles.closeButton,

                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={
                onClose
              }
              accessibilityRole="button"
              accessibilityLabel="Close incident details"
            >
              <Text
                style={
                  styles.closeButtonText
                }
              >
                Close
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

type DetailRowProps = {
  icon:
    keyof typeof Ionicons.glyphMap;

  label:
    string;

  value:
    string;
};

function DetailRow({
  icon,
  label,
  value,
}: DetailRowProps) {
  return (
    <View
      style={
        styles.detailRow
      }
    >
      <View
        style={
          styles.detailIcon
        }
      >
        <Ionicons
          name={
            icon
          }
          size={
            19
          }
          color="#A92F61"
        />
      </View>

      <View
        style={
          styles.detailText
        }
      >
        <Text
          style={
            styles.detailLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.detailValue
          }
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    overlay: {
      flex:
        1,

      justifyContent:
        'flex-end',

      backgroundColor:
        'rgba(30, 20, 25, 0.48)',
    },

    dismissArea: {
      flex:
        1,
    },

    modalContainer: {
      maxHeight:
        '88%',

      borderTopLeftRadius:
        28,

      borderTopRightRadius:
        28,

      backgroundColor:
        '#FFFFFF',
    },

    handle: {
      width:
        46,

      height:
        5,

      alignSelf:
        'center',

      marginTop:
        10,

      borderRadius:
        3,

      backgroundColor:
        '#D9C9D0',
    },

    content: {
      paddingHorizontal:
        22,

      paddingTop:
        14,

      paddingBottom:
        34,
    },

    header: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',
    },

    headerText: {
      flex:
        1,

      paddingRight:
        12,
    },

    smallTitlePill: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        6,

      alignSelf:
        'flex-start',

      paddingHorizontal:
        9,

      paddingVertical:
        4,

      borderRadius:
        9,

      backgroundColor:
        '#FBEAF1',
    },

    smallTitleDot: {
      width:
        6,

      height:
        6,

      borderRadius:
        3,

      backgroundColor:
        '#A92F61',
    },

    smallTitle: {
      color:
        '#A92F61',

      fontSize:
        10,

      fontWeight:
        '900',

      letterSpacing:
        1,
    },

    title: {
      marginTop:
        8,

      color:
        '#32252B',

      fontSize:
        24,

      fontWeight:
        '900',

      letterSpacing:
        -0.3,
    },

    closeIconButton: {
      width:
        42,

      height:
        42,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        21,

      backgroundColor:
        '#F7EFF2',
    },

    buttonPressed: {
      opacity:
        0.7,
    },

    heroRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        12,

      marginTop:
        22,
    },

    categoryIcon: {
      width:
        68,

      height:
        68,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        22,

      shadowColor:
        '#4E1026',

      shadowOffset: {
        width:
          0,

        height:
          3,
      },

      shadowOpacity:
        0.08,

      shadowRadius:
        8,

      elevation:
        2,
    },

    statusBadge: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        6,

      paddingHorizontal:
        11,

      paddingVertical:
        7,

      borderRadius:
        18,
    },

    statusText: {
      fontSize:
        12,

      fontWeight:
        '800',

      letterSpacing:
        0.1,
    },

    sectionLabel: {
      marginTop:
        22,

      color:
        '#32252B',

      fontSize:
        13.5,

      fontWeight:
        '900',

      letterSpacing:
        -0.1,
    },

    descriptionCard: {
      marginTop:
        8,

      padding:
        14,

      borderRadius:
        14,

      backgroundColor:
        '#FBF5F7',

      borderWidth:
        1,

      borderColor:
        '#F1DDE6',
    },

    description: {
      color:
        '#5D4B53',

      fontSize:
        14,

      lineHeight:
        22,
    },

    divider: {
      height:
        1,

      marginVertical:
        22,

      backgroundColor:
        '#F1DDE6',
    },

    detailRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom:
        17,
    },

    detailIcon: {
      width:
        42,

      height:
        42,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight:
        12,

      borderRadius:
        14,

      backgroundColor:
        '#FBEAF1',

      borderWidth:
        1,

      borderColor:
        '#F1C8DA',
    },

    detailText: {
      flex:
        1,
    },

    detailLabel: {
      color:
        '#927E87',

      fontSize:
        10,

      fontWeight:
        '900',

      letterSpacing:
        0.8,
    },

    detailValue: {
      marginTop:
        4,

      color:
        '#32252B',

      fontSize:
        14,

      fontWeight:
        '700',

      lineHeight:
        19,
    },

    privacyBox: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      gap:
        11,

      marginTop:
        5,

      padding:
        15,

      borderWidth:
        1,

      borderColor:
        '#F1C8DA',

      borderRadius:
        17,

      backgroundColor:
        '#FBEAF1',
    },

    privacyIconWrap: {
      width:
        38,

      height:
        38,

      borderRadius:
        12,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFFFFF',
    },

    privacyTextArea: {
      flex:
        1,
    },

    privacyTitle: {
      color:
        '#742443',

      fontSize:
        13,

      fontWeight:
        '900',
    },

    privacyText: {
      marginTop:
        4,

      color:
        '#75515F',

      fontSize:
        12,

      lineHeight:
        18,
    },

    closeButton: {
      height:
        54,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop:
        24,

      borderRadius:
        16,

      backgroundColor:
        '#C43D74',

      shadowColor:
        '#C43D74',

      shadowOffset: {
        width:
          0,

        height:
          5,
      },

      shadowOpacity:
        0.28,

      shadowRadius:
        10,

      elevation:
        4,
    },

    closeButtonText: {
      color:
        '#FFFFFF',

      fontSize:
        15,

      fontWeight:
        '800',

      letterSpacing:
        0.3,
    },
  });