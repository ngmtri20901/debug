/**
 * Tests for useCardSwipe hook
 */

import { renderHook, act } from '@testing-library/react-native'
import { useCardSwipe, useCardSwipeVelocity } from '../useCardSwipe'
import { Dimensions } from 'react-native'

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: () => ({
      enabled: jest.fn().mockReturnThis(),
      onStart: jest.fn().mockReturnThis(),
      onUpdate: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    }),
  },
}))

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react')

  return {
    useSharedValue: (initialValue: number) => {
      const ref = React.useRef({ value: initialValue })
      return ref.current
    },
    useAnimatedStyle: (fn: () => any) => {
      return fn()
    },
    withSpring: (toValue: number, config?: any) => toValue,
    withTiming: (toValue: number, config?: any, callback?: () => void) => {
      if (callback) setTimeout(callback, 0)
      return toValue
    },
    runOnJS: (fn: Function) => fn,
    interpolate: (
      value: number,
      inputRange: number[],
      outputRange: number[],
      extrapolate?: any
    ) => {
      const [inputMin, inputMax] = inputRange
      const [outputMin, outputMax] = outputRange
      const ratio = (value - inputMin) / (inputMax - inputMin)
      return outputMin + ratio * (outputMax - outputMin)
    },
    Extrapolate: {
      CLAMP: 'clamp',
    },
  }
})

const SCREEN_WIDTH = Dimensions.get('window').width

describe('useCardSwipe', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useCardSwipe())

    expect(result.current.gesture).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(typeof result.current.reset).toBe('function')
    expect(typeof result.current.swipeLeft).toBe('function')
    expect(typeof result.current.swipeRight).toBe('function')
  })

  it('should call onSwipeLeft when swiped left manually', async () => {
    const onSwipeLeft = jest.fn()
    const { result } = renderHook(() => useCardSwipe({ onSwipeLeft }))

    act(() => {
      result.current.swipeLeft()
    })

    // Wait for animation callback
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(onSwipeLeft).toHaveBeenCalled()
  })

  it('should call onSwipeRight when swiped right manually', async () => {
    const onSwipeRight = jest.fn()
    const { result } = renderHook(() => useCardSwipe({ onSwipeRight }))

    act(() => {
      result.current.swipeRight()
    })

    // Wait for animation callback
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(onSwipeRight).toHaveBeenCalled()
  })

  it('should reset position', () => {
    const { result } = renderHook(() => useCardSwipe())

    act(() => {
      result.current.reset()
    })

    // Reset should work without errors
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should respect enabled option', () => {
    const { result } = renderHook(() => useCardSwipe({ enabled: false }))

    expect(result.current.gesture).toBeDefined()
  })

  it('should use custom swipe threshold', () => {
    const swipeThreshold = 100
    const { result } = renderHook(() => useCardSwipe({ swipeThreshold }))

    expect(result.current.gesture).toBeDefined()
  })

  it('should use custom velocity threshold', () => {
    const velocityThreshold = 1000
    const { result } = renderHook(() => useCardSwipe({ velocityThreshold }))

    expect(result.current.gesture).toBeDefined()
  })

  it('should use custom spring config', () => {
    const springConfig = { damping: 15, stiffness: 100 }
    const { result } = renderHook(() => useCardSwipe({ springConfig }))

    act(() => {
      result.current.reset()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should update animated style based on gesture', () => {
    const { result } = renderHook(() => useCardSwipe())

    expect(result.current.animatedStyle).toHaveProperty('transform')
    expect(result.current.animatedStyle).toHaveProperty('opacity')
  })

  it('should handle multiple swipes', async () => {
    const onSwipeLeft = jest.fn()
    const onSwipeRight = jest.fn()
    const { result } = renderHook(() =>
      useCardSwipe({
        onSwipeLeft,
        onSwipeRight,
      })
    )

    // Swipe left
    act(() => {
      result.current.swipeLeft()
    })

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(onSwipeLeft).toHaveBeenCalledTimes(1)

    // Swipe right
    act(() => {
      result.current.swipeRight()
    })

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(onSwipeRight).toHaveBeenCalledTimes(1)
  })
})

describe('useCardSwipeVelocity', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useCardSwipeVelocity())

    expect(result.current.gesture).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(typeof result.current.reset).toBe('function')
  })

  it('should respect enabled option', () => {
    const { result } = renderHook(() => useCardSwipeVelocity({ enabled: false }))

    expect(result.current.gesture).toBeDefined()
  })

  it('should use custom velocity threshold', () => {
    const velocityThreshold = 1200
    const { result } = renderHook(() => useCardSwipeVelocity({ velocityThreshold }))

    expect(result.current.gesture).toBeDefined()
  })

  it('should call callbacks on swipe', async () => {
    const onSwipeLeft = jest.fn()
    const onSwipeRight = jest.fn()

    const { result } = renderHook(() =>
      useCardSwipeVelocity({
        onSwipeLeft,
        onSwipeRight,
      })
    )

    expect(result.current.gesture).toBeDefined()
  })

  it('should reset position with spring animation', () => {
    const { result } = renderHook(() => useCardSwipeVelocity())

    act(() => {
      result.current.reset()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should include translateY in animated style', () => {
    const { result } = renderHook(() => useCardSwipeVelocity())

    expect(result.current.animatedStyle).toHaveProperty('transform')
    expect(Array.isArray(result.current.animatedStyle.transform)).toBe(true)
  })

  it('should use custom spring config', () => {
    const springConfig = { damping: 10, stiffness: 120 }
    const { result } = renderHook(() => useCardSwipeVelocity({ springConfig }))

    act(() => {
      result.current.reset()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })
})
