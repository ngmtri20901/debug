/**
 * Daily Cache Tests
 * Tests daily flashcard caching with AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  saveDailyFlashcards,
  loadDailyFlashcards,
  clearDailyFlashcardsCache,
  getUserTimezone,
  getTodayDateString,
  getEndOfDayTimestamp,
} from '../daily-cache'
import type { FlashcardData } from '../../types/flashcard.types'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}))

describe('Daily Cache', () => {
  const mockFlashcards: FlashcardData[] = [
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
      is_common: true,
      image_url: null,
      audio_url: null,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Timezone helpers', () => {
    it('should get user timezone', () => {
      const timezone = getUserTimezone()
      expect(typeof timezone).toBe('string')
      expect(timezone.length).toBeGreaterThan(0)
    })

    it('should get today date string in YYYY-MM-DD format', () => {
      const timezone = 'America/New_York'
      const dateString = getTodayDateString(timezone)
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should get end of day timestamp', () => {
      const timezone = 'America/New_York'
      const timestamp = getEndOfDayTimestamp(timezone)
      expect(typeof timestamp).toBe('number')
      expect(timestamp).toBeGreaterThan(Date.now())
    })
  })

  describe('saveDailyFlashcards', () => {
    it('should save flashcards to AsyncStorage', async () => {
      await saveDailyFlashcards(mockFlashcards)

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@vio_vietnamese:flashcards:review',
        expect.any(String)
      )

      const callArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      const parsed = JSON.parse(callArg)

      expect(parsed.flashcards).toEqual(mockFlashcards)
      expect(parsed.date).toBeTruthy()
      expect(parsed.expiry).toBeGreaterThan(Date.now())
      expect(parsed.timezone).toBeTruthy()
    })

    it('should handle save errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'))

      // Should not throw
      await expect(saveDailyFlashcards(mockFlashcards)).resolves.toBeUndefined()
    })
  })

  describe('loadDailyFlashcards', () => {
    it('should load valid cached flashcards', async () => {
      const timezone = getUserTimezone()
      const today = getTodayDateString(timezone)
      const expiry = Date.now() + 10000 // Expires in 10 seconds

      const cacheData = {
        flashcards: mockFlashcards,
        date: today,
        expiry,
        timezone,
      }

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheData))

      const result = await loadDailyFlashcards()

      expect(result).toEqual(mockFlashcards)
    })

    it('should return null if no cache exists', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await loadDailyFlashcards()

      expect(result).toBeNull()
    })

    it('should return null and remove expired cache', async () => {
      const timezone = getUserTimezone()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayString = yesterday.toISOString().split('T')[0]

      const cacheData = {
        flashcards: mockFlashcards,
        date: yesterdayString,
        expiry: Date.now() - 1000, // Already expired
        timezone,
      }

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheData))

      const result = await loadDailyFlashcards()

      expect(result).toBeNull()
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        '@vio_vietnamese:flashcards:review'
      )
    })

    it('should handle corrupted cache data', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json')

      const result = await loadDailyFlashcards()

      expect(result).toBeNull()
      expect(AsyncStorage.removeItem).toHaveBeenCalled()
    })
  })

  describe('clearDailyFlashcardsCache', () => {
    it('should clear cache', async () => {
      await clearDailyFlashcardsCache()

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        '@vio_vietnamese:flashcards:review'
      )
    })

    it('should handle clear errors gracefully', async () => {
      ;(AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Failed'))

      // Should not throw
      await expect(clearDailyFlashcardsCache()).resolves.toBeUndefined()
    })
  })
})
