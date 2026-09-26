import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RouteDisclaimer from '@/src/components/route/RouteDisclaimer';
import RouteSummary from '@/src/components/route/RouteSummary';
import RouteWarningsList from '@/src/components/route/RouteWarningsList';
import { useReviewedRoute } from '@/src/hooks/useReviewedRoute';
import { useRouteWarnings } from '@/src/hooks/useRouteWarnings';
import { setSelectedRouteReview } from '@/src/state/selected-route';

export default function SelectedRouteReview() {
  const router = useRouter();
  const { review, isLoading, error, retry } = useReviewedRoute();
  const {
    warnings,
    isLoading: warningsLoading,
    error: warningsError,
    retry: retryWarnings,
  } = useRouteWarnings(review?.route ?? null);
  const reportedIncidentCount = warnings.reduce(
    (total, warning) => total + warning.recentReportCount,
    0
  );
  const summaryRoute = review
    ? {
        ...review.route,
        nearbyIncidentCount:
          warningsLoading && warnings.length === 0
            ? review.route.nearbyIncidentCount
            : reportedIncidentCount,
      }
    : null;

  const chooseAnotherRoute = () => {
    setSelectedRouteReview(null);

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/safe-route' as Href);
  };

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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Review your route</Text>
        <Text style={styles.subheading}>
          {review
            ? `Check this route to ${review.destinationLabel} before you start. Warnings come from recent reports near this route.`
            : 'Review the trip details and safety warnings before you start.'}
        </Text>

        {review && summaryRoute ? (
          <RouteSummary
            originLabel={review.originLabel}
            destinationLabel={review.destinationLabel}
            route={summaryRoute}
          />
        ) : (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Selected route</Text>
            {isLoading && <ActivityIndicator color="#C43D74" />}
            <Text style={styles.stateText}>
              {error ?? 'Loading your route summary…'}
            </Text>
            {error && (
              <Pressable
                style={({ pressed }) => [
                  styles.inlineButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={retry}
                accessibilityRole="button"
                accessibilityLabel="Try loading the route summary again"
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </Pressable>
            )}
          </View>
        )}

        <RouteWarningsList
          warnings={warnings}
          isLoading={!review ? !error : warningsLoading}
          error={review ? warningsError : null}
          onRetry={retryWarnings}
        />
        <RouteDisclaimer />
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push('/active-route' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Start Route"
        >
          <Text style={styles.primaryButtonText}>Start Route</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={chooseAnotherRoute}
          accessibilityRole="button"
          accessibilityLabel="Choose Another Route"
        >
          <Text style={styles.secondaryButtonText}>Choose Another Route</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8FB' },
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
  backText: { color: '#5A3D4D', fontSize: 15, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  heading: { color: '#32252B', fontSize: 24, fontWeight: '900' },
  subheading: {
    marginTop: 6,
    marginBottom: 18,
    color: '#5D4B53',
    fontSize: 13,
    lineHeight: 19,
  },
  summaryCard: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  summaryTitle: {
    color: '#32252B',
    fontSize: 18,
    fontWeight: '800',
  },
  inlineButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#C43D74',
  },
  stateText: {
    color: '#5D4B53',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#C43D74',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(93, 75, 83, 0.3)',
  },
  secondaryButtonText: { color: '#32252B', fontSize: 16, fontWeight: '700' },
  buttonPressed: { opacity: 0.7 },
});
