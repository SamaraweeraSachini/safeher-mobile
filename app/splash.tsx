import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/src/context/AuthContext';

const SPLASH_DURATION = 2200;

export default function SplashScreen() {
  const router = useRouter();
  const hasNavigated = useRef(false);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      continueToApp();
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  function continueToApp() {
    if (hasNavigated.current) {
      return;
    }

    hasNavigated.current = true;

    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/welcome');
    }
  }

  return (
    <Pressable
      style={styles.container}
      onPress={continueToApp}
      accessibilityRole="button"
      accessibilityLabel="Continue to SafeHer"
    >
      <StatusBar style="light" />

      <LinearGradient
        colors={[
          '#4E1026',
          '#7A1F3D',
          '#C45C7A',
        ]}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Ionicons
                name="shield-checkmark"
                size={58}
                color="#7A1F3D"
              />
            </View>
          </View>

          <Text style={styles.appName}>
            SafeHer
          </Text>

          <Text style={styles.message}>
            You deserve to feel safe — every
            step of the way.
          </Text>
        </View>

        <Text style={styles.hint}>
          Tap to continue
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  logoOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor:
      'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  appName: {
    marginTop: 24,
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  message: {
    marginTop: 14,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },

  hint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    paddingBottom: 36,
    textAlign: 'center',
  },
});

