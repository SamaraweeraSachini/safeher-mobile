import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabPlaceholderProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackgroundColor: string;
  availability?: string;
  showBackButton?: boolean;
};

export default function TabPlaceholder({
  title,
  description,
  icon,
  iconColor,
  iconBackgroundColor,
  availability,
  showBackButton = false,
}: TabPlaceholderProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {showBackButton && (
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#5A3D4D"
          />

          <Text style={styles.backText}>Back</Text>
        </Pressable>
      )}

      <View style={styles.container}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: iconBackgroundColor,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={46}
            color={iconColor}
          />
        </View>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.description}>{description}</Text>

        <View style={styles.messageContainer}>
          <Ionicons
            name="construct-outline"
            size={20}
            color="#A92F61"
          />

          <View style={styles.messageTextContainer}>
            <Text style={styles.message}>
              This SafeHer feature is being prepared.
            </Text>

            {availability && (
              <Text style={styles.availability}>
                {availability}
              </Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8FB',
  },

  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
    marginLeft: 18,
    marginTop: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  backText: {
    color: '#5A3D4D',
    fontSize: 15,
    fontWeight: '700',
  },

  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 70,
  },

  iconContainer: {
    width: 92,
    height: 92,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    marginTop: 24,
    color: '#392631',
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center',
  },

  description: {
    maxWidth: 320,
    marginTop: 10,
    color: '#755F6A',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },

  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    maxWidth: 340,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F9E4EE',
    borderWidth: 1,
    borderColor: '#F1C8DA',
  },

  messageTextContainer: {
    flex: 1,
  },

  message: {
    color: '#742443',
    fontSize: 13,
    fontWeight: '700',
  },

  availability: {
    marginTop: 4,
    color: '#8A5368',
    fontSize: 12,
    lineHeight: 17,
  },
});