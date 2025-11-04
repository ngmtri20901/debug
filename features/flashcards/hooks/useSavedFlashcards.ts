'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/shared/lib/supabase/client'
import { toast } from 'sonner'

/**
 * Hook to manage saved flashcards
 * Tracks which flashcards are saved by the current user
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
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          return
        }

        setLoading(true)
        
        // Fetch saved flashcards from Supabase
        const { data: savedFlashcards, error } = await supabase
          .from('saved_flashcards')
          .select('flashcard_id')
          .eq('UserID', user.id)  // Column name is UserID (capital U, capital ID)
          .eq('flashcard_type', 'APP')

        if (error) {
          console.error('Failed to load saved cards:', error)
          // Fallback to localStorage
          const savedIds = localStorage.getItem(`saved_flashcards_${user.id}`)
          if (savedIds) {
            const ids = JSON.parse(savedIds) as string[]
            const savedSet = new Set(ids)
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
        
        // Sync to localStorage as backup
        localStorage.setItem(`saved_flashcards_${user.id}`, JSON.stringify(ids))
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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Please log in to save flashcards')
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
          .eq('UserID', user.id)  // Column name is UserID
          .eq('flashcard_id', flashcardId)
          .eq('flashcard_type', 'APP')

        if (deleteError) {
          console.error('❌ [useSavedFlashcards] Failed to unsave flashcard:', deleteError)
          toast.error('Failed to remove flashcard')
          return false
        }

        // Update local state using functional update
        setSavedCards(prev => {
          const next = new Set(prev)
          next.delete(flashcardId)
          
          // Update localStorage
          const ids = Array.from(next)
          localStorage.setItem(`saved_flashcards_${user.id}`, JSON.stringify(ids))
          
          return next
        })
        
        console.log('✅ [useSavedFlashcards] Flashcard removed successfully')
        toast.success('Flashcard removed from your collection')
        return true
      } else {
        // Add to saved_flashcards table
        console.log('💾 [useSavedFlashcards] Adding flashcard to saved_flashcards')
        const { error: insertError } = await supabase
          .from('saved_flashcards')
          .insert({
            UserID: user.id,  // Column name is UserID (capital U, capital ID)
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
            toast.info('Flashcard is already saved')
            // Update local state to reflect this
            setSavedCards(prev => {
              const next = new Set(prev)
              next.add(flashcardId)
              
              // Update localStorage
              const ids = Array.from(next)
              localStorage.setItem(`saved_flashcards_${user.id}`, JSON.stringify(ids))
              
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
          toast.error(`Failed to save flashcard: ${insertError.message || 'Unknown error'}`)
          return false
        }

        // Update local state using functional update
        setSavedCards(prev => {
          const next = new Set(prev)
          next.add(flashcardId)
          
          // Update localStorage
          const ids = Array.from(next)
          localStorage.setItem(`saved_flashcards_${user.id}`, JSON.stringify(ids))
          
          return next
        })
        
        console.log('✅ [useSavedFlashcards] Flashcard saved successfully')
        toast.success('Flashcard saved to your collection')
        return true
      }
    } catch (error) {
      console.error('❌ [useSavedFlashcards] Unexpected error toggling save:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      toast.error(`An error occurred: ${errorMessage}`)
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

