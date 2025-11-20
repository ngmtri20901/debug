/**
 * Flashcard API service layer
 * Connects frontend to FastAPI backend
 */

import type {
  BackendFlashcardResponse,
  BackendTopicResponse,
  FlashcardSearchResponse,
  FlashcardData,
  FlashcardTopic,
  WordType,
  RandomFlashcardParams,
} from '../types/flashcard.types'
import { apiRequest } from '../utils/apiClient'
import { transformBackendFlashcard, transformBackendTopic } from '../utils/transformers'

// API service object with all methods
export const flashcardAPI = {
  // Get all flashcards with pagination
  async getAllFlashcards(skip = 0, limit = 100): Promise<FlashcardData[]> {
    const response = await apiRequest<BackendFlashcardResponse[]>(
      `/flashcards?skip=${skip}&limit=${limit}`
    )
    return response.map(transformBackendFlashcard)
  },

  // Get random flashcards for daily practice
  async getRandomFlashcards({ count = 20, commonWordsOnly = false }: RandomFlashcardParams = {}): Promise<FlashcardData[]> {
    const searchParams = new URLSearchParams({
      count: String(count),
      common_words_only: String(commonWordsOnly),
    })

    const response = await apiRequest<BackendFlashcardResponse[]>(
      `/flashcards/random?${searchParams.toString()}`
    )
    return response.map(transformBackendFlashcard)
  },

  // Search flashcards
  async searchFlashcards(query: string, limit = 50): Promise<FlashcardData[]> {
    const response = await apiRequest<BackendFlashcardResponse[]>(
      `/flashcards/search?q=${encodeURIComponent(query)}&limit=${limit}`
    )
    return response.map(transformBackendFlashcard)
  },

  // Get all topics
  async getAllTopics(complexity?: string): Promise<FlashcardTopic[]> {
    const url = complexity ? `/flashcards/topics?complexity=${encodeURIComponent(complexity)}` : "/flashcards/topics"
    const response = await apiRequest<BackendTopicResponse[]>(url)
    return response.map(transformBackendTopic)
  },

  // Get flashcards by topic with pagination
  async getFlashcardsByTopic(topicId: string, complexity?: string, skip = 0, limit = 20): Promise<{flashcards: FlashcardData[], total: number, hasMore: boolean}> {
    // First get all topics to find the title for this ID
    const topics = await this.getAllTopics()
    const topic = topics.find(t => t.id === topicId)
    
    if (!topic) {
      console.warn(`Topic not found for ID: ${topicId}`)
      return {flashcards: [], total: 0, hasMore: false}
    }
    
    // Build URL with pagination and optional complexity parameter
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    })
    
    if (complexity) {
      params.append('complexity', complexity)
    }
    
    const url = `/flashcards/by-topic/${encodeURIComponent(topic.title)}?${params.toString()}`
    
    const response = await apiRequest<FlashcardSearchResponse>(url)
    return {
      flashcards: response.flashcards.map(transformBackendFlashcard),
      total: response.total,
      hasMore: response.has_more
    }
  },

  // Get flashcards by topic (legacy method for backward compatibility)
  async getFlashcardsByTopicLegacy(topicId: string, complexity?: string): Promise<FlashcardData[]> {
    const result = await this.getFlashcardsByTopic(topicId, complexity, 0, 1000)
    return result.flashcards
  },

  // Get flashcards by word type
  async getFlashcardsByType(wordType: string, complexity?: string): Promise<FlashcardData[]> {
    const url = complexity
      ? `/flashcards/by-type/${encodeURIComponent(wordType)}?complexity=${encodeURIComponent(complexity)}`
      : `/flashcards/by-type/${encodeURIComponent(wordType)}`
    
    const response = await apiRequest<BackendFlashcardResponse[]>(url)
    return response.map(transformBackendFlashcard)
  },

  // Get multi-word expression flashcards
  async getMultiwordFlashcards(complexity?: string): Promise<FlashcardData[]> {
    const url = complexity
      ? `/flashcards/multiword?complexity=${encodeURIComponent(complexity)}`
      : "/flashcards/multiword"
    
    const response = await apiRequest<BackendFlashcardResponse[]>(url)
    return response.map(transformBackendFlashcard)
  },

  // Get multi-meaning flashcards
  async getMultimeaningFlashcards(complexity?: string): Promise<FlashcardData[]> {
    const url = complexity
      ? `/flashcards/multimeaning?complexity=${encodeURIComponent(complexity)}`
      : "/flashcards/multimeaning"
    
    const response = await apiRequest<BackendFlashcardResponse[]>(url)
    return response.map(transformBackendFlashcard)
  },

  // Get flashcards by complexity
  async getFlashcardsByComplexity(complexity: string, skip = 0, limit = 100): Promise<FlashcardData[]> {
    const response = await apiRequest<BackendFlashcardResponse[]>(
      `/flashcards/by-complexity/${encodeURIComponent(complexity)}?skip=${skip}&limit=${limit}`
    )
    return response.map(transformBackendFlashcard)
  },

  // Get complexity counts
  async getComplexityCounts(): Promise<{all: number, simple: number, complex: number}> {
    const response = await apiRequest<{all: number, simple: number, complex: number}>("/flashcards/complexity-counts")
    return response
  },

  // Get single flashcard by ID
  async getFlashcardById(id: string): Promise<FlashcardData> {
    const response = await apiRequest<BackendFlashcardResponse>(`/flashcards/${id}`)
    return transformBackendFlashcard(response)
  },

  // Get flashcard audio URL
  async getFlashcardAudio(flashcardId: string): Promise<{flashcard_id: string, audio_url: string | null, vietnamese: string}> {
    const response = await apiRequest<{flashcard_id: string, audio_url: string | null, vietnamese: string}>(
      `/flashcards/${flashcardId}/audio`
    )
    return response
  },

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return await apiRequest<{ status: string }>("/flashcards/health")
  },

  // Get all word types
  async getAllWordTypes(complexity?: string): Promise<WordType[]> {
    const url = complexity ? `/flashcards/word-types?complexity=${encodeURIComponent(complexity)}` : "/flashcards/word-types"
    const response = await apiRequest<WordType[]>(url)
    return response
  },

  // Get others counts (multi-meaning and multi-word)
  async getOthersCounts(complexity?: string): Promise<{multiword: number, multimeaning: number}> {
    const url = complexity ? `/flashcards/others-counts?complexity=${encodeURIComponent(complexity)}` : "/flashcards/others-counts"
    const response = await apiRequest<{multiword: number, multimeaning: number}>(url)
    return response
  },

  // Get flashcards by word type with pagination
  async getFlashcardsByTypeWithPagination(wordType: string, complexity?: string, skip = 0, limit = 20): Promise<{flashcards: FlashcardData[], total: number, hasMore: boolean}> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    })
    
    if (complexity) {
      params.append('complexity', complexity)
    }
    
    const response = await apiRequest<FlashcardSearchResponse>(`/flashcards/by-type/${encodeURIComponent(wordType)}?${params}`)
    
    return {
      flashcards: response.flashcards.map(transformBackendFlashcard),
      total: response.total,
      hasMore: response.has_more
    }
  },

  // Get multi-word flashcards with pagination
  async getMultiwordFlashcardsWithPagination(complexity?: string, skip = 0, limit = 20): Promise<{flashcards: FlashcardData[], total: number, hasMore: boolean}> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    })
    
    if (complexity) {
      params.append('complexity', complexity)
    }
    
    const response = await apiRequest<FlashcardSearchResponse>(`/flashcards/multiword?${params}`)
    
    return {
      flashcards: response.flashcards.map(transformBackendFlashcard),
      total: response.total,
      hasMore: response.has_more
    }
  },

  // Get multi-meaning flashcards with pagination
  async getMultimeaningFlashcardsWithPagination(complexity?: string, skip = 0, limit = 20): Promise<{flashcards: FlashcardData[], total: number, hasMore: boolean}> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    })

    if (complexity) {
      params.append('complexity', complexity)
    }

    const response = await apiRequest<FlashcardSearchResponse>(`/flashcards/multimeaning?${params}`)

    return {
      flashcards: response.flashcards.map(transformBackendFlashcard),
      total: response.total,
      hasMore: response.has_more
    }
  },

  // Get user's saved flashcards
  async getSavedFlashcards(userId: string): Promise<{flashcards: FlashcardData[], total: number}> {
    const response = await apiRequest<{flashcards: any[], total: number}>(`/flashcards/saved/${userId}`)
    return {
      flashcards: response.flashcards.map(transformBackendFlashcard),
      total: response.total
    }
  },

  // Get saved flashcards count
  async getSavedFlashcardsCount(userId: string): Promise<{count: number}> {
    const response = await apiRequest<{count: number}>(`/flashcards/saved/${userId}/count`)
    return response
  },

  // Get flashcards by IDs
  async getFlashcardsByIds(flashcardIds: string[]): Promise<FlashcardData[]> {
    const response = await apiRequest<BackendFlashcardResponse[]>(`/flashcards/by-ids`, {
      method: 'POST',
      body: JSON.stringify(flashcardIds)
    })
    return response.map(transformBackendFlashcard)
  },
}

// Export individual functions for backward compatibility
export async function getAllFlashcards(): Promise<FlashcardData[]> {
  return flashcardAPI.getAllFlashcards()
}

export async function getAllTopics(): Promise<FlashcardTopic[]> {
  return flashcardAPI.getAllTopics()
}

export async function getAllWordTypes(): Promise<WordType[]> {
  return flashcardAPI.getAllWordTypes()
}

export async function getFlashcardsByTopic(topicId: string, complexity?: string): Promise<{ flashcards: FlashcardData[]; title: string }> {
  // Define special categories at function scope
  const specialCategories = ['multi-meaning', 'multi-word']
  
  // Define word types that should use the by-type endpoint - get this dynamically from backend
  try {
    const allWordTypes = await flashcardAPI.getAllWordTypes()
    const wordTypeIds = allWordTypes.map(wt => wt.id)
    
    // Check if this is a word type
    if (wordTypeIds.includes(topicId.toLowerCase())) {
      const wordType = allWordTypes.find(wt => wt.id === topicId.toLowerCase())
      if (wordType) {
        const flashcards = await flashcardAPI.getFlashcardsByType(wordType.name, complexity)
        return {
          flashcards,
          title: wordType.title,
        }
      }
    }
    
    // Check if this is a special category
    if (specialCategories.includes(topicId.toLowerCase())) {
      let flashcards: FlashcardData[]
      let title: string
      
      if (topicId.toLowerCase() === 'multi-meaning') {
        flashcards = await flashcardAPI.getMultimeaningFlashcards(complexity)
        title = 'Multi-meaning Words'
      } else if (topicId.toLowerCase() === 'multi-word') {
        flashcards = await flashcardAPI.getMultiwordFlashcards(complexity)
        title = 'Multi-word Expressions'
      } else {
        flashcards = []
        title = topicId
      }
      
      return {
        flashcards,
        title,
      }
    }
  } catch (error) {
    console.error("Error loading word types:", error)
    // Fallback to hardcoded list if API fails
    const wordTypes = ['verb', 'noun', 'adj', 'adv', 'prep', 'conj', 'intj', 'pron', 'num', 'det', 'part']
    
    // Check if this is a word type
    if (wordTypes.includes(topicId.toLowerCase())) {
      const wordType = topicId.toUpperCase() // Backend expects uppercase
      const flashcards = await flashcardAPI.getFlashcardsByType(wordType, complexity)
      
      // Create proper title for word types
      const titleMap: Record<string, string> = {
        'VERB': 'Verbs',
        'NOUN': 'Nouns', 
        'ADJ': 'Adjectives',
        'ADV': 'Adverbs',
        'PREP': 'Prepositions',
        'CONJ': 'Conjunctions',
        'INTJ': 'Interjections',
        'PRON': 'Pronouns',
        'NUM': 'Numbers',
        'DET': 'Determiners',
        'PART': 'Particles'
      }
      
      return {
        flashcards,
        title: titleMap[wordType] || wordType,
      }
    }
  }
  
  // Check if this is a special category
  if (specialCategories.includes(topicId.toLowerCase())) {
    let flashcards: FlashcardData[]
    let title: string
    
    if (topicId.toLowerCase() === 'multi-meaning') {
      flashcards = await flashcardAPI.getMultimeaningFlashcards(complexity)
      title = 'Multi-meaning Words'
    } else if (topicId.toLowerCase() === 'multi-word') {
      flashcards = await flashcardAPI.getMultiwordFlashcards(complexity)
      title = 'Multi-word Expressions'
    } else {
      flashcards = []
      title = topicId
    }
    
    return {
      flashcards,
      title,
    }
  }
  
  // Otherwise, handle as regular topic
  const result = await flashcardAPI.getFlashcardsByTopicLegacy(topicId, complexity)
  const topics = await flashcardAPI.getAllTopics()
  const topic = topics.find(t => t.id === topicId)
  
  return {
    flashcards: result,
    title: topic?.title || `Topic: ${topicId}`,
  }
}

export async function getFlashcardsByTopicWithPagination(
  topicId: string, 
  complexity?: string, 
  skip = 0, 
  limit = 20
): Promise<{ flashcards: FlashcardData[]; title: string; total: number; hasMore: boolean }> {
  try {
    const result = await flashcardAPI.getFlashcardsByTopic(topicId, complexity, skip, limit)
    const topics = await flashcardAPI.getAllTopics()
    const topic = topics.find(t => t.id === topicId)
    
    return {
      flashcards: result.flashcards,
      title: topic?.title || `Topic: ${topicId}`,
      total: result.total,
      hasMore: result.hasMore
    }
  } catch (error) {
    console.error('Error fetching flashcards by topic with pagination:', error)
    throw error
  }
}

// Generic function to get flashcards by category ID (auto-detects type and uses pagination)
export async function getFlashcardsByCategoryWithPagination(
  categoryId: string, 
  complexity?: string, 
  skip = 0, 
  limit = 20
): Promise<{ flashcards: FlashcardData[]; title: string; total: number; hasMore: boolean }> {
  try {
    // Define special categories
    const specialCategories = ['multi-meaning', 'multi-word']
    
    // Define title map for consistent naming
    const titleMap: Record<string, string> = {
      'VERB': 'Verbs',
      'NOUN': 'Nouns', 
      'ADJ': 'Adjectives',
      'ADV': 'Adverbs',
      'PREP': 'Prepositions',
      'CONJ': 'Conjunctions',
      'INTJ': 'Interjections',
      'PRON': 'Pronouns',
      'NUM': 'Numbers',
      'DET': 'Determiners',
      'PART': 'Particles'
    }
    
    // Try to get word types from backend first
    try {
      const allWordTypes = await flashcardAPI.getAllWordTypes()
      const wordTypeIds = allWordTypes.map(wt => wt.id)
      
      // Check if this is a word type
      if (wordTypeIds.includes(categoryId.toLowerCase())) {
        const wordType = allWordTypes.find(wt => wt.id === categoryId.toLowerCase())
        if (wordType) {
          const result = await flashcardAPI.getFlashcardsByTypeWithPagination(wordType.name, complexity, skip, limit)
          return {
            flashcards: result.flashcards,
            title: wordType.title,
            total: result.total,
            hasMore: result.hasMore
          }
        }
      }
    } catch (error) {
      console.error("Error loading word types, falling back to hardcoded list:", error)
      // Fallback to hardcoded list if API fails
      const wordTypes = ['verb', 'noun', 'adj', 'adv', 'prep', 'conj', 'intj', 'pron', 'num', 'det', 'part']
      
      if (wordTypes.includes(categoryId.toLowerCase())) {
        const wordType = categoryId.toUpperCase() // Backend expects uppercase
        const result = await flashcardAPI.getFlashcardsByTypeWithPagination(wordType, complexity, skip, limit)
        
        return {
          flashcards: result.flashcards,
          title: titleMap[wordType] || wordType,
          total: result.total,
          hasMore: result.hasMore
        }
      }
    }
    
    // Check if this is a special category
    if (specialCategories.includes(categoryId.toLowerCase())) {
      let result: {flashcards: FlashcardData[], total: number, hasMore: boolean}
      let title: string
      
      if (categoryId.toLowerCase() === 'multi-meaning') {
        result = await flashcardAPI.getMultimeaningFlashcardsWithPagination(complexity, skip, limit)
        title = 'Multi-meaning Words'
      } else if (categoryId.toLowerCase() === 'multi-word') {
        result = await flashcardAPI.getMultiwordFlashcardsWithPagination(complexity, skip, limit)
        title = 'Multi-word Expressions'
      } else {
        // Fallback
        result = { flashcards: [], total: 0, hasMore: false }
        title = categoryId
      }
      
      return {
        flashcards: result.flashcards,
        title,
        total: result.total,
        hasMore: result.hasMore
      }
    }
    
    // Otherwise, handle as regular topic
    const result = await flashcardAPI.getFlashcardsByTopic(categoryId, complexity, skip, limit)
    const topics = await flashcardAPI.getAllTopics()
    const topic = topics.find(t => t.id === categoryId)
    
    return {
      flashcards: result.flashcards,
      title: topic?.title || `Topic: ${categoryId}`,
      total: result.total,
      hasMore: result.hasMore
    }
  } catch (error) {
    console.error('Error fetching flashcards by category with pagination:', error)
    throw error
  }
}

// Re-export types for convenience
export type {
  FlashcardData,
  FlashcardTopic,
  WordType,
  RandomFlashcardParams,
  APIError,
} from '../types/flashcard.types'

