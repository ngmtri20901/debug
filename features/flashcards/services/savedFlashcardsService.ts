/**
 * Saved flashcards API service
 * Handles all operations related to saved flashcards in Supabase
 */

import { createClient } from '@/shared/lib/supabase/client'

export interface SavedFlashcard {
  id: string
  UserID: string  // Note: Column name in DB is UserID (capital U, capital ID)
  flashcard_id: string
  flashcard_type: 'APP' | 'CUSTOM'
  topic?: string | null
  saved_at: string
  is_favorite: boolean
  review_count: number
  last_reviewed?: string | null
  tags: string[]
  notes?: string | null
}

export interface PaginatedSavedFlashcards {
  items: SavedFlashcard[]
  nextCursor?: string
}

export interface UserStats {
  appFlashcards: number
  customFlashcards: number
}

export interface CustomFlashcard {
  id: string
  vietnamese_text: string
  english_text: string
  image_url?: string | null
  topic?: string | null
}

export interface FlashcardTopic {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  sort_order?: number | null
}

export const savedFlashcardsAPI = {
  /**
   * Get saved flashcards with pagination
   */
  async getSavedFlashcardsPaginated(cursor?: string): Promise<PaginatedSavedFlashcards> {
    console.log('📦 savedFlashcardsAPI.getSavedFlashcardsPaginated called with cursor:', cursor)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log('👤 User authenticated:', !!user, 'UserID:', user?.id)

    if (!user) {
      throw new Error('User not authenticated')
    }

    const limit = 20
    let queryBuilder = supabase
      .from('saved_flashcards')
      .select('*')
      .eq('UserID', user.id)  // Column name is UserID (capital U, capital ID)

    if (cursor) {
      queryBuilder = queryBuilder.lt('saved_at', cursor) as typeof queryBuilder
    }

    console.log('🔍 Executing Supabase query...')
    const { data, error } = await (queryBuilder as any)
      .order('saved_at', { ascending: false })
      .limit(limit + 1) // Fetch one extra to check if there's a next page

    console.log('📊 Supabase query result:', {
      success: !error,
      dataCount: data?.length || 0,
      error: error?.message
    })

    if (error) {
      console.error('❌ Supabase query error:', error)
      throw error
    }

    const items = (data || []).slice(0, limit)
    const hasMore = (data || []).length > limit
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].saved_at : undefined

    console.log('✅ Returning paginated result:', { itemsCount: items.length, hasMore, nextCursor })

    return {
      items,
      nextCursor
    }
  },

  /**
   * Get custom flashcards by IDs (filtered by current user)
   */
  async getCustomFlashcardsByIds(ids: string[]): Promise<CustomFlashcard[]> {
    if (ids.length === 0) {
      return []
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    const { data, error } = await (supabase
      .from('custom_flashcards')
      .select('id, vietnamese_text, english_text, image_url, topic')
      .eq('user_id', user.id)  // Filter by current user
      .eq('status', 'ACTIVE')   // Only active flashcards
      .in('id', ids) as any)

    if (error) {
      throw error
    }

    return data || []
  },

  /**
   * Get custom flashcard topics for the current user only
   */
  async getCustomFlashcardTopics(): Promise<FlashcardTopic[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    const { data, error } = await (supabase
      .from('custom_flashcards')
      .select('topic')
      .eq('user_id', user.id)  // Filter by current user
      .eq('status', 'ACTIVE')  // Only active flashcards
      .not('topic', 'is', null) as any)

    if (error) {
      throw error
    }

    // Extract unique topics
    const topics = new Map<string, FlashcardTopic>()
    data?.forEach((item: { topic: string | null }) => {
      if (item.topic && !topics.has(item.topic)) {
        topics.set(item.topic, {
          id: item.topic,
          name: item.topic,
          description: null,
          icon: null,
          sort_order: null
        })
      }
    })

    return Array.from(topics.values())
  },

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { count: appCount, error: appError } = await (supabase
      .from('saved_flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('UserID', user.id)  // Column name is UserID
      .eq('flashcard_type', 'APP') as any)

    if (appError) {
      throw appError
    }

    const { count: customCount, error: customError } = await (supabase
      .from('saved_flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('UserID', user.id)  // Column name is UserID
      .eq('flashcard_type', 'CUSTOM') as any)

    if (customError) {
      throw customError
    }

    return {
      appFlashcards: appCount || 0,
      customFlashcards: customCount || 0
    }
  }
}

/**
 * Helper function to add timeout to fetch requests
 * Prevents hanging requests by rejecting after timeout duration
 */
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  return Promise.race([
    fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId)),
    new Promise<Response>((_, reject) =>
      setTimeout(() => {
        clearTimeout(timeoutId)
        reject(new Error(`Request timeout after ${timeoutMs}ms`))
      }, timeoutMs)
    )
  ])
}

/**
 * Get flashcard details by IDs from FastAPI backend
 * Uses POST method to send array of flashcard IDs in request body
 * Includes timeout handling to prevent hanging requests
 */
export async function getFlashcardDetailsByIds(flashcardIds: string[]): Promise<any[]> {
  if (flashcardIds.length === 0) {
    return []
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  const TIMEOUT_MS = 8000 // 8 second timeout (reduced from 15s to prevent hanging)
  
  try {
    console.log('🌐 Making API request to:', `${API_BASE_URL}/api/v1/flashcards/by-ids`)
    console.log('📦 Request payload (flashcard IDs):', flashcardIds)
    console.log('📊 Request count:', flashcardIds.length)
    console.log('⏱️ Timeout set to:', TIMEOUT_MS, 'ms')
    
    const startTime = Date.now()
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/v1/flashcards/by-ids`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flashcardIds),
      },
      TIMEOUT_MS
    )

    const duration = Date.now() - startTime
    console.log('📡 Response received:', {
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response')
      console.error('❌ API returned error:', { status: response.status, errorText })
      throw new Error(`Failed to fetch flashcard details: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ API response parsed:', {
      count: Array.isArray(data) ? data.length : 'not an array',
      ids: Array.isArray(data) ? data.map((d: any) => d?.id).filter(Boolean) : []
    })
    
    // Ensure we return an array
    if (!Array.isArray(data)) {
      console.warn('⚠️ API response is not an array, wrapping:', data)
      return [data].filter(Boolean)
    }
    
    return data
  } catch (error) {
    const isTimeout = error instanceof Error && (
      error.message.includes('timeout') || 
      error.message.includes('aborted') ||
      error.name === 'AbortError'
    )
    
    console.error('❌ Error fetching flashcard details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      url: `${API_BASE_URL}/api/v1/flashcards/by-ids`,
      isTimeout,
      flashcardIds: flashcardIds.slice(0, 5) // Log first 5 IDs for debugging
    })
    
    // Don't return empty array - rethrow to handle gracefully in calling code
    throw error
  }
}

