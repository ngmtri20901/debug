"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, BookMarked, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";

interface GrammarPoint {
  usage?: string;
  structure?: string;
  notes?: string[];
}

interface GrammarCarouselProps {
  grammarPoints: GrammarPoint[];
}

export default function GrammarCarousel({ grammarPoints }: GrammarCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!grammarPoints || grammarPoints.length === 0) {
    return null;
  }

  const currentPoint = grammarPoints[currentIndex];
  const totalPoints = grammarPoints.length;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalPoints - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === totalPoints - 1 ? 0 : prev + 1));
  };

  return (
    <Card className="bg-white shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookMarked className="h-6 w-6 text-violet-600" />
            <CardTitle className="text-xl font-bold text-slate-800">
              Grammar Points
            </CardTitle>
          </div>
          
          {/* Navigation Controls */}
          {totalPoints > 1 && (
            <div className="ml-auto flex items-center gap-1.5 flex-nowrap">

              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="h-8 w-8 rounded-full hover:bg-violet-100 hover:text-violet-700 transition-colors"
                aria-label="Previous grammar point"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="h-8 w-8 rounded-full hover:bg-violet-100 hover:text-violet-700 transition-colors"
                aria-label="Next grammar point"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/50 p-4 min-h-[200px]">
          {/* USAGE */}
          {currentPoint.usage && (
            <p className="text-base text-slate-700 leading-relaxed">{currentPoint.usage}</p>
          )}

          {/* STRUCTURE */}
          {currentPoint.structure && (
            <div>
              <h5 className="text-sm font-semibold text-slate-600 mb-1">Formula</h5>
              <div className="rounded-md bg-violet-100 p-2 text-sm font-mono text-violet-900 border border-violet-200">
                {currentPoint.structure}
              </div>
            </div>
          )}

          {/* NOTES */}
          {Array.isArray(currentPoint.notes) && currentPoint.notes.length > 0 && (
            <div className="pt-2">
              <h5 className="text-sm font-semibold text-slate-600 mb-2">Notes</h5>
              <ul className="space-y-2">
                {currentPoint.notes.map((note: string, j: number) => (
                  <li key={j} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-1 shrink-0 text-violet-500" />
                    <span className="text-sm text-slate-600">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Pagination Dots */}
        {totalPoints > 1 && (
          <div className="flex justify-center gap-1 mt-4">
            {Array.from({ length: totalPoints }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? "bg-violet-600"
                    : "bg-violet-200 hover:bg-violet-300"
                }`}
                aria-label={`Go to grammar point ${index + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
