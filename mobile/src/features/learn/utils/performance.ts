/**
 * Performance optimization utilities for Learn module
 * Provides helpers for memoization, lazy loading, and performance monitoring
 */

import { useCallback, useMemo, useRef, useEffect } from 'react'

/**
 * Debounce hook for expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Throttle hook for rate-limiting function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now())

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastRan.current >= delay) {
        callback(...args)
        lastRan.current = now
      }
    },
    [callback, delay]
  ) as T
}

/**
 * Memoized selector hook
 */
export function useMemoizedSelector<T, R>(
  data: T,
  selector: (data: T) => R,
  deps: any[] = []
): R {
  return useMemo(() => selector(data), [data, ...deps])
}

/**
 * Performance monitor hook
 * Measures render time and logs if it exceeds threshold
 */
export function usePerformanceMonitor(
  componentName: string,
  threshold: number = 16 // 16ms = 60fps
) {
  const renderStartTime = useRef<number>(0)

  useEffect(() => {
    renderStartTime.current = performance.now()
  })

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current
    if (renderTime > threshold) {
      console.warn(
        `[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render (threshold: ${threshold}ms)`
      )
    }
  })
}

/**
 * Image preloading utility
 */
export async function preloadImages(imageUrls: string[]): Promise<void> {
  const promises = imageUrls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      const img = Image.prefetch(url)
      img.then(() => resolve()).catch(() => reject())
    })
  })

  await Promise.all(promises)
}

/**
 * Chunk array for batch processing
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Memory usage monitor
 */
export function getMemoryUsage(): {
  used: number
  total: number
  percentage: number
} | null {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
    }
  }
  return null
}

/**
 * Lazy component loader with timeout
 */
export function lazyWithTimeout<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  timeout: number = 10000
): React.LazyExoticComponent<T> {
  return React.lazy(() => {
    return Promise.race([
      factory(),
      new Promise<{ default: T }>((_, reject) =>
        setTimeout(() => reject(new Error('Component loading timeout')), timeout)
      ),
    ])
  })
}

/**
 * Memoization cache with size limit
 */
export class MemoCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    return this.cache.get(key)
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry (first key)
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

/**
 * Batch state updates
 */
export function batchUpdates<T>(
  updates: Array<() => void>,
  callback?: () => void
): void {
  updates.forEach((update) => update())
  callback?.()
}

/**
 * Optimized list rendering helper
 */
export interface VirtualListConfig {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export function getVisibleRange(
  scrollOffset: number,
  config: VirtualListConfig
): { start: number; end: number } {
  const { itemHeight, containerHeight, overscan = 2 } = config
  const start = Math.max(0, Math.floor(scrollOffset / itemHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const end = start + visibleCount + overscan * 2

  return { start, end }
}

/**
 * Request animation frame throttle
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  callback: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  let lastArgs: Parameters<T> | null = null

  const throttled = (...args: Parameters<T>) => {
    lastArgs = args

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          callback(...lastArgs)
        }
        rafId = null
        lastArgs = null
      })
    }
  }

  return throttled
}

/**
 * Performance optimization recommendations
 */
export const PerformanceOptimizations = {
  // Component memoization
  useMemoizedComponent: <P extends object>(
    Component: React.ComponentType<P>,
    propsAreEqual?: (prevProps: P, nextProps: P) => boolean
  ) => {
    return React.memo(Component, propsAreEqual)
  },

  // Callback memoization
  useMemoizedCallback: <T extends (...args: any[]) => any>(
    callback: T,
    deps: any[]
  ) => {
    return useCallback(callback, deps)
  },

  // Value memoization
  useMemoizedValue: <T>(factory: () => T, deps: any[]) => {
    return useMemo(factory, deps)
  },

  // List key generator
  generateStableKey: (item: any, index: number, prefix: string = 'item') => {
    return `${prefix}-${item.id || index}`
  },

  // Shallow comparison for props
  shallowEqual: <T extends object>(objA: T, objB: T): boolean => {
    if (Object.is(objA, objB)) return true

    if (
      typeof objA !== 'object' ||
      objA === null ||
      typeof objB !== 'object' ||
      objB === null
    ) {
      return false
    }

    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)

    if (keysA.length !== keysB.length) return false

    for (let i = 0; i < keysA.length; i++) {
      const key = keysA[i]
      if (
        !Object.prototype.hasOwnProperty.call(objB, key) ||
        !Object.is(objA[key as keyof T], objB[key as keyof T])
      ) {
        return false
      }
    }

    return true
  },
}

// Import React if not already available
import React from 'react'
import { Image } from 'react-native'
