"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/shared/lib/supabase/client"
import { authSessionManager } from "@/features/flashcards/utils/auth-session-manager"
import { toast } from "sonner"
import { playCorrectSound, playIncorrectSound, playFlipSound } from "@/shared/utils/audio"
import type { FlashcardData } from "@/features/flashcards/types/flashcard.types"
import { useDisplaySettings } from "@/features/settings/hooks/use-display-settings"

export interface CardResult {
  cardId: string
  result: "correct" | "incorrect" | "unsure"
  timeSpent: number
}

interface UseFlashcardReviewProps {
  cards: FlashcardData[]
  onSessionComplete?: () => void
  enableTimer?: boolean
}

export const useFlashcardReview = ({ 
  cards, 
  onSessionComplete, 
  enableTimer = true 
}: UseFlashcardReviewProps) => {
  const { getReviewTimeSeconds } = useDisplaySettings()
  const reviewTimeSeconds = getReviewTimeSeconds()
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [timer, setTimer] = useState(reviewTimeSeconds)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [cardResults, setCardResults] = useState<CardResult[]>([])
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set())

  // Set review session status when component mounts/unmounts
  useEffect(() => {
    authSessionManager.setReviewSession(true)
    
    return () => {
      authSessionManager.setReviewSession(false)
    }
  }, [])

  // Tab visibility detection for debugging (development only)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const handleVisibilityChange = () => {
      console.log("👁️ [HOOK] Tab visibility changed:", {
        visibilityState: document.visibilityState,
        hidden: document.hidden,
        timestamp: new Date().toISOString(),
        currentCardIndex,
        isFlipped,
        timer,
        isTimerActive,
        cardsLength: cards.length,
        hasStartTime: !!startTime
      })
    }

    const handleFocus = () => {
      console.log("🎯 [HOOK] Window focused:", {
        timestamp: new Date().toISOString(),
        currentCardIndex,
        isFlipped,
        timer,
        isTimerActive,
        cardsLength: cards.length
      })
    }

    const handleBlur = () => {
      console.log("😴 [HOOK] Window blurred:", {
        timestamp: new Date().toISOString(),
        currentCardIndex,
        isFlipped,
        timer,
        isTimerActive,
        cardsLength: cards.length
      })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [currentCardIndex, isFlipped, timer, isTimerActive, cards.length, startTime])

  // Load saved cards for current user
  useEffect(() => {
    const loadSavedCards = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: savedFlashcards, error } = await supabase
          .from("saved_flashcards")
          .select("flashcard_id, flashcard_type, topic")
          .eq("UserID", user.id)

        if (savedFlashcards) {
          setSavedCards(new Set(savedFlashcards.map((item: any) => item.flashcard_id)))
        }
      } catch (error) {
        console.error("Error loading saved cards:", error)
      }
    }

    loadSavedCards()
  }, [])

  // Timer effect
  useEffect(() => {
    if (!enableTimer || !isTimerActive || timer <= 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log("⏰ [HOOK] Timer not active:", {
          enableTimer,
          isTimerActive,
          timer,
          timestamp: new Date().toISOString(),
          documentVisibility: document.visibilityState
        })
      }
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("⏰ [HOOK] Starting timer interval:", {
        timer,
        isTimerActive,
        timestamp: new Date().toISOString(),
        documentVisibility: document.visibilityState
      })
    }

    const intervalId = setInterval(() => {
      setTimer(prev => {
        const newTimer = prev - 1
        if (process.env.NODE_ENV === 'development' && (newTimer % 5 === 0 || newTimer <= 3)) {
          console.log("⏰ [HOOK] Timer tick:", {
            oldTimer: prev,
            newTimer,
            timestamp: new Date().toISOString(),
            documentVisibility: document.visibilityState
          })
        }
        return newTimer
      })
    }, 1000)

    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("⏰ [HOOK] Clearing timer interval")
      }
      clearInterval(intervalId)
    }
  }, [enableTimer, isTimerActive, timer])

  // Auto-flip when timer reaches 0
  useEffect(() => {
    if (enableTimer && timer === 0 && isTimerActive) {
      if (process.env.NODE_ENV === 'development') {
        console.log("🔄 [HOOK] Auto-flipping card due to timer", {
          timer,
          isTimerActive,
          timestamp: new Date().toISOString(),
          documentVisibility: document.visibilityState
        })
      }
      setIsFlipped(true)
      setIsTimerActive(false)
      playFlipSound()
    }
  }, [enableTimer, timer, isTimerActive])

  // Start new card
  const startNewCard = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("🆕 [HOOK] Starting new card:", {
        currentCardIndex,
        reviewTimeSeconds,
        enableTimer,
        timestamp: new Date().toISOString(),
        documentVisibility: document.visibilityState
      })
    }
    setIsFlipped(false)
    setTimer(reviewTimeSeconds)
    if (enableTimer) {
      setIsTimerActive(true)
    }
    setStartTime(new Date())
  }, [enableTimer, reviewTimeSeconds, currentCardIndex])

  // Handle starting new card when index changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("🔄 [HOOK] Card index changed:", {
        currentCardIndex,
        cardsLength: cards.length,
        shouldStartNewCard: cards.length > 0 && currentCardIndex < cards.length,
        timestamp: new Date().toISOString(),
        documentVisibility: document.visibilityState
      })
    }
    if (cards.length > 0 && currentCardIndex < cards.length) {
      startNewCard()
    }
  }, [currentCardIndex, cards.length, startNewCard])

  // Debug effect to monitor state changes (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("🔍 [HOOK] State update:", {
        currentCardIndex,
        isFlipped,
        timer,
        isTimerActive,
        cardsLength: cards.length,
        hasCurrentCard: !!cards[currentCardIndex],
        timestamp: new Date().toISOString(),
        documentVisibility: document.visibilityState
      })
    }
  }, [currentCardIndex, isFlipped, timer, isTimerActive, cards.length])

  // Handle card result - ensure progress even after inactivity
  const handleCardResult = useCallback(
    (result: "correct" | "incorrect" | "unsure") => {
      if (process.env.NODE_ENV === 'development') {
        console.log("🎯 [HOOK] handleCardResult called:", result, { 
          currentCardIndex, 
          isFlipped, 
          timer, 
          isTimerActive,
          hasCards: !!cards[currentCardIndex],
          hasStartTime: !!startTime,
          timestamp: new Date().toISOString(),
          documentVisibility: document.visibilityState,
          documentHidden: document.hidden,
          cardsLength: cards.length
        })
      }

      if (!cards[currentCardIndex]) {
        console.warn("❌ [HOOK] No card at index:", currentCardIndex, {
          cardsLength: cards.length,
          currentCardIndex,
          timestamp: new Date().toISOString()
        })
        return
      }

      // If startTime lost due to inactivity, re-initialize
      const effectiveStartTime = startTime ?? new Date()
      if (!startTime) {
        if (process.env.NODE_ENV === 'development') {
          console.log("🔄 [HOOK] Re-initializing startTime after inactivity", {
            timestamp: new Date().toISOString(),
            documentVisibility: document.visibilityState
          })
        }
        setStartTime(effectiveStartTime)
      }

      if (process.env.NODE_ENV === 'development') {
        console.log("🔊 [HOOK] Playing sound for result:", result)
      }
      if (result === 'correct') {
        playCorrectSound()
      } else if (result === 'incorrect') {
        playIncorrectSound()
      }
      // 'unsure' doesn't have a sound effect

      const timeSpent = Date.now() - effectiveStartTime.getTime()
      const cardResult: CardResult = {
        cardId: cards[currentCardIndex].id,
        result,
        timeSpent,
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log("📝 Recording result:", cardResult)
      }
      setCardResults(prev => [...prev, cardResult])

      // Always progress locally, regardless of timer state
      if (currentCardIndex < cards.length - 1) {
        if (process.env.NODE_ENV === 'development') {
          console.log("➡️ Moving to next card:", currentCardIndex + 1)
        }
        setCurrentCardIndex(prev => {
          const newIndex = prev + 1
          if (process.env.NODE_ENV === 'development') {
            console.log("🔄 currentCardIndex updated:", prev, "->", newIndex)
          }
          return newIndex
        })
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log("🏁 Session complete")
        }
        if (onSessionComplete) {
          onSessionComplete()
        }
      }

      // Stop timer on result
      setIsTimerActive(false)
    },
    [cards, currentCardIndex, startTime, onSessionComplete, isFlipped, timer, isTimerActive]
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
            .from("saved_flashcards")
            .delete()
            .eq("UserID", user.id)
            .eq("flashcard_id", cardId)
          toast.success("Card removed from saved!")
        } else {
          newSavedCards.add(cardId)
          await supabase
            .from("saved_flashcards")
            .insert({ UserID: user.id, flashcard_id: cardId })
          toast.success("Card saved!")
        }
        
        setSavedCards(newSavedCards)
      } catch (error) {
        console.error("Error saving card:", error)
        toast.error("Failed to save card")
      }
    },
    [savedCards]
  )

  // Handle manual card flip
  const handleFlipCard = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("🔄 [HOOK] Manual flip triggered", {
        currentIsFlipped: isFlipped,
        currentCardIndex,
        timer,
        isTimerActive,
        timestamp: new Date().toISOString(),
        documentVisibility: document.visibilityState
      })
    }
    setIsFlipped(prev => {
      if (!prev) {
        if (process.env.NODE_ENV === 'development') {
          console.log("🔄 [HOOK] Flipping card and stopping timer")
        }
        playFlipSound()
        // Stop timer when manually flipped
        setIsTimerActive(false)
      }
      return !prev
    })
  }, [isFlipped, currentCardIndex, timer, isTimerActive])

  // Reset session
  const resetSession = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("🔄 [HOOK] Resetting session", {
        timestamp: new Date().toISOString(),
        documentVisibility: document.visibilityState
      })
    }
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setTimer(reviewTimeSeconds)
    setIsTimerActive(false)
    setCardResults([])
    setStartTime(null)
  }, [reviewTimeSeconds])

  // Get progress statistics
  const getProgressStats = useCallback(() => {
    const correct = cardResults.filter(r => r.result === "correct").length
    const incorrect = cardResults.filter(r => r.result === "incorrect").length
    const unsure = cardResults.filter(r => r.result === "unsure").length
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
    resetSession,
    
    // Computed values
    getProgressStats,
    hasMoreCards: currentCardIndex < cards.length - 1,
    progress: cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0,
  }
}