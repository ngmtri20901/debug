/**
 * Session API service for custom flashcard review sessions
 */

import type {
  SessionFilterRequest,
  SessionValidationResponse,
  SessionGenerationRequest,
  SessionGenerationResponse,
  SuggestionOption,
} from '../types/session.types'

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
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
      
      const response = await fetch(`${this.baseUrl}/api/v1/flashcards/session/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
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
      const response = await fetch(`${this.baseUrl}/api/v1/flashcards/session/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
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