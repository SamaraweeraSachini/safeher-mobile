import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Brand } from '@/constants/brand';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverse';

type AppButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  haptic?: boolean;
};

export function AppButton({
  label,
  variant = 'primary',
  loading = false,
  haptic = true,
  disabled,
  onPress,
  ...rest
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={(event) => {
        if (haptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'inverse' ? Brand.white : Brand.burgundy} />
      ) : (
        <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: Brand.burgundy,
  },
  secondary: {
    backgroundColor: Brand.white,
    borderWidth: 1.5,
    borderColor: Brand.burgundy,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  inverse: {
    backgroundColor: Brand.white,
  },
});

const labelStyles = StyleSheet.create({
  primary: {
    color: Brand.white,
  },
  secondary: {
    color: Brand.burgundy,
  },
  ghost: {
    color: Brand.burgundy,
    fontWeight: '600',
  },
  inverse: {
    color: Brand.burgundy,
  },
});
