'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/shared/lib/supabase/client'

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
        // TODO: Implement fetching saved cards from Supabase
        // For now, we'll use localStorage as a fallback
        const savedIds = localStorage.getItem(`saved_flashcards_${user.id}`)
        if (savedIds) {
          const ids = JSON.parse(savedIds) as string[]
          setSavedCards(new Set(ids))
        }
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
        console.warn('User not authenticated, cannot save flashcard')
        return
      }

      setLoading(true)
      
      // Check if already saved
      const isSaved = savedCards.has(flashcardId)
      
      if (isSaved) {
        // Remove from saved
        setSavedCards(prev => {
          const next = new Set(prev)
          next.delete(flashcardId)
          
          // Update localStorage
          const ids = Array.from(next)
          localStorage.setItem(`saved_flashcards_${user.id}`, JSON.stringify(ids))
          
          return next
        })
        
        // TODO: Remove from Supabase database
      } else {
        // Add to saved
        setSavedCards(prev => {
          const next = new Set(prev)
          next.add(flashcardId)
          
          // Update localStorage
          const ids = Array.from(next)
          localStorage.setItem(`saved_flashcards_${user.id}`, JSON.stringify(ids))
          
          return next
        })
        
        // TODO: Save to Supabase database
      }
    } catch (error) {
      console.error('Failed to toggle save flashcard:', error)
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

