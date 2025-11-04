'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/shared/lib/supabase/client'
import { ReviewSession } from './ReviewSession'
import type { FlashcardData } from '@/features/flashcards/types/flashcard.types'
import { useFlashcardReview } from '@/features/flashcards/hooks/use-flashcard-review'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import { toast } from 'sonner'
import { authSessionManager } from '@/features/flashcards/utils/auth-session-manager'
import { ReviewSessionSummaryModal } from '@/features/flashcards/components/review/review-session-summary-modal'

export default function SessionClient() {
  const router = useRouter()
  const params = useSearchParams()
  const sessionId = params?.get('id') || ''

  const [loading, setLoading] = useState(true)
  const [sessionCards, setSessionCards] = useState<FlashcardData[]>([])
  const [sessionMeta, setSessionMeta] = useState<any | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summaryData, setSummaryData] = useState<{ totalCards: number, correctAnswers: number, accuracyRate: number, coinsEarned: number, timeSpent: number }>({ totalCards: 0, correctAnswers: 0, accuracyRate: 0, coinsEarned: 0, timeSpent: 0 })

  // Enforce focus mode by collapsing sidebar and disabling toggle
  useEffect(() => {
    // Mark as review session to avoid auth refresh side-effects
    authSessionManager.setReviewSession(true)

    // Collapse sidebar via cookie and block Ctrl/Cmd+B
    try {
      document.cookie = `sidebar:state=false; path=/; max-age=${60 * 60}`
      const preventToggle = (e: KeyboardEvent) => {
        const isToggle = (e.key === 'b' || e.key === 'B') && (e.ctrlKey || e.metaKey)
        if (isToggle) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
      window.addEventListener('keydown', preventToggle, { capture: true })
      return () => {
        window.removeEventListener('keydown', preventToggle, { capture: true } as any)
        authSessionManager.setReviewSession(false)
      }
    } catch {
      return () => authSessionManager.setReviewSession(false)
    }
  }, [])

  // Load session + cards
  useEffect(() => {
    const run = async () => {
      try {
        if (!sessionId) {
          toast.error('Missing session id')
          router.push('/flashcards/review')
          return
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          toast.error('Please log in to continue')
          router.push('/auth/login')
          return
        }
        setUserId(user.id)

        // Load session
        const { data: sessionRow, error: sessionError } = await supabase
          .from('review_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle()

        if (sessionError || !sessionRow) {
          toast.error('Session not found')
          router.push('/flashcards/review')
          return
        }
        setSessionMeta(sessionRow)

        // Load session cards mapping table
        const { data: sessionCardRows, error: sessionCardsError } = await supabase
          .from('review_session_cards')
          .select('flashcard_id, card_order')
          .eq('session_id', sessionId)
          .order('card_order', { ascending: true })

        if (sessionCardsError) {
          throw sessionCardsError
        }

        const flashcardIds = (sessionCardRows || []).map((r: any) => r.flashcard_id)
        if (!flashcardIds.length) {
          toast.error('No cards in this session')
          router.push('/flashcards/review')
          return
        }

        // Fetch card details from backend API by IDs
        const { flashcardAPI } = await import('@/features/flashcards/services/flashcardService')
        const cards: FlashcardData[] = await flashcardAPI.getFlashcardsByIds(flashcardIds)

        setSessionCards(cards)
      } catch (e) {
        console.error(e)
        toast.error('Failed to load review session')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [router, sessionId])

  const {
    currentCard,
    currentCardIndex,
    isFlipped,
    timer,
    isTimerActive,
    cardResults,
    savedCards,
    handleCardResult,
    handleSaveCard,
    handleFlipCard,
    resetSession,
    getProgressStats,
  } = useFlashcardReview({ cards: sessionCards, enableTimer: true })

  // Finalize when finished
  useEffect(() => {
    const finished = sessionCards.length > 0 && cardResults.length === sessionCards.length
    if (!finished) return
    ;(async () => {
      try {
        const stats = getProgressStats()
        await supabase
          .from('review_sessions')
          .update({
            status: 'completed',
            completed_cards: stats.total,
            correct_answers: stats.correct,
            total_time_seconds: null,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)

        // Aggregate and update daily flashcard statistics for the user
        if (userId) {
          const today = new Date().toISOString().slice(0, 10)
          // Sum time from this session's cards
          const { data: sumRows } = await supabase
            .from('review_session_cards')
            .select('time_spent_seconds')
            .eq('session_id', sessionId)
          const totalSeconds = (sumRows || []).reduce((acc: number, r: any) => acc + (r?.time_spent_seconds || 0), 0)
          const timeMinutes = Math.max(0, Math.round(totalSeconds / 60))

          // Load today's row
          const { data: todayRow } = await supabase
            .from('flashcard_statistics')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle()

          const reviewed = stats.total
          const correct = stats.correct
          const totalQuestions = stats.total

          if (todayRow) {
            const newReviewed = (todayRow.flashcards_reviewed || 0) + reviewed
            const newCorrect = (todayRow.correct_answers || 0) + correct
            const newTotalQ = (todayRow.total_questions || 0) + totalQuestions
            const newAccuracy = newTotalQ > 0 ? (newCorrect / newTotalQ) * 100 : 0
            const newMinutes = (todayRow.time_spent_minutes || 0) + timeMinutes

            await supabase
              .from('flashcard_statistics')
              .update({
                flashcards_reviewed: newReviewed,
                correct_answers: newCorrect,
                total_questions: newTotalQ,
                accuracy_rate: newAccuracy,
                time_spent_minutes: newMinutes,
                updated_at: new Date().toISOString(),
              })
              .eq('id', todayRow.id)
          } else {
            const accuracy = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0
            await supabase
              .from('flashcard_statistics')
              .insert({
                user_id: userId,
                date: today,
                flashcards_reviewed: reviewed,
                correct_answers: correct,
                total_questions: totalQuestions,
                accuracy_rate: accuracy,
                time_spent_minutes: timeMinutes,
              })
          }

          // Prepare and open summary modal
          setSummaryData({
            totalCards: stats.total,
            correctAnswers: stats.correct,
            accuracyRate: stats.accuracy,
            coinsEarned: 0,
            timeSpent: Math.max(0, (sumRows || []).reduce((acc: number, r: any) => acc + (r?.time_spent_seconds || 0), 0)),
          })
          setIsCompleted(true)
          setSummaryOpen(true)
        }
        toast.success('Session completed!')
      } catch (e) {
        console.error(e)
      }
    })()
  }, [cardResults.length, sessionCards.length, getProgressStats, sessionId, userId])

  // Persist a single card result to DB
  const persistCardResult = useCallback(async (cardId: string, result: 'correct' | 'incorrect' | 'unsure', timeSpentMs: number) => {
    if (!userId || !sessionId) return

    // 1) Update review_session_cards
    await supabase
      .from('review_session_cards')
      .update({ result, time_spent_seconds: Math.max(1, Math.round(timeSpentMs / 1000)), reviewed_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('flashcard_id', cardId)

    // 2) Update SRS record using simple SM-2 style logic
    const { data: existingRows } = await supabase
      .from('flashcard_srs_records')
      .select('*')
      .eq('user_id', userId)
      .eq('flashcard_id', cardId)
      .limit(1)

    const now = new Date()
    if (existingRows && existingRows.length > 0) {
      const row = existingRows[0] as any
      const wasCorrect = result === 'correct'
      const easeFactor = Math.max(1.3, Number(row.ease_factor || 2.5) + (wasCorrect ? 0.1 : -0.2))
      const repetition = wasCorrect ? Number(row.repetition_number || 0) + 1 : 0
      let intervalDays = 1
      if (repetition <= 1) intervalDays = 1
      else if (repetition === 2) intervalDays = 6
      else intervalDays = Math.round((row.interval_days || 6) * easeFactor)
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + intervalDays)

      await supabase
        .from('flashcard_srs_records')
        .update({
          ease_factor: easeFactor,
          repetition_number: repetition,
          interval_days: intervalDays,
          due_date: dueDate.toISOString().slice(0, 10),
          total_reviews: (row.total_reviews || 0) + 1,
          correct_reviews: (row.correct_reviews || 0) + (wasCorrect ? 1 : 0),
          last_reviewed: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', row.id)
    } else {
      const wasCorrect = result === 'correct'
      const easeFactor = wasCorrect ? 2.6 : 2.3
      const repetition = wasCorrect ? 1 : 0
      const intervalDays = wasCorrect ? 1 : 1
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + intervalDays)
      await supabase
        .from('flashcard_srs_records')
        .insert({
          user_id: userId,
          flashcard_id: cardId,
          ease_factor: easeFactor,
          repetition_number: repetition,
          interval_days: intervalDays,
          due_date: dueDate.toISOString().slice(0, 10),
          total_reviews: 1,
          correct_reviews: wasCorrect ? 1 : 0,
          last_reviewed: now.toISOString(),
          updated_at: now.toISOString(),
        })
    }
  }, [sessionId, userId])

  // Intercept result handler to persist
  const handleResultAndPersist = useCallback((result: 'correct' | 'incorrect' | 'unsure') => {
    if (isCompleting || isCompleted) return
    const card = sessionCards[currentCardIndex]
    // If this is the last card, mark as completing to block further clicks
    if (currentCardIndex === sessionCards.length - 1) {
      setIsCompleting(true)
    }
    handleCardResult(result)
    if (!card?.id) return
    // Defer to read the timeSpent added by hook
    setTimeout(() => {
      const last = cardResults[cardResults.length - 1]
      const timeMs = last && last.cardId === card.id ? last.timeSpent : 0
      persistCardResult(card.id, result, timeMs).catch(() => {})
    }, 50)
  }, [currentCardIndex, sessionCards, handleCardResult, persistCardResult, cardResults, isCompleting, isCompleted])

  // Complete session handler defined above

  const quitSession = useCallback(async () => {
    try {
      const stats = getProgressStats()
      await supabase
        .from('review_sessions')
        .update({
          status: 'abandoned',
          completed_cards: stats.total,
          correct_answers: stats.correct,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      toast.success('Session exited')
      router.push('/flashcards/review')
    } catch (e) {
      console.error(e)
      router.push('/flashcards/review')
    }
  }, [getProgressStats, router, sessionId])

  if (loading) {
    return null
  }

  if (!sessionCards.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No cards loaded</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/flashcards/review')}>Back</Button>
        </CardContent>
      </Card>
    )
  }

  const progressStats = getProgressStats()

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Focused Review Session</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={quitSession}>Quit</Button>
        </div>
      </div>

      <ReviewSession
        practiceCards={sessionCards}
        currentCard={currentCard}
        currentCardIndex={currentCardIndex}
        isFlipped={isFlipped}
        timer={timer}
        isTimerActive={isTimerActive}
        cardResults={cardResults}
        progressStats={progressStats}
        savedCards={savedCards}
        onCardResult={handleResultAndPersist}
        onSaveCard={isCompleted || isCompleting ? () => {} : handleSaveCard}
        onFlipCard={isCompleted || isCompleting ? () => {} : handleFlipCard}
        onRefreshCards={() => router.refresh()}
        onGetFreshCards={() => router.refresh()}
        getAnimationDuration={() => 300}
        isLoading={isCompleting || isCompleted}
      />

      <Separator className="my-6" />
      <div className="text-sm text-muted-foreground">Session ID: {sessionId}</div>

      <ReviewSessionSummaryModal
        isOpen={summaryOpen}
        onClose={() => {
          setSummaryOpen(false)
          router.push('/flashcards/review')
        }}
        sessionData={summaryData}
      />
    </div>
  )
}

