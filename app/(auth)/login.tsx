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
    if (
      isLoading ||
      guestLoading ||
      !validateForm()
    ) {
      return;
    }

    setIsLoading(true);

    setErrors({});

    try {
      await loginUser(
        email,
        password
      );

      router.replace('/(tabs)');
    } catch (error) {
      setErrors({
        general:
          getAuthenticationError(
            error
          ),
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleContinueAsGuest() {
    if (
      isLoading ||
      guestLoading
    ) {
      return;
    }

    try {
      setGuestLoading(true);

      setErrors({});

      await continueAsGuest();
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

  const formDisabled =
    isLoading ||
    guestLoading;

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <KeyboardAvoidingView
        style={
          styles.keyboardView
        }
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={
              styles.brandContainer
            }
          >
            <View
              style={styles.logo}
            >
              <Ionicons
                name="shield-checkmark"
                size={42}
                color="#FFFFFF"
              />
            </View>

            <Text
              style={
                styles.brandName
              }
            >
              SafeHer
            </Text>

            <Text
              style={styles.heading}
            >
              Welcome back
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Log in to continue to your SafeHer account.
            </Text>
          </View>

          {errors.general ? (
            <View
              style={
                styles.generalErrorContainer
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#B42318"
              />

              <Text
                style={
                  styles.generalErrorText
                }
              >
                {errors.general}
              </Text>
            </View>
          ) : null}

          <View
            style={styles.form}
          >
            <Text
              style={styles.label}
            >
              Email address
            </Text>

            <View
              style={[
                styles.inputContainer,
                errors.email &&
                  styles.inputContainerError,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color="#667085"
              />

              <TextInput
                value={email}
                onChangeText={(
                  value
                ) => {
                  setEmail(value);

                  setErrors(
                    current => ({
                      ...current,
                      email:
                        undefined,
                      general:
                        undefined,
                    })
                  );
                }}
                style={
                  styles.input
                }
                placeholder="Enter your email address"
                placeholderTextColor="#98A2B3"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={
                  false
                }
                editable={
                  !formDisabled
                }
                returnKeyType="next"
              />
            </View>

            {errors.email ? (
              <Text
                style={
                  styles.fieldError
                }
              >
                {errors.email}
              </Text>
            ) : null}

            <Text
              style={styles.label}
            >
              Password
            </Text>

            <View
              style={[
                styles.inputContainer,
                errors.password &&
                  styles.inputContainerError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#667085"
              />

              <TextInput
                value={password}
                onChangeText={(
                  value
                ) => {
                  setPassword(
                    value
                  );

                  setErrors(
                    current => ({
                      ...current,
                      password:
                        undefined,
                      general:
                        undefined,
                    })
                  );
                }}
                style={
                  styles.input
                }
                placeholder="Enter your password"
                placeholderTextColor="#98A2B3"
                secureTextEntry={
                  !passwordVisible
                }
                autoCapitalize="none"
                autoCorrect={
                  false
                }
                editable={
                  !formDisabled
                }
                returnKeyType="done"
                onSubmitEditing={
                  handleLogin
                }
              />

              <Pressable
                onPress={() =>
                  setPasswordVisible(
                    current =>
                      !current
                  )
                }
                hitSlop={10}
                disabled={
                  formDisabled
                }
                accessibilityRole="button"
                accessibilityLabel={
                  passwordVisible
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                <Ionicons
                  name={
                    passwordVisible
                      ? 'eye-off-outline'
                      : 'eye-outline'
                  }
                  size={22}
                  color="#667085"
                />
              </Pressable>
            </View>

            {errors.password ? (
              <Text
                style={
                  styles.fieldError
                }
              >
                {errors.password}
              </Text>
            ) : null}

            <Pressable
              style={({
                pressed,
              }) => [
                styles.primaryButton,
                pressed &&
                  styles.buttonPressed,
                formDisabled &&
                  styles.buttonDisabled,
              ]}
              onPress={
                handleLogin
              }
              disabled={
                formDisabled
              }
            >
              {isLoading ? (
                <View
                  style={
                    styles.loadingContent
                  }
                >
                  <ActivityIndicator
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Logging in...
                  </Text>
                </View>
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Log In
                </Text>
              )}
            </Pressable>

            <Pressable
              style={({
                pressed,
              }) => [
                styles.guestButton,
                pressed &&
                  styles.guestButtonPressed,
                formDisabled &&
                  styles.guestButtonDisabled,
              ]}
              onPress={
                handleContinueAsGuest
              }
              disabled={
                formDisabled
              }
            >
              {guestLoading ? (
                <View
                  style={
                    styles.loadingContent
                  }
                >
                  <ActivityIndicator
                    color="#A92F62"
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
                    color="#A92F62"
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

            <View
              style={
                styles.footerRow
              }
            >
              <Text
                style={
                  styles.footerText
                }
              >
                Don&apos;t have an account?
              </Text>

              <Pressable
                onPress={() =>
                  router.replace(
                    '/register'
                  )
                }
                disabled={
                  formDisabled
                }
              >
                <Text
                  style={
                    styles.linkText
                  }
                >
                  {' '}
                  Create account
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        '#FFF8FB',
    },

    keyboardView: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      justifyContent:
        'center',
      paddingHorizontal: 24,
      paddingVertical: 32,
    },

    brandContainer: {
      alignItems: 'center',
      marginBottom: 34,
    },

    logo: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#C43D74',
      marginBottom: 14,
    },

    brandName: {
      color: '#A92F62',
      fontSize: 23,
      fontWeight: '800',
      marginBottom: 28,
    },

    heading: {
      color: '#24151C',
      fontSize: 30,
      fontWeight: '800',
      textAlign: 'center',
    },

    description: {
      color: '#667085',
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      marginTop: 8,
    },

    generalErrorContainer: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 8,
      borderWidth: 1,
      borderColor: '#FDA29B',
      borderRadius: 12,
      backgroundColor:
        '#FEF3F2',
      padding: 12,
      marginBottom: 20,
    },

    generalErrorText: {
      flex: 1,
      color: '#B42318',
      fontSize: 14,
      lineHeight: 20,
    },

    form: {
      width: '100%',
    },

    label: {
      color: '#344054',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 7,
    },

    inputContainer: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: '#D0D5DD',
      borderRadius: 12,
      backgroundColor:
        '#FFFFFF',
      paddingHorizontal: 14,
    },

    inputContainerError: {
      borderColor: '#F04438',
    },

    input: {
      flex: 1,
      color: '#101828',
      fontSize: 16,
      paddingVertical: 14,
    },

    fieldError: {
      color: '#D92D20',
      fontSize: 13,
      marginTop: 5,
      marginBottom: 14,
    },

    primaryButton: {
      minHeight: 54,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 12,
      backgroundColor:
        '#C43D74',
      marginTop: 26,
    },

    loadingContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },

    buttonPressed: {
      opacity: 0.85,
    },

    buttonDisabled: {
      opacity: 0.65,
    },

    guestButton: {
      minHeight: 54,
      marginTop: 14,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: '#C43D74',
      borderRadius: 12,
      backgroundColor:
        '#FFFFFF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    guestButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    guestButtonText: {
      color: '#A92F62',
      fontSize: 16,
      fontWeight: '700',
    },

    guestButtonPressed: {
      backgroundColor:
        '#FFF1F6',
    },

    guestButtonDisabled: {
      opacity: 0.65,
    },

    footerRow: {
      flexDirection: 'row',
      justifyContent:
        'center',
      alignItems: 'center',
      marginTop: 24,
    },

    footerText: {
      color: '#667085',
      fontSize: 14,
    },

    linkText: {
      color: '#A92F62',
      fontSize: 14,
      fontWeight: '700',
    },
  });
