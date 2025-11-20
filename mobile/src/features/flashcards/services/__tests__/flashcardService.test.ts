/**
 * Flashcard Service Tests
 * Tests all API methods in flashcardService
 */

import { flashcardAPI } from '../flashcardService'
import * as apiClient from '../../utils/apiClient'

// Mock the apiRequest function
jest.mock('../../utils/apiClient', () => ({
  ...jest.requireActual('../../utils/apiClient'),
  apiRequest: jest.fn(),
}))

const mockApiRequest = apiClient.apiRequest as jest.MockedFunction<typeof apiClient.apiRequest>

describe('flashcardAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getRandomFlashcards', () => {
    it('should fetch random flashcards with default params', async () => {
      const mockResponse = [
        {
          id: '1',
          vietnamese: 'xin chào',
          english: ['hello'],
          type: ['INTJ'],
          is_multiword: false,
          is_multimeaning: false,
          common_meaning: 'hello',
          vietnamese_sentence: 'Xin chào bạn',
          english_sentence: 'Hello you',
          topic: ['greetings'],
          image_url: null,
          audio_url: null,
          text_complexity: 'simple',
          common_class: 'common',
          selected_meaning: null,
          pronunciation: 'sin chao',
        },
      ]

      mockApiRequest.mockResolvedValue(mockResponse)

      const result = await flashcardAPI.getRandomFlashcards()

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/flashcards/random?count=20&common_words_only=false'
      )
      expect(result).toHaveLength(1)
      expect(result[0].vietnamese).toBe('xin chào')
      expect(result[0].is_common).toBe(true) // common_class transformed to is_common
    })

    it('should fetch random flashcards with custom params', async () => {
      mockApiRequest.mockResolvedValue([])

      await flashcardAPI.getRandomFlashcards({ count: 50, commonWordsOnly: true })

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/flashcards/random?count=50&common_words_only=true'
      )
    })
  })

  describe('searchFlashcards', () => {
    it('should search flashcards with query', async () => {
      mockApiRequest.mockResolvedValue([])

      await flashcardAPI.searchFlashcards('xin chào', 30)

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/flashcards/search?q=xin%20ch%C3%A0o&limit=30'
      )
    })
  })

  describe('getAllTopics', () => {
    it('should fetch all topics', async () => {
      const mockTopics = [
        {
          id: 'food',
          title: 'Food & Drink',
          description: 'Food vocabulary',
          count: 100,
          imageUrl: '/food.jpg',
        },
      ]

      mockApiRequest.mockResolvedValue(mockTopics)

      const result = await flashcardAPI.getAllTopics()

      expect(mockApiRequest).toHaveBeenCalledWith('/flashcards/topics')
      expect(result).toEqual(mockTopics)
    })

    it('should fetch topics with complexity filter', async () => {
      mockApiRequest.mockResolvedValue([])

      await flashcardAPI.getAllTopics('simple')

      expect(mockApiRequest).toHaveBeenCalledWith('/flashcards/topics?complexity=simple')
    })
  })

  describe('getFlashcardsByTopic', () => {
    it('should fetch flashcards by topic with pagination', async () => {
      // Mock getAllTopics first
      const mockTopics = [
        {
          id: 'food',
          title: 'Food & Drink',
          description: 'Food vocabulary',
          count: 100,
          imageUrl: '/food.jpg',
        },
      ]
      mockApiRequest.mockResolvedValueOnce(mockTopics)

      // Then mock the actual flashcards response
      const mockResponse = {
        flashcards: [],
        total: 100,
        skip: 0,
        limit: 20,
        has_more: true,
      }
      mockApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await flashcardAPI.getFlashcardsByTopic('food', undefined, 0, 20)

      expect(result.flashcards).toEqual([])
      expect(result.total).toBe(100)
      expect(result.hasMore).toBe(true)
    })
  })

  describe('getSavedFlashcards', () => {
    it('should fetch saved flashcards for user', async () => {
      const mockResponse = {
        flashcards: [],
        total: 5,
      }

      mockApiRequest.mockResolvedValue(mockResponse)

      const result = await flashcardAPI.getSavedFlashcards('user-123')

      expect(mockApiRequest).toHaveBeenCalledWith('/flashcards/saved/user-123')
      expect(result.total).toBe(5)
    })
  })

  describe('getFlashcardAudio', () => {
    it('should fetch audio URL for flashcard', async () => {
      const mockResponse = {
        flashcard_id: 'card-123',
        audio_url: 'https://example.com/audio.mp3',
        vietnamese: 'xin chào',
      }

      mockApiRequest.mockResolvedValue(mockResponse)

      const result = await flashcardAPI.getFlashcardAudio('card-123')

      expect(mockApiRequest).toHaveBeenCalledWith('/flashcards/card-123/audio')
      expect(result.audio_url).toBe('https://example.com/audio.mp3')
    })
  })

  describe('getFlashcardsByIds', () => {
    it('should fetch flashcards by array of IDs', async () => {
      mockApiRequest.mockResolvedValue([])

      await flashcardAPI.getFlashcardsByIds(['id1', 'id2', 'id3'])

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/flashcards/by-ids',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(['id1', 'id2', 'id3']),
        })
      )
    })
  })
})
