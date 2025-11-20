/**
 * Progress API service layer for tracking user progress
 * Uses Supabase for data fetching and updates
 */

import { supabase, getCurrentUser } from '@/lib/supabase/client'
import type {
  UserLessonProgress,
  ZoneCompletionStats,
  TopicProgressSummary,
  ZoneProgressSummary,
} from '../types'

/**
 * Get user progress for a specific lesson
 */
export async function getUserLessonProgress(
  userId: string,
  lessonId: number
): Promise<UserLessonProgress | null> {
  try {
    const { data, error } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()

    if (error || !data) return null

    return data as UserLessonProgress
  } catch (error) {
    console.error('[getUserLessonProgress] Error:', error)
    return null
  }
}

/**
 * Get all user progress records for a specific topic
 */
export async function getUserTopicProgress(
  userId: string,
  topicId: number
): Promise<UserLessonProgress[]> {
  try {
    const { data, error } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .order('lesson_id', { ascending: true })

    if (error || !data) return []

    return data as UserLessonProgress[]
  } catch (error) {
    console.error('[getUserTopicProgress] Error:', error)
    return []
  }
}

/**
 * Get all user progress records for a specific zone
 */
export async function getUserZoneProgress(
  userId: string,
  zoneId: number
): Promise<UserLessonProgress[]> {
  try {
    // First get all topics in the zone
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('topic_id')
      .eq('zone_id', zoneId)

    if (topicsError || !topics || topics.length === 0) return []

    const topicIds = topics.map((t) => t.topic_id)

    // Get progress for all lessons in these topics
    const { data, error } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .in('topic_id', topicIds)
      .order('topic_id', { ascending: true })

    if (error || !data) return []

    return data as UserLessonProgress[]
  } catch (error) {
    console.error('[getUserZoneProgress] Error:', error)
    return []
  }
}

/**
 * Calculate zone completion statistics
 * Returns number of completed topics vs total topics in zone
 */
export async function getZoneCompletionStats(params: {
  userId: string
  zoneId: number
}): Promise<ZoneCompletionStats> {
  const { userId, zoneId } = params

  try {
    // Get all topics in the zone
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('topic_id')
      .eq('zone_id', zoneId)

    if (topicsError || !topics) {
      return { completed: 0, total: 0 }
    }

    const topicIds = topics.map((t) => t.topic_id)
    const totalTopics = topicIds.length

    if (totalTopics === 0) {
      return { completed: 0, total: 0 }
    }

    // Get all lessons in these topics
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, topic_id')
      .in('topic_id', topicIds)
      .eq('status', 'published')

    if (lessonsError || !lessons) {
      return { completed: 0, total: totalTopics }
    }

    // Get user progress for all lessons in this zone (only passed)
    const lessonIds = lessons.map((l) => l.id)

    const { data: progressRecords, error: progressError } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, topic_id, status')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)
      .eq('status', 'passed')

    if (progressError || !progressRecords) {
      return { completed: 0, total: totalTopics }
    }

    // Count how many topics have ALL lessons passed
    const topicCompletionMap = new Map<number, { total: number; passed: number }>()

    // Initialize counts
    topicIds.forEach((topicId: number) => {
      const topicLessons = lessons.filter((l) => l.topic_id === topicId)
      topicCompletionMap.set(topicId, { total: topicLessons.length, passed: 0 })
    })

    // Count passed lessons per topic
    progressRecords.forEach((progress: any) => {
      const topicData = topicCompletionMap.get(progress.topic_id)
      if (topicData) {
        topicData.passed += 1
      }
    })

    // Count how many topics are fully completed (all lessons passed)
    let completedTopics = 0
    topicCompletionMap.forEach((data) => {
      if (data.total > 0 && data.passed >= data.total) {
        completedTopics += 1
      }
    })

    return { completed: completedTopics, total: totalTopics }
  } catch (error) {
    console.error('[getZoneCompletionStats] Error:', error)
    return { completed: 0, total: 0 }
  }
}

/**
 * Get topic progress summary for a user
 */
export async function getTopicProgressSummary(
  userId: string,
  topicId: number
): Promise<TopicProgressSummary | null> {
  try {
    // Get topic info
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('topic_id, title, slug')
      .eq('topic_id', topicId)
      .single()

    if (topicError || !topic) return null

    // Get all lessons in topic
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('topic_id', topicId)
      .eq('status', 'published')

    if (lessonsError || !lessons) return null

    const totalLessons = lessons.length
    const lessonIds = lessons.map((l) => l.id)

    // Get user progress for these lessons
    const { data: progressRecords, error: progressError } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, status')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)
      .eq('status', 'passed')

    const completedLessons = progressRecords?.length || 0
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    const isCompleted = completedLessons >= totalLessons && totalLessons > 0

    return {
      topic_id: topicId,
      title: topic.title,
      slug: topic.slug,
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      progress_percent: progressPercent,
      is_completed: isCompleted,
    }
  } catch (error) {
    console.error('[getTopicProgressSummary] Error:', error)
    return null
  }
}

/**
 * Get zone progress summary for a user
 */
export async function getZoneProgressSummary(
  userId: string,
  zoneId: number
): Promise<ZoneProgressSummary | null> {
  try {
    // Get zone info
    const { data: zone, error: zoneError } = await supabase
      .from('zones')
      .select('id, name, level')
      .eq('id', zoneId)
      .single()

    if (zoneError || !zone) return null

    // Get completion stats
    const stats = await getZoneCompletionStats({ userId, zoneId })

    const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

    // Determine if zone is unlocked (Beginner is always unlocked, others need previous zone completion)
    let isUnlocked = zone.level === 1 // Beginner always unlocked

    if (zone.level > 1) {
      // Check if previous zone is completed
      const { data: previousZone } = await supabase
        .from('zones')
        .select('id')
        .eq('level', zone.level - 1)
        .single()

      if (previousZone) {
        const prevStats = await getZoneCompletionStats({ userId, zoneId: previousZone.id })
        isUnlocked = prevStats.total > 0 && prevStats.completed >= prevStats.total
      }
    }

    return {
      zone_id: zoneId,
      name: zone.name,
      level: zone.level,
      total_topics: stats.total,
      completed_topics: stats.completed,
      progress_percent: progressPercent,
      is_unlocked: isUnlocked,
    }
  } catch (error) {
    console.error('[getZoneProgressSummary] Error:', error)
    return null
  }
}

/**
 * Get all zones progress summary for current user
 */
export async function getAllZonesProgressSummary(): Promise<ZoneProgressSummary[]> {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    // Get all zones
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select('id, name, level')
      .order('level', { ascending: true })

    if (zonesError || !zones) return []

    // Get progress summary for each zone
    const summaries = await Promise.all(
      zones.map((zone) => getZoneProgressSummary(user.id, zone.id))
    )

    return summaries.filter((s): s is ZoneProgressSummary => s !== null)
  } catch (error) {
    console.error('[getAllZonesProgressSummary] Error:', error)
    return []
  }
}

/**
 * Get count of completed topics in previous zone (for unlock logic)
 */
export async function getCompletedTopicsInPreviousZone(
  userId: string,
  currentZoneLevel: number
): Promise<{ completed: number; total: number }> {
  try {
    if (currentZoneLevel <= 1) {
      return { completed: 0, total: 0 } // No previous zone
    }

    // Get previous zone
    const { data: previousZone, error: zoneError } = await supabase
      .from('zones')
      .select('id')
      .eq('level', currentZoneLevel - 1)
      .single()

    if (zoneError || !previousZone) {
      return { completed: 0, total: 0 }
    }

    return await getZoneCompletionStats({ userId, zoneId: previousZone.id })
  } catch (error) {
    console.error('[getCompletedTopicsInPreviousZone] Error:', error)
    return { completed: 0, total: 0 }
  }
}
