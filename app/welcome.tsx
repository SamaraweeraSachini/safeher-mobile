import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    router,
    type Href,
} from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/context/AuthContext';

export default function WelcomeScreen() {
  const { continueAsGuest } = useAuth();

  const [guestLoading, setGuestLoading] =
    useState(false);

  function handleGetStarted() {
    router.push('/tour' as Href);
  }

  function handleLogin() {
    router.push('/(auth)/login');
  }

  async function handleContinueAsGuest() {
    if (guestLoading) {
      return;
    }

    try {
      setGuestLoading(true);

      await continueAsGuest();

      router.replace('/(tabs)');
    } catch (error) {
      console.error(
        'Guest login failed:',
        error
      );

      Alert.alert(
        'Guest Access Failed',
        'SafeHer could not continue as a guest. Please try again.'
      );
    } finally {
      setGuestLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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

          <Text style={styles.title}>
            Your safety,
            {'\n'}
            our priority.
          </Text>

          <Text style={styles.description}>
            Travel with confidence and make
            safer decisions with SafeHer.
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={handleGetStarted}
              accessibilityRole="button"
              accessibilityLabel="Get Started"
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Get Started
              </Text>

              <Ionicons
                name="arrow-forward"
                size={20}
                color="#7A1F3D"
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed &&
                  styles.loginButtonPressed,
              ]}
              onPress={handleLogin}
              accessibilityRole="button"
              accessibilityLabel="Log In"
            >
              <Text
                style={styles.loginButtonText}
              >
                Log In
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.guestButton,
                pressed &&
                  styles.guestButtonPressed,
              ]}
              onPress={
                handleContinueAsGuest
              }
              disabled={guestLoading}
              accessibilityRole="button"
              accessibilityLabel="Continue as Guest"
            >
              {guestLoading ? (
                <View
                  style={
                    styles.loadingContent
                  }
                >
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.guestButtonText
                    }
                  >
                    Continuing...
                  </Text>
                </View>
              ) : (
                <View
                  style={
                    styles.guestButtonContent
                  }
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.guestButtonText
                    }
                  >
                    Continue as Guest
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <Text style={styles.footerText}>
          Your journey. Your safety. Your
          choice.
        </Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4E1026',
  },

  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  logoOuter: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor:
      'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  appName: {
    marginTop: 20,
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  title: {
    marginTop: 26,
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    textAlign: 'center',
  },

  description: {
    marginTop: 14,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 310,
  },

  buttonContainer: {
    width: '100%',
    marginTop: 34,
  },

  primaryButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  primaryButtonText: {
    color: '#7A1F3D',
    fontSize: 16,
    fontWeight: '700',
  },

  buttonPressed: {
    opacity: 0.85,
  },

  loginButton: {
    minHeight: 56,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.7)',
    backgroundColor:
      'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  loginButtonPressed: {
    backgroundColor:
      'rgba(255,255,255,0.18)',
  },

  guestButton: {
    minHeight: 56,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.45)',
    backgroundColor:
      'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  guestButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  guestButtonPressed: {
    backgroundColor:
      'rgba(255,255,255,0.14)',
  },

  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  footerText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 24,
  },
});

