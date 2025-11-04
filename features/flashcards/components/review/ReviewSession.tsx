'use client'

import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { AlarmClock, Check, X, CircleHelp, RefreshCw } from "lucide-react";
import { FlashcardComponent } from "@/features/flashcards/components/core/flashcard-component";
import type { FlashcardData } from "@/features/flashcards/types/flashcard.types";

interface ReviewSessionProps {
  practiceCards: FlashcardData[];
  currentCard: FlashcardData | null;
  currentCardIndex: number;
  isFlipped: boolean;
  timer: number;
  isTimerActive: boolean;
  cardResults: any[];
  progressStats: any;
  savedCards: Set<string>;
  onCardResult: (result: 'correct' | 'incorrect' | 'unsure') => void;
  onSaveCard: (cardId: string) => void;
  onFlipCard: () => void;
  onRefreshCards: () => void;
  onGetFreshCards: () => void;
  getAnimationDuration: () => number;
  isLoading: boolean;
}

export function ReviewSession({
  practiceCards,
  currentCard,
  currentCardIndex,
  isFlipped,
  timer,
  isTimerActive,
  cardResults,
  progressStats,
  savedCards,
  onCardResult,
  onSaveCard,
  onFlipCard,
  onRefreshCards,
  onGetFreshCards,
  getAnimationDuration,
  isLoading,
}: ReviewSessionProps) {
  if (!practiceCards.length || !currentCard) {
    return null;
  }

  return (
    <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-8">
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                <AlarmClock className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-medium text-blue-900 dark:text-blue-100">
                  {timer > 0
                    ? `${timer}s`
                    : isFlipped
                      ? "Review time!"
                      : ""}
                </span>
              </div>
              <Button
                onClick={onRefreshCards}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={isLoading}
                title="Restart session"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <FlashcardComponent
              data={currentCard}
              saved={savedCards.has(currentCard.id)}
              onSave={onSaveCard}
              onFlip={onFlipCard}
              isFlipped={isFlipped}
              animationDuration={getAnimationDuration()}
            />
          </div>

          <div className="flex justify-center gap-4 md:gap-6">
            <Button
              onClick={() => onCardResult("incorrect")}
              className="w-16 h-16 rounded-full bg-red-100 hover:bg-red-200 border-0"
              variant="outline"
              disabled={!isFlipped}
            >
              <X className="h-8 w-8 text-red-600" />
            </Button>

            <Button
              onClick={() => onCardResult("unsure")}
              className="w-16 h-16 rounded-full bg-yellow-100 hover:bg-yellow-200 border-0"
              variant="outline"
              disabled={!isFlipped}
              title="Unsure"
              aria-label="Unsure"
            >
              <CircleHelp className="h-8 w-8 text-yellow-600" />
            </Button>

            <Button
              onClick={() => onCardResult("correct")}
              className="w-16 h-16 rounded-full bg-green-100 hover:bg-green-200 border-0"
              variant="outline"
              disabled={!isFlipped}
            >
              <Check className="h-8 w-8 text-green-600" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300">
                Card {currentCardIndex + 1} of {practiceCards.length}
              </span>
              <span className="text-blue-700 dark:text-blue-300">
                Correct: {progressStats.correct} | Incorrect:{" "}
                {progressStats.incorrect} | Unsure: {progressStats.unsure}
              </span>
            </div>

            <div className="grid grid-cols-10 gap-1">
              {practiceCards.map((_, index) => {
                let bgColor = "bg-gray-200";

                if (index < progressStats.total) {
                  // This card has been reviewed - get the specific result for this card
                  const cardResult = cardResults[index]?.result;
                  if (cardResult === "correct") {
                    bgColor = "bg-green-500";
                  } else if (cardResult === "incorrect") {
                    bgColor = "bg-red-500";
                  } else if (cardResult === "unsure") {
                    bgColor = "bg-yellow-500";
                  }
                } else if (index === currentCardIndex) {
                  bgColor = "bg-gray-300";
                }

                return (
                  <div key={index} className={`h-2 rounded ${bgColor}`} />
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
