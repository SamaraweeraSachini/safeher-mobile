import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const HOLD_MS = 3000;

type Stage = 'idle' | 'holding' | 'confirm' | 'active';

type Props = {
  onConfirm: () => void;
};

export default function SosHoldButton({
  onConfirm,
}: Props) {
  const [stage, setStage] = useState<Stage>('idle');
  const [remaining, setRemaining] = useState(3);

  const startedAt = useRef<number | null>(null);
  const interval =
    useRef<ReturnType<typeof setInterval> | null>(null);
  const stageRef = useRef<Stage>('idle');

  const changeStage = (next: Stage) => {
    stageRef.current = next;
    setStage(next);
  };

  const stopTimer = () => {
    if (interval.current) {
      clearInterval(interval.current);
    }

    interval.current = null;
    startedAt.current = null;
  };

  const cancel = () => {
    stopTimer();

    if (stageRef.current !== 'active') {
      changeStage('idle');
      setRemaining(3);
    }
  };

  useEffect(() => {
    const listener = AppState.addEventListener(
      'change',
      (state) => {
        if (
          state !== 'active' &&
          stageRef.current === 'holding'
        ) {
          if (interval.current) {
            clearInterval(interval.current);
          }

          interval.current = null;
          startedAt.current = null;
          stageRef.current = 'idle';

          setStage('idle');
          setRemaining(3);
        }
      }
    );

    return () => {
      listener.remove();

      if (interval.current) {
        clearInterval(interval.current);
      }
    };
  }, []);

  const startHold = () => {
    if (stageRef.current !== 'idle') {
      return;
    }

    startedAt.current = Date.now();
    setRemaining(3);
    changeStage('holding');

    interval.current = setInterval(() => {
      if (
        stageRef.current !== 'holding' ||
        startedAt.current === null
      ) {
        return;
      }

      const elapsed = Date.now() - startedAt.current;

      setRemaining(
        Math.max(
          0,
          Math.ceil((HOLD_MS - elapsed) / 1000)
        )
      );

      if (elapsed >= HOLD_MS) {
        stopTimer();
        changeStage('confirm');
      }
    }, 100);
  };

  const releaseHold = () => {
    if (stageRef.current === 'holding') {
      cancel();
    }
  };

  const confirm = () => {
    if (stageRef.current !== 'confirm') {
      return;
    }

    changeStage('active');
    onConfirm();
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
        ]}
        onPressIn={startHold}
        onPressOut={releaseHold}
        disabled={
          stage === 'active' ||
          stage === 'confirm'
        }
        accessibilityRole="button"
        accessibilityLabel="Press and hold SOS for three seconds"
        accessibilityHint="Releasing early cancels the countdown"
        accessibilityState={{
          disabled: stage === 'active',
        }}
      >
        <Text style={styles.buttonText}>
          SOS
        </Text>
      </Pressable>

      {stage === 'idle' && (
        <Text style={styles.message}>
          Press and hold SOS for three seconds.
        </Text>
      )}

      {stage === 'holding' && (
        <View style={styles.prompt}>
          <Text style={styles.message}>
            Keep holding... {remaining}
          </Text>

          <Text style={styles.hint}>
            Release or tap Cancel to stop.
          </Text>

          <Pressable
            onPress={cancel}
            style={styles.secondary}
            accessibilityRole="button"
            accessibilityLabel="Cancel SOS countdown"
          >
            <Text style={styles.secondaryText}>
              Cancel countdown
            </Text>
          </Pressable>
        </View>
      )}

      {stage === 'confirm' && (
        <View style={styles.prompt}>
          <Text style={styles.message}>
            Confirm prototype SOS activation?
          </Text>

          <Text style={styles.hint}>
            No emergency service or contact is
            notified automatically.
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={cancel}
              style={styles.secondary}
              accessibilityRole="button"
              accessibilityLabel="Cancel SOS activation"
            >
              <Text style={styles.secondaryText}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={confirm}
              style={styles.primary}
              accessibilityRole="button"
              accessibilityLabel="Confirm prototype SOS activation"
            >
              <Text style={styles.primaryText}>
                Confirm SOS
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {stage === 'active' && (
        <Text style={styles.active}>
          Prototype SOS activated in this screen.
          No message has been sent.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  button: {
    width: 172,
    height: 172,
    borderRadius: 86,
    backgroundColor: '#C83B4D',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },

  pressed: {
    opacity: 0.85,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
  },

  prompt: {
    alignItems: 'center',
    width: '100%',
  },

  message: {
    marginTop: 16,
    color: '#32252B',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  hint: {
    marginTop: 6,
    color: '#5D4B53',
    fontSize: 12,
    textAlign: 'center',
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  secondary: {
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#C83B4D',
    borderRadius: 10,
  },

  secondaryText: {
    color: '#9E2637',
    fontWeight: '700',
  },

  primary: {
    padding: 12,
    marginTop: 8,
    backgroundColor: '#C83B4D',
    borderRadius: 10,
  },

  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  active: {
    marginTop: 16,
    color: '#9E2637',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});