import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import SafetyScoreBadge from '@/src/components/route/SafetyScoreBadge';
import SafetyScoreExplanation from '@/src/components/route/SafetyScoreExplanation';
import type { SafetyLevel } from '@/src/services/safety-score-service';
import type { RouteOption } from '@/src/types/route';

export type RouteComparisonCardData = RouteOption & {
  name: string;
  label: string;
  safetyLevel: SafetyLevel;
};

type Props = {
  route: RouteComparisonCardData;
  selected?: boolean;
  onSelect: (routeId: string) => void;
};

export default function RouteComparisonCard({
  route,
  selected = false,
  onSelect,
}: Props) {
  return (
    <View style={[styles.card, selected && styles.selectedCard]}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.name}>{route.name}</Text>
          <Text style={styles.label}>{route.label}</Text>
        </View>

        {selected && <Text style={styles.selectedTag}>Selected</Text>}
      </View>

      <View style={styles.details}>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>
            {(route.distanceMeters / 1000).toFixed(1)} km
          </Text>
        </View>

        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Estimated time</Text>
          <Text style={styles.detailValue}>
            {Math.round(route.durationSeconds / 60)} min
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Safety score</Text>

      <SafetyScoreBadge
        score={route.safetyScore}
        level={route.safetyLevel}
      />

      <Text style={styles.incidents}>
        Nearby reports: {route.nearbyIncidentCount}
      </Text>

      <Pressable
        style={[styles.button, selected && styles.selectedButton]}
        onPress={() => onSelect(route.id)}
        accessibilityRole="button"
        accessibilityLabel={
          selected
            ? `${route.name} selected`
            : `Select ${route.name}`
        }
      >
        <Text style={styles.buttonText}>
          {selected ? 'Selected Route' : 'Select Route'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.white,
    borderColor: Brand.line,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },

  selectedCard: {
    borderColor: Brand.burgundy,
    borderWidth: 2,
  },

  heading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  headingText: {
    flex: 1,
    paddingRight: 8,
  },

  name: {
    color: Brand.ink,
    fontSize: 18,
    fontWeight: '700',
  },

  label: {
    color: Brand.burgundy,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },

  selectedTag: {
    color: Brand.burgundy,
    fontSize: 12,
    fontWeight: '700',
  },

  details: {
    flexDirection: 'row',
    marginTop: 18,
  },

  detail: {
    flex: 1,
  },

  detailLabel: {
    color: Brand.muted,
    fontSize: 12,
  },

  detailValue: {
    color: Brand.ink,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },

  sectionLabel: {
    color: Brand.muted,
    fontSize: 12,
    marginBottom: 7,
    marginTop: 18,
  },

  incidents: {
    color: Brand.muted,
    fontSize: 13,
    marginTop: 14,
  },

  button: {
    alignItems: 'center',
    backgroundColor: Brand.burgundy,
    borderRadius: 12,
    marginTop: 18,
    paddingVertical: 13,
  },

  selectedButton: {
    backgroundColor: Brand.burgundyDeep,
  },

  buttonText: {
    color: Brand.white,
    fontSize: 14,
    fontWeight: '700',
  },
});