import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const COLORS = {
  background: '#FFF9FB',
  surface: '#FFFFFF',
  primary: '#C43D74',
  primarySoft: '#FBEAF1',
  title: '#32252B',
  text: '#5D4B53',
  muted: '#927E87',
  border: '#F1DDE6',
  warning: '#C25450',
  warningBackground: '#FCECEB',
};

export default function ReportScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Report Incident
          </Text>

          <Text style={styles.subtitle}>
            Help keep the SafeHer community informed and safer.
          </Text>
        </View>

        <View style={styles.reportCard}>
          <View style={styles.reportIcon}>
            <Ionicons
              name="warning-outline"
              size={32}
              color={COLORS.warning}
            />
          </View>

          <Text style={styles.cardTitle}>
            Report an unsafe situation
          </Text>

          <Text style={styles.cardDescription}>
            Report unsafe situations and help make the community safer.
          </Text>

          <View style={styles.plannedBadge}>
            <Ionicons
              name="construct-outline"
              size={15}
              color={COLORS.warning}
            />

            <Text style={styles.plannedText}>
              Reporting form coming soon
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() =>
            router.push('/recent-incidents' as any)
          }
          style={({ pressed }) => [
            styles.recentCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.recentIcon}>
            <Ionicons
              name="time-outline"
              size={26}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.recentContent}>
            <Text style={styles.recentTitle}>
              Recent Incidents
            </Text>

            <Text style={styles.recentDescription}>
              Browse recently reported safety incidents.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color={COLORS.primary}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.title,
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
  },

  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 22,
    alignItems: 'center',
    elevation: 2,
  },

  reportIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor:
      COLORS.warningBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.title,
    textAlign: 'center',
  },

  cardDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
    textAlign: 'center',
  },

  plannedBadge: {
    marginTop: 17,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor:
      COLORS.warningBackground,
    flexDirection: 'row',
    alignItems: 'center',
  },

  plannedText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
  },

  recentCard: {
    marginTop: 18,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },

  pressed: {
    opacity: 0.75,
  },

  recentIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  recentContent: {
    flex: 1,
    paddingRight: 8,
  },

  recentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.title,
  },

  recentDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },
});

