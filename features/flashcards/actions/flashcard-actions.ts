'use server'

import { createClient, isSupabaseConfigured } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateFlashcardInput {
  vietnamese_text: string
  english_text: string
  ipa_pronunciation?: string | null
  image_url?: string | null
  topic?: string | null
  notes?: string | null
}

export interface CreateFlashcardResult {
  success: boolean
  data?: {
    id: string
    vietnamese_text: string
    english_text: string
  }
  error?: string
}

/**
 * Server action to create a flashcard
 * Uses server-side Supabase client with fresh tokens
 */
export async function createFlashcard(
  input: CreateFlashcardInput
): Promise<CreateFlashcardResult> {
  try {
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

    // Prepare insert data
    const insertData = {
      user_id: user.id,
      vietnamese_text: input.vietnamese_text.trim(),
      english_text: input.english_text.trim(),
      ipa_pronunciation: input.ipa_pronunciation?.trim() || null,
      image_url: input.image_url || null,
      topic: input.topic?.trim() || null,
      notes: input.notes || null,
      status: 'ACTIVE' as const
    }

    // Insert flashcard into database
    // Cast to any to work around TypeScript union type issue with dummy client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as any
    const { data: flashcardDataResult, error: insertError } = await supabaseAny
      .from('custom_flashcards')
      .insert(insertData)
      .select('id, vietnamese_text, english_text')
      .single()

    if (insertError) {
      console.error('❌ Database insert error:', insertError)
      return {
        success: false,
        error: insertError.message || 'Failed to create flashcard'
      }
    }

    if (!flashcardDataResult) {
      return {
        success: false,
        error: 'Failed to create flashcard - no data returned'
      }
    }

    // Revalidate the saved flashcards page to show new card
    revalidatePath('/flashcards/saved')

    return {
      success: true,
      data: {
        id: flashcardDataResult.id,
        vietnamese_text: flashcardDataResult.vietnamese_text,
        english_text: flashcardDataResult.english_text
      }
    }
  } catch (error) {
    console.error('❌ Error creating flashcard:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create flashcard'
    }
  }
}

/**
 * Server action to upload image for flashcard
 * Returns the public URL of the uploaded image
 */
export async function uploadFlashcardImage(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Early return if Supabase is not configured
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase is not configured'
      }
    }

    // Get server-side Supabase client
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user || user.id !== userId) {
      return {
        success: false,
        error: 'Not authenticated or user mismatch'
      }
    }

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `flashcard_${userId}_${Date.now()}.${fileExt}`
    const filePath = `flashcards/${fileName}`

    // Upload file to Supabase Storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storageBucket: any = supabase.storage.from('images')
    const { error: uploadError } = await storageBucket.upload(filePath, buffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    })

    if (uploadError) {
      console.error('❌ Image upload error:', uploadError)
      return {
        success: false,
        error: uploadError.message || 'Failed to upload image'
      }
    }

    // Return relative path instead of full URL
    // Path format: flashcards/filename.jpg
    return {
      success: true,
      url: filePath
    }
  } catch (error) {
    console.error('❌ Error uploading image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    }
  }
}

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
