'use server'

import { createClient, isSupabaseConfigured } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server action to unsave an APP flashcard
 * Only deletes from saved_flashcards table
 */
export async function unsaveAppFlashcard(
  savedFlashcardId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🗑️ [Server Action] unsaveAppFlashcard called:', savedFlashcardId)

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as any

    // Delete from saved_flashcards table
    // Column name is UserID (capital U, capital ID)
    console.log('🗑️ [Server Action] Deleting from saved_flashcards...')
    const { error: deleteError } = await supabaseAny
      .from('saved_flashcards')
      .delete()
      .eq('id', savedFlashcardId)
      .eq('UserID', user.id)

    if (deleteError) {
      console.error('❌ [Server Action] Error unsaving flashcard:', deleteError)
      return {
        success: false,
        error: deleteError.message || 'Failed to unsave flashcard'
      }
    }

    console.log('✅ [Server Action] Successfully unsaved APP flashcard')

    // Revalidate the saved flashcards page
    revalidatePath('/flashcards/saved')

    return {
      success: true
    }
  } catch (error) {
    console.error('❌ [Server Action] Error unsaving flashcard:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unsave flashcard'
    }
  }
}
