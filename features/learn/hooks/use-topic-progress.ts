'use client'

import { useQuery } from '@tanstack/react-query'
import { useUserProfile } from '@/shared/hooks/use-user-profile'
import { getUserTopicProgress, getZoneCompletionStats, type UserLessonProgress } from '@/features/learn/api'
import { queryKeys } from '@/shared/hooks/query-keys'

/**
 * Hook to get user progress for all lessons in a topic
 */
export function useTopicProgress(topicId: number, initialData?: any[]) {
  const { user } = useUserProfile()

  const { data: topicProgress = [], isLoading } = useQuery({
    queryKey: queryKeys.lessonProgress.topic(user?.id ?? '', topicId),
    queryFn: async () => {
      if (!user?.id) return initialData ?? []
      return getUserTopicProgress(user.id, topicId)
    },
    enabled: !!user?.id,
    initialData: initialData, // Use server-side data immediately
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    topicProgress: topicProgress as UserLessonProgress[],
    isLoading,
  }
}

/**
 * Hook to get zone completion statistics
 * Returns number of completed topics vs total topics in a zone
 */
export function useZoneCompletion(zoneId: number) {
  const { user } = useUserProfile()

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.lessonProgress.zone(user?.id ?? '', zoneId), 'completion'],
    queryFn: async () => {
      if (!user?.id) return { completed: 0, total: 0 }
      return getZoneCompletionStats({
        userId: user.id,
        zoneId,
      })
    },
    enabled: !!user?.id && zoneId > 0,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    completed: data?.completed ?? 0,
    total: data?.total ?? 0,
    isLoading,
  }
}

