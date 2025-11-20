/**
 * Reusable Header component for screens
 */

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native'
import { colors, spacing, typography } from '../theme/colors'

interface HeaderProps {
  title: string
  leftIcon?: string
  rightIcon?: string
  onLeftPress?: () => void
  onRightPress?: () => void
  subtitle?: string
}

export const Header: React.FC<HeaderProps> = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  subtitle,
}) => {
  return (
    <View style={styles.container}>
      {/* Left Button */}
      <View style={styles.leftContainer}>
        {leftIcon && onLeftPress && (
          <TouchableOpacity
            onPress={onLeftPress}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.icon}>{leftIcon}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Button */}
      <View style={styles.rightContainer}>
        {rightIcon && onRightPress && (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.icon}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? spacing.md : (StatusBar.currentHeight || 0) + spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  iconButton: {
    padding: spacing.xs,
  },
  icon: {
    fontSize: 24,
  },
})
