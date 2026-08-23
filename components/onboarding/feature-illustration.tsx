import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { Brand } from '@/constants/brand';
import type { OnboardingSlide } from '@/constants/onboarding';

const ICONS: Record<OnboardingSlide['id'], ComponentProps<typeof Ionicons>['name']> = {
  nearby: 'location',
  report: 'eye-off',
  travel: 'navigate',
};

export function FeatureIllustration({ id }: { id: OnboardingSlide['id'] }) {
  return (
    <View style={styles.stage}>
      <View style={styles.glow} />
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name={ICONS[id]} size={42} color={Brand.burgundy} />
        </View>
        <View style={styles.lines}>
          <View style={[styles.line, styles.wide]} />
          <View style={[styles.line, styles.mid]} />
          <View style={[styles.line, styles.narrow]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Brand.blush,
  },
  card: {
    width: 210,
    backgroundColor: Brand.white,
    borderRadius: 28,
    padding: 22,
    gap: 18,
    shadowColor: Brand.burgundyDeep,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Brand.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lines: {
    gap: 10,
  },
  line: {
    height: 10,
    borderRadius: 8,
    backgroundColor: Brand.line,
  },
  wide: {
    width: '100%',
  },
  mid: {
    width: '78%',
  },
  narrow: {
    width: '54%',
  },
});
