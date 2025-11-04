"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Label } from "@/shared/components/ui/label";
import { AlertTriangle, ChevronRight, TrendingUp } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";

import type { SuggestionOption } from '@/features/flashcards/types/session.types'

interface InsufficientCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCount: number;
  requestedCount: number;
  suggestions: SuggestionOption[];
  onAcceptSuggestion: (suggestion: SuggestionOption) => void;
  onAdjustFilters: () => void;
  isLoading?: boolean;
}

export const InsufficientCardsModal: React.FC<InsufficientCardsModalProps> = ({
  isOpen,
  onClose,
  availableCount,
  requestedCount,
  suggestions,
  onAcceptSuggestion,
  onAdjustFilters,
  isLoading = false,
}) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>(
    suggestions.length > 0 ? suggestions[0].id : ""
  );

  const handleAcceptSuggestion = () => {
    const suggestion = suggestions.find((s) => s.id === selectedSuggestion);
    if (suggestion) {
      onAcceptSuggestion(suggestion);
    }
  };

  const selectedSuggestionData = suggestions.find(
    (s) => s.id === selectedSuggestion
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Not Enough Cards Available</DialogTitle>
              <DialogDescription className="mt-1">
                Only {availableCount} cards found, but you requested {requestedCount} cards
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          {suggestions.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Suggestions to reach {requestedCount} cards:
                </span>
              </div>

              <RadioGroup
                value={selectedSuggestion}
                onValueChange={setSelectedSuggestion}
                className="space-y-4"
              >
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedSuggestion === suggestion.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value={suggestion.id}
                        id={suggestion.id}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={suggestion.id}
                        className="flex-1 cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {suggestion.title}
                          </h3>
                          <Badge variant="secondary" className="ml-2">
                            {suggestion.estimated_count} cards
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {suggestion.description}
                        </p>

                        {suggestion.impact.additional_count && (
                          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                            <ChevronRight className="h-3 w-3" />
                            <span>
                              +{suggestion.impact.additional_count} additional cards
                            </span>
                          </div>
                        )}
                      </Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {selectedSuggestionData && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Selected option will provide: </span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {selectedSuggestionData.estimated_count} cards total
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                <p>No suggestions available to reach {requestedCount} cards.</p>
                <p className="mt-2">Try adjusting your filters manually.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={onAdjustFilters}
            className="flex-1"
            disabled={isLoading}
          >
            Adjust Filters
          </Button>
          
          {suggestions.length > 0 && selectedSuggestionData && (
            <Button
              onClick={handleAcceptSuggestion}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Creating Session..." : `Accept Suggestion`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 