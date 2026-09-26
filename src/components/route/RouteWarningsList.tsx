import { Ionicons } from '@expo/vector-icons';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import RouteWarningCard from '@/src/components/route/RouteWarningCard';

import type { RouteWarning } from '@/src/types/route';

type RouteWarningsListProps = {
  warnings: RouteWarning[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

export default function RouteWarningsList({
  warnings,
  isLoading,
  error,
  onRetry,
}: RouteWarningsListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-outline" size={18} color="#742443" />
        <Text style={styles.title}>Safety warnings for this route</Text>
      </View>

      {isLoading && warnings.length === 0 && (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#C43D74" />
          <Text style={styles.stateText}>Checking nearby reports…</Text>
        </View>
      )}

      {!isLoading && error && (
        <View style={styles.stateBox}>
          <Ionicons name="cloud-offline-outline" size={22} color="#8B5555" />
          <Text style={styles.stateText}>{error}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry loading safety warnings"
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !error && warnings.length === 0 && (
        <View style={styles.stateBox}>
          <Ionicons
            name="checkmark-circle-outline"
            size={22}
            color="#35735A"
          />
          <Text style={styles.stateText}>
            No recent reports were found near this route.
          </Text>
        </View>
      )}

      {warnings.map((warning) => (
        <RouteWarningCard key={warning.id} warning={warning} />
      ))}

      <Text style={styles.disclaimer}>
        These warnings are based on community-submitted reports and may not
        represent every current risk near this route.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  title: {
    color: '#32252B',
    fontSize: 15,
    fontWeight: '800',
  },

  stateBox: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },

  stateText: {
    color: '#5D4B53',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 12,
  },

  retryButton: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#C43D74',
  },

  buttonPressed: {
    opacity: 0.7,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  disclaimer: {
    marginTop: 4,
    color: '#927E87',
    fontSize: 11,
    lineHeight: 16,
  },
});