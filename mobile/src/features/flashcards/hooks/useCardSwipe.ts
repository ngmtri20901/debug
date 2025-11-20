/**
 * Hook for flashcard swipe gestures (React Native)
 * Uses Gesture Handler + Reanimated for smooth swipe navigation
 */

import { useCallback } from 'react'
import { Dimensions } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'

const SCREEN_WIDTH = Dimensions.get('window').width
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3 // 30% of screen width
const SWIPE_VELOCITY_THRESHOLD = 500 // pixels per second

interface UseCardSwipeOptions {
  /**
   * Called when card is swiped left
   */
  onSwipeLeft?: () => void

  /**
   * Called when card is swiped right
   */
  onSwipeRight?: () => void

  /**
   * Minimum distance to trigger swipe (default: 30% of screen width)
   */
  swipeThreshold?: number

  /**
   * Minimum velocity to trigger swipe (default: 500 px/s)
   */
  velocityThreshold?: number

  /**
   * Enable/disable swipe gestures (default: true)
   */
  enabled?: boolean

  /**
   * Spring config for snap-back animation
   */
  springConfig?: {
    damping?: number
    stiffness?: number
  }
}

interface UseCardSwipeReturn {
  /**
   * Pan gesture handler to attach to Animated.View
   */
  gesture: ReturnType<typeof Gesture.Pan>

  /**
   * Animated style for the card (includes translateX and rotation)
   */
  animatedStyle: ReturnType<typeof useAnimatedStyle>

  /**
   * Reset card to center position
   */
  reset: () => void

  /**
   * Manually trigger swipe left
   */
  swipeLeft: () => void

  /**
   * Manually trigger swipe right
   */
  swipeRight: () => void
}

/**
 * Hook for card swipe gestures
 *
 * @param options - Swipe configuration options
 * @returns Gesture handler and animated style
 *
 * @example
 * ```tsx
 * const { gesture, animatedStyle, reset } = useCardSwipe({
 *   onSwipeLeft: () => handleAnswer('incorrect'),
 *   onSwipeRight: () => handleAnswer('correct'),
 * })
 *
 * return (
 *   <GestureDetector gesture={gesture}>
 *     <Animated.View style={[styles.card, animatedStyle]}>
 *       <CardContent />
 *     </Animated.View>
 *   </GestureDetector>
 * )
 * ```
 */
export function useCardSwipe(options: UseCardSwipeOptions = {}): UseCardSwipeReturn {
  const {
    onSwipeLeft,
    onSwipeRight,
    swipeThreshold = SWIPE_THRESHOLD,
    velocityThreshold = SWIPE_VELOCITY_THRESHOLD,
    enabled = true,
    springConfig = { damping: 20, stiffness: 90 },
  } = options

  // Shared values for gesture
  const translateX = useSharedValue(0)
  const isGestureActive = useSharedValue(false)

  // Handle swipe left (move card off-screen to the left)
  const handleSwipeLeft = useCallback(() => {
    'worklet'
    translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
      if (onSwipeLeft) {
        runOnJS(onSwipeLeft)()
      }
      // Reset after animation completes
      translateX.value = 0
    })
  }, [onSwipeLeft])

  // Handle swipe right (move card off-screen to the right)
  const handleSwipeRight = useCallback(() => {
    'worklet'
    translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
      if (onSwipeRight) {
        runOnJS(onSwipeRight)()
      }
      // Reset after animation completes
      translateX.value = 0
    })
  }, [onSwipeRight])

  // Pan gesture handler
  const gesture = Gesture.Pan()
    .enabled(enabled)
    .onStart(() => {
      'worklet'
      isGestureActive.value = true
    })
    .onUpdate((event) => {
      'worklet'
      if (!enabled) return
      translateX.value = event.translationX
    })
    .onEnd((event) => {
      'worklet'
      isGestureActive.value = false

      const shouldSwipeLeft =
        (translateX.value < -swipeThreshold || event.velocityX < -velocityThreshold) &&
        translateX.value < 0

      const shouldSwipeRight =
        (translateX.value > swipeThreshold || event.velocityX > velocityThreshold) &&
        translateX.value > 0

      if (shouldSwipeLeft) {
        handleSwipeLeft()
      } else if (shouldSwipeRight) {
        handleSwipeRight()
      } else {
        // Snap back to center
        translateX.value = withSpring(0, springConfig)
      }
    })

  // Animated style with rotation
  const animatedStyle = useAnimatedStyle(() => {
    // Rotation based on translateX (-15deg to +15deg)
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolate.CLAMP
    )

    // Opacity based on distance (fade out as card moves)
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH / 2],
      [1, 0.5],
      Extrapolate.CLAMP
    )

    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotation}deg` },
      ],
      opacity,
    }
  })

  // Reset card to center
  const reset = useCallback(() => {
    translateX.value = withSpring(0, springConfig)
  }, [springConfig])

  // Manual swipe triggers (for buttons, etc.)
  const swipeLeft = useCallback(() => {
    handleSwipeLeft()
  }, [handleSwipeLeft])

  const swipeRight = useCallback(() => {
    handleSwipeRight()
  }, [handleSwipeRight])

  return {
    gesture,
    animatedStyle,
    reset,
    swipeLeft,
    swipeRight,
  }
}

/**
 * Alternative hook with explicit velocity-based swipe detection
 * More sensitive to fast swipes
 */
export function useCardSwipeVelocity(options: UseCardSwipeOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    velocityThreshold = 800, // Higher threshold for velocity-based
    enabled = true,
    springConfig = { damping: 20, stiffness: 90 },
  } = options

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)

  const gesture = Gesture.Pan()
    .enabled(enabled)
    .onUpdate((event) => {
      'worklet'
      translateX.value = event.translationX
      translateY.value = event.translationY
    })
    .onEnd((event) => {
      'worklet'
      const velocityX = Math.abs(event.velocityX)
      const velocityY = Math.abs(event.velocityY)

      // Only trigger if horizontal velocity dominates
      if (velocityX > velocityY && velocityX > velocityThreshold) {
        if (event.velocityX > 0) {
          // Swipe right
          translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 200 }, () => {
            if (onSwipeRight) {
              runOnJS(onSwipeRight)()
            }
            translateX.value = 0
          })
        } else {
          // Swipe left
          translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 200 }, () => {
            if (onSwipeLeft) {
              runOnJS(onSwipeLeft)()
            }
            translateX.value = 0
          })
        }
      } else {
        // Snap back
        translateX.value = withSpring(0, springConfig)
        translateY.value = withSpring(0, springConfig)
      }
    })

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-20, 0, 20],
      Extrapolate.CLAMP
    )

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    }
  })

  return {
    gesture,
    animatedStyle,
    reset: () => {
      translateX.value = withSpring(0, springConfig)
      translateY.value = withSpring(0, springConfig)
    },
  }
}
