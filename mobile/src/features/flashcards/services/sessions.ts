/**
 * Session API service for custom flashcard review sessions (React Native version)
 */

import type {
  SessionFilterRequest,
  SessionValidationResponse,
  SessionGenerationRequest,
  SessionGenerationResponse,
  SuggestionOption,
} from '../types/session.types'
import { apiRequest, API_BASE_URL } from '../utils/apiClient'

// Re-export types for backward compatibility
export type {
  SessionFilterRequest,
  SessionValidationResponse,
  SessionGenerationRequest,
  SessionGenerationResponse,
  SuggestionOption,
}

class SessionAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Validate session filters and get availability information
   * @param filters - Session filter criteria
   * @param userId - Optional user ID for saved cards validation
   */
  async validateSessionFilters(filters: SessionFilterRequest, userId?: string): Promise<SessionValidationResponse> {
    try {
      const requestBody: any = { ...filters }
      if (userId) {
        requestBody.user_id = userId
      }

      return await apiRequest<SessionValidationResponse>('/flashcards/session/validate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.error('Error validating session filters:', error);
      throw error;
    }
  }

  /**
   * Generate flashcards for a custom session
   */
  async generateSessionCards(request: SessionGenerationRequest): Promise<SessionGenerationResponse> {
    try {
      return await apiRequest<SessionGenerationResponse>('/flashcards/session/generate', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Error generating session cards:', error);
      throw error;
    }
  }

  /**
   * Helper method to build filters from form data
   */
  buildFiltersFromForm(formData: {
    topic?: string;
    complexity: string;
    onlyCommonWords: boolean;
    numberOfCards: number;
  }): SessionFilterRequest {
    return {
      topic: formData.topic || undefined,
      complexity: formData.complexity === "All" ? "all" : formData.complexity.toLowerCase(),
      common_words_only: formData.onlyCommonWords,
      num_cards: formData.numberOfCards,
    };
  }

  /**
   * Helper method to format suggestion for display
   */
  formatSuggestionForDisplay(suggestion: SuggestionOption): string {
    const impacts = [];
    
    if (suggestion.impact.removed_restrictions?.length) {
      impacts.push(`removes ${suggestion.impact.removed_restrictions.join(", ")} restrictions`);
    }
    
    if (suggestion.impact.expanded_complexity) {
      impacts.push("includes all complexity levels");
    }
    
    if (suggestion.impact.expanded_topics) {
      impacts.push("includes all topics");
    }

    return impacts.length > 0 ? impacts.join(", ") : suggestion.description;
  }
}

// Export singleton instance
export const sessionAPI = new SessionAPI(); 