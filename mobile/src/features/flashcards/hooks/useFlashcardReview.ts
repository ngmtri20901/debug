/**
 * Hook for flashcard review session management (React Native version)
 * Handles card navigation, timer, results tracking, and audio playback
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { audioService } from '@/features/flashcards/services/audioService'
import type { FlashcardData } from '@/features/flashcards/types/flashcard.types'

export interface CardResult {
  cardId: string
  result: 'correct' | 'incorrect' | 'unsure'
  timeSpent: number
}

interface UseFlashcardReviewProps {
  cards: FlashcardData[]
  onSessionComplete?: () => void
  enableTimer?: boolean
  reviewTimeSeconds?: number
}

export const useFlashcardReview = ({
  cards,
  onSessionComplete,
  enableTimer = true,
  reviewTimeSeconds = 10,
}: UseFlashcardReviewProps) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [timer, setTimer] = useState(reviewTimeSeconds)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [cardResults, setCardResults] = useState<CardResult[]>([])
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set())

  // Load saved cards for current user
  useEffect(() => {
    const loadSavedCards = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: savedFlashcards, error } = await supabase
          .from('saved_flashcards')
          .select('flashcard_id, flashcard_type, topic')
          .eq('UserID', user.id)

        if (savedFlashcards) {
          setSavedCards(new Set(savedFlashcards.map((item: any) => item.flashcard_id)))
        }
      } catch (error) {
        console.error('Error loading saved cards:', error)
      }
    }

    loadSavedCards()
  }, [])

  // Timer countdown effect
  useEffect(() => {
    if (!enableTimer || !isTimerActive || timer <= 0) {
      return
    }

    const intervalId = setInterval(() => {
      setTimer(prev => prev - 1)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [enableTimer, isTimerActive, timer])

  // Auto-flip when timer reaches 0
  useEffect(() => {
    if (enableTimer && timer === 0 && isTimerActive) {
      setIsFlipped(true)
      setIsTimerActive(false)
    }
  }, [enableTimer, timer, isTimerActive])

  // Start new card
  const startNewCard = useCallback(() => {
    setIsFlipped(false)
    setTimer(reviewTimeSeconds)
    if (enableTimer) {
      setIsTimerActive(true)
    }
    setStartTime(new Date())
  }, [enableTimer, reviewTimeSeconds])

  // Handle starting new card when index changes
  useEffect(() => {
    if (cards.length > 0 && currentCardIndex < cards.length) {
      startNewCard()
    }
  }, [currentCardIndex, cards.length, startNewCard])

  // Handle card result (correct/incorrect/unsure)
  const handleCardResult = useCallback(
    (result: 'correct' | 'incorrect' | 'unsure') => {
      if (!cards[currentCardIndex]) {
        console.warn('❌ [useFlashcardReview] No card at index:', currentCardIndex)
        return
      }

      // If startTime lost, re-initialize
      const effectiveStartTime = startTime ?? new Date()
      if (!startTime) {
        setStartTime(effectiveStartTime)
      }

      const timeSpent = Date.now() - effectiveStartTime.getTime()
      const cardResult: CardResult = {
        cardId: cards[currentCardIndex].id,
        result,
        timeSpent,
      }

      setCardResults(prev => [...prev, cardResult])

      // Always progress to next card
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1)
      } else {
        // Session complete
        if (onSessionComplete) {
          onSessionComplete()
        }
      }

      // Stop timer on result
      setIsTimerActive(false)
    },
    [cards, currentCardIndex, startTime, onSessionComplete]
  )

  // Handle saving/unsaving cards
  const handleSaveCard = useCallback(
    async (cardId: string) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const newSavedCards = new Set(savedCards)
        if (newSavedCards.has(cardId)) {
          newSavedCards.delete(cardId)
          await supabase
            .from('saved_flashcards')
            .delete()
            .eq('UserID', user.id)
            .eq('flashcard_id', cardId)
        } else {
          newSavedCards.add(cardId)
          await supabase
            .from('saved_flashcards')
            .insert({ UserID: user.id, flashcard_id: cardId })
        }

        setSavedCards(newSavedCards)
      } catch (error) {
        console.error('Error saving card:', error)
      }
    },
    [savedCards]
  )

  // Handle manual card flip
  const handleFlipCard = useCallback(() => {
    setIsFlipped(prev => {
      if (!prev) {
        // Stop timer when manually flipped
        setIsTimerActive(false)
      }
      return !prev
    })
  }, [])

  // Play audio for current card
  const playAudio = useCallback(async () => {
    const currentCard = cards[currentCardIndex]
    if (!currentCard) return

    try {
      await audioService.playPronunciation(currentCard.id, currentCard.vietnamese)
    } catch (error) {
      console.error('Failed to play audio:', error)
    }
  }, [cards, currentCardIndex])

  // Stop audio
  const stopAudio = useCallback(() => {
    audioService.stop()
  }, [])

  // Reset session
  const resetSession = useCallback(() => {
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setTimer(reviewTimeSeconds)
    setIsTimerActive(false)
    setCardResults([])
    setStartTime(null)
    audioService.stop()
  }, [reviewTimeSeconds])

  // Get progress statistics
  const getProgressStats = useCallback(() => {
    const correct = cardResults.filter(r => r.result === 'correct').length
    const incorrect = cardResults.filter(r => r.result === 'incorrect').length
    const unsure = cardResults.filter(r => r.result === 'unsure').length
    const total = cardResults.length

    return {
      correct,
      incorrect,
      unsure,
      total,
      remaining: cards.length - total,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
    }
  }, [cardResults, cards.length])

  const currentCard = cards[currentCardIndex] || null

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioService.stop()
    }
  }, [])

  return {
    // State
    currentCard,
    currentCardIndex,
    isFlipped,
    timer,
    isTimerActive,
    cardResults,
    savedCards,
    startTime,

    // Actions
    handleCardResult,
    handleSaveCard,
    handleFlipCard,
    playAudio,
    stopAudio,
    resetSession,

    // Computed values
    getProgressStats,
    hasMoreCards: currentCardIndex < cards.length - 1,
    progress: cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0,
  }
}
