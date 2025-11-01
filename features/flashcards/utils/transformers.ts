/**
 * Data transformation utilities
 * Converts backend response types to frontend types
 */

import type { BackendFlashcardResponse, BackendTopicResponse, FlashcardData, FlashcardTopic } from '../types/flashcard.types'

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

