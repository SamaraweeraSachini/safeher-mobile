import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { getIncidentCategoryLabel } from '@/constants/incident-categories';
import { ROUTE_WARNING_LEVEL_STYLES } from '@/constants/route-warnings';

import type { RouteWarning } from '@/src/types/route';

type RouteWarningCardProps = {
  warning: RouteWarning;
};

function formatApproximateDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    const roundedToNearestTen = Math.max(
      10,
      Math.round(distanceMeters / 10) * 10
    );

    return `~${roundedToNearestTen} m away`;
  }

  return `~${(distanceMeters / 1000).toFixed(1)} km away`;
}

function formatReportCount(count: number): string {
  return count === 1 ? '1 recent report' : `${count} recent reports`;
}

export default function RouteWarningCard({
  warning,
}: RouteWarningCardProps) {
  const levelStyle = ROUTE_WARNING_LEVEL_STYLES[warning.level];
  const categoryLabel = getIncidentCategoryLabel(warning.incidentType);

  return (
    <View
      style={[styles.card, { backgroundColor: levelStyle.backgroundColor }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${levelStyle.label}: ${warning.message} ${formatApproximateDistance(
        warning.approximateDistanceMeters
      )}, ${formatReportCount(warning.recentReportCount)}. Safety guidance: ${warning.guidance}`}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={levelStyle.icon} size={20} color={levelStyle.color} />
      </View>

      <View style={styles.textArea}>
        <View style={styles.topRow}>
          <Text style={[styles.categoryLabel, { color: levelStyle.color }]}>
            {categoryLabel.toUpperCase()}
          </Text>

          <Text style={[styles.levelLabel, { color: levelStyle.color }]}>
            {levelStyle.label}
          </Text>
        </View>

        <Text style={styles.message}>{warning.message}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="navigate-outline" size={14} color="#5D4B53" />
            <Text style={styles.metaText}>
              {formatApproximateDistance(warning.approximateDistanceMeters)}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons
              name="document-text-outline"
              size={14}
              color="#5D4B53"
            />
            <Text style={styles.metaText}>
              {formatReportCount(warning.recentReportCount)}
            </Text>
          </View>
        </View>

        <View style={styles.guidanceRow}>
          <Ionicons name="bulb-outline" size={14} color="#5D4B53" />
          <Text style={styles.guidanceText}>{warning.guidance}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },

  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },

  textArea: {
    flex: 1,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  categoryLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  levelLabel: {
    fontSize: 11,
    fontWeight: '700',
  },

  message: {
    marginTop: 4,
    color: '#32252B',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },

  metaRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaText: {
    color: '#5D4B53',
    fontSize: 12,
    fontWeight: '600',
  },

  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(93, 75, 83, 0.12)',
  },

  guidanceText: {
    flex: 1,
    color: '#5D4B53',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});