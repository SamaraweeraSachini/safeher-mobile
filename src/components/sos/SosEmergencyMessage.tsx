import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { generateEmergencyMessage } from '@/src/services/sos-message-service';
import type { PreparedSos } from '@/src/services/sos-preparation-service';

type Props = {
  activation: PreparedSos;
  isRetrievingLocation: boolean;
};

export default function SosEmergencyMessage({
  activation,
  isRetrievingLocation,
}: Props) {
  const [isSharing, setIsSharing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const sharing = useRef(false);

  const message = generateEmergencyMessage(activation);

  const handleShare = async () => {
    if (sharing.current || isRetrievingLocation) return;

    sharing.current = true;
    setIsSharing(true);
    setFeedback(null);

    try {
      const result = await Share.share(
        {
          title: 'SafeHer prototype SOS message',
          message,
        },
        {
          dialogTitle: 'Share SafeHer prototype SOS message',
          subject: 'SafeHer prototype SOS message',
        },
      );

      if (result.action === Share.dismissedAction) {
        setFeedback('Sharing was cancelled. Delivery is not confirmed.');
      } else {
        // Opening or completing the share interface is not delivery proof.
        setFeedback(
          'The share interface was opened. SafeHer cannot confirm whether the message was sent or delivered.',
        );
      }
    } catch {
      setFeedback(
        'Could not open sharing. You can select and copy the message below, then paste it into another application.',
      );
    } finally {
      sharing.current = false;
      setIsSharing(false);
    }
  };

  const disabled = isRetrievingLocation || isSharing;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Emergency message</Text>

      <Text style={styles.body}>
        Review the message before sharing. Choose the application and
        recipient yourself, then complete sending in that application.
      </Text>

      {isRetrievingLocation ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#A92F61" />
          <Text style={styles.body}>
            Waiting for the location result...
          </Text>
        </View>
      ) : (
        <Text selectable style={styles.preview}>
          {message}
        </Text>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          disabled && styles.disabled,
          pressed && styles.pressed,
        ]}
        onPress={() => void handleShare()}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Share prototype emergency message"
        accessibilityState={{ disabled, busy: isSharing }}
      >
        {isSharing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : null}

        <Text style={styles.buttonText}>
          {isSharing ? 'Opening sharing...' : 'Share emergency message'}
        </Text>
      </Pressable>

      {feedback ? (
        <Text accessibilityLiveRegion="polite" style={styles.feedback}>
          {feedback}
        </Text>
      ) : null}

      <Text style={styles.disclaimer}>
        No message is sent automatically. Opening the share interface
        does not confirm sending, receipt, or emergency assistance.
      </Text>
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  preview: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5DCE1',
    borderRadius: 12,
    backgroundColor: '#FFF8FB',
    color: '#32252B',
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    minHeight: 48,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 12,
    backgroundColor: '#A92F61',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.8,
  },
  feedback: {
    color: '#5D4B53',
    fontSize: 13,
    lineHeight: 20,
  },
  disclaimer: {
    color: '#5D4B53',
    fontSize: 12,
    lineHeight: 18,
  },
});