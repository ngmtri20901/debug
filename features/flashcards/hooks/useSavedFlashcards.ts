'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/shared/lib/supabase/client'
import { toast } from 'sonner'

/**
 * Hook to manage saved flashcards
 * Tracks which flashcards are saved by the current user
 */
export function useSavedFlashcards() {
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

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
            setSavedCards(new Set(ids))
          }
          return
        }

        // Extract flashcard IDs
        const ids = savedFlashcards?.map(sf => sf.flashcard_id) || []
        setSavedCards(new Set(ids))
        
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
        return
      }

      setLoading(true)
      
      // Check if already saved
      const isSaved = savedCards.has(flashcardId)
      
      if (isSaved) {
        // Remove from saved_flashcards table
        const { error: deleteError } = await supabase
          .from('saved_flashcards')
          .delete()
          .eq('UserID', user.id)  // Column name is UserID
          .eq('flashcard_id', flashcardId)
          .eq('flashcard_type', 'APP')

        if (deleteError) {
          console.error('Failed to unsave flashcard:', deleteError)
          toast.error('Failed to remove flashcard')
          return
        }

        // Update local state
        setSavedCards(prev => {
          const next = new Set(prev)
          next.delete(flashcardId)
          
          // Update localStorage
          const ids = Array.from(next)
          localStorage.setItem(`saved_flashcards_${user.id}`, JSON.stringify(ids))
          
          return next
        })
        
        toast.success('Flashcard removed from your collection')
      } else {
        // Add to saved_flashcards table
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
            console.log('Flashcard already saved')
            toast.info('Flashcard is already saved')
            // Update local state to reflect this
            setSavedCards(prev => {
              const next = new Set(prev)
              next.add(flashcardId)
              return next
            })
            return
          }
          
          console.error('Failed to save flashcard:', insertError)
          toast.error('Failed to save flashcard')
          return
        }

        // Update local state
        setSavedCards(prev => {
          const next = new Set(prev)
          next.add(flashcardId)
          
          // Update localStorage
          const ids = Array.from(next)
          localStorage.setItem(`saved_flashcards_${user.id}`, JSON.stringify(ids))
          
          return next
        })
        
        toast.success('Flashcard saved to your collection')
      }
    } catch (error) {
      console.error('Failed to toggle save flashcard:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [savedCards])

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

