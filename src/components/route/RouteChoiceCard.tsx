import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SAFETY_LEVEL_STYLES } from '@/constants/safety-levels';
import { getSafetyLevel } from '@/src/services/safety-score-service';

import type { RouteOption, RouteType } from '@/src/types/route';

type RouteChoiceCardProps = {
  route: RouteOption;
  onReview: (route: RouteOption) => void;
};

const ROUTE_STYLES: Record<
  RouteType,
  { label: string; color: string; button: string }
> = {
  fastest: {
    label: 'Fastest route',
    color: '#1D6FB8',
    button: '#1D6FB8',
  },
  safest: {
    label: 'Safest route',
    color: '#2E7D32',
    button: '#2E7D32',
  },
  balanced: {
    label: 'Balanced route',
    color: '#C47A1A',
    button: '#C47A1A',
  },
};

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatDuration(durationSeconds: number): string {
  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

export default function RouteChoiceCard({
  route,
  onReview,
}: RouteChoiceCardProps) {
  const style = ROUTE_STYLES[route.type];
  const levelStyle = SAFETY_LEVEL_STYLES[getSafetyLevel(route.safetyScore)];
  const incidentText =
    route.nearbyIncidentCount === 1
      ? '1 nearby incident'
      : `${route.nearbyIncidentCount} nearby incidents`;

  return (
    <View style={[styles.card, { borderColor: style.color }]}>
      <Text style={[styles.title, { color: style.color }]}>{style.label}</Text>
      <Text style={styles.trip}>
        {formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)}
      </Text>
      <Text style={styles.score}>
        Safety score {route.safetyScore}/100
      </Text>
      <Text style={styles.incidents}>{incidentText}</Text>
      <View style={[styles.badge, { backgroundColor: levelStyle.backgroundColor }]}>
        <Text style={[styles.badgeText, { color: levelStyle.color }]}>
          {levelStyle.label}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: style.button },
          pressed && styles.pressed,
        ]}
        onPress={() => onReview(route)}
        accessibilityRole="button"
        accessibilityLabel={`Review this ${style.label}`}
      >
        <Text style={styles.buttonText}>Review this route</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  trip: {
    marginTop: 8,
    color: '#32252B',
    fontSize: 15,
    fontWeight: '700',
  },
  score: {
    marginTop: 8,
    color: '#32252B',
    fontSize: 15,
    fontWeight: '800',
  },
  incidents: {
    marginTop: 4,
    color: '#5D4B53',
    fontSize: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  button: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
