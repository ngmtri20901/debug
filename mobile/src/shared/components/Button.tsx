/**
 * Reusable Button component
 * Consistent with Shadcn button design
 */

import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native'
import { colors, borderRadius, spacing, typography, shadows } from '../theme/colors'

interface ButtonProps {
  children: React.ReactNode
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const variantStyles = {
    primary: styles.primary,
    secondary: styles.secondary,
    outline: styles.outline,
    ghost: styles.ghost,
    danger: styles.danger,
  }

  const sizeStyles = {
    sm: styles.sm,
    md: styles.md,
    lg: styles.lg,
  }

  const textSizeStyles = {
    sm: styles.textSm,
    md: styles.textMd,
    lg: styles.textLg,
  }

  const textVariantStyles = {
    primary: styles.textPrimary,
    secondary: styles.textSecondary,
    outline: styles.textOutline,
    ghost: styles.textGhost,
    danger: styles.textDanger,
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'danger'
              ? colors.text.inverse
              : colors.primary[600]
          }
        />
      ) : (
        <Text
          style={[
            styles.text,
            textSizeStyles[size],
            textVariantStyles[variant],
            disabled && styles.textDisabled,
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },

  // Variants
  primary: {
    backgroundColor: colors.primary[600],
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: colors.gray[100],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error.main,
    ...shadows.sm,
  },

  // Sizes
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 52,
  },

  // States
  disabled: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSm: {
    fontSize: typography.fontSize.sm,
  },
  textMd: {
    fontSize: typography.fontSize.base,
  },
  textLg: {
    fontSize: typography.fontSize.lg,
  },

  // Text variant styles
  textPrimary: {
    color: colors.text.inverse,
  },
  textSecondary: {
    color: colors.text.primary,
  },
  textOutline: {
    color: colors.text.primary,
  },
  textGhost: {
    color: colors.primary[600],
  },
  textDanger: {
    color: colors.text.inverse,
  },
  textDisabled: {
    opacity: 0.5,
  },
})
