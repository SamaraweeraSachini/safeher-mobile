import { StyleSheet, Text, View } from 'react-native';

import type { SafetyLevel } from '@/src/services/safety-score-service';

type Props = {
  score: number;
  level: SafetyLevel;
};

const LEVEL_DETAILS: Record<
  SafetyLevel,
  { label: string; textColor: string; backgroundColor: string }
> = {
  'lower-reported-risk': {
    label: 'Lower reported risk',
    textColor: '#256147',
    backgroundColor: '#E5F4ED',
  },
  'moderate-reported-risk': {
    label: 'Moderate reported risk',
    textColor: '#875B13',
    backgroundColor: '#FFF3D6',
  },
  'higher-reported-risk': {
    label: 'Higher reported risk',
    textColor: '#A63046',
    backgroundColor: '#FCE8EC',
  },
};

export default function SafetyScoreBadge({ score, level }: Props) {
  const details = LEVEL_DETAILS[level];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: details.backgroundColor },
      ]}
      accessibilityLabel={`Safety score ${score} out of 100. ${details.label}`}
    >
      <Text style={[styles.score, { color: details.textColor }]}>
        {score}/100
      </Text>
      <Text style={[styles.level, { color: details.textColor }]}>
        {details.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
  },
  level: {
    fontSize: 12,
    marginTop: 2,
  },
});