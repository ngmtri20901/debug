/**
 * API Client Tests
 * Run with: npm test -- apiClient.test.ts
 */

import { apiRequest, checkAPIHealth, setAuthToken, clearAuthToken } from '../apiClient'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}))

// Mock @env
jest.mock('@env', () => ({
  API_URL: 'http://localhost:8000',
}))

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('apiRequest', () => {
    it('should make successful API request', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' }),
        })
      ) as jest.Mock

      const result = await apiRequest('/test')
      expect(result).toEqual({ data: 'test' })
    })

    it('should include auth token if available', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test-token')

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' }),
        })
      ) as jest.Mock

      await apiRequest('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('should throw APIError on HTTP error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({ detail: 'Resource not found' }),
        })
      ) as jest.Mock

      await expect(apiRequest('/test')).rejects.toThrow('Resource not found')
    })

    it('should handle network errors', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network failed'))) as jest.Mock

      await expect(apiRequest('/test')).rejects.toThrow('Network error: Network failed')
    })
  })

  describe('checkAPIHealth', () => {
    it('should return true if API is healthy', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
        })
      ) as jest.Mock

      const result = await checkAPIHealth()
      expect(result).toBe(true)
    })

    it('should return false if API is down', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Connection failed'))) as jest.Mock

      const result = await checkAPIHealth()
      expect(result).toBe(false)
    })
  })

  describe('Auth token management', () => {
    it('should store auth token', async () => {
      await setAuthToken('test-token')
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@vio_vietnamese:auth_token',
        'test-token'
      )
    })

    it('should clear auth token', async () => {
      await clearAuthToken()
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@vio_vietnamese:auth_token')
    })
  })
})
