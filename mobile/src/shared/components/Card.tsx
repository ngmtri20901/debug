/**
 * Reusable Card component
 * Consistent with Shadcn card design
 */

import React from 'react'
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native'
import { colors, shadows, borderRadius, spacing } from '../theme/colors'

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: keyof typeof spacing
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
}) => {
  const variantStyles = {
    default: styles.default,
    elevated: styles.elevated,
    outlined: styles.outlined,
  }

  return (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.primary,
  },
  default: {
    ...shadows.sm,
  },
  elevated: {
    ...shadows.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border.light,
  },
})
