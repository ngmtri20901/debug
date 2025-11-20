/**
 * Tests for useRandomFlashcards hook
 */

import { renderHook, waitFor } from '@testing-library/react-native'
import { useRandomFlashcards } from '../useRandomFlashcards'
import { flashcardAPI } from '../../services/flashcardService'
import { loadDailyFlashcards, saveDailyFlashcards } from '../../utils/daily-cache'
import type { FlashcardData } from '../../types/flashcard.types'

// Mock dependencies
jest.mock('../../services/flashcardService', () => ({
  flashcardAPI: {
    getRandomFlashcards: jest.fn(),
  },
}))

jest.mock('../../utils/daily-cache', () => ({
  loadDailyFlashcards: jest.fn(),
  saveDailyFlashcards: jest.fn(),
}))

const mockFlashcards: FlashcardData[] = [
  {
    id: '1',
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
    id: '2',
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

describe('useRandomFlashcards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch flashcards from API when no cache exists', async () => {
    ;(loadDailyFlashcards as jest.Mock).mockResolvedValue(null)
    ;(flashcardAPI.getRandomFlashcards as jest.Mock).mockResolvedValue(mockFlashcards)

    const { result } = renderHook(() => useRandomFlashcards({ count: 2 }))

    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockFlashcards)
    expect(flashcardAPI.getRandomFlashcards).toHaveBeenCalledWith({
      count: 2,
      commonWordsOnly: false,
    })
    expect(saveDailyFlashcards).toHaveBeenCalledWith(mockFlashcards)
  })

  it('should use cached flashcards when available', async () => {
    ;(loadDailyFlashcards as jest.Mock).mockResolvedValue(mockFlashcards)

    const { result } = renderHook(() => useRandomFlashcards({ count: 2 }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockFlashcards)
    expect(flashcardAPI.getRandomFlashcards).not.toHaveBeenCalled()
    expect(loadDailyFlashcards).toHaveBeenCalled()
  })

  it('should slice cached flashcards if more than requested count', async () => {
    const manyFlashcards = [...mockFlashcards, ...mockFlashcards, ...mockFlashcards]
    ;(loadDailyFlashcards as jest.Mock).mockResolvedValue(manyFlashcards)

    const { result } = renderHook(() => useRandomFlashcards({ count: 2 }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data).toEqual(manyFlashcards.slice(0, 2))
  })

  it('should fetch from API when cached count is less than requested', async () => {
    ;(loadDailyFlashcards as jest.Mock).mockResolvedValue([mockFlashcards[0]]) // Only 1 cached
    ;(flashcardAPI.getRandomFlashcards as jest.Mock).mockResolvedValue(mockFlashcards)

    const { result } = renderHook(() => useRandomFlashcards({ count: 2 }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(flashcardAPI.getRandomFlashcards).toHaveBeenCalled()
    expect(result.current.data).toEqual(mockFlashcards)
  })

  it('should support commonWordsOnly parameter', async () => {
    ;(loadDailyFlashcards as jest.Mock).mockResolvedValue(null)
    ;(flashcardAPI.getRandomFlashcards as jest.Mock).mockResolvedValue(mockFlashcards)

    renderHook(() => useRandomFlashcards({ count: 2, commonWordsOnly: true }))

    await waitFor(() => {
      expect(flashcardAPI.getRandomFlashcards).toHaveBeenCalledWith({
        count: 2,
        commonWordsOnly: true,
      })
    })
  })

  it('should refetch and skip cache', async () => {
    ;(loadDailyFlashcards as jest.Mock).mockResolvedValue(mockFlashcards)
    ;(flashcardAPI.getRandomFlashcards as jest.Mock).mockResolvedValue(mockFlashcards)

    const { result } = renderHook(() => useRandomFlashcards({ count: 2 }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // First load uses cache
    expect(flashcardAPI.getRandomFlashcards).not.toHaveBeenCalled()

    // Refetch should skip cache
    await result.current.refetch()

    await waitFor(() => {
      expect(flashcardAPI.getRandomFlashcards).toHaveBeenCalled()
    })
  })

  it('should handle errors gracefully', async () => {
    const error = new Error('Network error')
    ;(loadDailyFlashcards as jest.Mock).mockResolvedValue(null)
    ;(flashcardAPI.getRandomFlashcards as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useRandomFlashcards({ count: 2 }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeUndefined()
  })

  it('should throw error when refetch has throwOnError option', async () => {
    const error = new Error('Network error')
    ;(loadDailyFlashcards as jest.Mock).mockResolvedValue(null)
    ;(flashcardAPI.getRandomFlashcards as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useRandomFlashcards({ count: 2 }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await expect(result.current.refetch({ throwOnError: true })).rejects.toThrow('Network error')
  })
})
