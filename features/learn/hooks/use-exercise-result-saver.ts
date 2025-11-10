"use client"

import { useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { QuestionAttempt } from '@/features/learn/utils'

export interface ExerciseResultData {
  practiceSetId: string
  userId: string
  scorePercent: number
  totalCorrect: number
  totalIncorrect: number
  totalSkipped: number
  timeSpentSeconds: number
  weakQuestionTypes?: Record<string, number>
  attempts: QuestionAttempt[]
  passed: boolean
  lessonId?: number
  topicId?: number
}

/**
 * Hook for saving exercise results to Supabase
 * Handles both practice_results and practice_result_details tables
 */
export function useExerciseResultSaver() {
  const supabase = createClient()
  const isSaving = useRef(false)

  const saveExerciseResult = useCallback(async (data: ExerciseResultData) => {
    // Prevent duplicate saves
    if (isSaving.current) {
      console.warn('[useExerciseResultSaver] Save already in progress, skipping')
      return { success: false, error: 'Save already in progress' }
    }

    isSaving.current = true

    try {
      console.log('[useExerciseResultSaver] Starting save for practice set:', data.practiceSetId)

      // 1. Get practice set details
      const { data: practiceSet, error: practiceSetError } = await supabase
        .from('practice_sets')
        .select('lesson_id, topic_id, coin_reward, xp_reward, pass_threshold')
        .eq('id', data.practiceSetId)
        .single()

      if (practiceSetError || !practiceSet) {
        console.error('[useExerciseResultSaver] Practice set not found:', practiceSetError)
        return { success: false, error: 'Practice set not found' }
      }

      // 2. Calculate attempt number
      const { count: attemptCount } = await supabase
        .from('practice_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', data.userId)
        .eq('practice_set_id', data.practiceSetId)

      const attemptNo = (attemptCount || 0) + 1

      // 3. Check if this is first pass
      const { data: existingPasses } = await supabase
        .from('practice_results')
        .select('passed')
        .eq('user_id', data.userId)
        .eq('practice_set_id', data.practiceSetId)
        .eq('passed', true)

      const isFirstPass = (!existingPasses || existingPasses.length === 0) && data.passed

      // 4. Calculate weak question types
      const weakQuestionTypes: Record<string, number> = {}
      data.attempts.forEach(attempt => {
        if (!attempt.grade.isCorrect) {
          const questionType = (attempt as any).questionType || 'unknown'
          weakQuestionTypes[questionType] = (weakQuestionTypes[questionType] || 0) + 1
        }
      })

      // 5. Insert practice_results record
      const { data: practiceResult, error: resultError } = await supabase
        .from('practice_results')
        .insert({
          user_id: data.userId,
          practice_set_id: data.practiceSetId,
          practice_date: new Date().toISOString().split('T')[0],
          score_percent: data.scorePercent,
          total_correct: data.totalCorrect,
          total_incorrect: data.totalIncorrect,
          total_skipped: data.totalSkipped,
          time_spent_seconds: data.timeSpentSeconds,
          weak_question_types: weakQuestionTypes,
          coins_earned: isFirstPass ? (practiceSet.coin_reward || 0) : 0,
          xp_earned: isFirstPass ? (practiceSet.xp_reward || 0) : 0,
          is_first_pass: isFirstPass,
          passed: data.passed,
          attempt_no: attemptNo,
          status: 'completed',
          pass_criteria: {
            min_accuracy: practiceSet.pass_threshold || 80,
            min_correct: null
          }
        })
        .select()
        .single()

      if (resultError) {
        console.error('[useExerciseResultSaver] Error saving practice_results:', resultError)
        return { success: false, error: resultError.message }
      }

      console.log('[useExerciseResultSaver] Saved practice_results:', practiceResult.id)

      // 6. Insert practice_result_details records
      const detailsToInsert = data.attempts.map(attempt => ({
        practice_result_id: practiceResult.id,
        question_id: parseInt(attempt.questionId) || null,
        is_correct: attempt.grade.isCorrect,
        time_spent_ms: attempt.timeSpentMs,
        answer_data: {
          userAnswer: attempt.userAnswer,
          score: attempt.grade.score,
          feedback: attempt.grade.feedback
        },
        status: attempt.status || 'answered'
      }))

      const { error: detailsError } = await supabase
        .from('practice_result_details')
        .insert(detailsToInsert)

      if (detailsError) {
        console.error('[useExerciseResultSaver] Error saving practice_result_details:', detailsError)
        // Don't fail completely if details save fails
      } else {
        console.log('[useExerciseResultSaver] Saved', detailsToInsert.length, 'practice_result_details')
      }

      // 7. Update/insert user_lesson_progress
      if (practiceSet.lesson_id && practiceSet.topic_id) {
        const { data: existingProgress } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', data.userId)
          .eq('lesson_id', practiceSet.lesson_id)
          .single()

        const now = new Date().toISOString()

        if (existingProgress) {
          // Update existing progress
          const updateData: any = {
            total_attempts: (existingProgress.total_attempts || 0) + 1,
            last_attempted_at: now,
            updated_at: now
          }

          // Update best score if current is better
          if (data.scorePercent > (existingProgress.best_score_percent || 0)) {
            updateData.best_score_percent = data.scorePercent
          }

          // Update status if passed
          if (data.passed && existingProgress.status !== 'passed') {
            updateData.status = 'passed'
            updateData.passed_at = now
          } else if (existingProgress.status === 'not_started') {
            updateData.status = 'in_progress'
          }

          const { error: progressError } = await supabase
            .from('user_lesson_progress')
            .update(updateData)
            .eq('id', existingProgress.id)

          if (progressError) {
            console.error('[useExerciseResultSaver] Error updating user_lesson_progress:', progressError)
          }
        } else {
          // Insert new progress record
          const { error: progressError } = await supabase
            .from('user_lesson_progress')
            .insert({
              user_id: data.userId,
              lesson_id: practiceSet.lesson_id,
              topic_id: practiceSet.topic_id,
              total_attempts: 1,
              best_score_percent: data.scorePercent,
              status: data.passed ? 'passed' : 'in_progress',
              first_attempted_at: now,
              last_attempted_at: now,
              passed_at: data.passed ? now : null,
              pass_threshold: practiceSet.pass_threshold || 80
            })

          if (progressError) {
            console.error('[useExerciseResultSaver] Error inserting user_lesson_progress:', progressError)
          }
        }
      }

      // 8. Award coins and XP if first pass
      if (isFirstPass) {
        const { error: rewardError } = await supabase.rpc('award_user_rewards', {
          p_user_id: data.userId,
          p_coins: practiceSet.coin_reward || 0,
          p_xp: practiceSet.xp_reward || 0,
        })

        if (rewardError) {
          console.error('[useExerciseResultSaver] Error awarding rewards:', rewardError)
        } else {
          console.log('[useExerciseResultSaver] Awarded rewards:', {
            coins: practiceSet.coin_reward,
            xp: practiceSet.xp_reward
          })
        }
      }

      return { 
        success: true, 
        practiceResultId: practiceResult.id,
        isFirstPass,
        coinsEarned: isFirstPass ? (practiceSet.coin_reward || 0) : 0,
        xpEarned: isFirstPass ? (practiceSet.xp_reward || 0) : 0
      }
    } catch (error) {
      console.error('[useExerciseResultSaver] Unexpected error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      isSaving.current = false
    }
  }, [supabase])

  return { saveExerciseResult }
}
