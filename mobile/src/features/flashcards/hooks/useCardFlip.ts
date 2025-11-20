/**
 * Hook for flashcard flip animation (React Native)
 * Uses Reanimated for smooth 3D flip effect
 */

import { useSharedValue, withTiming, interpolate, Extrapolate } from 'react-native-reanimated'
import { useCallback } from 'react'

interface UseCardFlipReturn {
  flipValue: Animated.SharedValue<number>
  frontRotation: Animated.DerivedValue<string>
  backRotation: Animated.DerivedValue<string>
  frontOpacity: Animated.DerivedValue<number>
  backOpacity: Animated.DerivedValue<number>
  isFlipped: boolean
  flip: () => void
  reset: () => void
}

/**
 * Hook for card flip animation
 *
 * @param duration - Animation duration in milliseconds (default: 300)
 * @returns Flip animation values and controls
 *
 * @example
 * ```tsx
 * const { flipValue, frontRotation, backRotation, flip } = useCardFlip()
 *
 * return (
 *   <>
 *     <Animated.View style={[styles.card, { transform: [{ rotateY: frontRotation }] }]}>
 *       <Front />
 *     </Animated.View>
 *     <Animated.View style={[styles.card, { transform: [{ rotateY: backRotation }] }]}>
 *       <Back />
 *     </Animated.View>
 *   </>
 * )
 * ```
 */
export function useCardFlip(duration: number = 300): UseCardFlipReturn {
  // Shared value for flip animation (0 = front, 1 = back)
  const flipValue = useSharedValue(0)

  // Front side rotation (0deg → 180deg)
  const frontRotation = useDerivedValue(() => {
    return `${interpolate(
      flipValue.value,
      [0, 1],
      [0, 180],
      Extrapolate.CLAMP
    )}deg`
  })

  // Back side rotation (180deg → 360deg)
  const backRotation = useDerivedValue(() => {
    return `${interpolate(
      flipValue.value,
      [0, 1],
      [180, 360],
      Extrapolate.CLAMP
    )}deg`
  })

  // Front opacity (visible when not flipped)
  const frontOpacity = useDerivedValue(() => {
    return interpolate(
      flipValue.value,
      [0, 0.5, 1],
      [1, 0, 0],
      Extrapolate.CLAMP
    )
  })

  // Back opacity (visible when flipped)
  const backOpacity = useDerivedValue(() => {
    return interpolate(
      flipValue.value,
      [0, 0.5, 1],
      [0, 0, 1],
      Extrapolate.CLAMP
    )
  })

  // Check if currently flipped
  const isFlipped = flipValue.value === 1

  // Flip card (toggle between front and back)
  const flip = useCallback(() => {
    flipValue.value = withTiming(flipValue.value === 0 ? 1 : 0, {
      duration,
    })
  }, [flipValue, duration])

  // Reset to front
  const reset = useCallback(() => {
    flipValue.value = withTiming(0, { duration })
  }, [flipValue, duration])

  return {
    flipValue,
    frontRotation,
    backRotation,
    frontOpacity,
    backOpacity,
    isFlipped,
    flip,
    reset,
  }
}

/**
 * Alternative hook with explicit front/back control
 */
export function useCardFlipControl(duration: number = 300) {
  const flipValue = useSharedValue(0)

  const frontRotation = useDerivedValue(() => {
    return `${interpolate(flipValue.value, [0, 1], [0, 180])}deg`
  })

  const backRotation = useDerivedValue(() => {
    return `${interpolate(flipValue.value, [0, 1], [180, 360])}deg`
  })

  const frontOpacity = useDerivedValue(() => {
    return interpolate(flipValue.value, [0, 0.5, 1], [1, 0, 0])
  })

  const backOpacity = useDerivedValue(() => {
    return interpolate(flipValue.value, [0, 0.5, 1], [0, 0, 1])
  })

  // Show front
  const showFront = useCallback(() => {
    flipValue.value = withTiming(0, { duration })
  }, [flipValue, duration])

  // Show back
  const showBack = useCallback(() => {
    flipValue.value = withTiming(1, { duration })
  }, [flipValue, duration])

  // Toggle
  const toggle = useCallback(() => {
    flipValue.value = withTiming(flipValue.value === 0 ? 1 : 0, { duration })
  }, [flipValue, duration])

  return {
    flipValue,
    frontRotation,
    backRotation,
    frontOpacity,
    backOpacity,
    showFront,
    showBack,
    toggle,
    isFlipped: flipValue.value === 1,
  }
}

// Import types if using TypeScript
import type { Animated } from 'react-native-reanimated'
import { useDerivedValue } from 'react-native-reanimated'
