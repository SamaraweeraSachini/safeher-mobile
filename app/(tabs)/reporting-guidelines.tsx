import { Ionicons } from '@expo/vector-icons';
import { type Href, router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type GuidelineIcon =
  | 'checkmark-circle-outline'
  | 'shield-checkmark-outline'
  | 'eye-off-outline'
  | 'ban-outline'
  | 'person-outline'
  | 'warning-outline'
  | 'location-outline'
  | 'create-outline'
  | 'time-outline'
  | 'map-outline'
  | 'documents-outline'
  | 'list-outline';

function GuidelineItem({
  icon,
  title,
  description,
  important = false,
}: {
  icon: GuidelineIcon;
  title: string;
  description: string;
  important?: boolean;
}) {
  return (
    <View style={[styles.guidelineCard, important && styles.importantCard]}>
      <View style={[styles.guidelineIcon, important && styles.importantIcon]}>
        <Ionicons
          name={icon}
          size={22}
          color={important ? '#7A1F3D' : '#C43D74'}
        />
      </View>
      <View style={styles.guidelineContent}>
        <Text style={styles.guidelineTitle}>{title}</Text>
        <Text style={styles.guidelineDescription}>{description}</Text>
      </View>
    </View>
  );
}

export default function ReportingGuidelinesScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#5A3D4D" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Reporting guidelines</Text>
        <Text style={styles.introduction}>
          Report responsibly and protect privacy. SafeHer incident reports help
          the community understand safety concerns. Follow these guidelines
          before you submit a report.
        </Text>

        <Text style={styles.sectionTitle}>Report accurately</Text>
        <GuidelineItem
          icon="checkmark-circle-outline"
          title="Include only what you know is true"
          description="Report a safety concern you experienced or personally witnessed. If you are unsure of a detail, leave it out. Do not guess a name, a motive, or what someone intended."
        />
        <GuidelineItem
          icon="create-outline"
          title="Describe what happened"
          description="Say what you saw or experienced, where it was, and when it happened. A clear description is more useful than a long one."
        />
        <GuidelineItem
          icon="location-outline"
          title="Use a public place"
          description="Set the location to the road, stop, or public area where the concern happened. Do not use a report to publish someone's home address."
        />

        <Text style={styles.sectionTitle}>Choose the correct category</Text>
        <Text style={styles.sectionBody}>
          Pick the closest incident type. The Safety Map and route warnings use this type, so the wrong category gives other people the wrong information.
        </Text>
        <GuidelineItem
          icon="list-outline"
          title="Match the type to what happened"
          description="Harassment is unwanted or threatening behaviour. Stalking is repeated following or monitoring. Poor lighting is a dark or badly lit place. Unsafe transport is a journey or vehicle that felt unsafe. Assault is physical violence or an attempt. Suspicious activity is other behaviour that may put people at risk. Choose Other only when none of these fit."
        />

        <Text style={styles.sectionTitle}>Protect a victim's identity</Text>
        <GuidelineItem
          icon="eye-off-outline"
          title="Do not identify the person affected"
          description="Do not include a victim's name, photo, phone number, age, school, workplace, home address, or other details that could identify them. Describe the safety concern, not who they are."
        />
        <GuidelineItem
          icon="shield-checkmark-outline"
          title="Leave private details out"
          description="Do not include full names, phone numbers, email addresses, or home addresses of a victim, a witness, or anyone else involved."
        />
        <GuidelineItem
          icon="person-outline"
          title="Your name is not shown"
          description="You can submit anonymously. Even if you do not, other people still do not see your name on the report. They can see the incident type, description, place, and time while the report is active."
        />

        <Text style={styles.sectionTitle}>False and offensive reports are not allowed</Text>
        <GuidelineItem
          icon="ban-outline"
          title="Do not submit a false report"
          description="Do not knowingly submit false, exaggerated, or misleading information. Reports are for genuine safety concerns."
          important
        />
        <GuidelineItem
          icon="ban-outline"
          title="Do not submit offensive content"
          description="Do not include abusive, threatening, discriminatory, sexually explicit, or otherwise offensive content."
          important
        />

        <Text style={styles.sectionTitle}>After you submit</Text>
        <GuidelineItem
          icon="documents-outline"
          title="Review your own reports"
          description="My Reports lists the incident reports you submitted, with the type, description, place, time, and current status."
        />
        <GuidelineItem
          icon="map-outline"
          title="Withdraw a report you submitted"
          description="If a report should not stay on the map, open it from My Reports and withdraw it. The report is marked Removed and disappears from the Safety Map for everyone. My Reports still shows it as Removed."
        />
        <GuidelineItem
          icon="time-outline"
          title="A report can change status"
          description="A new report starts as Active. It may later be shown as Under Review, Resolved, or Removed. Active reports can be seen on the Safety Map without your name."
        />

        <Text style={styles.sectionTitle}>During an emergency</Text>
        <GuidelineItem
          icon="warning-outline"
          title="Call emergency services first"
          description="If you or someone else is in immediate danger, call 119 for the police. If someone needs urgent medical help, call 1990. SafeHer reporting is not a replacement for the police, an ambulance, or the fire service. You can also use SafeHer SOS when you cannot safely make a call."
          important
        />
        <Pressable
          onPress={() => router.push('/safety-resources' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Open safety resources"
          style={({ pressed }) => [styles.resourceLink, pressed && styles.pressed]}
        >
          <Text style={styles.resourceLinkText}>Open safety resources</Text>
        </Pressable>

        <View style={styles.privacyNotice}>
          <Ionicons name="lock-closed-outline" size={22} color="#7A1F3D" />
          <View style={styles.privacyNoticeContent}>
            <Text style={styles.privacyNoticeTitle}>Privacy reminder</Text>
            <Text style={styles.privacyNoticeText}>
              Share only the information needed to describe the safety concern.
              Avoid details that could unnecessarily identify or endanger another
              person.
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Before you submit</Text>
          <SummaryRow text="The description says only what you know is true." />
          <SummaryRow text="The incident type matches what happened." />
          <SummaryRow text="A victim's name and other identifying details are left out." />
          <SummaryRow text="The report is not false or offensive." />
          <SummaryRow text="You are not in immediate danger. If you are, call 119." />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}
        >
          <Text style={styles.returnButtonText}>Back</Text>
        </Pressable>

        <Text style={styles.footerText}>
          By submitting an incident report, you confirm that the information
          follows these reporting guidelines.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ text }: { text: string }) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name="checkmark-circle" size={18} color="#C43D74" />
      <Text style={styles.summaryText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8FB' },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  backButton: {
    minHeight: 54,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: { color: '#5A3D4D', fontSize: 15, fontWeight: '700' },
  title: {
    marginTop: 8,
    color: '#392631',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  introduction: {
    marginTop: 10,
    marginBottom: 22,
    color: '#755F6A',
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    color: '#392631',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionBody: {
    marginBottom: 12,
    color: '#755F6A',
    fontSize: 14,
    lineHeight: 21,
  },
  guidelineCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  importantCard: {
    borderColor: '#E8A6B9',
    backgroundColor: '#FCE8EE',
  },
  guidelineIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCE8EE',
  },
  importantIcon: { backgroundColor: '#FFFFFF' },
  guidelineContent: { flex: 1 },
  guidelineTitle: { color: '#392631', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  guidelineDescription: {
    marginTop: 4,
    color: '#755F6A',
    fontSize: 14,
    lineHeight: 21,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FCE8EE',
  },
  privacyNoticeContent: { flex: 1 },
  privacyNoticeTitle: { color: '#7A1F3D', fontSize: 15, fontWeight: '800' },
  privacyNoticeText: { marginTop: 4, color: '#5A3D4D', fontSize: 14, lineHeight: 21 },
  summaryCard: {
    marginBottom: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  summaryTitle: { marginBottom: 12, color: '#392631', fontSize: 16, fontWeight: '800' },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  summaryText: { flex: 1, color: '#392631', fontSize: 14, lineHeight: 20 },
  returnButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#C43D74',
  },
  returnButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  resourceLink: {
    alignSelf: 'flex-start',
    marginTop: -4,
    marginBottom: 16,
    paddingVertical: 8,
  },
  resourceLinkText: {
    color: '#C43D74',
    fontSize: 15,
    fontWeight: '800',
  },
  footerText: {
    marginTop: 14,
    color: '#755F6A',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  pressed: { opacity: 0.75 },
});
