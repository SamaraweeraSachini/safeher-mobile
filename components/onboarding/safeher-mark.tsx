import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand } from '@/constants/brand';

type SafeHerMarkProps = {
  size?: number;
  variant?: 'light' | 'dark';
};

export function SafeHerMark({ size = 88, variant = 'dark' }: SafeHerMarkProps) {
  const isLight = variant === 'light';
  const ring = isLight ? 'rgba(255,255,255,0.18)' : Brand.blush;
  const fill = isLight ? Brand.white : Brand.burgundy;
  const icon = isLight ? Brand.burgundy : Brand.white;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="SafeHer logo"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: ring,
        },
      ]}>
      <View
        style={[
          styles.core,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: size * 0.36,
            backgroundColor: fill,
          },
        ]}>
        <Ionicons name="shield-checkmark" size={size * 0.36} color={icon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Brand.burgundyDeep,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
