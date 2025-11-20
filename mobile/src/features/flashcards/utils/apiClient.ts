/**
 * API client utility for making requests to the FastAPI backend (React Native version)
 * Adapted from web version with AsyncStorage support and mobile-specific optimizations
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { APIError } from '../types/flashcard.types'

// Configuration
// Using @env for environment variables (requires react-native-config or babel-plugin-transform-inline-environment-variables)
// @ts-ignore - env types will be defined in env.d.ts
import { API_URL } from '@env'

export const API_BASE_URL = API_URL || "http://localhost:8000"
export const API_PREFIX = "/api/v1"

// Token storage keys
const AUTH_TOKEN_KEY = '@vio_vietnamese:auth_token'

/**
 * Get authentication token from AsyncStorage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to get auth token:', error)
    return null
  }
}

/**
 * Store authentication token in AsyncStorage
 */
export async function setAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch (error) {
    console.error('Failed to store auth token:', error)
  }
}

/**
 * Remove authentication token from AsyncStorage
 */
export async function clearAuthToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to clear auth token:', error)
  }
}

/**
 * Helper function to handle API responses (React Native version)
 *
 * @param endpoint - API endpoint path (e.g., '/flashcards/random')
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws APIError on HTTP errors or network failures
 */
export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`

  try {
    // Get auth token if available
    const token = await getAuthToken()

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      // Parse error response if available
      let errorMessage = `API request failed: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch {
        // Failed to parse error response, use status text
      }

      throw new APIError(response.status, errorMessage)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }

    // Network error or other issues
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    throw new APIError(0, `Network error: ${errorMessage}`)
  }
}

/**
 * Check if API is reachable (health check)
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/flashcards/health`)
    return response.ok
  } catch {
    return false
  }
}
