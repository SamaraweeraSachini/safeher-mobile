import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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

import {
  getAuthenticationError,
  registerUser,
} from '@/src/services/auth-service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegistrationErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] =
    useState(false);

  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  function validateForm(): boolean {
    const nextErrors: RegistrationErrors = {};
    const normalizedEmail = email.trim();

    if (!fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!normalizedEmail) {
      nextErrors.email = 'Email address is required.';
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      nextErrors.password =
        'Password must contain at least 6 characters.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'The passwords do not match.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleRegistration() {
    if (isLoading || !validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await registerUser({ fullName, email, password });
      router.replace('/(tabs)');
    } catch (error) {
      setErrors({ general: getAuthenticationError(error) });
    } finally {
      setIsLoading(false);
    }
  }

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
                  size={34}
                  color="#FFFFFF"
                />
              </View>
            </View>

            <Text style={styles.brandName}>SafeHer</Text>
            <Text style={styles.heading}>Create your account</Text>

            <Text style={styles.description}>
              Join the community and help make every journey safer.
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
            <InputLabel text="Full name" />

            <View
              style={[
                styles.inputContainer,
                errors.fullName && styles.inputContainerError,
              ]}
            >
              <Ionicons name="person-outline" size={19} color="#667085" />

              <TextInput
                value={fullName}
                onChangeText={value => {
                  setFullName(value);
                  setErrors(current => ({
                    ...current,
                    fullName: undefined,
                    general: undefined,
                  }));
                }}
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#98A2B3"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="next"
              />
            </View>

            <FieldError message={errors.fullName} />

            <InputLabel text="Email address" />

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
                editable={!isLoading}
                returnKeyType="next"
              />
            </View>

            <FieldError message={errors.email} />

            <InputLabel text="Password" />

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
                placeholder="Minimum 6 characters"
                placeholderTextColor="#98A2B3"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="next"
              />

              <Pressable
                onPress={() =>
                  setPasswordVisible(current => !current)
                }
                hitSlop={10}
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

            <FieldError message={errors.password} />

            <InputLabel text="Confirm password" />

            <View
              style={[
                styles.inputContainer,
                errors.confirmPassword && styles.inputContainerError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color="#667085"
              />

              <TextInput
                value={confirmPassword}
                onChangeText={value => {
                  setConfirmPassword(value);
                  setErrors(current => ({
                    ...current,
                    confirmPassword: undefined,
                    general: undefined,
                  }));
                }}
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor="#98A2B3"
                secureTextEntry={!confirmPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleRegistration}
              />

              <Pressable
                onPress={() =>
                  setConfirmPasswordVisible(current => !current)
                }
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  confirmPasswordVisible
                    ? 'Hide confirmed password'
                    : 'Show confirmed password'
                }
              >
                <Ionicons
                  name={
                    confirmPasswordVisible
                      ? 'eye-off-outline'
                      : 'eye-outline'
                  }
                  size={21}
                  color="#667085"
                />
              </Pressable>
            </View>

            <FieldError message={errors.confirmPassword} />

            {/* ---------- Primary button ---------- */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleRegistration}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    Creating account...
                  </Text>
                </View>
              ) : (
                <View style={styles.loadingContent}>
                  <Ionicons
                    name="person-add-outline"
                    size={19}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryButtonText}>
                    Create Account
                  </Text>
                </View>
              )}
            </Pressable>

            {/* ---------- Footer ---------- */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>
                Already have an account?
              </Text>

              <Pressable
                onPress={() => router.replace('/login')}
                disabled={isLoading}
              >
                <Text style={styles.linkText}> Log in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputLabel({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <Text style={styles.fieldError}>{message}</Text>;
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },

  /* ---------- Brand ---------- */
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },

  logoRing: {
    padding: 5,
    borderRadius: 50,
    backgroundColor: '#FCE8EE',
    marginBottom: 12,
  },

  logo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C43D74',
    shadowColor: '#C43D74',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 4,
  },

  brandName: {
    color: '#A92F62',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 22,
    letterSpacing: 0.3,
  },

  heading: {
    color: '#24151C',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
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
    marginBottom: 18,
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
    marginBottom: 12,
    fontWeight: '600',
  },

  /* ---------- Primary button ---------- */
  primaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#C43D74',
    marginTop: 24,
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

  /* ---------- Footer ---------- */
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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