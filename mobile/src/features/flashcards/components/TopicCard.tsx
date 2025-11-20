/**
 * TopicCard component for displaying flashcard topics
 */

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native'
import type { FlashcardTopic } from '../types/flashcard.types'
import { colors, shadows, borderRadius, spacing, typography } from '@/shared/theme/colors'

interface TopicCardProps {
  topic: FlashcardTopic
  onPress: () => void
  progress?: number // 0-100
}

// Default topic icons (you can replace with actual images)
const getTopicIcon = (topicId: string): string => {
  const iconMap: Record<string, string> = {
    greetings: '👋',
    family: '👨‍👩‍👧‍👦',
    food: '🍜',
    travel: '✈️',
    numbers: '🔢',
    colors: '🎨',
    animals: '🐘',
    weather: '⛅',
    time: '🕐',
    body: '👤',
    clothing: '👔',
    house: '🏠',
    emotions: '😊',
    shopping: '🛍️',
    health: '💊',
    education: '📚',
    work: '💼',
    sports: '⚽',
    technology: '💻',
    nature: '🌳',
  }

  return iconMap[topicId.toLowerCase()] || '📝'
}

export const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  onPress,
  progress = 0,
}) => {
  const icon = getTopicIcon(topic.id)
  const wordCount = topic.flashcard_count || 0

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>

        {/* Topic Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.titleVietnamese} numberOfLines={1}>
            {topic.name_vietnamese}
          </Text>
          <Text style={styles.titleEnglish} numberOfLines={1}>
            {topic.name_english}
          </Text>

          {/* Word Count */}
          <Text style={styles.wordCount}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </Text>
        </View>

        {/* Chevron */}
        <View style={styles.chevronContainer}>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>

      {/* Progress Bar */}
      {progress > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(progress, 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  infoContainer: {
    flex: 1,
  },
  titleVietnamese: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  titleEnglish: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  wordCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  chevronContainer: {
    marginLeft: spacing.sm,
  },
  chevron: {
    fontSize: 24,
    color: colors.text.tertiary,
    fontWeight: '300',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
})
