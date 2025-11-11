'use client'

import { useMemo } from 'react'
import { useUserProfile } from '@/shared/hooks/use-user-profile'
import { useTopicProgress } from './use-topic-progress'
import { useZoneCompletion } from './use-topic-progress'
import { checkLessonUnlock, type LessonUnlockStatus } from '@/features/learn/utils/lesson-unlock-logic'
import type { SubscriptionTier } from '@/features/learn/utils/lesson-unlock-logic'

interface UseLessonUnlockParams {
  topicId: number
  zoneId: number
  zoneLevel: number
  lessonId: number
  lessonSortOrder: number
  previousLessonId?: number | null
}

/**
 * Hook to determine if a lesson is unlocked based on user tier and progress
 */
export function useLessonUnlock(params: UseLessonUnlockParams): LessonUnlockStatus {
  const { topicId, zoneId, zoneLevel, lessonId, lessonSortOrder, previousLessonId } = params
  const { user, profile, isAuthenticated } = useUserProfile()
  const { topicProgress } = useTopicProgress(topicId)
  const { completed: prevZoneCompleted, total: prevZoneTotal } = useZoneCompletion(zoneId - 1)

  const unlockStatus = useMemo(() => {
    const tier = (profile?.subscription_type ?? 'FREE') as SubscriptionTier

    // Find previous lesson progress
    const previousLessonProgress = previousLessonId
      ? topicProgress.find(p => p.lesson_id === previousLessonId) ?? null
      : null

    return checkLessonUnlock({
      userTier: tier,
      isAuthenticated,
      zoneLevel,
      lessonSortOrder,
      previousLessonProgress,
      completedTopicsInPreviousZone: prevZoneCompleted,
      totalTopicsInPreviousZone: prevZoneTotal,
    })
  }, [
    profile?.subscription_type,
    isAuthenticated,
    zoneLevel,
    lessonSortOrder,
    previousLessonId,
    topicProgress,
    prevZoneCompleted,
    prevZoneTotal,
  ])

  return unlockStatus
}

