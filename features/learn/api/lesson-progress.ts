import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type PracticeResult = Database['public']['Tables']['practice_results']['Row']
type PracticeResultInsert = Database['public']['Tables']['practice_results']['Insert']

export interface UserLessonProgress {
  id: string
  user_id: string
  lesson_id: number
  topic_id: number
  best_score_percent: number
  total_attempts: number
  pass_threshold: number
  status: 'not_started' | 'in_progress' | 'passed'
  first_attempted_at: string | null
  last_attempted_at: string | null
  passed_at: string | null
}

export interface SubmitAttemptParams {
  practiceSetId: string
  scorePercent: number
  totalCorrect: number
  totalIncorrect: number
  totalSkipped: number
  timeSpentSeconds: number
  weakQuestionTypes?: Record<string, any>
}

/**
 * Submit a lesson attempt and track progress
 * Awards coins and XP only on first pass (score >= threshold and no previous pass)
 */
export async function submitLessonAttempt(
  params: SubmitAttemptParams
): Promise<{ success: boolean; result: PracticeResult | null; error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, result: null, error: 'User not authenticated' }
    }

    // Get practice set details including reward information
    const { data: practiceSet } = await supabase
      .from('practice_sets')
      .select('lesson_id, coin_reward, xp_reward, pass_threshold')
      .eq('id', params.practiceSetId)
      .single()

    if (!practiceSet?.lesson_id) {
      return { success: false, result: null, error: 'Practice set not linked to lesson' }
    }

    // Check for existing pass to determine if this is first pass
    const { data: existingResults } = await supabase
      .from('practice_results')
      .select('score_percent')
      .eq('user_id', user.id)
      .eq('practice_set_id', params.practiceSetId)
      .gte('score_percent', practiceSet.pass_threshold || 80)

    const isFirstPass = !existingResults || existingResults.length === 0
    const shouldReward = isFirstPass && params.scorePercent >= (practiceSet.pass_threshold || 80)

    // Insert practice result - using ONLY existing columns in practice_results table
    const { data: result, error } = await supabase
      .from('practice_results')
      .insert({
        user_id: user.id,
        practice_set_id: params.practiceSetId,
        practice_date: new Date().toISOString().split('T')[0],
        score_percent: params.scorePercent,
        total_correct: params.totalCorrect,
        total_incorrect: params.totalIncorrect,
        weak_question_types: params.weakQuestionTypes || {},
        // Note: time_taken column exists but expects time type, not integer
        // Note: total_skipped, coins_earned, xp_earned, is_first_pass, time_spent_seconds 
        // may not exist - will be added via ALTER TABLE migration
      })
      .select()
      .single()

    if (error) {
      console.error('[submitLessonAttempt] Error:', error)
      console.error('[submitLessonAttempt] Error details:', JSON.stringify(error, null, 2))
      return { success: false, result: null, error: error.message }
    }

    // Award coins and XP to user profile if first pass
    if (shouldReward) {
      const { error: rewardError } = await supabase.rpc('award_user_rewards', {
        p_user_id: user.id,
        p_coins: practiceSet.coin_reward || 0,
        p_xp: practiceSet.xp_reward || 0,
      })

      if (rewardError) {
        console.error('[submitLessonAttempt] Reward error:', rewardError)
        // Don't fail the whole operation if reward fails
      }
    }

    return { success: true, result, error: undefined }
  } catch (err) {
    console.error('[submitLessonAttempt] Exception:', err)
    return { 
      success: false, 
      result: null, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }
  }
}

/**
 * Get user progress for a specific lesson
 */
export async function getUserLessonProgress(
  userId: string,
  lessonId: number
): Promise<UserLessonProgress | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single()

  if (error || !data) return null
  return data as UserLessonProgress
}

/**
 * Get all user progress records for a specific topic
 */
export async function getUserTopicProgress(
  userId: string,
  topicId: number
): Promise<UserLessonProgress[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .order('lesson_id', { ascending: true })

  if (error || !data) return []
  return data as UserLessonProgress[]
}

/**
 * Get all user progress records for a specific zone
 */
export async function getUserZoneProgress(
  userId: string,
  zoneId: number
): Promise<UserLessonProgress[]> {
  const supabase = createClient()
  
  // First get all topics in the zone
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('topic_id')
    .eq('zone_id', zoneId)

  if (topicsError || !topics || topics.length === 0) return []

  const topicIds = topics.map(t => t.topic_id)

  // Get progress for all lessons in these topics
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .in('topic_id', topicIds)
    .order('topic_id', { ascending: true })

  if (error || !data) return []
  return data as UserLessonProgress[]
}

/**
 * Calculate zone completion statistics
 * Returns number of completed topics vs total topics in zone
 */
export async function getZoneCompletionStats(params: {
  userId: string
  zoneId: number
}): Promise<{ completed: number; total: number }> {
  const { userId, zoneId } = params
  const supabase = createClient()

  // Get all topics in the zone
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('topic_id')
    .eq('zone_id', zoneId)

  if (topicsError || !topics) {
    return { completed: 0, total: 0 }
  }

  const topicIds = topics.map(t => t.topic_id)
  const totalTopics = topicIds.length

  if (totalTopics === 0) {
    return { completed: 0, total: 0 }
  }

  // Get all lessons in these topics
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, topic_id')
    .in('topic_id', topicIds)

  if (lessonsError || !lessons) {
    return { completed: 0, total: totalTopics }
  }

  // Get user progress for all lessons in this zone (only passed)
  const lessonIds = lessons.map(l => l.id)
  
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
    const topicLessons = lessons.filter(l => l.topic_id === topicId)
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
}
