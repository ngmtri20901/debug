'use client'

import { useQuery } from '@tanstack/react-query'
import { useUserProfile } from '@/shared/hooks/use-user-profile'
import { getUserTopicProgress } from '@/features/learn/api'
import { queryKeys } from '@/shared/hooks/query-keys'

/**
 * Hook to get topic progress statistics (completed lessons count)
 */
export function useTopicProgressStats(topicId: number, initialData?: any[]) {
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

  // Count completed lessons (status === 'passed')
  const completedLessons = topicProgress.filter(p => p.status === 'passed').length

  return {
    completedLessons,
    isLoading,
  }
}

