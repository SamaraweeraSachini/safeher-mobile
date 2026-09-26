import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RouteWarningsList from '@/src/components/route/RouteWarningsList';
import { usePreviewRouteWarnings } from '@/src/hooks/useRouteWarnings';

export default function RouteWarningsPreviewScreen() {
  const router = useRouter();
  const { warnings, isLoading, error, retry, incidentCount } =
    usePreviewRouteWarnings();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color="#5A3D4D" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>SAFE-95 preview</Text>
        <Text style={styles.subheading}>
          Demo route through real Firestore incidents. The selected-route
          screen in SAFE-96 will replace this preview.
        </Text>

        {!isLoading && !error && incidentCount === 0 && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Submit at least one incident report, then return here to see
              warning cards.
            </Text>
          </View>
        )}

        {(isLoading || error || incidentCount > 0) && (
          <RouteWarningsList
            warnings={warnings}
            isLoading={isLoading}
            error={error}
            onRetry={retry}
          />
        )}
      </ScrollView>
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

  content: {
    padding: 20,
  },

  heading: {
    color: '#32252B',
    fontSize: 20,
    fontWeight: '900',
  },

  subheading: {
    marginTop: 4,
    marginBottom: 18,
    color: '#5D4B53',
    fontSize: 13,
  },

  notice: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FBEAF1',
  },

  noticeText: {
    color: '#742443',
    fontSize: 13,
  },
});
