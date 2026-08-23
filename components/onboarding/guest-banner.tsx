import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand } from '@/constants/brand';
import { useAuth } from '@/src/context/AuthContext';

export function GuestBanner() {
  const { isGuest } = useAuth();

  if (!isGuest) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.copy}>
        <Text style={styles.title}>
          Browsing as a guest
        </Text>

        <Text style={styles.body}>
          You are using SafeHer as a guest.
          Some personal safety settings may
          not be available.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Brand.blush,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Brand.line,
  },

  copy: {
    gap: 4,
  },

  title: {
    color: Brand.ink,
    fontWeight: '700',
    fontSize: 14,
  },

  body: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 16,
  },
});

