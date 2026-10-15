import { Ionicons } from '@expo/vector-icons';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
    <View
      style={[
        styles.card,
        selected && styles.selectedCard,
      ]}
    >
      {/* ---------- Header ---------- */}
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.name}>{route.name}</Text>
          <Text style={styles.label}>{route.label}</Text>
        </View>

        {selected ? (
          <View style={styles.selectedTag}>
            <Ionicons
              name="checkmark-circle"
              size={13}
              color={Brand.white}
            />
            <Text style={styles.selectedTagText}>Selected</Text>
          </View>
        ) : null}
      </View>

      {/* ---------- Details ---------- */}
      <View style={styles.details}>
        <View style={styles.detail}>
          <View style={styles.detailIconRow}>
            <Ionicons
              name="map-outline"
              size={14}
              color={Brand.burgundy}
            />
            <Text style={styles.detailLabel}>Distance</Text>
          </View>

          <Text style={styles.detailValue}>
            {(route.distanceMeters / 1000).toFixed(1)} km
          </Text>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detail}>
          <View style={styles.detailIconRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={Brand.burgundy}
            />
            <Text style={styles.detailLabel}>Estimated time</Text>
          </View>

          <Text style={styles.detailValue}>
            {Math.round(route.durationSeconds / 60)} min
          </Text>
        </View>
      </View>

      {/* ---------- Safety ---------- */}
      <View style={styles.safetySection}>
        <Text style={styles.sectionLabel}>Safety score</Text>

        <SafetyScoreBadge
          score={route.safetyScore}
          level={route.safetyLevel}
        />

        <SafetyScoreExplanation />

        <View style={styles.incidentsRow}>
          <Ionicons
            name="alert-circle-outline"
            size={15}
            color={Brand.muted}
          />
          <Text style={styles.incidents}>
            Nearby reports: {route.nearbyIncidentCount}
          </Text>
        </View>
      </View>

      {/* ---------- Button ---------- */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          selected && styles.selectedButton,
          pressed && styles.pressed,
        ]}
        onPress={() => onSelect(route.id)}
        accessibilityRole="button"
        accessibilityLabel={
          selected
            ? `${route.name} selected`
            : `Select ${route.name}`
        }
      >
        <Ionicons
          name={selected ? 'checkmark-circle' : 'radio-button-off'}
          size={17}
          color={Brand.white}
        />
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
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
    shadowColor: '#4E1026',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },

  selectedCard: {
    borderColor: Brand.burgundy,
    borderWidth: 2,
    shadowColor: Brand.burgundy,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },

  /* ---------- Heading ---------- */
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
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.1,
  },

  label: {
    color: Brand.burgundy,
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 4,
  },

  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: Brand.burgundy,
  },

  selectedTagText: {
    color: Brand.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  /* ---------- Details ---------- */
  details: {
    flexDirection: 'row',
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Brand.cream,
  },

  detail: {
    flex: 1,
  },

  detailIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  detailDivider: {
    width: 1,
    backgroundColor: Brand.line,
    marginHorizontal: 10,
  },

  detailLabel: {
    color: Brand.muted,
    fontSize: 11.5,
    fontWeight: '600',
  },

  detailValue: {
    color: Brand.ink,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.1,
  },

  /* ---------- Safety ---------- */
  safetySection: {
    marginTop: 16,
  },

  sectionLabel: {
    color: Brand.muted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },

  incidentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },

  incidents: {
    color: Brand.muted,
    fontSize: 12.5,
    fontWeight: '600',
  },

  /* ---------- Button ---------- */
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Brand.burgundy,
    borderRadius: 14,
    marginTop: 16,
    paddingVertical: 14,
    shadowColor: Brand.burgundy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },

  selectedButton: {
    backgroundColor: Brand.burgundyDeep,
  },

  buttonText: {
    color: Brand.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  pressed: {
    opacity: 0.85,
  },
});