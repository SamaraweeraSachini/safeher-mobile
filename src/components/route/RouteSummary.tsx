import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { SAFETY_LEVEL_STYLES } from '@/constants/safety-levels';
import { getSafetyLevel } from '@/src/services/safety-score-service';

import type { RouteOption, RouteType } from '@/src/types/route';

type RouteSummaryProps = {
  originLabel: string;
  destinationLabel: string;
  route: RouteOption;
};

const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  fastest: 'Fastest Route',
  safest: 'Safest Route',
  balanced: 'Balanced Route',
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

function formatIncidentCount(count: number): string {
  return count === 1
    ? '1 incident reported near this route'
    : `${count} incidents reported near this route`;
}

export default function RouteSummary({
  originLabel,
  destinationLabel,
  route,
}: RouteSummaryProps) {
  const safetyLevel = getSafetyLevel(route.safetyScore);
  const levelStyle = SAFETY_LEVEL_STYLES[safetyLevel];

  return (
    <View style={styles.card}>
      <Text style={styles.routeType}>{ROUTE_TYPE_LABELS[route.type]}</Text>

      <View style={styles.locationRow}>
        <Ionicons name="ellipse" size={10} color="#5D4B53" />
        <Text style={styles.locationText} numberOfLines={1}>
          {originLabel}
        </Text>
      </View>
      <View style={styles.locationRow}>
        <Ionicons name="location" size={12} color="#C43D74" />
        <Text style={styles.locationText} numberOfLines={1}>
          {destinationLabel}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDistance(route.distanceMeters)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDuration(route.durationSeconds)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: levelStyle.color }]}>
            {route.safetyScore}/100
          </Text>
          <Text style={styles.statLabel}>Safety score</Text>
        </View>
      </View>

      <View style={[styles.badge, { backgroundColor: levelStyle.backgroundColor }]}>
        <Text style={[styles.badgeText, { color: levelStyle.color }]}>
          {levelStyle.label}
        </Text>
      </View>

      <Text style={styles.incidentText}>
        {formatIncidentCount(route.nearbyIncidentCount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  routeType: {
    color: '#32252B',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  locationText: {
    flex: 1,
    color: '#32252B',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(93, 75, 83, 0.12)',
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#32252B',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: '#5D4B53',
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  incidentText: {
    color: '#5D4B53',
    fontSize: 13,
    fontWeight: '600',
  },
});