/**
 * Tests for useSavedFlashcards hook
 */

import { renderHook, waitFor, act } from '@testing-library/react-native'
import { useSavedFlashcards } from '../useSavedFlashcards'
import { supabase } from '@/shared/lib/supabase/client'
import { setItem, getItem } from '@/shared/utils/storage'

// Mock dependencies
jest.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

jest.mock('@/shared/utils/storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}))

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

const mockSavedFlashcards = [
  { flashcard_id: 'card-1', flashcard_type: 'APP', topic: 'greetings' },
  { flashcard_id: 'card-2', flashcard_type: 'APP', topic: 'food' },
]

describe('useSavedFlashcards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should load saved flashcards on mount', async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockSavedFlashcards,
            error: null,
          }),
        }),
      }),
    })

    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    })
    ;(supabase.from as jest.Mock).mockImplementation(mockFrom)

    const { result } = renderHook(() => useSavedFlashcards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.savedCards.has('card-1')).toBe(true)
    expect(result.current.savedCards.has('card-2')).toBe(true)
    expect(setItem).toHaveBeenCalledWith(
      'saved_flashcards_user-123',
      ['card-1', 'card-2']
    )
  })

  it('should fallback to AsyncStorage on Supabase error', async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Network error' },
          }),
        }),
      }),
    })

    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    })
    ;(supabase.from as jest.Mock).mockImplementation(mockFrom)
    ;(getItem as jest.Mock).mockResolvedValue(['card-1', 'card-2'])

    const { result } = renderHook(() => useSavedFlashcards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.savedCards.has('card-1')).toBe(true)
    expect(result.current.savedCards.has('card-2')).toBe(true)
  })

  it('should toggle save - add flashcard', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null })
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
      insert: mockInsert,
    })

    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    })
    ;(supabase.from as jest.Mock).mockImplementation(mockFrom)

    const { result } = renderHook(() => useSavedFlashcards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Save a flashcard
    await act(async () => {
      await result.current.toggleSave('card-3', 'travel')
    })

    await waitFor(() => {
      expect(result.current.savedCards.has('card-3')).toBe(true)
    })

    expect(mockInsert).toHaveBeenCalledWith({
      UserID: 'user-123',
      flashcard_id: 'card-3',
      flashcard_type: 'APP',
      topic: 'travel',
      saved_at: expect.any(String),
      is_favorite: false,
      review_count: 0,
      tags: [],
    })
  })

  it('should toggle save - remove flashcard', async () => {
    const mockDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    })

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ flashcard_id: 'card-1' }],
            error: null,
          }),
        }),
      }),
      delete: mockDelete,
    })

    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    })
    ;(supabase.from as jest.Mock).mockImplementation(mockFrom)

    const { result } = renderHook(() => useSavedFlashcards())

    await waitFor(() => {
      expect(result.current.savedCards.has('card-1')).toBe(true)
    })

    // Remove the flashcard
    await act(async () => {
      await result.current.toggleSave('card-1')
    })

    await waitFor(() => {
      expect(result.current.savedCards.has('card-1')).toBe(false)
    })

    expect(mockDelete).toHaveBeenCalled()
  })

  it('should handle duplicate key error gracefully', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      error: { code: '23505', message: 'Duplicate key' },
    })

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
      insert: mockInsert,
    })

    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    })
    ;(supabase.from as jest.Mock).mockImplementation(mockFrom)

    const { result } = renderHook(() => useSavedFlashcards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Try to save
    const success = await act(async () => {
      return await result.current.toggleSave('card-1')
    })

    expect(success).toBe(true)
    expect(result.current.savedCards.has('card-1')).toBe(true)
  })

  it('should check if flashcard is saved', async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ flashcard_id: 'card-1' }],
            error: null,
          }),
        }),
      }),
    })

    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    })
    ;(supabase.from as jest.Mock).mockImplementation(mockFrom)

    const { result } = renderHook(() => useSavedFlashcards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isFlashcardSaved('card-1')).toBe(true)
    expect(result.current.isFlashcardSaved('card-2')).toBe(false)
  })

  it('should not load if user is not logged in', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
    })

    const { result } = renderHook(() => useSavedFlashcards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.savedCards.size).toBe(0)
  })

  it('should warn when toggling save without user', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
    })

    const { result } = renderHook(() => useSavedFlashcards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const success = await act(async () => {
      return await result.current.toggleSave('card-1')
    })

    expect(success).toBe(false)
    expect(consoleWarnSpy).toHaveBeenCalledWith('Please log in to save flashcards')

    consoleWarnSpy.mockRestore()
  })
})
