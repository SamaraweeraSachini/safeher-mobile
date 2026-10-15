import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/context/AuthContext';

import {
  getAuthenticationError,
  loginUser,
} from '@/src/services/auth-service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export default function LoginScreen() {
  const { continueAsGuest } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [errors, setErrors] = useState<LoginErrors>({});

  const [isLoading, setIsLoading] = useState(false);

  const [guestLoading, setGuestLoading] = useState(false);

  function validateForm(): boolean {
    const nextErrors: LoginErrors = {};

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      nextErrors.email = 'Email address is required.';
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleLogin() {
    if (isLoading || guestLoading || !validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await loginUser(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      setErrors({
        general: getAuthenticationError(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleContinueAsGuest() {
    if (isLoading || guestLoading) {
      return;
    }

    try {
      setGuestLoading(true);
      setErrors({});
      await continueAsGuest();
    } catch (error) {
      console.error('Guest login failed:', error);
      Alert.alert(
        'Guest Access Failed',
        'SafeHer could not continue as a guest. Please try again.'
      );
    } finally {
      setGuestLoading(false);
    }
  }

  const formDisabled = isLoading || guestLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ---------- Brand / Header ---------- */}
          <View style={styles.brandContainer}>
            <View style={styles.logoRing}>
              <View style={styles.logo}>
                <Ionicons
                  name="shield-checkmark"
                  size={38}
                  color="#FFFFFF"
                />
              </View>
            </View>

            <Text style={styles.brandName}>SafeHer</Text>
            <Text style={styles.heading}>Welcome back</Text>

            <Text style={styles.description}>
              Log in to continue to your SafeHer account.
            </Text>
          </View>

          {/* ---------- General error ---------- */}
          {errors.general ? (
            <View style={styles.generalErrorContainer}>
              <View style={styles.errorIconWrap}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#B42318"
                />
              </View>
              <Text style={styles.generalErrorText}>
                {errors.general}
              </Text>
            </View>
          ) : null}

          {/* ---------- Form ---------- */}
          <View style={styles.form}>
            <Text style={styles.label}>Email address</Text>

            <View
              style={[
                styles.inputContainer,
                errors.email && styles.inputContainerError,
              ]}
            >
              <Ionicons name="mail-outline" size={19} color="#667085" />

              <TextInput
                value={email}
                onChangeText={value => {
                  setEmail(value);
                  setErrors(current => ({
                    ...current,
                    email: undefined,
                    general: undefined,
                  }));
                }}
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor="#98A2B3"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!formDisabled}
                returnKeyType="next"
              />
            </View>

            {errors.email ? (
              <Text style={styles.fieldError}>{errors.email}</Text>
            ) : null}

            <Text style={styles.label}>Password</Text>

            <View
              style={[
                styles.inputContainer,
                errors.password && styles.inputContainerError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color="#667085"
              />

              <TextInput
                value={password}
                onChangeText={value => {
                  setPassword(value);
                  setErrors(current => ({
                    ...current,
                    password: undefined,
                    general: undefined,
                  }));
                }}
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#98A2B3"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!formDisabled}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <Pressable
                onPress={() =>
                  setPasswordVisible(current => !current)
                }
                hitSlop={10}
                disabled={formDisabled}
                accessibilityRole="button"
                accessibilityLabel={
                  passwordVisible ? 'Hide password' : 'Show password'
                }
              >
                <Ionicons
                  name={
                    passwordVisible ? 'eye-off-outline' : 'eye-outline'
                  }
                  size={21}
                  color="#667085"
                />
              </Pressable>
            </View>

            {errors.password ? (
              <Text style={styles.fieldError}>{errors.password}</Text>
            ) : null}

            {/* ---------- Primary button ---------- */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                formDisabled && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={formDisabled}
            >
              {isLoading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    Logging in...
                  </Text>
                </View>
              ) : (
                <View style={styles.loadingContent}>
                  <Ionicons
                    name="log-in-outline"
                    size={19}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryButtonText}>Log In</Text>
                </View>
              )}
            </Pressable>

            {/* ---------- Guest button ---------- */}
            <Pressable
              style={({ pressed }) => [
                styles.guestButton,
                pressed && styles.guestButtonPressed,
                formDisabled && styles.guestButtonDisabled,
              ]}
              onPress={handleContinueAsGuest}
              disabled={formDisabled}
            >
              {guestLoading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator color="#A92F62" />
                  <Text style={styles.guestButtonText}>
                    Continuing...
                  </Text>
                </View>
              ) : (
                <View style={styles.guestButtonContent}>
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color="#A92F62"
                  />
                  <Text style={styles.guestButtonText}>
                    Continue as Guest
                  </Text>
                </View>
              )}
            </Pressable>

            {/* ---------- Footer ---------- */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>
                Don&apos;t have an account?
              </Text>

              <Pressable
                onPress={() => router.replace('/register')}
                disabled={formDisabled}
              >
                <Text style={styles.linkText}> Create account</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8FB',
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  /* ---------- Brand ---------- */
  brandContainer: {
    alignItems: 'center',
    marginBottom: 34,
  },

  logoRing: {
    padding: 6,
    borderRadius: 50,
    backgroundColor: '#FCE8EE',
    marginBottom: 14,
  },

  logo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C43D74',
    shadowColor: '#C43D74',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },

  brandName: {
    color: '#A92F62',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 26,
    letterSpacing: 0.3,
  },

  heading: {
    color: '#24151C',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  description: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },

  /* ---------- General error ---------- */
  generalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FDA29B',
    borderRadius: 14,
    backgroundColor: '#FEF3F2',
    padding: 12,
    marginBottom: 20,
  },

  errorIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  generalErrorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  /* ---------- Form ---------- */
  form: {
    width: '100%',
  },

  label: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
    letterSpacing: 0.1,
  },

  inputContainer: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },

  inputContainerError: {
    borderColor: '#F04438',
  },

  input: {
    flex: 1,
    color: '#101828',
    fontSize: 15,
    paddingVertical: 15,
  },

  fieldError: {
    color: '#D92D20',
    fontSize: 12.5,
    marginTop: 6,
    marginBottom: 14,
    fontWeight: '600',
  },

  /* ---------- Buttons ---------- */
  primaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#C43D74',
    marginTop: 26,
    shadowColor: '#C43D74',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },

  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  buttonPressed: {
    opacity: 0.88,
  },

  buttonDisabled: {
    opacity: 0.65,
    shadowOpacity: 0,
    elevation: 0,
  },

  /* ---------- Guest button ---------- */
  guestButton: {
    minHeight: 56,
    marginTop: 14,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#C43D74',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  guestButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  guestButtonText: {
    color: '#A92F62',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  guestButtonPressed: {
    backgroundColor: '#FFF1F6',
  },

  guestButtonDisabled: {
    opacity: 0.65,
  },

  /* ---------- Footer ---------- */
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
  },

  footerText: {
    color: '#667085',
    fontSize: 13.5,
  },

  linkText: {
    color: '#A92F62',
    fontSize: 13.5,
    fontWeight: '800',
  },
});