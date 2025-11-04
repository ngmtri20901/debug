'use server'

import { createClient, isSupabaseConfigured } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server action to delete a custom flashcard
 * Deletes from both custom_flashcards and saved_flashcards tables
 */
export async function deleteCustomFlashcard(
  customFlashcardId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🗑️ [Server Action] deleteCustomFlashcard called:', customFlashcardId)

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

    // Step 1: Delete from saved_flashcards table first
    // Column name is UserID (capital U, capital ID) in saved_flashcards
    console.log('🗑️ [Server Action] Deleting from saved_flashcards...')
    const { error: savedDeleteError } = await supabaseAny
      .from('saved_flashcards')
      .delete()
      .eq('flashcard_id', `custom_${customFlashcardId}`)
      .eq('UserID', user.id)
      .eq('flashcard_type', 'CUSTOM')

    if (savedDeleteError) {
      console.error('❌ [Server Action] Error deleting from saved_flashcards:', savedDeleteError)
      // Continue anyway - the record might not exist in saved_flashcards
    } else {
      console.log('✅ [Server Action] Deleted from saved_flashcards')
    }

    // Step 2: Delete from custom_flashcards table
    // Column name is user_id (lowercase) in custom_flashcards
    console.log('🗑️ [Server Action] Deleting from custom_flashcards...')
    const { error: customDeleteError } = await supabaseAny
      .from('custom_flashcards')
      .delete()
      .eq('id', customFlashcardId)
      .eq('user_id', user.id)

    if (customDeleteError) {
      console.error('❌ [Server Action] Error deleting from custom_flashcards:', customDeleteError)
      return {
        success: false,
        error: customDeleteError.message || 'Failed to delete flashcard'
      }
    }

    console.log('✅ [Server Action] Successfully deleted custom flashcard')

    // Revalidate the saved flashcards page
    revalidatePath('/flashcards/saved')

    return {
      success: true
    }
  } catch (error) {
    console.error('❌ [Server Action] Error deleting flashcard:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete flashcard'
    }
  }
}
