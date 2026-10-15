import {
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';

import {
  Stack,
} from 'expo-router';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import {
  AuthProvider,
  useAuth,
} from '@/src/context/AuthContext';

import {
  LanguageProvider,
} from '@/src/context/LanguageContext';

import {
  PrivacyPreferencesProvider,
} from '@/src/context/PrivacyPreferencesContext';

export const unstable_settings = {
  initialRouteName:
    'splash',
};

const SAFEHER_THEME = {
  ...DefaultTheme,

  colors: {
    ...DefaultTheme.colors,

    background:
      '#FFF8FB',

    card:
      '#FFFFFF',

    text:
      '#291820',

    border:
      '#F1DDE6',

    primary:
      '#C43D74',
  },
};

function RootNavigator() {
  const {
    isAuthenticated,
    isGuest,
    loading,
  } =
    useAuth();

  if (
    loading
  ) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <StatusBar
          style="dark"
          backgroundColor="#FFF8FB"
        />

        <ActivityIndicator
          size="large"
          color="#C43D74"
        />
      </View>
    );
  }

  return (
    <ThemeProvider
      value={
        SAFEHER_THEME
      }
    >
      <Stack
        screenOptions={{
          headerShown:
            false,

          contentStyle: {
            backgroundColor:
              '#FFF8FB',
          },
        }}
      >
        <Stack.Screen
          name="splash"
        />

        {/* Logged-out users */}
        <Stack.Protected
          guard={
            !isAuthenticated
          }
        >
          <Stack.Screen
            name="welcome"
          />

          <Stack.Screen
            name="(onboarding)"
          />
        </Stack.Protected>

        {/*
         * Authentication screens remain available to:
         * - signed-out users
         * - anonymous guest users
         *
         * This lets a guest later create an account
         * or sign in with a registered account.
         */}
        <Stack.Protected
          guard={
            !isAuthenticated ||
            isGuest
          }
        >
          <Stack.Screen
            name="(auth)"
          />
        </Stack.Protected>

        {/* Main SafeHer application */}
        <Stack.Protected
          guard={
            isAuthenticated
          }
        >
          <Stack.Screen
            name="(tabs)"
          />

          <Stack.Screen
            name="route-summary"
          />

          <Stack.Screen
            name="active-route"
          />

          <Stack.Screen
            name="modal"
            options={{
              presentation:
                'modal',
            }}
          />
        </Stack.Protected>
      </Stack>

      <StatusBar
        style="dark"
        backgroundColor="#FFF8FB"
      />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PrivacyPreferencesProvider>
        <LanguageProvider>
          <RootNavigator />
        </LanguageProvider>
      </PrivacyPreferencesProvider>
    </AuthProvider>
  );
}

const styles =
  StyleSheet.create({
    loadingContainer: {
      flex:
        1,

      justifyContent:
        'center',

      alignItems:
        'center',

      backgroundColor:
        '#FFF8FB',
    },
  });