import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/context/AuthContext';

type FeatureCard = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
};

const FEATURES: FeatureCard[] = [
  {
    id: 'safety-map',
    title: 'Safety Map',
    description: 'View nearby safety information',
    icon: 'map-outline',
    color: '#16697A',
    backgroundColor: '#E4F4F7',
  },
  {
    id: 'report-incident',
    title: 'Report Incident',
    description: 'Quickly report an unsafe situation',
    icon: 'warning-outline',
    color: '#C25450',
    backgroundColor: '#FCECEB',
  },
  {
    id: 'safe-route',
    title: 'Safe Route',
    description: 'Find a safer route to your destination',
    icon: 'navigate-outline',
    color: '#38785A',
    backgroundColor: '#E8F5ED',
  },
  {
    id: 'trusted-contacts',
    title: 'Trusted Contacts',
    description: 'Manage people you trust',
    icon: 'people-outline',
    color: '#7957A8',
    backgroundColor: '#F1EAF9',
  },
  {
    id: 'safe-journey',
    title: 'Safe Journey',
    description: 'Share and monitor your journey',
    icon: 'walk-outline',
    color: '#B36A22',
    backgroundColor: '#FFF1DF',
  },
  {
    id: 'sos',
    title: 'SOS',
    description: 'Get emergency help immediately',
    icon: 'alert-circle-outline',
    color: '#FFFFFF',
    backgroundColor: '#C83B4D',
  },
];

export default function HomeScreen() {
  const { user, isGuest } = useAuth();

  const displayName = useMemo(() => {
    if (isGuest) {
      return 'Guest';
    }

    if (user?.displayName) {
      return user.displayName;
    }

    if (user?.email) {
      return user.email.split('@')[0];
    }

    return 'SafeHer User';
  }, [isGuest, user]);

  const handleFeaturePress = (feature: FeatureCard) => {
    Alert.alert(
      feature.title,
      `${feature.title} will be available from this Home screen.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <View style={styles.logoContainer}>
              <Ionicons
                name="shield-checkmark"
                size={24}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.brandName}>SafeHer</Text>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={() =>
              Alert.alert(
                'Notifications',
                'You have no new notifications.'
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color="#5A3D4D"
            />
          </Pressable>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Hello, {displayName} 👋</Text>

          <Text style={styles.welcomeText}>
            Where would you like to go safely today?
          </Text>
        </View>

        <View style={styles.safetyMessage}>
          <View style={styles.safetyIconContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={26}
              color="#A92F61"
            />
          </View>

          <View style={styles.safetyTextContainer}>
            <Text style={styles.safetyTitle}>Your safety matters</Text>

            <Text style={styles.safetyDescription}>
              Stay aware, trust your instincts and keep your trusted
              contacts informed.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Safety Features</Text>

          <Text style={styles.sectionSubtitle}>
            Choose a service to continue
          </Text>
        </View>

        <View style={styles.featureGrid}>
          {FEATURES.map((feature) => {
            const isSos = feature.id === 'sos';

            return (
              <Pressable
                key={feature.id}
                style={({ pressed }) => [
                  styles.featureCard,
                  {
                    backgroundColor: feature.backgroundColor,
                    opacity: pressed ? 0.75 : 1,
                  },
                  isSos && styles.sosCard,
                ]}
                onPress={() => handleFeaturePress(feature)}
                accessibilityRole="button"
                accessibilityLabel={feature.title}
                accessibilityHint={feature.description}
              >
                <View
                  style={[
                    styles.featureIconContainer,
                    {
                      backgroundColor: isSos
                        ? 'rgba(255, 255, 255, 0.18)'
                        : '#FFFFFF',
                    },
                  ]}
                >
                  <Ionicons
                    name={feature.icon}
                    size={29}
                    color={feature.color}
                  />
                </View>

                <Text
                  style={[
                    styles.featureTitle,
                    isSos && styles.sosText,
                  ]}
                >
                  {feature.title}
                </Text>

                <Text
                  style={[
                    styles.featureDescription,
                    isSos && styles.sosDescription,
                  ]}
                >
                  {feature.description}
                </Text>

                <View style={styles.arrowContainer}>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={isSos ? '#FFFFFF' : feature.color}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tipContainer}>
          <Ionicons
            name="bulb-outline"
            size={22}
            color="#A96C20"
          />

          <Text style={styles.tipText}>
            Safety tip: Share your live location with someone you trust
            before beginning a journey.
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

  container: {
    flex: 1,
    backgroundColor: '#FFF8FB',
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  logoContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C43D74',
  },

  brandName: {
    color: '#452B39',
    fontSize: 22,
    fontWeight: '800',
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1DDE6',
  },

  welcomeSection: {
    marginTop: 12,
    marginBottom: 20,
  },

  greeting: {
    color: '#392631',
    fontSize: 26,
    fontWeight: '800',
  },

  welcomeText: {
    marginTop: 6,
    color: '#755F6A',
    fontSize: 15,
    lineHeight: 22,
  },

  safetyMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#F9E4EE',
    borderWidth: 1,
    borderColor: '#F1C8DA',
  },

  safetyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  safetyTextContainer: {
    flex: 1,
    marginLeft: 13,
  },

  safetyTitle: {
    color: '#742443',
    fontSize: 16,
    fontWeight: '800',
  },

  safetyDescription: {
    marginTop: 4,
    color: '#75515F',
    fontSize: 13,
    lineHeight: 19,
  },

  sectionHeader: {
    marginTop: 26,
    marginBottom: 14,
  },

  sectionTitle: {
    color: '#392631',
    fontSize: 20,
    fontWeight: '800',
  },

  sectionSubtitle: {
    marginTop: 3,
    color: '#876F7A',
    fontSize: 13,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },

  featureCard: {
    width: '48%',
    minHeight: 190,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(83, 55, 68, 0.08)',
  },

  sosCard: {
    borderColor: '#C83B4D',
  },

  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  featureTitle: {
    marginTop: 14,
    color: '#392631',
    fontSize: 16,
    fontWeight: '800',
  },

  featureDescription: {
    marginTop: 6,
    color: '#695660',
    fontSize: 12,
    lineHeight: 17,
  },

  sosText: {
    color: '#FFFFFF',
  },

  sosDescription: {
    color: '#FFE7EA',
  },

  arrowContainer: {
    position: 'absolute',
    right: 14,
    bottom: 13,
  },

  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 22,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#FFF3DE',
    borderWidth: 1,
    borderColor: '#F5DCAE',
  },

  tipText: {
    flex: 1,
    color: '#74552C',
    fontSize: 13,
    lineHeight: 19,
  },
});