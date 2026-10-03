import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERGENCY_CONTACTS = [
  {
    number: '119',
    title: 'Police',
    description: 'Police emergency service. Call if you are in danger or a crime is happening.',
  },
  {
    number: '1990',
    title: 'Ambulance',
    description: 'Emergency ambulance service. Call for urgent medical help.',
  },
  {
    number: '110',
    title: 'Fire and rescue',
    description: 'Emergency and rescue services, including fire.',
  },
  {
    number: '109',
    title: 'Children and women',
    description: 'Police line for reporting abuse of children and women.',
  },
  {
    number: '1938',
    title: 'Women’s Help Line',
    description: 'National Women’s Help Line for support and guidance.',
  },
] as const;

const EMERGENCY_STEPS = [
  'If you are in immediate danger, call 119. If someone needs urgent medical help, call 1990.',
  'Move to a busy, well-lit place if you can do that safely.',
  'Tell a trusted person where you are.',
  'Use SafeHer SOS when you cannot safely make a call yourself.',
  'Leave if you can. Do not stay to confront someone.',
];

function ResourceCard({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color="#C43D74" />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardText}>{children}</Text>
      </View>
    </View>
  );
}

export default function SafetyResourcesScreen() {
  const [callingNumber, setCallingNumber] = useState<string | null>(null);

  const callNumber = async (number: string) => {
    if (callingNumber) {
      return;
    }

    setCallingNumber(number);

    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      Alert.alert(
        'Call unavailable',
        `Dial ${number} from your phone.`
      );
    } finally {
      setCallingNumber(null);
    }
  };

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

        <Text style={styles.title}>Safety resources</Text>
        <Text style={styles.introduction}>
          Official emergency numbers and short guidance for unsafe situations.
          If you are in immediate danger, call 119 before using SafeHer.
        </Text>

        <Text style={styles.sectionTitle}>Emergency contact numbers</Text>
        {EMERGENCY_CONTACTS.map((contact) => (
          <Pressable
            key={contact.number}
            style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
            onPress={() => {
              void callNumber(contact.number);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Call ${contact.title} on ${contact.number}`}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="call-outline" size={22} color="#7A1F3D" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{contact.title}</Text>
              <Text style={styles.number}>{contact.number}</Text>
              <Text style={styles.cardText}>{contact.description}</Text>
            </View>
          </Pressable>
        ))}
        <Text style={styles.source}>
          Numbers published by the Telecommunications Regulatory Commission of Sri Lanka and Sri Lanka Police.
        </Text>

        <Text style={styles.sectionTitle}>During an emergency</Text>
        <View style={styles.stepsCard}>
          {EMERGENCY_STEPS.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Harassment reporting</Text>
        <ResourceCard icon="megaphone-outline" title="Get help and report it">
          If you are in danger now, call 119 or 109. You can also call 1938, the Women’s Help Line. A police complaint is separate from a SafeHer incident report. In SafeHer, describe what happened without names, phone numbers, or other private details.
        </ResourceCard>

        <Text style={styles.sectionTitle}>Public transport</Text>
        <ResourceCard icon="bus-outline" title="Travel with a plan">
          Note the route and vehicle number before you board. Sit near other passengers when you can. If someone bothers you, move toward other people and leave at a busy stop if it is safe. Tell a trusted person which route you are taking.
        </ResourceCard>

        <Text style={styles.sectionTitle}>Location sharing</Text>
        <ResourceCard icon="location-outline" title="Share only with people you trust">
          Share your location with a trusted contact for a journey, then stop sharing when you arrive. You can turn location use off in Privacy Settings. Do not put your home address in an incident report. Describe a public place instead.
        </ResourceCard>

        <Text style={styles.sectionTitle}>What SafeHer cannot do</Text>
        <ResourceCard icon="information-circle-outline" title="SafeHer is not an emergency service">
          SafeHer does not replace the police, an ambulance, or the fire service. The Safety Map shows community reports, which can be incomplete or out of date. Flagging a report does not remove it and is not a police complaint. SOS and journeys need your phone, a connection, and location permission.
        </ResourceCard>

        <Pressable
          style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.returnButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 18,
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
  contactCard: {
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
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  stepsCard: {
    marginBottom: 16,
    padding: 16,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCE8EE',
  },
  cardBody: { flex: 1 },
  cardTitle: { color: '#392631', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  number: { marginTop: 2, color: '#C43D74', fontSize: 20, fontWeight: '800' },
  cardText: { marginTop: 4, color: '#755F6A', fontSize: 14, lineHeight: 21 },
  source: {
    marginTop: -4,
    marginBottom: 16,
    color: '#9A8790',
    fontSize: 12,
    lineHeight: 18,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    color: '#C43D74',
    fontSize: 15,
    fontWeight: '800',
  },
  stepText: { flex: 1, color: '#392631', fontSize: 14, lineHeight: 21 },
  returnButton: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#C43D74',
  },
  returnButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.75 },
});
