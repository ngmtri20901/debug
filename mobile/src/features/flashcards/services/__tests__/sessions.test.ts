/**
 * Session Service Tests
 * Tests session validation and generation
 */

import { sessionAPI } from '../sessions'
import * as apiClient from '../../utils/apiClient'

jest.mock('../../utils/apiClient', () => ({
  ...jest.requireActual('../../utils/apiClient'),
  apiRequest: jest.fn(),
  API_BASE_URL: 'http://localhost:8000',
}))

const mockApiRequest = apiClient.apiRequest as jest.MockedFunction<typeof apiClient.apiRequest>

describe('sessionAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateSessionFilters', () => {
    it('should validate session filters successfully', async () => {
      const mockResponse = {
        available_count: 50,
        insufficient: false,
      }

      mockApiRequest.mockResolvedValue(mockResponse)

      const filters = {
        topic: 'food',
        complexity: 'simple',
        common_words_only: true,
        num_cards: 20,
      }

      const result = await sessionAPI.validateSessionFilters(filters)

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/flashcards/session/validate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(filters),
        })
      )
      expect(result.available_count).toBe(50)
      expect(result.insufficient).toBe(false)
    })

    it('should include user ID if provided', async () => {
      mockApiRequest.mockResolvedValue({ available_count: 10, insufficient: true })

      const filters = {
        num_cards: 20,
        complexity: 'all',
        common_words_only: false,
      }

      await sessionAPI.validateSessionFilters(filters, 'user-123')

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/flashcards/session/validate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ...filters, user_id: 'user-123' }),
        })
      )
    })

    it('should return suggestions when insufficient cards', async () => {
      const mockResponse = {
        available_count: 10,
        insufficient: true,
        suggestions: [
          {
            id: 'suggestion-1',
            title: 'Remove topic filter',
            description: 'Expand to all topics',
            filters: { num_cards: 20, complexity: 'all', common_words_only: false },
            estimated_count: 500,
            impact: {
              removed_restrictions: ['topic'],
              additional_count: 490,
            },
          },
        ],
      }

      mockApiRequest.mockResolvedValue(mockResponse)

      const result = await sessionAPI.validateSessionFilters({
        topic: 'food',
        num_cards: 20,
        complexity: 'all',
        common_words_only: false,
      })

      expect(result.insufficient).toBe(true)
      expect(result.suggestions).toHaveLength(1)
      expect(result.suggestions![0].title).toBe('Remove topic filter')
    })
  })

  describe('generateSessionCards', () => {
    it('should generate flashcards for session', async () => {
      const mockResponse = {
        session_id: 'session-123',
        flashcards: [{ id: '1' }, { id: '2' }],
        actual_count: 2,
        filters_applied: {
          topic: 'food',
          num_cards: 2,
          complexity: 'simple',
          common_words_only: false,
        },
        generation_metadata: {},
      }

      mockApiRequest.mockResolvedValue(mockResponse)

      const request = {
        user_id: 'user-123',
        filters: {
          topic: 'food',
          num_cards: 20,
          complexity: 'simple',
          common_words_only: false,
        },
      }

      const result = await sessionAPI.generateSessionCards(request)

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/flashcards/session/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        })
      )
      expect(result.session_id).toBe('session-123')
      expect(result.actual_count).toBe(2)
    })
  })

  describe('buildFiltersFromForm', () => {
    it('should build filters from form data', () => {
      const formData = {
        topic: 'food',
        complexity: 'Simple',
        onlyCommonWords: true,
        numberOfCards: 25,
      }

      const filters = sessionAPI.buildFiltersFromForm(formData)

      expect(filters).toEqual({
        topic: 'food',
        complexity: 'simple',
        common_words_only: true,
        num_cards: 25,
      })
    })

    it('should handle "All" complexity', () => {
      const formData = {
        complexity: 'All',
        onlyCommonWords: false,
        numberOfCards: 10,
      }

      const filters = sessionAPI.buildFiltersFromForm(formData)

      expect(filters.complexity).toBe('all')
      expect(filters.topic).toBeUndefined()
    })
  })

  describe('formatSuggestionForDisplay', () => {
    it('should format suggestion with removed restrictions', () => {
      const suggestion = {
        id: '1',
        title: 'Test',
        description: 'Test description',
        filters: { num_cards: 10, complexity: 'all', common_words_only: false },
        estimated_count: 100,
        impact: {
          removed_restrictions: ['topic', 'complexity'],
        },
      }

      const formatted = sessionAPI.formatSuggestionForDisplay(suggestion)

      expect(formatted).toContain('removes topic, complexity restrictions')
    })

    it('should format suggestion with expanded complexity', () => {
      const suggestion = {
        id: '1',
        title: 'Test',
        description: 'Test description',
        filters: { num_cards: 10, complexity: 'all', common_words_only: false },
        estimated_count: 100,
        impact: {
          expanded_complexity: true,
        },
      }

      const formatted = sessionAPI.formatSuggestionForDisplay(suggestion)

      expect(formatted).toContain('includes all complexity levels')
    })
  })
})
