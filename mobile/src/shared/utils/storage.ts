/**
 * Generic AsyncStorage wrapper with TypeScript support
 * Provides type-safe key-value storage with optional expiry
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Storage entry with expiry metadata
 */
interface StorageEntry<T> {
  value: T
  expiry?: number
}

/**
 * Storage key prefix for the app
 */
const APP_PREFIX = '@vio_vietnamese:'

/**
 * Generate prefixed storage key
 */
function getPrefixedKey(key: string): string {
  return `${APP_PREFIX}${key}`
}

/**
 * Set item in AsyncStorage
 *
 * @param key - Storage key (will be prefixed automatically)
 * @param value - Value to store (will be JSON serialized)
 * @throws Error if serialization or storage fails
 */
export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    const serialized = JSON.stringify(value)
    await AsyncStorage.setItem(getPrefixedKey(key), serialized)
  } catch (error) {
    console.error(`Failed to set item ${key}:`, error)
    throw error
  }
}

/**
 * Get item from AsyncStorage
 *
 * @param key - Storage key (will be prefixed automatically)
 * @returns Parsed value or null if not found
 */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const serialized = await AsyncStorage.getItem(getPrefixedKey(key))
    if (!serialized) return null

    return JSON.parse(serialized) as T
  } catch (error) {
    console.error(`Failed to get item ${key}:`, error)
    return null
  }
}

/**
 * Remove item from AsyncStorage
 *
 * @param key - Storage key (will be prefixed automatically)
 */
export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(getPrefixedKey(key))
  } catch (error) {
    console.error(`Failed to remove item ${key}:`, error)
    throw error
  }
}

/**
 * Clear all app storage
 *
 * WARNING: This removes all keys with the app prefix
 */
export async function clear(): Promise<void> {
  try {
    // Get all keys
    const keys = await AsyncStorage.getAllKeys()

    // Filter keys with app prefix
    const appKeys = keys.filter(key => key.startsWith(APP_PREFIX))

    // Remove app keys only
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys)
    }
  } catch (error) {
    console.error('Failed to clear app storage:', error)
    throw error
  }
}

/**
 * Set item with expiry time
 *
 * @param key - Storage key
 * @param value - Value to store
 * @param ttlMs - Time to live in milliseconds
 */
export async function setItemWithExpiry<T>(
  key: string,
  value: T,
  ttlMs: number
): Promise<void> {
  const entry: StorageEntry<T> = {
    value,
    expiry: Date.now() + ttlMs,
  }

  try {
    const serialized = JSON.stringify(entry)
    await AsyncStorage.setItem(getPrefixedKey(key), serialized)
  } catch (error) {
    console.error(`Failed to set item ${key} with expiry:`, error)
    throw error
  }
}

/**
 * Get item with expiry check
 *
 * @param key - Storage key
 * @returns Value if not expired, null otherwise
 */
export async function getItemWithExpiry<T>(key: string): Promise<T | null> {
  try {
    const serialized = await AsyncStorage.getItem(getPrefixedKey(key))
    if (!serialized) return null

    const entry = JSON.parse(serialized) as StorageEntry<T>

    // Check if has expiry and is expired
    if (entry.expiry && Date.now() > entry.expiry) {
      // Remove expired item
      await removeItem(key)
      return null
    }

    return entry.value
  } catch (error) {
    console.error(`Failed to get item ${key} with expiry:`, error)
    return null
  }
}

/**
 * Check if key exists in storage
 *
 * @param key - Storage key
 * @returns true if key exists, false otherwise
 */
export async function hasItem(key: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(getPrefixedKey(key))
    return value !== null
  } catch (error) {
    console.error(`Failed to check item ${key}:`, error)
    return false
  }
}

/**
 * Get all keys with app prefix
 *
 * @returns Array of keys (without prefix)
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys()
    return keys
      .filter(key => key.startsWith(APP_PREFIX))
      .map(key => key.replace(APP_PREFIX, ''))
  } catch (error) {
    console.error('Failed to get all keys:', error)
    return []
  }
}

/**
 * Get multiple items at once
 *
 * @param keys - Array of storage keys
 * @returns Object with key-value pairs
 */
export async function multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
  try {
    const prefixedKeys = keys.map(getPrefixedKey)
    const results = await AsyncStorage.multiGet(prefixedKeys)

    const parsed: Record<string, T | null> = {}
    results.forEach(([key, value]) => {
      const originalKey = key.replace(APP_PREFIX, '')
      parsed[originalKey] = value ? JSON.parse(value) : null
    })

    return parsed
  } catch (error) {
    console.error('Failed to get multiple items:', error)
    return {}
  }
}

/**
 * Set multiple items at once
 *
 * @param items - Object with key-value pairs
 */
export async function multiSet<T>(items: Record<string, T>): Promise<void> {
  try {
    const pairs: Array<[string, string]> = Object.entries(items).map(([key, value]) => [
      getPrefixedKey(key),
      JSON.stringify(value),
    ])

    await AsyncStorage.multiSet(pairs)
  } catch (error) {
    console.error('Failed to set multiple items:', error)
    throw error
  }
}

/**
 * Get storage size (number of items)
 *
 * @returns Number of items stored
 */
export async function getStorageSize(): Promise<number> {
  try {
    const keys = await getAllKeys()
    return keys.length
  } catch (error) {
    console.error('Failed to get storage size:', error)
    return 0
  }
}
