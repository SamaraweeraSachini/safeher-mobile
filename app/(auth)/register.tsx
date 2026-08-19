import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAuthenticationError,
  registerUser,
} from "@/src/services/auth-service";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegistrationErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  function validateForm(): boolean {
    const nextErrors: RegistrationErrors = {};
    const normalizedEmail = email.trim();

    if (!fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!normalizedEmail) {
      nextErrors.email = "Email address is required.";
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must contain at least 6 characters.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "The passwords do not match.";
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
      await registerUser({
        fullName,
        email,
        password,
      });

      router.replace("/(tabs)");
    } catch (error) {
      setErrors({
        general: getAuthenticationError(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandContainer}>
            <View style={styles.logo}>
              <Ionicons name="shield-checkmark" size={38} color="#FFFFFF" />
            </View>

            <Text style={styles.brandName}>SafeHer</Text>

            <Text style={styles.heading}>Create your account</Text>

            <Text style={styles.description}>
              Join the community and help make every journey safer.
            </Text>
          </View>

          {errors.general ? (
            <View style={styles.generalErrorContainer}>
              <Ionicons name="alert-circle-outline" size={20} color="#B42318" />

              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <InputLabel text="Full name" />

            <View
              style={[
                styles.inputContainer,
                errors.fullName && styles.inputContainerError,
              ]}
            >
              <Ionicons name="person-outline" size={20} color="#667085" />

              <TextInput
                value={fullName}
                onChangeText={(value) => {
                  setFullName(value);
                  setErrors((current) => ({
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
              <Ionicons name="mail-outline" size={20} color="#667085" />

              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setErrors((current) => ({
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
              <Ionicons name="lock-closed-outline" size={20} color="#667085" />

              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setErrors((current) => ({
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
                onPress={() => setPasswordVisible((current) => !current)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  passwordVisible ? "Hide password" : "Show password"
                }
              >
                <Ionicons
                  name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                  size={22}
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
              <Ionicons name="lock-closed-outline" size={20} color="#667085" />

              <TextInput
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  setErrors((current) => ({
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
                onPress={() => setConfirmPasswordVisible((current) => !current)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  confirmPasswordVisible
                    ? "Hide confirmed password"
                    : "Show confirmed password"
                }
              >
                <Ionicons
                  name={
                    confirmPasswordVisible ? "eye-off-outline" : "eye-outline"
                  }
                  size={22}
                  color="#667085"
                />
              </Pressable>
            </View>

            <FieldError message={errors.confirmPassword} />

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
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>

              <Pressable
                onPress={() => router.replace("/login")}
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
    backgroundColor: "#FFF8FB",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C43D74",
    marginBottom: 12,
  },
  brandName: {
    color: "#A92F62",
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 22,
  },
  heading: {
    color: "#24151C",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  description: {
    color: "#667085",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 320,
  },
  generalErrorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FDA29B",
    borderRadius: 12,
    backgroundColor: "#FEF3F2",
    padding: 12,
    marginBottom: 18,
  },
  generalErrorText: {
    flex: 1,
    color: "#B42318",
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    width: "100%",
  },
  label: {
    color: "#344054",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 7,
  },
  inputContainer: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
  },
  inputContainerError: {
    borderColor: "#F04438",
  },
  input: {
    flex: 1,
    color: "#101828",
    fontSize: 16,
    paddingVertical: 14,
  },
  fieldError: {
    color: "#D92D20",
    fontSize: 13,
    marginTop: 5,
    marginBottom: 12,
  },
  primaryButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#C43D74",
    marginTop: 24,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  footerText: {
    color: "#667085",
    fontSize: 14,
  },
  linkText: {
    color: "#A92F62",
    fontSize: 14,
    fontWeight: "700",
  },
});
