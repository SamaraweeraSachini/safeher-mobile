import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  title: string;
  message: string;
  onRetry: () => void;
};

export default function LocationPermissionMessage({
  title,
  message,
  onRetry,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.message}>
        {message}
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.retryButton,
          pressed &&
            styles.retryButtonPressed,
        ]}
        onPress={onRetry}
      >
        <Text
          style={
            styles.retryButtonText
          }
        >
          Try Again
        </Text>
      </Pressable>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      position: 'absolute',

      top: 16,
      left: 16,
      right: 16,

      zIndex: 20,
      elevation: 20,

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,
      borderColor:
        '#F1DDE6',

      borderRadius: 14,

      padding: 16,

      shadowColor:
        '#5A3D4D',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity:
        0.12,

      shadowRadius: 8,
    },

    title: {
      color: '#24151C',
      fontSize: 16,
      fontWeight: '800',
    },

    message: {
      color: '#667085',
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
    },

    retryButton: {
      alignSelf: 'flex-start',

      marginTop: 12,

      minHeight: 42,

      paddingHorizontal: 16,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 10,

      backgroundColor:
        '#C43D74',
    },

    retryButtonPressed: {
      opacity: 0.85,
    },

    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });