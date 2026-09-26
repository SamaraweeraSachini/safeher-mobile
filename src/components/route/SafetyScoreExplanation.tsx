import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand } from '@/constants/brand';
import { ROUTE_SCORING_RULES } from '@/constants/risk-weights';

export default function SafetyScoreExplanation() {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.disclaimer}>
        Based on community-reported incidents. A higher score does not
        guarantee that a route is safe.
      </Text>

      <Pressable
        onPress={() => setExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={
          expanded
            ? 'Hide safety score explanation'
            : 'Show safety score explanation'
        }
        style={styles.toggle}
      >
        <Text style={styles.toggleText}>
          {expanded
            ? 'Hide score explanation'
            : 'How is this score calculated?'}
        </Text>
      </Pressable>

      {expanded && (
        <View style={styles.details}>
          <Text style={styles.detailText}>
            Every route starts at {ROUTE_SCORING_RULES.startingScore}
            /100. Active community reports within approximately{' '}
            {ROUTE_SCORING_RULES.nearbyDistanceMetres} metres of the
            route reduce the score. The deduction depends on the
            reported incident category.
          </Text>

          <Text style={styles.detailText}>
            Reports from the last {ROUTE_SCORING_RULES.recentDays} days
            have their full effect. Reports up to{' '}
            {ROUTE_SCORING_RULES.olderDays} days old have a reduced
            effect; older reports are not included.
          </Text>

          <Text style={styles.detailText}>
            Reports may be incomplete or inaccurate, and unreported
            risks will not appear in the score. Use your own judgment
            and pay attention to your surroundings.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
  },
  disclaimer: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  toggle: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 5,
  },
  toggleText: {
    color: Brand.burgundy,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  details: {
    backgroundColor: Brand.cream,
    borderColor: Brand.line,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  detailText: {
    color: Brand.ink,
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 8,
  },
});