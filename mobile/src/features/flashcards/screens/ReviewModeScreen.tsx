/**
 * Flashcard Review Mode Screen
 * Core learning screen with flip animation and swipe gestures
 */

import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import type { ReviewModeNavigationProp, ReviewModeRouteProp } from '../navigation/types'
import { FlashCard } from '../components/FlashCard'
import { useFlashcardReview } from '../hooks/useFlashcardReview'
import { useCardSwipe } from '../hooks/useCardSwipe'
import { colors, spacing, borderRadius, typography, shadows } from '@/shared/theme/colors'

const { width } = Dimensions.get('window')

export const ReviewModeScreen: React.FC = () => {
  const navigation = useNavigation<ReviewModeNavigationProp>()
  const route = useRoute<ReviewModeRouteProp>()
  const { cards, topicName } = route.params

  const [sessionComplete, setSessionComplete] = useState(false)

  // Use review hook
  const {
    currentCard,
    currentCardIndex,
    isFlipped,
    handleFlipCard,
    handleCardResult,
    playAudio,
    getProgressStats,
    progress,
    hasMoreCards,
  } = useFlashcardReview({
    cards,
    enableTimer: false, // Can be enabled with settings
    onSessionComplete: () => {
      setSessionComplete(true)
    },
  })

  // Use swipe hook for gesture navigation
  const { gesture, animatedStyle, swipeLeft, swipeRight } = useCardSwipe({
    onSwipeLeft: () => handleCardResult('incorrect'),
    onSwipeRight: () => handleCardResult('correct'),
    enabled: isFlipped, // Only allow swipe when card is flipped
  })

  const handleQuit = useCallback(() => {
    Alert.alert(
      'Quit Review?',
      'Your progress will be saved. Continue learning later?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    )
  }, [navigation])

  const handleFinish = useCallback(() => {
    const stats = getProgressStats()
    Alert.alert(
      'Session Complete!',
      `Correct: ${stats.correct}\nIncorrect: ${stats.incorrect}\nAccuracy: ${stats.accuracy}%`,
      [
        {
          text: 'Done',
          onPress: () => navigation.goBack(),
        },
      ]
    )
  }, [navigation, getProgressStats])

  // Show completion screen
  if (sessionComplete) {
    const stats = getProgressStats()
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>Great Job!</Text>
          <Text style={styles.completionSubtitle}>
            You've completed the review session
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.correct}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning.main }]}>
                {stats.unsure}
              </Text>
              <Text style={styles.statLabel}>Unsure</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.error.main }]}>
                {stats.incorrect}
              </Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
          </View>

          <View style={styles.accuracyContainer}>
            <Text style={styles.accuracyLabel}>Accuracy</Text>
            <Text style={styles.accuracyValue}>{stats.accuracy}%</Text>
          </View>

          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.finishButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (!currentCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No cards to review</Text>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.finishButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleQuit} style={styles.quitButton}>
          <Text style={styles.quitIcon}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.cardCounter}>
            Card {currentCardIndex + 1} of {cards.length}
          </Text>
          {topicName && <Text style={styles.topicName}>{topicName}</Text>}
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      {/* Card Container */}
      <View style={styles.cardContainer}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={animatedStyle}>
            <FlashCard flashcard={currentCard} onFlip={() => handleFlipCard()} />
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Action Buttons - Only show when card is flipped */}
      {isFlipped && (
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsHint}>How well did you know this?</Text>
          <View style={styles.actions}>
            {/* Forgot Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonForgot]}
              onPress={() => handleCardResult('incorrect')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>❌</Text>
              <Text style={[styles.actionText, styles.actionTextForgot]}>
                Forgot
              </Text>
            </TouchableOpacity>

            {/* Unsure Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonUnsure]}
              onPress={() => handleCardResult('unsure')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>❓</Text>
              <Text style={[styles.actionText, styles.actionTextUnsure]}>
                Unsure
              </Text>
            </TouchableOpacity>

            {/* Got it Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonCorrect]}
              onPress={() => handleCardResult('correct')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>✅</Text>
              <Text style={[styles.actionText, styles.actionTextCorrect]}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.swipeHint}>Or swipe left/right</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quitButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitIcon: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  cardCounter: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  topicName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },

  // Progress Bar
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.secondary,
    minWidth: 50,
    textAlign: 'right',
  },

  // Card
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },

  // Actions
  actionsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  actionsHint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    ...shadows.md,
  },
  actionButtonForgot: {
    backgroundColor: colors.error.main,
  },
  actionButtonUnsure: {
    backgroundColor: colors.warning.main,
  },
  actionButtonCorrect: {
    backgroundColor: colors.success.main,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  actionTextForgot: {
    color: colors.text.inverse,
  },
  actionTextUnsure: {
    color: colors.text.primary,
  },
  actionTextCorrect: {
    color: colors.text.inverse,
  },
  swipeHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Completion Screen
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  completionEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  completionTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  completionSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.xxl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: 'bold',
    color: colors.success.main,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  accuracyContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  accuracyLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  accuracyValue: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  finishButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 200,
    ...shadows.lg,
  },
  finishButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.inverse,
    textAlign: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
})
