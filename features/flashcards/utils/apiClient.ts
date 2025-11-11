/**
 * API client utility for making requests to the FastAPI backend
 */

import { APIError } from '../types/flashcard.types'

// Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
export const API_PREFIX = "/api/v1"

// Helper function to handle API responses
export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      cache: 'no-store', // Prevent browser and Next.js caching for fresh data
      ...options,
    })

    if (!response.ok) {
      throw new APIError(response.status, `API request failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(0, `Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

