import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

import {
  AuthProvider,
  useAuth,
} from '@/src/context/AuthContext';

export const unstable_settings = {
  initialRouteName: 'splash',
};

function RootNavigator() {
  const colorScheme = useColorScheme();

  const {
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
        colorScheme === 'dark'
          ? DarkTheme
          : DefaultTheme
      }
    >
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="splash"
        />

        <Stack.Protected
          guard={!isAuthenticated}
        >
          <Stack.Screen
            name="(auth)"
          />
        </Stack.Protected>

        <Stack.Protected
          guard={isAuthenticated}
        >
          <Stack.Screen
            name="(tabs)"
          />

          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
            }}
          />
        </Stack.Protected>
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8FB',
  },
});