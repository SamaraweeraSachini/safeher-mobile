import { StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/brand';

type PagerDotsProps = {
  count: number;
  activeIndex: number;
};

export function PagerDots({ count, activeIndex }: PagerDotsProps) {
  return (
    <View accessibilityRole="progressbar" style={styles.row}>
      {Array.from({ length: count }).map((_, index) => {
        const active = index === activeIndex;
        return (
          <View
            key={index}
            style={[styles.dot, active ? styles.active : styles.idle]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  active: {
    width: 26,
    backgroundColor: Brand.burgundy,
  },
  idle: {
    width: 8,
    backgroundColor: Brand.roseSoft,
  },
});
