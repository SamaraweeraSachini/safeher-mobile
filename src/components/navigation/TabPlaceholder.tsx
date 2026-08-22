import { Ionicons } from '@expo/vector-icons';
import {
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
};

export default function TabPlaceholder({
  title,
  description,
  icon,
  iconColor,
  iconBackgroundColor,
}: TabPlaceholderProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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

          <Text style={styles.message}>
            This SafeHer feature is being prepared.
          </Text>
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
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F9E4EE',
    borderWidth: 1,
    borderColor: '#F1C8DA',
  },

  message: {
    color: '#742443',
    fontSize: 13,
    fontWeight: '600',
  },
});