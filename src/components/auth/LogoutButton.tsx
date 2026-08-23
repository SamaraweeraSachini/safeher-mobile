import { useState } from 'react';

import {
  Alert,
  StyleSheet,
  Text,
  Pressable,
} from 'react-native';

import {
  useAuth,
} from '@/src/context/AuthContext';

export default function LogoutButton() {
  const {
    logout,
  } = useAuth();

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);

  async function performLogout() {
    try {
      setIsLoggingOut(true);

      await logout();
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      );

      Alert.alert(
        'Logout Failed',
        'SafeHer could not log you out. Please try again.'
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  }

  return (
    <Pressable
      style={({
        pressed,
      }) => [
        styles.button,
        pressed &&
          styles.buttonPressed,
        isLoggingOut &&
          styles.buttonDisabled,
      ]}
      onPress={handleLogout}
      disabled={isLoggingOut}
      accessibilityRole="button"
      accessibilityLabel="Logout"
    >
      <Text
        style={styles.text}
      >
        {isLoggingOut
          ? 'Logging out...'
          : 'Logout'}
      </Text>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    button: {
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',

      borderWidth: 1,
      borderColor: '#C43D74',
      borderRadius: 12,

      backgroundColor:
        '#FFFFFF',

      paddingHorizontal: 22,
      paddingVertical: 12,

      marginTop: 20,
    },

    text: {
      color: '#A92F62',
      fontSize: 16,
      fontWeight: '700',
    },

    buttonPressed: {
      backgroundColor:
        '#FFF1F6',
    },

    buttonDisabled: {
      opacity: 0.6,
    },
  });