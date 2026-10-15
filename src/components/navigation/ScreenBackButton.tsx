import { Ionicons } from '@expo/vector-icons';

import {
  useRouter,
} from 'expo-router';

import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import {
  Brand,
} from '@/constants/brand';

export default function ScreenBackButton({
  label = 'Back',
}: {
  label?: string;
}) {
  const router =
    useRouter();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed &&
          styles.pressed,
      ]}
      onPress={() =>
        router.back()
      }
      accessibilityRole="button"
      accessibilityLabel={
        label
      }
    >
      <Ionicons
        name="arrow-back"
        size={21}
        color={
          Brand.burgundy
        }
      />

      <Text
        style={styles.text}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    button: {
      alignSelf:
        'flex-start',

      minHeight: 42,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,

      paddingHorizontal: 12,

      marginBottom: 10,

      borderWidth: 1,

      borderColor:
        Brand.line,

      borderRadius: 14,

      backgroundColor:
        Brand.white,
    },

    text: {
      color:
        Brand.burgundy,

      fontSize: 14,

      fontWeight:
        '800',
    },

    pressed: {
      opacity: 0.72,
    },
  });