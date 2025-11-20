/**
 * TypeScript types for flashcard data structures
 * Includes both backend response types and frontend adapted types
 */

// Backend response types (matching FastAPI FlashcardResponse)
export interface BackendFlashcardResponse {
  id: string
  vietnamese: string
  english: string[]
  type: string[] | string
  is_multiword: boolean
  is_multimeaning: boolean
  vietnamese_sentence: string
  english_sentence: string
  topic: string[]
  audio_url: string | null
  image_url: string | null
  text_complexity: string
  common_class: string
  selected_meaning: string[] | null
  common_meaning: string
  pronunciation?: string
}

export interface BackendTopicResponse {
  id: string
  title: string
  description: string
  count: number
  imageUrl: string | null
}

export interface FlashcardSearchResponse {
  flashcards: BackendFlashcardResponse[]
  total: number
  skip: number
  limit: number
  has_more: boolean
}

// Frontend adapted types (for components)
export interface FlashcardData {
  id: string
  vietnamese: string
  english: string[]
  type: string[] | string
  is_multiword: boolean
  is_multimeaning: boolean
  common_meaning: string
  vietnamese_sentence: string
  english_sentence: string
  topic: string[]
  is_common: boolean
  image_url: string | null
  audio_url: string | null
  pronunciation?: string
  // Saved flashcard metadata
  saved_id?: string
  saved_at?: string
  flashcard_type?: 'APP' | 'CUSTOM'
  tags?: string[]
  review_count?: number
  last_reviewed?: string
  notes?: string
  is_favorite?: boolean
  // Custom flashcard specific fields
  ipa_pronunciation?: string
}

export interface FlashcardTopic {
  id: string
  title: string
  description: string
  count: number
  imageUrl: string
}

export interface WordType {
  id: string
  name: string
  title: string
  description: string
  count: number
  imageUrl: string
}

export interface RandomFlashcardParams {
  count?: number
  commonWordsOnly?: boolean
}

// API Error class
export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "APIError"
  }
}

