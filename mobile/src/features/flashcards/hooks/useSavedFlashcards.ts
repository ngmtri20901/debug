/**
 * Hook to manage saved flashcards (React Native version)
 * Tracks which flashcards are saved by the current user
 * Uses mobile Supabase client and AsyncStorage
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { setItem, getItem } from '@/shared/utils/storage'

/**
 * Hook to manage saved flashcards
 * Syncs with Supabase and caches locally in AsyncStorage
 */
export function useSavedFlashcards() {
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  // Use ref to track current savedCards for use in callbacks without stale closures
  const savedCardsRef = useRef<Set<string>>(new Set())

  // Keep ref in sync with state
  useEffect(() => {
    savedCardsRef.current = savedCards
  }, [savedCards])

  // Load saved cards on mount
  useEffect(() => {
    const loadSavedCards = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          return
        }

        setLoading(true)

        // Fetch saved flashcards from Supabase
        const { data: savedFlashcards, error } = await supabase
          .from('saved_flashcards')
          .select('flashcard_id')
          .eq('UserID', user.id) // Column name is UserID (capital U, capital ID)
          .eq('flashcard_type', 'APP')

        if (error) {
          console.error('Failed to load saved cards:', error)
          // Fallback to AsyncStorage
          const savedIds = await getItem<string[]>(`saved_flashcards_${user.id}`)
          if (savedIds) {
            const savedSet = new Set(savedIds)
            setSavedCards(savedSet)
            savedCardsRef.current = savedSet
          }
          return
        }

        // Extract flashcard IDs
        const ids = savedFlashcards?.map(sf => sf.flashcard_id) || []
        const savedSet = new Set(ids)
        setSavedCards(savedSet)
        savedCardsRef.current = savedSet

        // Sync to AsyncStorage as backup
        await setItem(`saved_flashcards_${user.id}`, ids)
      } catch (error) {
        console.error('Failed to load saved cards:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSavedCards()
  }, [])

  const toggleSave = useCallback(async (flashcardId: string, topic?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.warn('Please log in to save flashcards')
        return false
      }

      setLoading(true)

      // Check current saved state using ref to avoid stale closure issues
      const isSaved = savedCardsRef.current.has(flashcardId)

      console.log('🔄 [useSavedFlashcards] Toggling save for flashcard:', flashcardId, 'isSaved:', isSaved)

      if (isSaved) {
        // Remove from saved_flashcards table
        console.log('🗑️ [useSavedFlashcards] Removing flashcard from saved_flashcards')
        const { error: deleteError } = await supabase
          .from('saved_flashcards')
          .delete()
          .eq('UserID', user.id) // Column name is UserID
          .eq('flashcard_id', flashcardId)
          .eq('flashcard_type', 'APP')

        if (deleteError) {
          console.error('❌ [useSavedFlashcards] Failed to unsave flashcard:', deleteError)
          return false
        }

        // Update local state using functional update
        setSavedCards(prev => {
          const next = new Set(prev)
          next.delete(flashcardId)

          // Update AsyncStorage
          const ids = Array.from(next)
          setItem(`saved_flashcards_${user.id}`, ids)

          return next
        })

        console.log('✅ [useSavedFlashcards] Flashcard removed successfully')
        return true
      } else {
        // Add to saved_flashcards table
        console.log('💾 [useSavedFlashcards] Adding flashcard to saved_flashcards')
        const { error: insertError } = await supabase
          .from('saved_flashcards')
          .insert({
            UserID: user.id, // Column name is UserID (capital U, capital ID)
            flashcard_id: flashcardId,
            flashcard_type: 'APP',
            topic: topic || null,
            saved_at: new Date().toISOString(),
            is_favorite: false,
            review_count: 0,
            tags: []
          })

        if (insertError) {
          // Check if it's a duplicate key error (already saved)
          if (insertError.code === '23505') {
            console.log('ℹ️ [useSavedFlashcards] Flashcard already saved (duplicate key)')
            // Update local state to reflect this
            setSavedCards(prev => {
              const next = new Set(prev)
              next.add(flashcardId)

              // Update AsyncStorage
              const ids = Array.from(next)
              setItem(`saved_flashcards_${user.id}`, ids)

              return next
            })
            return true
          }

          console.error('❌ [useSavedFlashcards] Failed to save flashcard:', insertError)
          console.error('❌ [useSavedFlashcards] Error details:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          })
          return false
        }

        // Update local state using functional update
        setSavedCards(prev => {
          const next = new Set(prev)
          next.add(flashcardId)

          // Update AsyncStorage
          const ids = Array.from(next)
          setItem(`saved_flashcards_${user.id}`, ids)

          return next
        })

        console.log('✅ [useSavedFlashcards] Flashcard saved successfully')
        return true
      }
    } catch (error) {
      console.error('❌ [useSavedFlashcards] Unexpected error toggling save:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      console.error(`An error occurred: ${errorMessage}`)
      return false
    } finally {
      setLoading(false)
    }
  }, []) // Remove savedCards from dependencies - use functional updates instead

  const isFlashcardSaved = useCallback((flashcardId: string): boolean => {
    return savedCards.has(flashcardId)
  }, [savedCards])

  return {
    savedCards,
    toggleSave,
    isFlashcardSaved,
    loading,
  }
}
