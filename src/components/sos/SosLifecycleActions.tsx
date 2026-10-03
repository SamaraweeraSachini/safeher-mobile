import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  closeActiveSosRequest,
  type SosClosedStatus,
} from '@/src/services/sos-request-service';

type Props = {
  userId: string;
  activatedAt: string;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onClosed: (status: SosClosedStatus) => void;
};

export default function SosLifecycleActions({
  userId,
  activatedAt,
  disabled,
  onBusyChange,
  onClosed,
}: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const working = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const closeRequest = async (status: SosClosedStatus) => {
    if (working.current || disabled || !mounted.current) return;

    working.current = true;
    setIsClosing(true);
    setError(null);
    onBusyChange(true);

    try {
      const savedStatus = await closeActiveSosRequest(
        userId,
        activatedAt,
        status,
      );

      if (mounted.current) {
        onClosed(savedStatus);
      }
    } catch {
      if (mounted.current) {
        setError(
          'Could not confirm the status change. Check your connection, then retry or reload the saved request. No closure success has been confirmed.',
        );
      }
    } finally {
      working.current = false;

      if (mounted.current) {
        setIsClosing(false);
        onBusyChange(false);
      }
    }
  };

  const confirmClosure = (status: SosClosedStatus) => {
    if (disabled || working.current) return;

    const cancelling = status === 'cancelled';

    Alert.alert(
      cancelling ? 'Cancel prototype SOS?' : 'Resolve prototype SOS?',
      cancelling
        ? 'This will mark the simulation request as cancelled. Messages already shared through another application cannot be recalled.'
        : 'This will mark the simulation request as resolved. It does not confirm that emergency services responded.',
      [
        {
          text: 'Keep active',
          style: 'cancel',
        },
        {
          text: cancelling ? 'Cancel SOS' : 'Resolve SOS',
          style: cancelling ? 'destructive' : 'default',
          onPress: () => void closeRequest(status),
        },
      ],
      { cancelable: false },
    );
  };

  const buttonsDisabled = disabled || isClosing;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Manage active SOS</Text>

      <Text style={styles.body}>
        Cancel an unwanted activation or mark the simulation as resolved.
        Both actions require confirmation.
      </Text>

      <Pressable
        style={[
          styles.cancelButton,
          buttonsDisabled && styles.disabled,
        ]}
        disabled={buttonsDisabled}
        onPress={() => confirmClosure('cancelled')}
        accessibilityRole="button"
        accessibilityState={{ disabled: buttonsDisabled }}
      >
        <Text style={styles.cancelText}>Cancel SOS</Text>
      </Pressable>

      <Pressable
        style={[
          styles.resolveButton,
          buttonsDisabled && styles.disabled,
        ]}
        disabled={buttonsDisabled}
        onPress={() => confirmClosure('resolved')}
        accessibilityRole="button"
        accessibilityState={{ disabled: buttonsDisabled }}
      >
        <Text style={styles.resolveText}>Resolve SOS</Text>
      </Pressable>

      {isClosing ? (
        <ActivityIndicator color="#A92F61" />
      ) : null}

      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  title: {
    color: '#32252B',
    fontSize: 17,
    fontWeight: '800',
  },
  body: {
    color: '#5D4B53',
    fontSize: 14,
    lineHeight: 21,
  },
  cancelButton: {
    minHeight: 48,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#9E2637',
    borderRadius: 12,
  },
  cancelText: {
    color: '#9E2637',
    fontWeight: '700',
  },
  resolveButton: {
    minHeight: 48,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#A92F61',
  },
  resolveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    color: '#9E2637',
    fontSize: 13,
    lineHeight: 20,
  },
});