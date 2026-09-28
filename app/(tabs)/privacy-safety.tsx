import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SECTIONS = [
  {
    title: 'Why SafeHer requests location',
    text: 'SafeHer asks for your location so it can show where you are on the map, attach a place to an incident report, and follow a route or journey. Location is used only while you are using the app, and only if Use location is turned on in Privacy Settings.',
  },
  {
    title: 'When location is used',
    text: 'Your location is used when you open the safety map, choose your current place for a report, start or follow a route, or start a journey. If you turn Use location off, SafeHer stops asking for your location and does not use it for those actions.',
  },
  {
    title: 'What an incident report contains',
    text: 'A report stores the incident type, your description, the location you selected, the time it was submitted, and whether you chose to report anonymously. Other people can see the incident details and place. They do not see your name or email on the report.',
  },
  {
    title: 'Anonymous reporting and your account id',
    text: 'If you report anonymously, the public report is shown as anonymous. If you turn anonymous reporting off, it is still shown only as a community report, not with your name. Either way, SafeHer keeps an internal account id, called a Firebase UID, with the report. That id is not shown to other people. It lets the app know which signed-in account created the report.',
  },
  {
    title: 'How trusted contacts are used',
    text: 'Trusted contacts are people you choose. When journey sharing is on, a journey can include those contacts so they are the people the journey is shared with. Their names are stored with your journey, not on public incident reports. If you turn Journey sharing off, those names are hidden in the app.',
  },
  {
    title: 'Safety is not guaranteed',
    text: 'SafeHer does not guarantee absolute safety. Route scores, warnings, and reports come from community information and may not show every current risk. Stay aware of your surroundings.',
  },
  {
    title: 'Emergency services',
    text: 'SafeHer is not a replacement for emergency services. If you need immediate help, contact your local emergency service.',
  },
] as const;

export default function PrivacyInformationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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

        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed-outline" size={42} color="#A92F61" />
        </View>

        <Text style={styles.title}>Privacy information</Text>
        <Text style={styles.introduction}>
          This explains how SafeHer uses your location, incident reports, and
          trusted contacts.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionText}>{section.text}</Text>
          </View>
        ))}
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
  },
  backButton: {
    minHeight: 54,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: '#5A3D4D',
    fontSize: 15,
    fontWeight: '700',
  },
  iconContainer: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 25,
    backgroundColor: '#F9E4EE',
  },
  title: {
    marginTop: 20,
    color: '#392631',
    fontSize: 27,
    fontWeight: '800',
  },
  introduction: {
    marginTop: 10,
    marginBottom: 8,
    color: '#755F6A',
    fontSize: 15,
    lineHeight: 23,
  },
  section: {
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    color: '#392631',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionText: {
    marginTop: 6,
    color: '#755F6A',
    fontSize: 14,
    lineHeight: 21,
  },
});
