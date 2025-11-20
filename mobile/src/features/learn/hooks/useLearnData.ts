/**
 * React Query hooks for Learn API (zones, topics, lessons)
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { queryKeys } from '../config/queryClient'
import {
  getAllZones,
  getZoneById,
  getTopicsByZone,
  getTopicBySlug,
  getLessonsByTopicSlug,
  getLessonBySlugs,
  getLessonMaterials,
} from '../services'
import type { Zone, Topic, Lesson, Material } from '../types'
import {
  getCachedData,
  setCachedData,
  CACHE_TTL,
  getZonesCacheKey,
  getZoneCacheKey,
  getTopicsByZoneCacheKey,
  getTopicCacheKey,
  getLessonsByTopicCacheKey,
  getLessonCacheKey,
} from '../utils/apiCache'

/**
 * Hook to fetch all zones with topics
 */
export function useAllZones(): UseQueryResult<Zone[], Error> {
  return useQuery({
    queryKey: queryKeys.zones.all,
    queryFn: async () => {
      // Check cache first
      const cacheKey = getZonesCacheKey()
      const cached = getCachedData<Zone[]>(cacheKey)
      if (cached) return cached

      // Fetch fresh data
      const zones = await getAllZones()

      // Cache it
      setCachedData(cacheKey, zones, CACHE_TTL.ZONES)

      return zones
    },
    staleTime: CACHE_TTL.ZONES,
  })
}

/**
 * Hook to fetch single zone by ID
 */
export function useZone(zoneId: number | string): UseQueryResult<Zone | null, Error> {
  return useQuery({
    queryKey: queryKeys.zones.byId(zoneId),
    queryFn: async () => {
      // Check cache first
      const cacheKey = getZoneCacheKey(zoneId)
      const cached = getCachedData<Zone | null>(cacheKey)
      if (cached) return cached

      // Fetch fresh data
      const zone = await getZoneById(zoneId)

      // Cache it
      setCachedData(cacheKey, zone, CACHE_TTL.ZONES)

      return zone
    },
    enabled: !!zoneId, // Only run if zoneId is provided
    staleTime: CACHE_TTL.ZONES,
  })
}

/**
 * Hook to fetch topics by zone
 */
export function useTopicsByZone(zoneId: number): UseQueryResult<Topic[], Error> {
  return useQuery({
    queryKey: queryKeys.topics.byZone(zoneId),
    queryFn: async () => {
      // Check cache first
      const cacheKey = getTopicsByZoneCacheKey(zoneId)
      const cached = getCachedData<Topic[]>(cacheKey)
      if (cached) return cached

      // Fetch fresh data
      const topics = await getTopicsByZone(zoneId)

      // Cache it
      setCachedData(cacheKey, topics, CACHE_TTL.TOPICS)

      return topics
    },
    enabled: !!zoneId,
    staleTime: CACHE_TTL.TOPICS,
  })
}

/**
 * Hook to fetch topic by slug with lessons
 */
export function useTopic(
  topicSlug: string
): UseQueryResult<
  { topic: Topic; lessons: Lesson[]; zoneLevel: number } | null,
  Error
> {
  return useQuery({
    queryKey: queryKeys.topics.bySlug(topicSlug),
    queryFn: async () => {
      // Check cache first
      const cacheKey = getTopicCacheKey(topicSlug)
      const cached = getCachedData<{ topic: Topic; lessons: Lesson[]; zoneLevel: number } | null>(
        cacheKey
      )
      if (cached) return cached

      // Fetch fresh data
      const data = await getTopicBySlug(topicSlug)

      // Cache it
      setCachedData(cacheKey, data, CACHE_TTL.TOPICS)

      return data
    },
    enabled: !!topicSlug,
    staleTime: CACHE_TTL.TOPICS,
  })
}

/**
 * Hook to fetch lessons by topic slug
 */
export function useLessonsByTopic(topicSlug: string): UseQueryResult<Lesson[], Error> {
  return useQuery({
    queryKey: queryKeys.lessons.byTopic(topicSlug),
    queryFn: async () => {
      // Check cache first
      const cacheKey = getLessonsByTopicCacheKey(topicSlug)
      const cached = getCachedData<Lesson[]>(cacheKey)
      if (cached) return cached

      // Fetch fresh data
      const lessons = await getLessonsByTopicSlug(topicSlug)

      // Cache it
      setCachedData(cacheKey, lessons, CACHE_TTL.LESSONS)

      return lessons
    },
    enabled: !!topicSlug,
    staleTime: CACHE_TTL.LESSONS,
  })
}

/**
 * Hook to fetch lesson by slugs with materials
 */
export function useLesson(
  topicSlug: string,
  lessonSlug: string
): UseQueryResult<
  {
    lesson: Lesson
    materials: Material[]
    topic: { title: string; slug: string }
    zoneLevel: number
  } | null,
  Error
> {
  return useQuery({
    queryKey: queryKeys.lessons.bySlugs(topicSlug, lessonSlug),
    queryFn: async () => {
      // Check cache first
      const cacheKey = getLessonCacheKey(topicSlug, lessonSlug)
      const cached = getCachedData<{
        lesson: Lesson
        materials: Material[]
        topic: { title: string; slug: string }
        zoneLevel: number
      } | null>(cacheKey)
      if (cached) return cached

      // Fetch fresh data
      const data = await getLessonBySlugs(topicSlug, lessonSlug)

      // Cache it
      setCachedData(cacheKey, data, CACHE_TTL.LESSONS)

      return data
    },
    enabled: !!topicSlug && !!lessonSlug,
    staleTime: CACHE_TTL.LESSONS,
  })
}

/**
 * Hook to fetch lesson materials
 */
export function useLessonMaterials(lessonId: number): UseQueryResult<Material[], Error> {
  return useQuery({
    queryKey: queryKeys.materials.byLesson(lessonId),
    queryFn: async () => {
      return await getLessonMaterials(lessonId)
    },
    enabled: !!lessonId,
    staleTime: CACHE_TTL.MATERIALS,
  })
}
