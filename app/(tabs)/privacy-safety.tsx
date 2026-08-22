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

export default function PrivacySafetyScreen() {
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
            name="lock-closed-outline"
            size={42}
            color="#A92F61"
          />
        </View>

        <Text style={styles.title}>Privacy and Safety</Text>

        <Text style={styles.introduction}>
          SafeHer is designed to help users access safety information
          while respecting personal privacy.
        </Text>

        <PolicyItem
          title="Protect your account"
          text="Keep your password private and do not allow another person to access your account."
        />

        <PolicyItem
          title="Share carefully"
          text="Only share journey or location information with people you know and trust."
        />

        <PolicyItem
          title="Respect personal information"
          text="Do not upload or share another person’s private details without a legitimate safety reason."
        />

        <PolicyItem
          title="Emergency situations"
          text="SafeHer does not replace emergency services. Contact the appropriate local emergency service when immediate help is required."
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function PolicyItem({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <View style={styles.policyItem}>
      <Ionicons
        name="checkmark-circle-outline"
        size={22}
        color="#38785A"
      />

      <View style={styles.policyText}>
        <Text style={styles.policyTitle}>{title}</Text>
        <Text style={styles.policyDescription}>{text}</Text>
      </View>
    </View>
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
    marginBottom: 20,
    color: '#755F6A',
    fontSize: 15,
    lineHeight: 23,
  },

  policyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 13,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  policyText: {
    flex: 1,
  },

  policyTitle: {
    color: '#392631',
    fontSize: 15,
    fontWeight: '800',
  },

  policyDescription: {
    marginTop: 5,
    color: '#755F6A',
    fontSize: 13,
    lineHeight: 20,
  },
});