"use client"

import { useCallback, useRef } from 'react'
import type { QuestionAttempt } from '@/features/learn/utils/exercise-utils'

export interface ExerciseSession {
  practiceResultId: string
  attemptNo: number
}

/**
 * Hook for managing exercise sessions via API routes
 * Handles starting, submitting, and resuming exercises
 */
export function useExerciseSession() {
  const isStarting = useRef(false)
  const isSubmitting = useRef(false)

  /**
   * Start a new exercise session
   * Creates a practice_result record with status 'in_progress'
   */
  const startExercise = useCallback(async (practiceSetId: string): Promise<ExerciseSession | null> => {
    if (isStarting.current) {
      console.warn('[useExerciseSession] Start already in progress')
      return null
    }

    isStarting.current = true

    try {
      console.log('[useExerciseSession] Starting exercise:', practiceSetId)

      const response = await fetch('/api/exercise/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ practiceSetId })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('[useExerciseSession] Failed to start exercise:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          data
        })
        return null
      }

      console.log('[useExerciseSession] Exercise started:', {
        practiceResultId: data.practiceResultId,
        attemptNo: data.attemptNo,
        resumed: data.resumed
      })

      return {
        practiceResultId: data.practiceResultId,
        attemptNo: data.attemptNo
      }
    } catch (error) {
      console.error('[useExerciseSession] Error starting exercise:', error)
      return null
    } finally {
      isStarting.current = false
    }
  }, [])

  /**
   * Submit completed exercise results
   * Updates practice_result to 'completed' and saves all details
   */
  const submitExercise = useCallback(async (data: {
    practiceResultId: string
    practiceSetId: string
    scorePercent: number
    totalCorrect: number
    totalIncorrect: number
    totalSkipped: number
    timeSpentSeconds: number
    attempts: QuestionAttempt[]
    passed: boolean
  }): Promise<{
    success: boolean
    isFirstPass?: boolean
    coinsEarned?: number
    xpEarned?: number
    topicId?: number
    lessonId?: number
    error?: string
  }> => {
    if (isSubmitting.current) {
      console.warn('[useExerciseSession] Submit already in progress')
      return { success: false, error: 'Submit already in progress' }
    }

    isSubmitting.current = true

    try {
      console.log('[useExerciseSession] Submitting exercise:', {
        practiceResultId: data.practiceResultId,
        scorePercent: data.scorePercent,
        passed: data.passed
      })

      const response = await fetch('/api/exercise/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error('[useExerciseSession] Failed to submit exercise:', result.error)
        return { success: false, error: result.error }
      }

      console.log('[useExerciseSession] Exercise submitted successfully:', {
        isFirstPass: result.isFirstPass,
        coinsEarned: result.coinsEarned,
        xpEarned: result.xpEarned
      })

      return result
    } catch (error) {
      console.error('[useExerciseSession] Error submitting exercise:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      isSubmitting.current = false
    }
  }, [])

  /**
   * Check for existing in_progress session to resume
   */
  const checkForResume = useCallback(async (practiceSetId: string): Promise<ExerciseSession | null> => {
    try {
      console.log('[useExerciseSession] Checking for in_progress session:', practiceSetId)

      const response = await fetch(`/api/exercise/resume?practiceSetId=${practiceSetId}`)

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('[useExerciseSession] Failed to check resume:', data.error)
        return null
      }

      if (data.practiceResult) {
        console.log('[useExerciseSession] Found in_progress session:', data.practiceResult.id)
        return {
          practiceResultId: data.practiceResult.id,
          attemptNo: data.practiceResult.attemptNo
        }
      }

      console.log('[useExerciseSession] No in_progress session found')
      return null
    } catch (error) {
      console.error('[useExerciseSession] Error checking resume:', error)
      return null
    }
  }, [])

  return {
    startExercise,
    submitExercise,
    checkForResume
  }
}
