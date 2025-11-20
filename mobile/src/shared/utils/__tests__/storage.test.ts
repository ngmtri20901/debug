/**
 * Storage Utility Tests
 * Tests AsyncStorage wrapper with expiry support
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  setItem,
  getItem,
  removeItem,
  clear,
  setItemWithExpiry,
  getItemWithExpiry,
  hasItem,
  getAllKeys,
  multiGet,
  multiSet,
  getStorageSize,
} from '../storage'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}))

describe('Storage Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('setItem & getItem', () => {
    it('should set and get string value', async () => {
      const value = 'test-value'
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(value))

      await setItem('test-key', value)
      const result = await getItem<string>('test-key')

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@vio_vietnamese:test-key',
        JSON.stringify(value)
      )
      expect(result).toBe(value)
    })

    it('should set and get object value', async () => {
      const value = { name: 'John', age: 30 }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(value))

      await setItem('user', value)
      const result = await getItem<typeof value>('user')

      expect(result).toEqual(value)
    })

    it('should return null for non-existent key', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await getItem('non-existent')

      expect(result).toBeNull()
    })

    it('should handle get errors gracefully', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'))

      const result = await getItem('test')

      expect(result).toBeNull()
    })
  })

  describe('removeItem', () => {
    it('should remove item', async () => {
      await removeItem('test-key')

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@vio_vietnamese:test-key')
    })
  })

  describe('clear', () => {
    it('should clear all app keys', async () => {
      const mockKeys = [
        '@vio_vietnamese:key1',
        '@vio_vietnamese:key2',
        '@other_app:key3',
      ]
      ;(AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys)

      await clear()

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@vio_vietnamese:key1',
        '@vio_vietnamese:key2',
      ])
    })
  })

  describe('setItemWithExpiry & getItemWithExpiry', () => {
    it('should set and get item with expiry', async () => {
      const value = { data: 'test' }
      const ttl = 5000 // 5 seconds

      await setItemWithExpiry('temp-data', value, ttl)

      const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0]
      const stored = JSON.parse(setCall[1])

      expect(stored.value).toEqual(value)
      expect(stored.expiry).toBeGreaterThan(Date.now())
      expect(stored.expiry).toBeLessThan(Date.now() + ttl + 100)

      // Mock retrieval
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(setCall[1])

      const result = await getItemWithExpiry<typeof value>('temp-data')
      expect(result).toEqual(value)
    })

    it('should return null for expired item', async () => {
      const value = { data: 'test' }
      const expiredEntry = {
        value,
        expiry: Date.now() - 1000, // Expired 1 second ago
      }

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(expiredEntry))

      const result = await getItemWithExpiry('expired-data')

      expect(result).toBeNull()
      expect(AsyncStorage.removeItem).toHaveBeenCalled()
    })

    it('should return value for non-expired item', async () => {
      const value = { data: 'test' }
      const validEntry = {
        value,
        expiry: Date.now() + 10000, // Expires in 10 seconds
      }

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(validEntry))

      const result = await getItemWithExpiry('valid-data')

      expect(result).toEqual(value)
    })
  })

  describe('hasItem', () => {
    it('should return true if item exists', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('some-value')

      const result = await hasItem('existing-key')

      expect(result).toBe(true)
    })

    it('should return false if item does not exist', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await hasItem('non-existent-key')

      expect(result).toBe(false)
    })
  })

  describe('getAllKeys', () => {
    it('should return all app keys without prefix', async () => {
      const mockKeys = [
        '@vio_vietnamese:key1',
        '@vio_vietnamese:key2',
        '@other_app:key3',
      ]
      ;(AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys)

      const result = await getAllKeys()

      expect(result).toEqual(['key1', 'key2'])
    })
  })

  describe('multiGet & multiSet', () => {
    it('should get multiple items', async () => {
      const mockData = [
        ['@vio_vietnamese:key1', JSON.stringify('value1')],
        ['@vio_vietnamese:key2', JSON.stringify('value2')],
      ]
      ;(AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockData)

      const result = await multiGet<string>(['key1', 'key2'])

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
      })
    })

    it('should set multiple items', async () => {
      const items = {
        key1: 'value1',
        key2: { data: 'value2' },
      }

      await multiSet(items)

      expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
        ['@vio_vietnamese:key1', JSON.stringify('value1')],
        ['@vio_vietnamese:key2', JSON.stringify({ data: 'value2' })],
      ])
    })
  })

  describe('getStorageSize', () => {
    it('should return number of app keys', async () => {
      const mockKeys = [
        '@vio_vietnamese:key1',
        '@vio_vietnamese:key2',
        '@other_app:key3',
      ]
      ;(AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys)

      const size = await getStorageSize()

      expect(size).toBe(2)
    })
  })
})
