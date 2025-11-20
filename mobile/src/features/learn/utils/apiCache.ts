/**
 * API response caching utility for Learn module (React Native)
 * Uses in-memory cache with TTL (Time To Live)
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

// In-memory cache
const cache = new Map<string, CacheEntry<any>>()

/**
 * Cache configuration (TTL in milliseconds)
 */
export const CACHE_TTL = {
  ZONES: 30 * 60 * 1000, // 30 minutes - rarely changes
  TOPICS: 30 * 60 * 1000, // 30 minutes - rarely changes
  LESSONS: 15 * 60 * 1000, // 15 minutes - occasionally changes
  MATERIALS: 10 * 60 * 1000, // 10 minutes - may change
  EXERCISES: 5 * 60 * 1000, // 5 minutes - questions may change
  PROGRESS: 2 * 60 * 1000, // 2 minutes - frequently changes
  USER_DATA: 1 * 60 * 1000, // 1 minute - very dynamic
} as const

/**
 * Get cached data if not expired
 */
export function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key)

  if (!entry) {
    return null
  }

  const now = Date.now()

  // Check if expired
  if (now > entry.expiresAt) {
    cache.delete(key)
    return null
  }

  return entry.data as T
}

/**
 * Set data in cache with TTL
 */
export function setCachedData<T>(key: string, data: T, ttl: number): void {
  const now = Date.now()

  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  })
}

/**
 * Remove specific cache entry
 */
export function clearCacheEntry(key: string): void {
  cache.delete(key)
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  cache.clear()
}

/**
 * Clear cache entries matching a pattern
 */
export function clearCacheByPattern(pattern: string | RegExp): void {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key)
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  entries: Array<{ key: string; age: number; ttl: number }>
} {
  const now = Date.now()
  const entries: Array<{ key: string; age: number; ttl: number }> = []

  for (const [key, entry] of cache.entries()) {
    entries.push({
      key,
      age: now - entry.timestamp,
      ttl: entry.expiresAt - now,
    })
  }

  return {
    size: cache.size,
    entries,
  }
}

/**
 * Helper: Generate cache key for zones
 */
export function getZonesCacheKey(): string {
  return 'zones:all'
}

/**
 * Helper: Generate cache key for specific zone
 */
export function getZoneCacheKey(zoneId: number | string): string {
  return `zone:${zoneId}`
}

/**
 * Helper: Generate cache key for topics by zone
 */
export function getTopicsByZoneCacheKey(zoneId: number): string {
  return `topics:zone:${zoneId}`
}

/**
 * Helper: Generate cache key for topic by slug
 */
export function getTopicCacheKey(topicSlug: string): string {
  return `topic:${topicSlug}`
}

/**
 * Helper: Generate cache key for lessons by topic
 */
export function getLessonsByTopicCacheKey(topicSlug: string): string {
  return `lessons:topic:${topicSlug}`
}

/**
 * Helper: Generate cache key for lesson by slugs
 */
export function getLessonCacheKey(topicSlug: string, lessonSlug: string): string {
  return `lesson:${topicSlug}:${lessonSlug}`
}

/**
 * Helper: Generate cache key for exercise
 */
export function getExerciseCacheKey(topicSlug: string, lessonSlug: string): string {
  return `exercise:${topicSlug}:${lessonSlug}`
}

/**
 * Helper: Generate cache key for user progress
 */
export function getUserProgressCacheKey(userId: string, lessonId: number): string {
  return `progress:user:${userId}:lesson:${lessonId}`
}

/**
 * Helper: Generate cache key for topic progress
 */
export function getTopicProgressCacheKey(userId: string, topicId: number): string {
  return `progress:user:${userId}:topic:${topicId}`
}

/**
 * Helper: Generate cache key for zone progress
 */
export function getZoneProgressCacheKey(userId: string, zoneId: number): string {
  return `progress:user:${userId}:zone:${zoneId}`
}

/**
 * Helper: Generate cache key for zone completion stats
 */
export function getZoneCompletionCacheKey(userId: string, zoneId: number): string {
  return `completion:user:${userId}:zone:${zoneId}`
}

/**
 * Invalidate all progress cache for a user (call after exercise submission)
 */
export function invalidateUserProgressCache(userId: string): void {
  clearCacheByPattern(`progress:user:${userId}:`)
  clearCacheByPattern(`completion:user:${userId}:`)
}

/**
 * Invalidate specific lesson progress cache (call after lesson completion)
 */
export function invalidateLessonProgressCache(userId: string, lessonId: number): void {
  clearCacheEntry(getUserProgressCacheKey(userId, lessonId))
}

/**
 * Cached fetch wrapper
 * Automatically caches the result and returns cached data if available
 */
export async function cachedFetch<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Check cache first
  const cached = getCachedData<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetchFn()

  // Cache it
  setCachedData(key, data, ttl)

  return data
}
