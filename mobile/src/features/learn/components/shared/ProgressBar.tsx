/**
 * Shared ProgressBar component for Learn module
 */

import React from 'react'
import { View, StyleSheet, ViewStyle, Text } from 'react-native'

export interface ProgressBarProps {
  progress: number // 0-100
  height?: number
  color?: string
  backgroundColor?: string
  showPercentage?: boolean
  style?: ViewStyle
}

export function ProgressBar({
  progress,
  height = 8,
  color = '#10B981',
  backgroundColor = '#E5E7EB',
  showPercentage = false,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <View style={style}>
      <View
        style={[
          styles.container,
          { height, backgroundColor, borderRadius: height / 2 },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  percentage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
})
