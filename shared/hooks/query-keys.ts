/**
 * Query Key Factories for Vietnamese Learning App
 * Provides consistent and type-safe query key generation
 * Following TanStack Query best practices with hierarchical keys
 */

// Type definitions for query parameters
export interface FlashcardFilters {
  topic?: string
  complexity?: string
  wordType?: string
  isCommon?: boolean
  isMultiword?: boolean
  isMultimeaning?: boolean
  search?: string
  skip?: number
  limit?: number
}

export interface RandomFlashcardKeyParams {
  date?: string
  count?: number
  commonWordsOnly?: boolean
}

const getUtcDateKey = () => new Date().toISOString().split('T')[0]

export const queryKeys = {
  /**
   * User-related queries
   */
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    coins: () => [...queryKeys.user.all, 'coins'] as const,
    progress: () => [...queryKeys.user.all, 'progress'] as const,
    achievements: () => [...queryKeys.user.all, 'achievements'] as const,
    badges: () => [...queryKeys.user.all, 'badges'] as const,
    statistics: () => [...queryKeys.user.all, 'statistics'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
  },

  /**
   * Flashcard-related queries
   */
  flashcards: {
    all: ['flashcards'] as const,
    lists: () => [...queryKeys.flashcards.all, 'list'] as const,
    list: (filters?: FlashcardFilters) => [...queryKeys.flashcards.lists(), filters] as const,
    topics: (complexity?: string) => [...queryKeys.flashcards.all, 'topics', complexity] as const,
    wordTypes: (complexity?: string) => [...queryKeys.flashcards.all, 'wordTypes', complexity] as const,
    saved: () => [...queryKeys.flashcards.all, 'saved'] as const,
    savedWithDetails: () => [...queryKeys.flashcards.all, 'savedWithDetails'] as const,
    byTopic: (topicId: string, complexity?: string) => 
      [...queryKeys.flashcards.all, 'byTopic', topicId, complexity] as const,
    byTopicInfinite: (topicId: string, complexity?: string) => 
      [...queryKeys.flashcards.all, 'byTopicInfinite', topicId, complexity] as const,
    byType: (wordType: string, complexity?: string) => 
      [...queryKeys.flashcards.all, 'byType', wordType, complexity] as const,
    byTypeInfinite: (wordType: string, complexity?: string) => 
      [...queryKeys.flashcards.all, 'byTypeInfinite', wordType, complexity] as const,
    byComplexity: (complexity: string) => 
      [...queryKeys.flashcards.all, 'complexity', complexity] as const,
    search: (query: string) => 
      [...queryKeys.flashcards.all, 'search', query] as const,
    random: (params: RandomFlashcardKeyParams = {}) => {
      const { date, count = 20, commonWordsOnly = false } = params
      const dayKey = date ?? getUtcDateKey()
      return [...queryKeys.flashcards.all, 'random', dayKey, { count, commonWordsOnly }] as const
    },
    multiword: (complexity?: string) => [...queryKeys.flashcards.all, 'multiword', complexity] as const,
    multiwordInfinite: (complexity?: string) => [...queryKeys.flashcards.all, 'multiwordInfinite', complexity] as const,
    multimeaning: (complexity?: string) => [...queryKeys.flashcards.all, 'multimeaning', complexity] as const,
    multimeaningInfinite: (complexity?: string) => [...queryKeys.flashcards.all, 'multimeaningInfinite', complexity] as const,
    detail: (id: string) => 
      [...queryKeys.flashcards.all, 'detail', id] as const,
    audio: (id: string) => 
      [...queryKeys.flashcards.all, 'audio', id] as const,
    complexityCounts: () => [...queryKeys.flashcards.all, 'complexityCounts'] as const,
    othersCounts: (complexity?: string) => [...queryKeys.flashcards.all, 'othersCounts', complexity] as const,
  },

  /**
   * Quest and achievement-related queries
   */
  quests: {
    all: ['quests'] as const,
    daily: () => [...queryKeys.quests.all, 'daily'] as const,
    weekly: () => [...queryKeys.quests.all, 'weekly'] as const,
    monthly: () => [...queryKeys.quests.all, 'monthly'] as const,
    progress: () => [...queryKeys.quests.all, 'progress'] as const,
    completed: () => [...queryKeys.quests.all, 'completed'] as const,
    available: () => [...queryKeys.quests.all, 'available'] as const,
  },

  /**
   * Exercise-related queries
   */
  exercises: {
    all: ['exercises'] as const,
    byLesson: (lessonId: string) => 
      [...queryKeys.exercises.all, 'lesson', lessonId] as const,
    byType: (type: string) => 
      [...queryKeys.exercises.all, 'type', type] as const,
    progress: () => [...queryKeys.exercises.all, 'progress'] as const,
    results: (exerciseId: string) => 
      [...queryKeys.exercises.all, 'results', exerciseId] as const,
  },

  /**
   * Review session-related queries
   */
  sessions: {
    all: ['sessions'] as const,
    active: () => [...queryKeys.sessions.all, 'active'] as const,
    history: () => [...queryKeys.sessions.all, 'history'] as const,
    statistics: () => [...queryKeys.sessions.all, 'statistics'] as const,
    byDate: (date: string) => 
      [...queryKeys.sessions.all, 'date', date] as const,
  },

  /**
   * Learning statistics and analytics
   */
  analytics: {
    all: ['analytics'] as const,
    daily: () => [...queryKeys.analytics.all, 'daily'] as const,
    weekly: () => [...queryKeys.analytics.all, 'weekly'] as const,
    monthly: () => [...queryKeys.analytics.all, 'monthly'] as const,
    streaks: () => [...queryKeys.analytics.all, 'streaks'] as const,
    accuracy: () => [...queryKeys.analytics.all, 'accuracy'] as const,
  },

  /**
   * Shop and monetization
   */
  shop: {
    all: ['shop'] as const,
    items: () => [...queryKeys.shop.all, 'items'] as const,
    purchases: () => [...queryKeys.shop.all, 'purchases'] as const,
    coins: () => [...queryKeys.shop.all, 'coins'] as const,
  },

  /**
   * Lesson Progress queries
   */
  lessonProgress: {
    all: ['lesson-progress'] as const,
    user: (userId: string) => [...queryKeys.lessonProgress.all, userId] as const,
    lesson: (userId: string, lessonId: number) => 
      [...queryKeys.lessonProgress.user(userId), 'lesson', lessonId] as const,
    topic: (userId: string, topicId: number) => 
      [...queryKeys.lessonProgress.user(userId), 'topic', topicId] as const,
    zone: (userId: string, zoneId: number) => 
      [...queryKeys.lessonProgress.user(userId), 'zone', zoneId] as const,
  },
} as const

/**
 * Type helpers for query keys
 */
export type QueryKey = typeof queryKeys[keyof typeof queryKeys]

/**
 * Utility function to invalidate all queries for a specific domain
 */
export const invalidationKeys = {
  user: queryKeys.user.all,
  flashcards: queryKeys.flashcards.all,
  quests: queryKeys.quests.all,
  exercises: queryKeys.exercises.all,
  sessions: queryKeys.sessions.all,
  analytics: queryKeys.analytics.all,
  shop: queryKeys.shop.all,
  lessonProgress: queryKeys.lessonProgress.all,
} as const

/**
 * Helper function to create dynamic query keys
 * Useful for infinite queries or paginated data
 */
export const createPaginatedKey = (
  baseKey: readonly string[],
  params: {
    page?: number
    limit?: number
    filters?: Record<string, any>
  }
) => {
  const { page, limit, filters } = params
  return [
    ...baseKey,
    'paginated',
    { page, limit, ...(filters && { filters }) },
  ] as const
}

/**
 * Helper function to create filtered query keys
 */
export const createFilteredKey = (
  baseKey: readonly string[],
  filters: Record<string, any>
) => {
  return [...baseKey, 'filtered', filters] as const
} 
