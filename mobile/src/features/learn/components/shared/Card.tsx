/**
 * Shared Card component for Learn module
 */

import React from 'react'
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native'

export interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  onPress?: () => void
  elevated?: boolean
  padding?: number
}

export function Card({
  children,
  style,
  onPress,
  elevated = true,
  padding = 16,
}: CardProps) {
  const cardStyles = [
    styles.card,
    elevated && styles.elevated,
    { padding },
    style,
  ]

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return <View style={cardStyles}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
})
