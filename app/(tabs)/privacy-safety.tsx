import { Ionicons } from '@expo/vector-icons';

import {
  useState,
} from 'react';

import {
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

type InfoSection = {
  id: string;
  title: string;
  summary: string;
  icon: keyof typeof Ionicons.glyphMap;
  points: string[];
};

const SECTIONS: InfoSection[] = [
  {
    id: 'location',
    title: 'Location',
    summary: 'When and why SafeHer may use your location.',
    icon: 'location-outline',
    points: [
      'SafeHer requests foreground location only when a feature actually needs it.',
      'Location may be used when reporting an incident, finding a Safe Route, starting a Safe Journey or using SOS.',
      'SafeHer does not need continuous background location for the current academic prototype.',
      'Turning off location use in Privacy Settings prevents supported SafeHer features from requesting it through the app.',
    ],
  },
  {
    id: 'incident-reports',
    title: 'Incident Reports',
    summary: 'What information is saved with community reports.',
    icon: 'warning-outline',
    points: [
      'An incident report can contain the incident type, description, location, readable address, anonymous-reporting choice, status and submission time.',
      'GPS coordinates are retained because Safety Map and Safe Route calculations require geographic coordinates.',
      'Community incident reports may not have been independently verified, so users should treat them as safety information rather than guaranteed facts.',
    ],
  },
  {
    id: 'anonymous',
    title: 'Anonymous Reporting',
    summary: 'What anonymous means inside SafeHer.',
    icon: 'eye-off-outline',
    points: [
      'Anonymous reporting means your name and profile information are not shown publicly with the incident report.',
      'The application may still store an internal Firebase user identifier so the system can associate the report with the submitting account where required.',
      'The internal identifier should not be displayed to other SafeHer users.',
    ],
  },
  {
    id: 'trusted-contacts',
    title: 'Trusted Contacts',
    summary: 'How saved contacts are used in journeys and emergencies.',
    icon: 'people-outline',
    points: [
      'Trusted contacts are stored under your own SafeHer user account.',
      'They can be selected when configuring Safe Journey and are shown inside SOS assistance.',
      'SafeHer does not automatically call or message a trusted contact. Call and share controls open the phone’s normal applications or sharing interface.',
      'Removing a trusted contact means that contact will no longer be available for future SOS or Safe Journey selection.',
    ],
  },
  {
    id: 'journey',
    title: 'Safe Journey',
    summary: 'What is stored while monitoring a journey.',
    icon: 'navigate-outline',
    points: [
      'Safe Journey stores the destination, journey start location, expected arrival time, selected trusted-contact IDs, check-in interval and journey status.',
      'A journey can remain Active, or later become Completed or Cancelled.',
      'Completing or cancelling a journey keeps the same journey record so it can appear in Journey History.',
      'Sharing a current location uses the phone’s native share interface. SafeHer does not claim that another person received the message.',
    ],
  },
  {
    id: 'sos',
    title: 'SOS Assistance',
    summary: 'What the SOS prototype can and cannot do.',
    icon: 'alert-circle-outline',
    points: [
      'SOS is designed to provide quick access to emergency calling, trusted contacts and location sharing.',
      'Emergency-call buttons open the phone dialler. SafeHer does not silently place calls.',
      'Emergency sharing uses the device sharing interface.',
      'The academic prototype cannot verify that an emergency message was delivered, that authorities were dispatched or that help is on the way.',
    ],
  },
  {
    id: 'limitations',
    title: 'Safety Limitations',
    summary: 'SafeHer supports safety decisions but cannot guarantee safety.',
    icon: 'shield-outline',
    points: [
      'SafeHer cannot guarantee that any route, location or journey is completely safe.',
      'Safety scores depend partly on the incident information currently available to the application.',
      'A lack of reported incidents does not prove that an area has no safety risks.',
      'For immediate danger, users should contact the appropriate emergency services rather than relying only on SafeHer.',
    ],
  },
];

export default function PrivacySafetyScreen() {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    'location'
  );

  const toggle = (id: string) => {
    setExpandedSection(current => (current === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenBackButton label="Privacy Settings" />

        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="lock-closed"
              size={24}
              color={Brand.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Privacy & Safety</Text>
            <Text style={styles.subtitle}>
              Understand what SafeHer uses, why it is needed and what the
              prototype cannot guarantee.
            </Text>
          </View>
        </View>

        {/* ---------- Summary card ---------- */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={Brand.burgundy}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>
              Privacy in simple terms
            </Text>
            <Text style={styles.summaryText}>
              SafeHer uses only the information needed by its safety
              features. Tap any section below for more detail.
            </Text>
          </View>
        </View>

        {/* ---------- Sections ---------- */}
        {SECTIONS.map(section => {
          const expanded = expandedSection === section.id;

          return (
            <View
              key={section.id}
              style={[
                styles.sectionCard,
                expanded && styles.sectionCardExpanded,
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.sectionHeader,
                  pressed && styles.pressed,
                ]}
                onPress={() => toggle(section.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
              >
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name={section.icon}
                    size={21}
                    color={Brand.burgundy}
                  />
                </View>

                <View style={styles.sectionHeadingText}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionSummary}>
                    {section.summary}
                  </Text>
                </View>

                <View
                  style={[
                    styles.chevronCircle,
                    expanded && styles.chevronCircleExpanded,
                  ]}
                >
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={Brand.burgundy}
                  />
                </View>
              </Pressable>

              {expanded ? (
                <View style={styles.sectionBody}>
                  {section.points.map((point, index) => (
                    <View
                      key={`${section.id}-${index}`}
                      style={styles.pointRow}
                    >
                      <View style={styles.pointDot} />
                      <Text style={styles.pointText}>{point}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}

        {/* ---------- Emergency card ---------- */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyIconWrap}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color="#B42318"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>Immediate danger</Text>
            <Text style={styles.emergencyText}>
              SafeHer is not a replacement for emergency services. If you
              are in immediate danger, use an appropriate emergency
              service or the emergency calling options available through
              SOS Assistance.
            </Text>
          </View>
        </View>

        <Text style={styles.prototypeText}>
          SafeHer is an academic prototype developed for safety support
          and demonstration purposes.
        </Text>
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
    marginTop: 6,
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

  title: {
    color: Brand.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 4,
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  /* ---------- Summary ---------- */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Brand.roseSoft,
    borderRadius: 18,
    backgroundColor: Brand.blush,
  },

  summaryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  summaryTitle: {
    color: Brand.burgundyDeep,
    fontSize: 14,
    fontWeight: '900',
  },

  summaryText: {
    marginTop: 4,
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  /* ---------- Section card ---------- */
  sectionCard: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 18,
    backgroundColor: Brand.white,
    overflow: 'hidden',
    shadowColor: '#4E1026',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  sectionCardExpanded: {
    borderColor: Brand.roseSoft,
    shadowColor: Brand.burgundy,
    shadowOpacity: 0.08,
    elevation: 2,
  },

  sectionHeader: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 14,
  },

  sectionIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: Brand.blush,
    borderWidth: 1,
    borderColor: Brand.roseSoft,
  },

  sectionHeadingText: {
    flex: 1,
  },

  sectionTitle: {
    color: Brand.ink,
    fontSize: 14,
    fontWeight: '900',
  },

  sectionSummary: {
    marginTop: 4,
    color: Brand.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },

  chevronCircleExpanded: {
    backgroundColor: Brand.roseSoft,
  },

  sectionBody: {
    paddingHorizontal: 15,
    paddingTop: 4,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
  },

  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
  },

  pointDot: {
    width: 6,
    height: 6,
    marginTop: 7,
    borderRadius: 3,
    backgroundColor: Brand.burgundy,
  },

  pointText: {
    flex: 1,
    color: Brand.ink,
    fontSize: 12,
    lineHeight: 19,
  },

  /* ---------- Emergency ---------- */
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDA29B',
    borderRadius: 18,
    backgroundColor: '#FEF3F2',
  },

  emergencyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  emergencyTitle: {
    color: '#912018',
    fontSize: 14,
    fontWeight: '900',
  },

  emergencyText: {
    marginTop: 5,
    color: '#7A4A46',
    fontSize: 12,
    lineHeight: 18,
  },

  prototypeText: {
    marginTop: 20,
    color: Brand.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },

  pressed: {
    opacity: 0.75,
  },
});