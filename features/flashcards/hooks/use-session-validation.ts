"use client";

import { useState, useCallback } from "react";
import { sessionAPI, SessionFilterRequest, SessionValidationResponse, SuggestionOption } from "@/features/flashcards/services/sessions";
import { toast } from "sonner";

interface UseSessionValidationReturn {
  isValidating: boolean;
  validationResult: SessionValidationResponse | null;
  validateSession: (filters: SessionFilterRequest, userId?: string) => Promise<SessionValidationResponse | null>;
  clearValidation: () => void;
  error: string | null;
}

export const useSessionValidation = (): UseSessionValidationReturn => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<SessionValidationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateSession = useCallback(async (filters: SessionFilterRequest, userId?: string): Promise<SessionValidationResponse | null> => {
    setIsValidating(true);
    setError(null);

    try {
      console.log("🔍 Validating session filters:", filters, userId ? `for user ${userId}` : "");
      const result = await sessionAPI.validateSessionFilters(filters, userId);

      console.log("✅ Validation result:", result);
      setValidationResult(result);
      
      if (result.insufficient) {
        console.log(`⚠️ Insufficient cards: ${result.available_count}/${filters.num_cards}`);
        if (result.suggestions && result.suggestions.length > 0) {
          console.log(`💡 Found ${result.suggestions.length} suggestions`);
        }
      } else {
        console.log(`✅ Sufficient cards available: ${result.available_count}/${filters.num_cards}`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to validate session";
      console.error("❌ Session validation error:", error);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setError(null);
  }, []);

  return {
    isValidating,
    validationResult,
    validateSession,
    clearValidation,
    error,
  };
}; 