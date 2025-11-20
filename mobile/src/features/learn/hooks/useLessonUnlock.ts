/**
 * Custom hooks for lesson unlock logic
 * Determines which lessons are accessible based on tier and progress
 */

import { useMemo } from 'react'
import { useUserTopicProgress, useCompletedTopicsInPreviousZone } from './useProgress'
import {
  checkLessonUnlock,
  getUnlockedLessonsInTopic,
  isZoneUnlocked,
  type SubscriptionTier,
  type LessonUnlockStatus,
} from '../utils/lesson-unlock-logic'
import type { Lesson, UserLessonProgress } from '../types'

/**
 * Hook to check if a specific lesson is unlocked
 */
export function useLessonUnlock(params: {
  userTier: SubscriptionTier | null
  isAuthenticated: boolean
  zoneLevel: number
  lessonSortOrder: number
  previousLessonId: number | null
  topicId: number
}): LessonUnlockStatus {
  const {
    userTier,
    isAuthenticated,
    zoneLevel,
    lessonSortOrder,
    previousLessonId,
    topicId,
  } = params

  // Get previous lesson progress (if exists)
  const { data: topicProgress = [] } = useUserTopicProgress(topicId)
  const previousLessonProgress = useMemo(() => {
    if (!previousLessonId) return null
    return topicProgress.find((p) => p.lesson_id === previousLessonId) || null
  }, [topicProgress, previousLessonId])

  // Get zone completion stats for FREE tier
  const { data: previousZoneCompletion } = useCompletedTopicsInPreviousZone(zoneLevel)

  // Check unlock status
  const unlockStatus = useMemo(() => {
    return checkLessonUnlock({
      userTier,
      isAuthenticated,
      zoneLevel,
      lessonSortOrder,
      previousLessonProgress,
      completedTopicsInPreviousZone: previousZoneCompletion?.completed || 0,
      totalTopicsInPreviousZone: previousZoneCompletion?.total || 0,
    })
  }, [
    userTier,
    isAuthenticated,
    zoneLevel,
    lessonSortOrder,
    previousLessonProgress,
    previousZoneCompletion,
  ])

  return unlockStatus
}

/**
 * Hook to get all unlocked lessons in a topic
 */
export function useUnlockedLessonsInTopic(params: {
  userTier: SubscriptionTier
  zoneLevel: number
  lessonsInTopic: Lesson[]
  topicId: number
}): Set<number> {
  const { userTier, zoneLevel, lessonsInTopic, topicId } = params

  // Get all progress records for this topic
  const { data: progressRecords = [] } = useUserTopicProgress(topicId)

  // Get zone completion stats for FREE tier
  const { data: previousZoneCompletion } = useCompletedTopicsInPreviousZone(zoneLevel)

  // Calculate unlocked lessons
  const unlockedLessonIds = useMemo(() => {
    // Map lessons to required format
    const lessonsData = lessonsInTopic.map((lesson) => ({
      id: parseInt(lesson.id),
      sort_order: lesson.order,
    }))

    return getUnlockedLessonsInTopic({
      userTier,
      zoneLevel,
      lessonsInTopic: lessonsData,
      progressRecords: progressRecords as UserLessonProgress[],
      completedTopicsInPreviousZone: previousZoneCompletion?.completed || 0,
      totalTopicsInPreviousZone: previousZoneCompletion?.total || 0,
    })
  }, [
    userTier,
    zoneLevel,
    lessonsInTopic,
    progressRecords,
    previousZoneCompletion,
  ])

  return unlockedLessonIds
}

/**
 * Hook to check if a zone is unlocked
 */
export function useZoneUnlock(params: {
  userTier: SubscriptionTier
  zoneLevel: number
}): boolean {
  const { userTier, zoneLevel } = params

  // Get zone completion stats
  const { data: previousZoneCompletion } = useCompletedTopicsInPreviousZone(zoneLevel)

  // Check if zone is unlocked
  const isUnlocked = useMemo(() => {
    return isZoneUnlocked({
      userTier,
      zoneLevel,
      completedTopicsInPreviousZone: previousZoneCompletion?.completed || 0,
      totalTopicsInPreviousZone: previousZoneCompletion?.total || 0,
    })
  }, [userTier, zoneLevel, previousZoneCompletion])

  return isUnlocked
}

/**
 * Hook to get the next unlockable lesson in a topic
 */
export function useNextUnlockableLesson(params: {
  userTier: SubscriptionTier
  zoneLevel: number
  lessonsInTopic: Lesson[]
  topicId: number
}): Lesson | null {
  const { lessonsInTopic } = params

  // Get unlocked lessons
  const unlockedLessonIds = useUnlockedLessonsInTopic(params)

  // Find the first lesson that is not unlocked
  const nextLesson = useMemo(() => {
    // Sort lessons by order
    const sortedLessons = [...lessonsInTopic].sort((a, b) => a.order - b.order)

    // Find first lesson that is unlocked but not completed
    for (const lesson of sortedLessons) {
      const lessonId = parseInt(lesson.id)
      if (unlockedLessonIds.has(lessonId)) {
        // This lesson is unlocked, it's the next one to do
        return lesson
      }
    }

    return null
  }, [lessonsInTopic, unlockedLessonIds])

  return nextLesson
}

/**
 * Hook to get topic completion percentage
 */
export function useTopicCompletion(topicId: number): {
  completedLessons: number
  totalLessons: number
  percentage: number
} {
  const { data: progressRecords = [] } = useUserTopicProgress(topicId)

  const completion = useMemo(() => {
    const passedLessons = progressRecords.filter((p) => p.status === 'passed')
    const totalLessons = progressRecords.length

    const percentage = totalLessons > 0 ? Math.round((passedLessons.length / totalLessons) * 100) : 0

    return {
      completedLessons: passedLessons.length,
      totalLessons,
      percentage,
    }
  }, [progressRecords])

  return completion
}
