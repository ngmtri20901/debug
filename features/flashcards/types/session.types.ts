/**
 * Type definitions for flashcard review session functionality
 */

export interface SessionFilterRequest {
  topic?: string;
  complexity?: string; // all, simple, complex  
  common_words_only?: boolean;
  num_cards: number; // 10-50
}

export interface SuggestionOption {
  id: string;
  title: string;
  description: string;
  filters: SessionFilterRequest;
  estimated_count: number;
  impact: {
    removed_restrictions?: string[];
    expanded_complexity?: boolean;
    expanded_topics?: boolean;
    additional_count?: number;
  };
}

export interface SessionValidationResponse {
  available_count: number;
  insufficient: boolean;
  suggestions?: SuggestionOption[];
}

export interface SessionGenerationRequest {
  user_id: string;
  filters: SessionFilterRequest;
  suggestion_id?: string;
  session_metadata?: Record<string, any>;
}

export interface SessionGenerationResponse {
  session_id: string;
  flashcards: any[];
  actual_count: number;
  filters_applied: SessionFilterRequest;
  generation_metadata: Record<string, any>;
}

