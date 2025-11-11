import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface QuestionAttempt {
  questionId: string
  userAnswer: any
  status: 'answered' | 'skipped'
  timeSpentMs: number
  grade: {
    isCorrect: boolean
    score: number
    feedback: string
  }
}

interface SubmitExerciseRequest {
  practiceResultId: string
  practiceSetId: string
  scorePercent: number
  totalCorrect: number
  totalIncorrect: number
  totalSkipped: number
  timeSpentSeconds: number
  attempts: QuestionAttempt[]
  passed: boolean
}

/**
 * POST /api/exercise/submit
 * 
 * Submits completed exercise results and updates practice_result to 'completed'
 * 
 * Request body: SubmitExerciseRequest
 * 
 * Response:
 * {
 *   success: boolean
 *   practiceResultId?: string
 *   isFirstPass?: boolean
 *   coinsEarned?: number
 *   xpEarned?: number
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Handle error
            }
          },
        },
      }
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('[API /exercise/submit] Authentication failed:', authError)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: SubmitExerciseRequest = await request.json()
    const {
      practiceResultId,
      practiceSetId,
      scorePercent,
      totalCorrect,
      totalIncorrect,
      totalSkipped,
      timeSpentSeconds,
      attempts,
      passed
    } = body

    console.log('[API /exercise/submit] Submitting exercise:', {
      userId: user.id,
      practiceResultId,
      practiceSetId,
      scorePercent,
      passed
    })

    // Validate practice result exists and is in_progress
    const { data: existingResult, error: resultError } = await supabase
      .from('practice_results')
      .select('id, user_id, status')
      .eq('id', practiceResultId)
      .eq('user_id', user.id)
      .single()

    if (resultError || !existingResult) {
      console.error('[API /exercise/submit] Practice result not found:', resultError)
      return NextResponse.json(
        { success: false, error: 'Practice result not found' },
        { status: 404 }
      )
    }

    if (existingResult.status !== 'in_progress') {
      console.error('[API /exercise/submit] Practice result not in progress:', existingResult.status)
      return NextResponse.json(
        { success: false, error: 'Practice result already submitted' },
        { status: 400 }
      )
    }

    // Get practice set details for rewards and zone information
    const { data: practiceSet, error: practiceSetError } = await supabase
      .from('practice_sets')
      .select(`
        lesson_id, 
        topic_id, 
        coin_reward, 
        xp_reward, 
        pass_threshold,
        topics!inner (
          zone_id,
          zones!inner (
            level
          )
        )
      `)
      .eq('id', practiceSetId)
      .single()

    if (practiceSetError || !practiceSet) {
      console.error('[API /exercise/submit] Practice set not found:', practiceSetError)
      return NextResponse.json(
        { success: false, error: 'Practice set not found' },
        { status: 404 }
      )
    }

    // Calculate zone-based pass condition server-side for consistency
    const zoneLevel = (practiceSet.topics as any)?.zones?.level || 1
    const zoneThresholds: Record<number, number> = {
      1: 65, // Beginner
      2: 70, // Elementary
      3: 75, // Intermediate
      4: 80, // Upper-Intermediate
      5: 80, // Advanced
    }
    const zoneThreshold = zoneThresholds[zoneLevel] || 80
    const serverSidePassed = scorePercent >= zoneThreshold

    console.log('[API /exercise/submit] Pass condition check:', {
      scorePercent,
      zoneLevel,
      zoneThreshold,
      clientPassed: passed,
      serverPassed: serverSidePassed
    })

    // Check if this is first pass
    const { data: existingPasses } = await supabase
      .from('practice_results')
      .select('passed')
      .eq('user_id', user.id)
      .eq('practice_set_id', practiceSetId)
      .eq('passed', true)
      .neq('id', practiceResultId) // Exclude current attempt

    const isFirstPass = (!existingPasses || existingPasses.length === 0) && serverSidePassed

    // Calculate weak question types
    const weakQuestionTypes: Record<string, number> = {}
    attempts.forEach(attempt => {
      if (!attempt.grade.isCorrect) {
        const questionType = (attempt as any).questionType || 'unknown'
        weakQuestionTypes[questionType] = (weakQuestionTypes[questionType] || 0) + 1
      }
    })

    // Update practice_results record
    const { error: updateError } = await supabase
      .from('practice_results')
      .update({
        status: 'completed',
        score_percent: scorePercent,
        total_correct: totalCorrect,
        total_incorrect: totalIncorrect,
        total_skipped: totalSkipped,
        time_spent_seconds: timeSpentSeconds,
        weak_question_types: weakQuestionTypes,
        passed: serverSidePassed,
        is_first_pass: isFirstPass,
        coins_earned: isFirstPass ? (practiceSet.coin_reward || 0) : 0,
        xp_earned: isFirstPass ? (practiceSet.xp_reward || 0) : 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', practiceResultId)

    if (updateError) {
      console.error('[API /exercise/submit] Failed to update practice_result:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    console.log('[API /exercise/submit] Updated practice_result successfully')

    // Insert practice_result_details records
    const detailsToInsert = attempts.map(attempt => ({
      practice_result_id: practiceResultId,
      question_id: parseInt(attempt.questionId) || null,
      is_correct: attempt.grade.isCorrect,
      time_spent_ms: attempt.timeSpentMs,
      answer_data: {
        userAnswer: attempt.userAnswer,
        score: attempt.grade.score,
        feedback: attempt.grade.feedback
      },
      status: attempt.status
    }))

    const { error: detailsError } = await supabase
      .from('practice_result_details')
      .insert(detailsToInsert)

    if (detailsError) {
      console.error('[API /exercise/submit] Failed to insert practice_result_details:', detailsError)
      // Don't fail completely if details save fails, continue with other operations
    } else {
      console.log('[API /exercise/submit] Inserted', detailsToInsert.length, 'practice_result_details')
    }

    // Update/insert user_lesson_progress (if lesson_id and topic_id exist)
    if (practiceSet.lesson_id && practiceSet.topic_id) {
      const { data: existingProgress } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', practiceSet.lesson_id)
        .single()

      const now = new Date().toISOString()

      if (existingProgress) {
        // Update existing progress
        const updateData: any = {
          total_attempts: (existingProgress.total_attempts || 0) + 1,
          last_attempted_at: now,
          updated_at: now,
          pass_threshold: zoneThreshold
        }

        // Update best score if current is better
        if (scorePercent > (existingProgress.best_score_percent || 0)) {
          updateData.best_score_percent = scorePercent
        }

        // Update status if passed
        if (serverSidePassed && existingProgress.status !== 'passed') {
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
          console.error('[API /exercise/submit] Failed to update user_lesson_progress:', progressError)
        } else {
          console.log('[API /exercise/submit] Updated user_lesson_progress')
        }
      } else {
        // Insert new progress record
        const { error: progressError } = await supabase
          .from('user_lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: practiceSet.lesson_id,
            topic_id: practiceSet.topic_id,
            total_attempts: 1,
            best_score_percent: scorePercent,
            status: serverSidePassed ? 'passed' : 'in_progress',
            first_attempted_at: now,
            last_attempted_at: now,
            passed_at: serverSidePassed ? now : null,
            pass_threshold: zoneThreshold
          })

        if (progressError) {
          console.error('[API /exercise/submit] Failed to insert user_lesson_progress:', progressError)
        } else {
          console.log('[API /exercise/submit] Inserted user_lesson_progress')
        }
      }
    }

    // Award coins and XP if first pass
    if (isFirstPass) {
      const { error: rewardError } = await supabase.rpc('award_user_rewards', {
        p_user_id: user.id,
        p_coins: practiceSet.coin_reward || 0,
        p_xp: practiceSet.xp_reward || 0,
      })

      if (rewardError) {
        console.error('[API /exercise/submit] Failed to award rewards:', rewardError)
      } else {
        console.log('[API /exercise/submit] Awarded rewards:', {
          coins: practiceSet.coin_reward,
          xp: practiceSet.xp_reward
        })
      }
    }

    return NextResponse.json({
      success: true,
      practiceResultId,
      isFirstPass,
      coinsEarned: isFirstPass ? (practiceSet.coin_reward || 0) : 0,
      xpEarned: isFirstPass ? (practiceSet.xp_reward || 0) : 0,
      // ✅ Thêm topicId và lessonId để frontend biết invalidate cache nào
      topicId: practiceSet.topic_id,
      lessonId: practiceSet.lesson_id
    })

  } catch (error) {
    console.error('[API /exercise/submit] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
