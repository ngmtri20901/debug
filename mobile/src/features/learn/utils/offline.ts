/**
 * Offline support utilities for Learn module
 * Provides offline detection, caching, and sync queue management
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'

/**
 * Storage keys for offline data
 */
export const OfflineStorageKeys = {
  CACHED_ZONES: '@learn/offline/zones',
  CACHED_TOPICS: '@learn/offline/topics',
  CACHED_LESSONS: '@learn/offline/lessons',
  CACHED_EXERCISES: '@learn/offline/exercises',
  PENDING_SUBMISSIONS: '@learn/offline/pending_submissions',
  OFFLINE_MODE: '@learn/offline/mode',
  LAST_SYNC: '@learn/offline/last_sync',
} as const

/**
 * Network status hook
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(true)
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true)
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false)
      setIsInternetReachable(state.isInternetReachable)
      setConnectionType(state.type)
    })

    return () => unsubscribe()
  }, [])

  return {
    isConnected,
    isInternetReachable,
    connectionType,
    isOffline: !isConnected || isInternetReachable === false,
  }
}

/**
 * Offline data cache manager
 */
export class OfflineCache {
  /**
   * Save data to offline cache
   */
  static async set<T>(key: string, data: T): Promise<void> {
    try {
      const jsonData = JSON.stringify({
        data,
        timestamp: Date.now(),
      })
      await AsyncStorage.setItem(key, jsonData)
    } catch (error) {
      console.error(`Failed to cache data for key ${key}:`, error)
    }
  }

  /**
   * Get data from offline cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const jsonData = await AsyncStorage.getItem(key)
      if (!jsonData) return null

      const { data, timestamp } = JSON.parse(jsonData)
      return data as T
    } catch (error) {
      console.error(`Failed to get cached data for key ${key}:`, error)
      return null
    }
  }

  /**
   * Check if cached data exists and is fresh
   */
  static async isFresh(key: string, maxAgeMs: number): Promise<boolean> {
    try {
      const jsonData = await AsyncStorage.getItem(key)
      if (!jsonData) return false

      const { timestamp } = JSON.parse(jsonData)
      const age = Date.now() - timestamp
      return age < maxAgeMs
    } catch (error) {
      return false
    }
  }

  /**
   * Remove cached data
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to remove cached data for key ${key}:`, error)
    }
  }

  /**
   * Clear all offline cache
   */
  static async clearAll(): Promise<void> {
    try {
      const keys = Object.values(OfflineStorageKeys)
      await AsyncStorage.multiRemove(keys)
    } catch (error) {
      console.error('Failed to clear offline cache:', error)
    }
  }

  /**
   * Get cache size
   */
  static async getSize(): Promise<number> {
    try {
      const keys = Object.values(OfflineStorageKeys)
      const items = await AsyncStorage.multiGet(keys)
      let totalSize = 0
      items.forEach(([key, value]) => {
        if (value) {
          totalSize += value.length
        }
      })
      return totalSize
    } catch (error) {
      console.error('Failed to get cache size:', error)
      return 0
    }
  }
}

/**
 * Pending submission queue for offline sync
 */
export interface PendingSubmission {
  id: string
  type: 'exercise' | 'progress' | 'session'
  data: any
  timestamp: number
  retries: number
}

export class SyncQueue {
  /**
   * Add item to sync queue
   */
  static async enqueue(submission: Omit<PendingSubmission, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    try {
      const queue = await this.getQueue()
      const newSubmission: PendingSubmission = {
        ...submission,
        id: `${submission.type}_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        retries: 0,
      }
      queue.push(newSubmission)
      await this.saveQueue(queue)
    } catch (error) {
      console.error('Failed to enqueue submission:', error)
    }
  }

  /**
   * Get all pending submissions
   */
  static async getQueue(): Promise<PendingSubmission[]> {
    try {
      const data = await AsyncStorage.getItem(OfflineStorageKeys.PENDING_SUBMISSIONS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get sync queue:', error)
      return []
    }
  }

  /**
   * Save queue to storage
   */
  private static async saveQueue(queue: PendingSubmission[]): Promise<void> {
    await AsyncStorage.setItem(OfflineStorageKeys.PENDING_SUBMISSIONS, JSON.stringify(queue))
  }

  /**
   * Remove item from queue
   */
  static async dequeue(id: string): Promise<void> {
    try {
      const queue = await this.getQueue()
      const newQueue = queue.filter((item) => item.id !== id)
      await this.saveQueue(newQueue)
    } catch (error) {
      console.error('Failed to dequeue submission:', error)
    }
  }

  /**
   * Increment retry count for item
   */
  static async incrementRetry(id: string): Promise<void> {
    try {
      const queue = await this.getQueue()
      const item = queue.find((i) => i.id === id)
      if (item) {
        item.retries++
        await this.saveQueue(queue)
      }
    } catch (error) {
      console.error('Failed to increment retry count:', error)
    }
  }

  /**
   * Clear all pending submissions
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OfflineStorageKeys.PENDING_SUBMISSIONS)
    } catch (error) {
      console.error('Failed to clear sync queue:', error)
    }
  }

  /**
   * Get queue size
   */
  static async size(): Promise<number> {
    const queue = await this.getQueue()
    return queue.length
  }
}

/**
 * Offline mode manager
 */
export class OfflineManager {
  /**
   * Enable offline mode
   */
  static async enable(): Promise<void> {
    await AsyncStorage.setItem(OfflineStorageKeys.OFFLINE_MODE, 'true')
  }

  /**
   * Disable offline mode
   */
  static async disable(): Promise<void> {
    await AsyncStorage.setItem(OfflineStorageKeys.OFFLINE_MODE, 'false')
  }

  /**
   * Check if offline mode is enabled
   */
  static async isEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(OfflineStorageKeys.OFFLINE_MODE)
    return value === 'true'
  }

  /**
   * Update last sync timestamp
   */
  static async updateLastSync(): Promise<void> {
    await AsyncStorage.setItem(OfflineStorageKeys.LAST_SYNC, Date.now().toString())
  }

  /**
   * Get last sync timestamp
   */
  static async getLastSync(): Promise<number | null> {
    const value = await AsyncStorage.getItem(OfflineStorageKeys.LAST_SYNC)
    return value ? parseInt(value, 10) : null
  }

  /**
   * Get time since last sync in milliseconds
   */
  static async getTimeSinceLastSync(): Promise<number | null> {
    const lastSync = await this.getLastSync()
    return lastSync ? Date.now() - lastSync : null
  }
}

/**
 * Offline-aware fetch wrapper
 */
export async function offlineFetch<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  options: {
    maxAge?: number // Max age in ms before refetching
    useCache?: boolean // Whether to use cache when offline
  } = {}
): Promise<T> {
  const { maxAge = 24 * 60 * 60 * 1000, useCache = true } = options

  try {
    // Try to fetch from network
    const data = await fetchFn()

    // Cache the result
    await OfflineCache.set(cacheKey, data)

    return data
  } catch (error) {
    // If network fails and cache is enabled, try to get from cache
    if (useCache) {
      const cachedData = await OfflineCache.get<T>(cacheKey)
      if (cachedData) {
        console.log(`Using cached data for ${cacheKey}`)
        return cachedData
      }
    }

    // Re-throw if no cache available
    throw error
  }
}

/**
 * Hook for offline-aware data fetching
 */
export function useOfflineData<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)

  const { isOffline } = useNetworkStatus()

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (isOffline) {
          // Load from cache if offline
          const cachedData = await OfflineCache.get<T>(cacheKey)
          if (cachedData && mounted) {
            setData(cachedData)
            setIsFromCache(true)
          } else {
            throw new Error('No cached data available')
          }
        } else {
          // Fetch from network
          const freshData = await fetchFn()
          if (mounted) {
            setData(freshData)
            setIsFromCache(false)
            // Cache the result
            await OfflineCache.set(cacheKey, freshData)
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [isOffline, cacheKey, ...deps])

  return { data, loading, error, isFromCache }
}

/**
 * Sync pending submissions when online
 */
export async function syncPendingSubmissions(
  submitFn: (submission: PendingSubmission) => Promise<void>
): Promise<{ success: number; failed: number }> {
  const queue = await SyncQueue.getQueue()
  let success = 0
  let failed = 0

  for (const submission of queue) {
    try {
      await submitFn(submission)
      await SyncQueue.dequeue(submission.id)
      success++
    } catch (error) {
      console.error(`Failed to sync submission ${submission.id}:`, error)

      // Increment retry count
      await SyncQueue.incrementRetry(submission.id)

      // Remove if too many retries (>5)
      if (submission.retries >= 5) {
        console.warn(`Removing submission ${submission.id} after 5 failed retries`)
        await SyncQueue.dequeue(submission.id)
      }

      failed++
    }
  }

  // Update last sync time if any succeeded
  if (success > 0) {
    await OfflineManager.updateLastSync()
  }

  return { success, failed }
}
