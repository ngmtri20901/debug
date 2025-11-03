/**
 * Flashcard sync utilities
 * Handles syncing custom flashcards to saved_flashcards table
 */

import { createClient } from '@/shared/lib/supabase/client'

export interface SyncStatus {
  needsSync: boolean
  unsyncedCount: number
}

export interface SyncResult {
  success: boolean
  synced: number
  error?: string
}

/**
 * Check if custom flashcards need to be synced to saved_flashcards
 */
export async function checkSyncStatus(userId: string): Promise<SyncStatus> {
  const supabase = createClient()

  // Get all custom flashcards for the user
  const { data: customFlashcards, error: customError } = await supabase
    .from('custom_flashcards')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')

  if (customError) {
    console.error('Error fetching custom flashcards:', customError)
    return { needsSync: false, unsyncedCount: 0 }
  }

  const customIds = (customFlashcards || []).map(cf => `custom_${cf.id}`)

  if (customIds.length === 0) {
    return { needsSync: false, unsyncedCount: 0 }
  }

    // Get existing saved flashcards of type CUSTOM
    const { data: savedCustom, error: savedError } = await supabase
      .from('saved_flashcards')
      .select('flashcard_id')
      .eq('UserID', userId)  // Column name is UserID
      .eq('flashcard_type', 'CUSTOM')
      .in('flashcard_id', customIds)

  if (savedError) {
    console.error('Error fetching saved custom flashcards:', savedError)
    return { needsSync: false, unsyncedCount: 0 }
  }

  const savedIds = new Set((savedCustom || []).map(sf => sf.flashcard_id))
  const unsyncedIds = customIds.filter(id => !savedIds.has(id))

  return {
    needsSync: unsyncedIds.length > 0,
    unsyncedCount: unsyncedIds.length
  }
}

/**
 * Sync custom flashcards to saved_flashcards table
 */
export async function syncCustomFlashcardsToSaved(userId: string): Promise<SyncResult> {
  try {
    const supabase = createClient()

    // Get all custom flashcards for the user
    const { data: customFlashcards, error: customError } = await supabase
      .from('custom_flashcards')
      .select('id, topic')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')

    if (customError) {
      throw customError
    }

    if (!customFlashcards || customFlashcards.length === 0) {
      return { success: true, synced: 0 }
    }

    // Get existing saved flashcards of type CUSTOM
    const { data: savedCustom, error: savedError } = await supabase
      .from('saved_flashcards')
      .select('flashcard_id')
      .eq('UserID', userId)  // Column name is UserID
      .eq('flashcard_type', 'CUSTOM')

    if (savedError) {
      throw savedError
    }

    const savedIds = new Set((savedCustom || []).map(sf => sf.flashcard_id))

    // Find unsynced flashcards
    const toSync = customFlashcards.filter(
      cf => !savedIds.has(`custom_${cf.id}`)
    )

    if (toSync.length === 0) {
      return { success: true, synced: 0 }
    }

    // Insert unsynced flashcards
    const insertData = toSync.map(cf => ({
      UserID: userId,  // Column name is UserID
      flashcard_id: `custom_${cf.id}`,
      flashcard_type: 'CUSTOM' as const,
      topic: cf.topic || null,
      saved_at: new Date().toISOString(),
      is_favorite: false,
      review_count: 0,
      tags: []
    }))

    const { error: insertError } = await supabase
      .from('saved_flashcards')
      .insert(insertData)

    if (insertError) {
      throw insertError
    }

    return {
      success: true,
      synced: toSync.length
    }
  } catch (error) {
    console.error('Error syncing custom flashcards:', error)
    return {
      success: false,
      synced: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

