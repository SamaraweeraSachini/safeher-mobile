import { type Href, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RouteChoiceCard from '@/src/components/route/RouteChoiceCard';
import { useActiveIncidents } from '@/src/hooks/useRecentIncidents';
import { placeLabel } from '@/src/services/reviewed-route-service';
import { buildSelectableRoutes } from '@/src/services/route-options-service';
import {
  getSelectedRouteReview,
  setSelectedRouteReview,
} from '@/src/state/selected-route';

import type { RouteOption } from '@/src/types/route';

export default function SafeRouteScreen() {
  const router = useRouter();
  const { incidents, isLoading, error, retry } = useActiveIncidents();
  const routes = useMemo(() => buildSelectableRoutes(incidents), [incidents]);

  const reviewRoute = (route: RouteOption) => {
    const start = route.coordinates[0];
    const end = route.coordinates[route.coordinates.length - 1];

    setSelectedRouteReview({
      originLabel: 'Starting point',
      destinationLabel: 'Destination',
      route,
    });
    router.push('/route-summary' as Href);

    void Promise.all([
      placeLabel(start, 'Starting point'),
      placeLabel(end, 'Destination'),
    ]).then(([originLabel, destinationLabel]) => {
      if (getSelectedRouteReview()?.route.id !== route.id) {
        return;
      }

      setSelectedRouteReview({
        originLabel,
        destinationLabel,
        route,
      });
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Safe Route</Text>
        <Text style={styles.subheading}>
          Choose Fastest, Safest, or Balanced. Each route is based on recent
          incident reports from the community.
        </Text>

        {isLoading && routes.length === 0 && (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#C43D74" />
            <Text style={styles.stateText}>Loading reported incidents…</Text>
          </View>
        )}

        {!isLoading && error && routes.length === 0 && (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
              onPress={retry}
              accessibilityRole="button"
              accessibilityLabel="Try loading routes again"
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {!isLoading && !error && routes.length === 0 && (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>
              Routes appear here once people have shared recent incident
              reports.
            </Text>
          </View>
        )}

        {routes.map((route) => (
          <View key={route.id}>
            <RouteChoiceCard
              route={route}
              onReview={reviewRoute}
            />
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
    paddingTop: 12,
    paddingBottom: 28,
  },
  heading: {
    color: '#32252B',
    fontSize: 28,
    fontWeight: '900',
  },
  subheading: {
    marginTop: 6,
    marginBottom: 18,
    color: '#5D4B53',
    fontSize: 14,
    lineHeight: 20,
  },
  stateCard: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  stateText: {
    color: '#5D4B53',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#C43D74',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
