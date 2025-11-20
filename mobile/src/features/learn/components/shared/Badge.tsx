/**
 * Shared Badge component for Learn module
 */

import React from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'

export interface BadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'small' | 'medium' | 'large'
  style?: ViewStyle
  textStyle?: TextStyle
}

export function Badge({
  label,
  variant = 'neutral',
  size = 'medium',
  style,
  textStyle,
}: BadgeProps) {
  const badgeStyles = [
    styles.badge,
    styles[variant],
    styles[size],
    style,
  ]

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ]

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  // Variants
  success: {
    backgroundColor: '#D1FAE5',
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  error: {
    backgroundColor: '#FEE2E2',
  },
  info: {
    backgroundColor: '#DBEAFE',
  },
  neutral: {
    backgroundColor: '#F3F4F6',
  },

  // Sizes
  small: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  medium: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  large: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },

  // Text styles
  text: {
    fontWeight: '600',
  },
  successText: {
    color: '#059669',
  },
  warningText: {
    color: '#D97706',
  },
  errorText: {
    color: '#DC2626',
  },
  infoText: {
    color: '#2563EB',
  },
  neutralText: {
    color: '#6B7280',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
})
