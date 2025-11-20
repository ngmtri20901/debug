/**
 * Tests for useCardFlip hook
 */

import { renderHook, act } from '@testing-library/react-native'
import { useCardFlip, useCardFlipControl } from '../useCardFlip'

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react')

  return {
    useSharedValue: (initialValue: number) => {
      const ref = React.useRef({ value: initialValue })
      return ref.current
    },
    useDerivedValue: (fn: () => any) => {
      const ref = React.useRef({ value: fn() })
      return ref.current
    },
    withTiming: (toValue: number, config?: any, callback?: () => void) => {
      // Simulate immediate update for testing
      setTimeout(() => {
        if (callback) callback()
      }, 0)
      return toValue
    },
    interpolate: (
      value: number,
      inputRange: number[],
      outputRange: number[],
      extrapolate?: any
    ) => {
      // Simple linear interpolation for testing
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

describe('useCardFlip', () => {
  it('should initialize with front side visible', () => {
    const { result } = renderHook(() => useCardFlip())

    expect(result.current.flipValue.value).toBe(0)
    expect(result.current.isFlipped).toBe(false)
  })

  it('should flip card when flip is called', () => {
    const { result } = renderHook(() => useCardFlip())

    act(() => {
      result.current.flip()
    })

    expect(result.current.flipValue.value).toBe(1)
  })

  it('should toggle between front and back', () => {
    const { result } = renderHook(() => useCardFlip())

    // Flip to back
    act(() => {
      result.current.flip()
    })

    expect(result.current.flipValue.value).toBe(1)

    // Flip back to front
    act(() => {
      result.current.flip()
    })

    expect(result.current.flipValue.value).toBe(0)
  })

  it('should reset to front side', () => {
    const { result } = renderHook(() => useCardFlip())

    // Flip to back
    act(() => {
      result.current.flip()
    })

    expect(result.current.flipValue.value).toBe(1)

    // Reset to front
    act(() => {
      result.current.reset()
    })

    expect(result.current.flipValue.value).toBe(0)
  })

  it('should use custom duration', () => {
    const duration = 500
    const { result } = renderHook(() => useCardFlip(duration))

    act(() => {
      result.current.flip()
    })

    // Duration is passed to withTiming, but we can't easily test the actual duration
    // Just verify the flip works
    expect(result.current.flipValue.value).toBe(1)
  })

  it('should calculate front rotation correctly', () => {
    const { result } = renderHook(() => useCardFlip())

    // Front should be 0deg when flipValue is 0
    expect(result.current.frontRotation.value).toBe('0deg')

    // Front should be 180deg when flipValue is 1
    act(() => {
      result.current.flipValue.value = 1
    })

    expect(result.current.frontRotation.value).toBe('180deg')
  })

  it('should calculate back rotation correctly', () => {
    const { result } = renderHook(() => useCardFlip())

    // Back should be 180deg when flipValue is 0
    expect(result.current.backRotation.value).toBe('180deg')

    // Back should be 360deg when flipValue is 1
    act(() => {
      result.current.flipValue.value = 1
    })

    expect(result.current.backRotation.value).toBe('360deg')
  })

  it('should calculate front opacity correctly', () => {
    const { result } = renderHook(() => useCardFlip())

    // Front should be fully visible when flipValue is 0
    expect(result.current.frontOpacity.value).toBe(1)

    // Front should be invisible when flipValue is 1
    act(() => {
      result.current.flipValue.value = 1
    })

    expect(result.current.frontOpacity.value).toBe(0)
  })

  it('should calculate back opacity correctly', () => {
    const { result } = renderHook(() => useCardFlip())

    // Back should be invisible when flipValue is 0
    expect(result.current.backOpacity.value).toBe(0)

    // Back should be fully visible when flipValue is 1
    act(() => {
      result.current.flipValue.value = 1
    })

    expect(result.current.backOpacity.value).toBe(1)
  })
})

describe('useCardFlipControl', () => {
  it('should initialize with front side visible', () => {
    const { result } = renderHook(() => useCardFlipControl())

    expect(result.current.flipValue.value).toBe(0)
    expect(result.current.isFlipped).toBe(false)
  })

  it('should show front explicitly', () => {
    const { result } = renderHook(() => useCardFlipControl())

    // Flip to back first
    act(() => {
      result.current.showBack()
    })

    expect(result.current.flipValue.value).toBe(1)

    // Show front explicitly
    act(() => {
      result.current.showFront()
    })

    expect(result.current.flipValue.value).toBe(0)
  })

  it('should show back explicitly', () => {
    const { result } = renderHook(() => useCardFlipControl())

    act(() => {
      result.current.showBack()
    })

    expect(result.current.flipValue.value).toBe(1)
  })

  it('should toggle between sides', () => {
    const { result } = renderHook(() => useCardFlipControl())

    // Toggle to back
    act(() => {
      result.current.toggle()
    })

    expect(result.current.flipValue.value).toBe(1)

    // Toggle back to front
    act(() => {
      result.current.toggle()
    })

    expect(result.current.flipValue.value).toBe(0)
  })

  it('should track isFlipped state', () => {
    const { result } = renderHook(() => useCardFlipControl())

    expect(result.current.isFlipped).toBe(false)

    act(() => {
      result.current.showBack()
    })

    expect(result.current.isFlipped).toBe(true)

    act(() => {
      result.current.showFront()
    })

    expect(result.current.isFlipped).toBe(false)
  })
})
