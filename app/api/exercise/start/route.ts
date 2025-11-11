import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/exercise/start
 * 
 * Starts an exercise session and creates an in_progress practice_result record
 * 
 * Request body:
 * {
 *   practiceSetId: string (uuid)
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   practiceResultId?: string (uuid)
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
      console.error('[API /exercise/start] Authentication failed:', authError)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { practiceSetId } = body

    if (!practiceSetId) {
      return NextResponse.json(
        { success: false, error: 'practiceSetId is required' },
        { status: 400 }
      )
    }

    console.log('[API /exercise/start] Starting exercise:', {
      userId: user.id,
      practiceSetId,
      practiceSetIdType: typeof practiceSetId
    })

    // Get practice set details
    const { data: practiceSet, error: practiceSetError } = await supabase
      .from('practice_sets')
      .select('id, lesson_id, topic_id, pass_threshold')
      .eq('id', practiceSetId)
      .single()

    if (practiceSetError || !practiceSet) {
      console.error('[API /exercise/start] Practice set not found:', practiceSetError)
      return NextResponse.json(
        { success: false, error: 'Practice set not found' },
        { status: 404 }
      )
    }

    // Check if there's already an in_progress session
    const { data: existingSession } = await supabase
      .from('practice_results')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('practice_set_id', practiceSetId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingSession) {
      console.log('[API /exercise/start] Resuming existing session:', existingSession.id)
      return NextResponse.json({
        success: true,
        practiceResultId: existingSession.id,
        resumed: true
      })
    }

    // Calculate attempt number
    const { count: attemptCount } = await supabase
      .from('practice_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('practice_set_id', practiceSetId)

    const attemptNo = (attemptCount || 0) + 1

    // Create new in_progress practice_result
    const { data: practiceResult, error: insertError } = await supabase
      .from('practice_results')
      .insert({
        user_id: user.id,
        practice_set_id: practiceSetId,
        practice_date: new Date().toISOString().split('T')[0],
        status: 'in_progress',
        attempt_no: attemptNo,
        score_percent: 0,
        total_correct: 0,
        total_incorrect: 0,
        total_skipped: 0,
        time_spent_seconds: 0,
        passed: false,
        pass_criteria: {
          min_accuracy: (practiceSet.pass_threshold || 0.8) * 100,
          min_correct: null
        }
      })
      .select('id')
      .single()

    if (insertError || !practiceResult) {
      console.error('[API /exercise/start] Failed to create practice_result:', insertError)
      return NextResponse.json(
        { success: false, error: insertError?.message || 'Failed to start exercise' },
        { status: 500 }
      )
    }

    console.log('[API /exercise/start] Exercise started successfully:', {
      practiceResultId: practiceResult.id,
      attemptNo
    })

    return NextResponse.json({
      success: true,
      practiceResultId: practiceResult.id,
      attemptNo,
      resumed: false
    })

  } catch (error) {
    console.error('[API /exercise/start] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
