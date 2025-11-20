/**
 * Data transformation utilities
 * Converts backend response types to frontend types
 */

import type { BackendFlashcardResponse, BackendTopicResponse, FlashcardData, FlashcardTopic } from '../types/flashcard.types'

/**
 * Converts a relative image path to a full Supabase Storage URL
 * Handles both relative paths (e.g., "flashcards/filename.jpg") and full URLs (backward compatibility)
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null

  // If already a full URL, return as-is (backward compatibility)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // Convert relative path to full Supabase Storage URL
  // Format: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL is not configured')
    return imagePath // Return relative path as fallback
  }

  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath

  // Construct full URL for the 'images' bucket
  return `${supabaseUrl}/storage/v1/object/public/images/${cleanPath}`
}

// Transform backend flashcard response to frontend flashcard data
export function transformBackendFlashcard(backend: any): FlashcardData {
  return {
    id: backend.id,
    vietnamese: backend.vietnamese,
    english: backend.english,
    type: backend.type,
    is_multiword: backend.is_multiword,
    is_multimeaning: backend.is_multimeaning,
    common_meaning: backend.common_meaning,
    vietnamese_sentence: backend.vietnamese_sentence,
    english_sentence: backend.english_sentence,
    topic: backend.topic,
    is_common: backend.common_class === "common",
    image_url: backend.image_url,
    audio_url: backend.audio_url,
    pronunciation: backend.pronunciation,
    // Handle saved flashcard metadata
    saved_id: backend.saved_id,
    saved_at: backend.saved_at,
    flashcard_type: backend.flashcard_type,
    tags: backend.tags,
    review_count: backend.review_count,
    last_reviewed: backend.last_reviewed,
    notes: backend.notes,
    is_favorite: backend.is_favorite,
    ipa_pronunciation: backend.ipa_pronunciation,
  }
}

// Transform backend topic response to frontend topic data
export function transformBackendTopic(backend: BackendTopicResponse): FlashcardTopic {
  return {
    id: backend.id,
    title: backend.title,
    description: backend.description,
    count: backend.count,
    imageUrl: backend.imageUrl || "/placeholder.svg?height=200&width=400",
  }
}

