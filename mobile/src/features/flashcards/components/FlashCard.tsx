/**
 * FlashCard component with 3D flip animation
 * Uses useCardFlip hook for animation
 */

import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useCardFlip } from '../hooks/useCardFlip'
import type { FlashcardData } from '../types/flashcard.types'
import { colors, shadows, borderRadius, spacing, typography } from '@/shared/theme/colors'
import { audioService } from '../services/audioService'

const { width } = Dimensions.get('window')
const CARD_WIDTH = width - spacing.xl * 2

interface FlashCardProps {
  flashcard: FlashcardData
  onFlip?: (isFlipped: boolean) => void
  showAudio?: boolean
  autoFlip?: boolean
}

export const FlashCard: React.FC<FlashCardProps> = ({
  flashcard,
  onFlip,
  showAudio = true,
  autoFlip = false,
}) => {
  const { frontRotation, backRotation, frontOpacity, backOpacity, flip, isFlipped } =
    useCardFlip()

  const handleFlip = useCallback(() => {
    flip()
    onFlip?.(!isFlipped)
  }, [flip, isFlipped, onFlip])

  const handlePlayAudio = useCallback(async () => {
    try {
      await audioService.playPronunciation(flashcard.id, flashcard.vietnamese)
    } catch (error) {
      console.error('Failed to play audio:', error)
    }
  }, [flashcard.id, flashcard.vietnamese])

  // Front side animated style
  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: frontRotation.value }],
    opacity: frontOpacity.value,
  }))

  // Back side animated style
  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: backRotation.value }],
    opacity: backOpacity.value,
  }))

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={handleFlip}
      style={styles.container}
    >
      {/* Front Side */}
      <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
        <View style={styles.cardContent}>
          {/* Vietnamese Word */}
          <View style={styles.wordSection}>
            <Text style={styles.vietnamese}>{flashcard.vietnamese}</Text>
            <Text style={styles.pronunciation}>/{flashcard.pronunciation}/</Text>

            {/* Audio Button */}
            {showAudio && (
              <TouchableOpacity
                style={styles.audioButton}
                onPress={handlePlayAudio}
                activeOpacity={0.7}
              >
                <Text style={styles.audioIcon}>🔊</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Image */}
          {flashcard.image_url && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: flashcard.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Word Type Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {flashcard.word_type || 'Vocabulary'}
            </Text>
          </View>

          {/* Tap to flip hint */}
          <Text style={styles.tapHint}>Tap to flip</Text>
        </View>
      </Animated.View>

      {/* Back Side */}
      <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
        <View style={styles.cardContent}>
          {/* English Translation */}
          <View style={styles.translationSection}>
            <Text style={styles.label}>Translation</Text>
            <Text style={styles.english}>{flashcard.english}</Text>
          </View>

          {/* Example Sentence */}
          {flashcard.example_sentence && (
            <View style={styles.exampleSection}>
              <Text style={styles.label}>Example</Text>
              <Text style={styles.exampleVietnamese}>
                {flashcard.example_sentence}
              </Text>
              {flashcard.example_translation && (
                <Text style={styles.exampleEnglish}>
                  {flashcard.example_translation}
                </Text>
              )}
            </View>
          )}

          {/* Difficulty Indicator */}
          {flashcard.difficulty_level && (
            <View style={styles.difficultyContainer}>
              {[...Array(3)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.difficultyDot,
                    i < flashcard.difficulty_level!
                      ? styles.difficultyDotActive
                      : styles.difficultyDotInactive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Tap to flip hint */}
          <Text style={styles.tapHint}>Tap to flip back</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4, // Aspect ratio 5:7
    alignSelf: 'center',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.primary,
    ...shadows.xl,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    zIndex: 2,
  },
  cardBack: {
    zIndex: 1,
  },
  cardContent: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },

  // Front side styles
  wordSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  vietnamese: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  pronunciation: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  audioButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioIcon: {
    fontSize: 24,
  },
  imageContainer: {
    flex: 1,
    marginVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[100],
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Back side styles
  translationSection: {
    marginTop: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  english: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  exampleSection: {
    flex: 1,
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
  },
  exampleVietnamese: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
  exampleEnglish: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  difficultyDotActive: {
    backgroundColor: colors.primary[500],
  },
  difficultyDotInactive: {
    backgroundColor: colors.gray[300],
  },

  // Common styles
  tapHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
})
