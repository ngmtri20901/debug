'use server'

import { createClient, isSupabaseConfigured } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Input for creating a review session
 */
export interface CreateReviewSessionInput {
  session_type: 'daily' | 'custom'
  total_cards: number
  session_config?: Record<string, unknown>
  filters_applied?: Record<string, unknown>
}

/**
 * Result from creating a review session
 */
export interface CreateReviewSessionResult {
  success: boolean
  data?: {
    id: string
    user_id: string
    session_type: string
    total_cards: number
    created_at: string
  }
  error?: string
}

/**
 * Input for creating session card mappings
 */
export interface CreateSessionCardMappingsInput {
  session_id: string
  flashcards: Array<{
    id?: string
    _id?: string
    [key: string]: unknown
  }>
}

/**
 * Result from creating session card mappings
 */
export interface CreateSessionCardMappingsResult {
  success: boolean
  data?: {
    inserted_count: number
    failed_count: number
  }
  error?: string
}

/**
 * Server action to create a review session
 * Uses server-side Supabase client to avoid cookie conflicts
 */
export async function createReviewSession(
  input: CreateReviewSessionInput
): Promise<CreateReviewSessionResult> {
  try {
    console.log('💾 [Server Action] createReviewSession called:', input)

    // Early return if Supabase is not configured
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase is not configured'
      }
    }

    // Get server-side Supabase client with fresh session
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    console.log('👤 [Server Action] User authentication:', {
      authenticated: !!user,
      userId: user?.id
    })

    if (userError || !user) {
      return {
        success: false,
        error: 'Not authenticated - please log in first'
      }
    }

    // Prepare session data to match database schema
    const sessionData = {
      user_id: user.id,
      session_type: input.session_type,
      total_cards: input.total_cards,
      session_config: input.session_config || {},
      filters_applied: input.filters_applied || {}
    }

    console.log('💾 [Server Action] Inserting session data:', sessionData)

    // Insert session into database
    // Use server-side client which uses HttpOnly cookies
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as any
    const { data: sessionResult, error: insertError } = await supabaseAny
      .from('review_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ [Server Action] Database insert error:', insertError)
      return {
        success: false,
        error: insertError.message || 'Failed to create session'
      }
    }

    if (!sessionResult) {
      return {
        success: false,
        error: 'Failed to create session - no data returned'
      }
    }

    console.log('✅ [Server Action] Session created successfully:', sessionResult.id)

    // Revalidate review pages
    revalidatePath('/flashcards/review')

    return {
      success: true,
      data: {
        id: sessionResult.id,
        user_id: sessionResult.user_id,
        session_type: sessionResult.session_type,
        total_cards: sessionResult.total_cards,
        created_at: sessionResult.created_at
      }
    }
  } catch (error) {
    console.error('❌ [Server Action] Error creating session:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session'
    }
  }
}

/**
 * Server action to create session card mappings
 * Maps flashcards to a review session
 */
export async function createSessionCardMappings(
  input: CreateSessionCardMappingsInput
): Promise<CreateSessionCardMappingsResult> {
  try {
    console.log('📝 [Server Action] createSessionCardMappings called:', {
      session_id: input.session_id,
      flashcard_count: input.flashcards.length
    })

    // Early return if Supabase is not configured
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase is not configured'
      }
    }

    // Get server-side Supabase client with fresh session
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Not authenticated - please log in first'
      }
    }

    // Prepare rows for insertion
    const rows = input.flashcards.map((fc, idx) => {
      // Backend returns FlashcardResponse objects, extract the ID
      const flashcardId = typeof fc === 'string' ? fc : (fc?.id ?? fc?._id ?? '')
      return {
        session_id: input.session_id,
        flashcard_id: flashcardId,
        flashcard_type: 'APP' as const,
        card_order: idx + 1
      }
    }).filter(r => r.flashcard_id) // Only include valid flashcard IDs

    console.log(`📝 [Server Action] Inserting ${rows.length} session card mappings`)

    // Insert in batches to avoid payload limits
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as any
    const batchSize = 100
    let insertedCount = 0
    let failedCount = 0

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      const { error: mapErr } = await supabaseAny
        .from('review_session_cards')
        .insert(batch)

      if (mapErr) {
        console.error(`❌ [Server Action] Error inserting batch ${i / batchSize + 1}:`, mapErr)
        failedCount += batch.length
      } else {
        insertedCount += batch.length
        console.log(`✅ [Server Action] Inserted batch ${i / batchSize + 1} (${batch.length} cards)`)
      }
    }

    console.log(`✅ [Server Action] Total cards mapped: ${insertedCount}/${rows.length}`)

    // Revalidate review pages
    revalidatePath('/flashcards/review')

    return {
      success: true,
      data: {
        inserted_count: insertedCount,
        failed_count: failedCount
      }
    }
  } catch (error) {
    console.error('❌ [Server Action] Error creating session card mappings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session card mappings'
    }
  }
}
