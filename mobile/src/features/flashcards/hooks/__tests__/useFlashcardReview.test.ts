/**
 * Tests for useFlashcardReview hook
 */

import { renderHook, waitFor, act } from '@testing-library/react-native'
import { useFlashcardReview } from '../useFlashcardReview'
import { supabase } from '@/shared/lib/supabase/client'
import { audioService } from '@/features/flashcards/services/audioService'
import type { FlashcardData } from '../../types/flashcard.types'

// Mock dependencies
jest.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

jest.mock('@/features/flashcards/services/audioService', () => ({
  audioService: {
    playPronunciation: jest.fn(),
    stop: jest.fn(),
  },
}))

const mockFlashcards: FlashcardData[] = [
  {
    id: 'card-1',
    vietnamese: 'xin chào',
    english: 'hello',
    pronunciation: 'sin chow',
    word_type: 'greeting',
    example_sentence: 'Xin chào bạn',
    example_translation: 'Hello friend',
    is_common_word: true,
    difficulty_level: 1,
    topic_id: 'greetings',
    audio_url: null,
  },
  {
    id: 'card-2',
    vietnamese: 'cảm ơn',
    english: 'thank you',
    pronunciation: 'gahm uhn',
    word_type: 'expression',
    example_sentence: 'Cảm ơn bạn',
    example_translation: 'Thank you',
    is_common_word: true,
    difficulty_level: 1,
    topic_id: 'greetings',
    audio_url: null,
  },
]

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

describe('useFlashcardReview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should initialize with first card', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    })

    const { result } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        enableTimer: false,
      })
    )

    await waitFor(() => {
      expect(result.current.currentCard).toEqual(mockFlashcards[0])
      expect(result.current.currentCardIndex).toBe(0)
      expect(result.current.isFlipped).toBe(false)
    })
  })

  it('should flip card manually', async () => {
    const { result } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        enableTimer: false,
      })
    )

    await waitFor(() => {
      expect(result.current.currentCard).toBeTruthy()
    })

    act(() => {
      result.current.handleFlipCard()
    })

    expect(result.current.isFlipped).toBe(true)
  })

  it('should handle timer countdown', async () => {
    const { result } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        enableTimer: true,
        reviewTimeSeconds: 10,
      })
    )

    await waitFor(() => {
      expect(result.current.timer).toBe(10)
    })

    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(result.current.timer).toBe(5)
    })

    // Fast-forward 5 more seconds
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(result.current.timer).toBe(0)
      expect(result.current.isFlipped).toBe(true)
    })
  })

  it('should record card result and move to next card', async () => {
    const onSessionComplete = jest.fn()

    const { result } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        onSessionComplete,
        enableTimer: false,
      })
    )

    await waitFor(() => {
      expect(result.current.currentCard).toEqual(mockFlashcards[0])
    })

    act(() => {
      result.current.handleCardResult('correct')
    })

    await waitFor(() => {
      expect(result.current.currentCardIndex).toBe(1)
      expect(result.current.currentCard).toEqual(mockFlashcards[1])
      expect(result.current.cardResults).toHaveLength(1)
      expect(result.current.cardResults[0]).toMatchObject({
        cardId: 'card-1',
        result: 'correct',
      })
    })
  })

  it('should call onSessionComplete when all cards are reviewed', async () => {
    const onSessionComplete = jest.fn()

    const { result } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        onSessionComplete,
        enableTimer: false,
      })
    )

    await waitFor(() => {
      expect(result.current.currentCard).toBeTruthy()
    })

    // Review first card
    act(() => {
      result.current.handleCardResult('correct')
    })

    await waitFor(() => {
      expect(result.current.currentCardIndex).toBe(1)
    })

    // Review second card
    act(() => {
      result.current.handleCardResult('incorrect')
    })

    await waitFor(() => {
      expect(onSessionComplete).toHaveBeenCalled()
      expect(result.current.cardResults).toHaveLength(2)
    })
  })

  it('should play audio for current card', async () => {
    const { result } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        enableTimer: false,
      })
    )

    await waitFor(() => {
      expect(result.current.currentCard).toBeTruthy()
    })

    await act(async () => {
      await result.current.playAudio()
    })

    expect(audioService.playPronunciation).toHaveBeenCalledWith('card-1', 'xin chào')
  })

  it('should stop audio on reset', async () => {
    const { result } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        enableTimer: false,
      })
    )

    await waitFor(() => {
      expect(result.current.currentCard).toBeTruthy()
    })

    act(() => {
      result.current.resetSession()
    })

    expect(audioService.stop).toHaveBeenCalled()
    expect(result.current.currentCardIndex).toBe(0)
    expect(result.current.cardResults).toHaveLength(0)
  })

  it('should calculate progress stats correctly', async () => {
    const { result } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        enableTimer: false,
      })
    )

    await waitFor(() => {
      expect(result.current.currentCard).toBeTruthy()
    })

    // Answer first card correct
    act(() => {
      result.current.handleCardResult('correct')
    })

    await waitFor(() => {
      expect(result.current.currentCardIndex).toBe(1)
    })

    // Answer second card incorrect
    act(() => {
      result.current.handleCardResult('incorrect')
    })

    await waitFor(() => {
      const stats = result.current.getProgressStats()
      expect(stats.correct).toBe(1)
      expect(stats.incorrect).toBe(1)
      expect(stats.unsure).toBe(0)
      expect(stats.total).toBe(2)
      expect(stats.accuracy).toBe(50)
    })
  })

  it('should handle saved cards', async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ flashcard_id: 'card-1' }],
          error: null,
        }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    })

    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    })
    ;(supabase.from as jest.Mock).mockImplementation(mockFrom)

    const { result } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        enableTimer: false,
      })
    )

    await waitFor(() => {
      expect(result.current.savedCards.has('card-1')).toBe(true)
    })

    // Save card-2
    await act(async () => {
      await result.current.handleSaveCard('card-2')
    })

    await waitFor(() => {
      expect(result.current.savedCards.has('card-2')).toBe(true)
    })
  })

  it('should calculate progress percentage', async () => {
    const { result } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        enableTimer: false,
      })
    )

    await waitFor(() => {
      expect(result.current.progress).toBe(50) // First card out of 2
    })

    act(() => {
      result.current.handleCardResult('correct')
    })

    await waitFor(() => {
      expect(result.current.progress).toBe(100) // Second card out of 2
    })
  })

  it('should detect if there are more cards', async () => {
    const { result } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        enableTimer: false,
      })
    )

    await waitFor(() => {
      expect(result.current.hasMoreCards).toBe(true)
    })

    act(() => {
      result.current.handleCardResult('correct')
    })

    await waitFor(() => {
      expect(result.current.hasMoreCards).toBe(false) // Last card
    })
  })

  it('should stop timer when manually flipped', async () => {
    const { result } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        enableTimer: true,
        reviewTimeSeconds: 10,
      })
    )

    await waitFor(() => {
      expect(result.current.isTimerActive).toBe(true)
    })

    act(() => {
      result.current.handleFlipCard()
    })

    await waitFor(() => {
      expect(result.current.isTimerActive).toBe(false)
    })
  })

  it('should cleanup audio on unmount', async () => {
    const { unmount } = renderHook(() =>
      useFlashcardReview({
        cards: mockFlashcards,
        enableTimer: false,
      })
    )

    unmount()

    expect(audioService.stop).toHaveBeenCalled()
  })
})
