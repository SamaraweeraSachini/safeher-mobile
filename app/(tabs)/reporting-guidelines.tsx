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

const GUIDELINES = [
  'Choose the incident category that most accurately describes the situation.',
  'Provide a clear location and time whenever it is safe to do so.',
  'Describe what happened using factual and respectful language.',
  'Do not include unnecessary private information about another person.',
  'Only attach media that is relevant and safe to share.',
  'Do not submit knowingly false, misleading or duplicate reports.',
];

export default function ReportingGuidelinesScreen() {
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
          accessibilityLabel="Return to Profile"
        >
          <Ionicons name="arrow-back" size={24} color="#5A3D4D" />
          <Text style={styles.backText}>Profile</Text>
        </Pressable>

        <View style={styles.iconContainer}>
          <Ionicons
            name="document-text-outline"
            size={42}
            color="#A92F61"
          />
        </View>

        <Text style={styles.title}>Reporting Guidelines</Text>

        <Text style={styles.introduction}>
          Responsible reporting helps SafeHer provide useful safety
          information while reducing harm and misinformation.
        </Text>

        {GUIDELINES.map((guideline, index) => (
          <View
            key={guideline}
            style={styles.guideline}
          >
            <View style={styles.numberContainer}>
              <Text style={styles.number}>{index + 1}</Text>
            </View>

            <Text style={styles.guidelineText}>{guideline}</Text>
          </View>
        ))}

        <View style={styles.emergencyNotice}>
          <Ionicons
            name="warning-outline"
            size={24}
            color="#B42318"
          />

          <Text style={styles.emergencyText}>
            If there is immediate danger, contact the appropriate local
            emergency service first.
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
    marginTop: 14,
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
    marginBottom: 17,
    color: '#755F6A',
    fontSize: 15,
    lineHeight: 23,
  },

  guideline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 13,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  numberContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#F9E4EE',
  },

  number: {
    color: '#A92F61',
    fontSize: 13,
    fontWeight: '800',
  },

  guidelineText: {
    flex: 1,
    color: '#5F4B55',
    fontSize: 13,
    lineHeight: 20,
  },

  emergencyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginTop: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDA29B',
    borderRadius: 18,
    backgroundColor: '#FEF3F2',
  },

  emergencyText: {
    flex: 1,
    color: '#B42318',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
});