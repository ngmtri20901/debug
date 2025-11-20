/**
 * Animation utilities for Learn module
 * Provides reusable animation configurations for React Native Reanimated
 */

import { withSpring, withTiming, withSequence } from 'react-native-reanimated'

/**
 * Animation configurations
 */
export const AnimationConfig = {
  // Spring animations
  spring: {
    gentle: {
      damping: 15,
      stiffness: 100,
      mass: 0.5,
    },
    bouncy: {
      damping: 10,
      stiffness: 100,
      mass: 0.8,
    },
    quick: {
      damping: 20,
      stiffness: 200,
      mass: 0.3,
    },
  },

  // Timing animations
  timing: {
    fast: {
      duration: 200,
    },
    medium: {
      duration: 300,
    },
    slow: {
      duration: 500,
    },
  },
}

/**
 * Fade in animation
 */
export const fadeIn = (duration: number = 300) => {
  'worklet'
  return withTiming(1, { duration })
}

/**
 * Fade out animation
 */
export const fadeOut = (duration: number = 300) => {
  'worklet'
  return withTiming(0, { duration })
}

/**
 * Scale in animation (for cards, buttons)
 */
export const scaleIn = () => {
  'worklet'
  return withSpring(1, AnimationConfig.spring.gentle)
}

/**
 * Scale out animation
 */
export const scaleOut = () => {
  'worklet'
  return withSpring(0.95, AnimationConfig.spring.quick)
}

/**
 * Shake animation (for incorrect answers)
 */
export const shake = () => {
  'worklet'
  return withSequence(
    withTiming(10, { duration: 50 }),
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(-10, { duration: 50 }),
    withTiming(0, { duration: 50 })
  )
}

/**
 * Success pulse animation (for correct answers)
 */
export const successPulse = () => {
  'worklet'
  return withSequence(
    withSpring(1.1, AnimationConfig.spring.bouncy),
    withSpring(1, AnimationConfig.spring.gentle)
  )
}

/**
 * Slide in from right
 */
export const slideInRight = (duration: number = 300) => {
  'worklet'
  return withTiming(0, { duration })
}

/**
 * Slide in from left
 */
export const slideInLeft = (duration: number = 300) => {
  'worklet'
  return withTiming(0, { duration })
}

/**
 * Progress bar fill animation
 */
export const progressFill = (targetValue: number, duration: number = 500) => {
  'worklet'
  return withTiming(targetValue, { duration })
}

/**
 * Card flip animation
 */
export const flipCard = () => {
  'worklet'
  return withSequence(
    withTiming(90, { duration: 150 }),
    withTiming(0, { duration: 150 })
  )
}

/**
 * Bounce animation (for rewards)
 */
export const bounce = () => {
  'worklet'
  return withSequence(
    withSpring(1.2, AnimationConfig.spring.bouncy),
    withSpring(1, AnimationConfig.spring.gentle)
  )
}

/**
 * Rotate animation (for loading indicators)
 */
export const rotate = (duration: number = 1000) => {
  'worklet'
  return withTiming(360, { duration })
}

/**
 * Stagger animation helper
 * Returns delay for staggered animations
 */
export const getStaggerDelay = (index: number, baseDelay: number = 50): number => {
  return index * baseDelay
}

/**
 * Easing functions
 */
export const Easing = {
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  linear: 'linear',
}

/**
 * Animation presets for common use cases
 */
export const AnimationPresets = {
  // Card entrance
  cardEntrance: {
    opacity: fadeIn(300),
    scale: scaleIn(),
  },

  // Correct answer feedback
  correctAnswer: {
    scale: successPulse(),
    opacity: fadeIn(200),
  },

  // Incorrect answer feedback
  incorrectAnswer: {
    translateX: shake(),
    opacity: fadeIn(200),
  },

  // Button press
  buttonPress: {
    scale: scaleOut(),
  },

  // Button release
  buttonRelease: {
    scale: scaleIn(),
  },

  // Progress update
  progressUpdate: (value: number) => ({
    width: progressFill(value, 500),
  }),

  // Reward appearance
  rewardAppear: {
    scale: bounce(),
    opacity: fadeIn(300),
  },
}
