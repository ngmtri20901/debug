import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/exercise/resume?practiceSetId={uuid}
 * 
 * Gets existing in_progress practice_result for resuming an exercise
 * 
 * Query params:
 * - practiceSetId: string (uuid)
 * 
 * Response:
 * {
 *   success: boolean
 *   practiceResult?: {
 *     id: string
 *     attemptNo: number
 *     details: Array<{...}>
 *   }
 *   error?: string
 * }
 */
export async function GET(request: NextRequest) {
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
      console.error('[API /exercise/resume] Authentication failed:', authError)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get practiceSetId from query params
    const { searchParams } = new URL(request.url)
    const practiceSetId = searchParams.get('practiceSetId')

    if (!practiceSetId) {
      return NextResponse.json(
        { success: false, error: 'practiceSetId is required' },
        { status: 400 }
      )
    }

    console.log('[API /exercise/resume] Checking for in_progress session:', {
      userId: user.id,
      practiceSetId
    })

    // Find existing in_progress session
    const { data: practiceResult, error: resultError } = await supabase
      .from('practice_results')
      .select('id, attempt_no, created_at, status')
      .eq('user_id', user.id)
      .eq('practice_set_id', practiceSetId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (resultError) {
      console.error('[API /exercise/resume] Database error:', resultError)
      return NextResponse.json(
        { success: false, error: resultError.message },
        { status: 500 }
      )
    }

    if (!practiceResult) {
      console.log('[API /exercise/resume] No in_progress session found')
      return NextResponse.json({
        success: true,
        practiceResult: null
      })
    }

    // Get practice_result_details if any
    const { data: details, error: detailsError } = await supabase
      .from('practice_result_details')
      .select('*')
      .eq('practice_result_id', practiceResult.id)
      .order('created_at', { ascending: true })

    if (detailsError) {
      console.error('[API /exercise/resume] Failed to fetch details:', detailsError)
      // Continue without details
    }

    console.log('[API /exercise/resume] Found in_progress session:', {
      practiceResultId: practiceResult.id,
      attemptNo: practiceResult.attempt_no,
      detailsCount: details?.length || 0
    })

    return NextResponse.json({
      success: true,
      practiceResult: {
        id: practiceResult.id,
        attemptNo: practiceResult.attempt_no,
        details: details || []
      }
    })

  } catch (error) {
    console.error('[API /exercise/resume] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
