/**
 * React Query configuration for Learn module
 * Provides query client with caching and retry logic
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Query client configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long before data is considered stale
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: How long to keep unused data in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry configuration
      retry: 2, // Retry failed requests 2 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

      // Refetch configuration
      refetchOnWindowFocus: false, // Don't refetch on window focus (mobile)
      refetchOnReconnect: true, // Refetch when reconnecting
      refetchOnMount: true, // Refetch on component mount

      // Network mode
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      // Retry configuration for mutations
      retry: 1, // Retry failed mutations once
      retryDelay: 1000, // Wait 1 second before retrying

      // Network mode
      networkMode: 'online', // Only mutate when online
    },
  },
})

/**
 * Query keys factory for Learn module
 * Provides consistent query key structure
 */
export const queryKeys = {
  // Zones
  zones: {
    all: ['zones'] as const,
    byId: (id: number | string) => ['zones', id] as const,
  },

  // Topics
  topics: {
    all: ['topics'] as const,
    byZone: (zoneId: number) => ['topics', 'zone', zoneId] as const,
    bySlug: (slug: string) => ['topics', slug] as const,
  },

  // Lessons
  lessons: {
    all: ['lessons'] as const,
    byTopic: (topicSlug: string) => ['lessons', 'topic', topicSlug] as const,
    bySlugs: (topicSlug: string, lessonSlug: string) =>
      ['lessons', topicSlug, lessonSlug] as const,
  },

  // Materials
  materials: {
    byLesson: (lessonId: number) => ['materials', 'lesson', lessonId] as const,
  },

  // Exercises
  exercises: {
    all: ['exercises'] as const,
    bySlugs: (topicSlug: string, lessonSlug: string) =>
      ['exercises', topicSlug, lessonSlug] as const,
  },

  // Progress
  progress: {
    all: ['progress'] as const,
    lesson: (userId: string, lessonId: number) =>
      ['progress', 'user', userId, 'lesson', lessonId] as const,
    topic: (userId: string, topicId: number) =>
      ['progress', 'user', userId, 'topic', topicId] as const,
    zone: (userId: string, zoneId: number) =>
      ['progress', 'user', userId, 'zone', zoneId] as const,
    allZones: (userId: string) => ['progress', 'user', userId, 'zones'] as const,
  },

  // Completion stats
  completion: {
    zone: (userId: string, zoneId: number) =>
      ['completion', 'user', userId, 'zone', zoneId] as const,
    topicSummary: (userId: string, topicId: number) =>
      ['completion', 'user', userId, 'topic', topicId] as const,
    zoneSummary: (userId: string, zoneId: number) =>
      ['completion', 'user', userId, 'zone', zoneId] as const,
  },
} as const

/**
 * Mutation keys for Learn module
 */
export const mutationKeys = {
  submitExercise: ['submit-exercise'] as const,
  createSession: ['create-session'] as const,
} as const
