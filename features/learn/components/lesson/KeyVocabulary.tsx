// ...existing code...
"use client";

import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";
import { Badge } from "@/shared/components/ui/badge"; // added badge import

interface VocabularyItem {
  vi: string;
  en: string;
  pos?: string; // added part-of-speech
}

interface KeyVocabularyProps {
  vocabulary: VocabularyItem[];
  maxHeight?: string;
}

export default function KeyVocabulary({
  vocabulary,
  maxHeight = "200px",
}: KeyVocabularyProps) {
  if (!vocabulary || vocabulary.length === 0) {
    return null;
  }

  // Map pos to abbreviation & colors
  const getPosBadge = (pos?: string) => {
    if (!pos) return { label: "", className: "hidden" };

    const key = String(pos).toLowerCase().trim();
    switch (key.toLowerCase()) {
      case "noun":
      case "n":
        return { label: "n.", className: "bg-blue-100 text-blue-800" };

      case "verb":
      case "v":
        return { label: "v.", className: "bg-emerald-100 text-emerald-800" };

      case "adjective":
      case "adj":
        return { label: "adj.", className: "bg-purple-100 text-purple-800" };

      case "adverb":
      case "adv":
        return { label: "adv.", className: "bg-teal-100 text-teal-800" };

      case "phrase":
      case "phr":
      case "phr.":
        return { label: "phr.", className: "bg-amber-100 text-amber-800" };

      // thêm mới
      case "verb phrase":
      case "vp":
        return { label: "v.phr.", className: "bg-emerald-200 text-emerald-900" };

      case "conjunction":
      case "conj":
        return { label: "conj.", className: "bg-pink-100 text-pink-800" };

      case "pronoun":
      case "pron":
        return { label: "pron.", className: "bg-indigo-100 text-indigo-800" };

      case "preposition":
      case "prep":
        return { label: "prep.", className: "bg-rose-100 text-rose-800" };

      case "particle":
      case "prt":
        return { label: "prt.", className: "bg-gray-200 text-gray-800" };

      case "determiner":
      case "det":
        return { label: "det.", className: "bg-yellow-100 text-yellow-800" };

      case "classifier":
      case "clf":
        return { label: "clf.", className: "bg-lime-100 text-lime-800" };

      default:
        return { label: key.slice(0, 3) + ".", className: "bg-slate-100 text-slate-800" };
    }
  };

  return (
    <Card className="bg-white shadow-lg rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-indigo-600" />
          <CardTitle className="text-xl font-bold text-slate-800">Key Vocabulary</CardTitle>
        </div>
        {vocabulary.length > 8 && (
          <p className="text-xs text-slate-500 mt-1">Scroll to see all {vocabulary.length} words</p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="relative">
          {/* Scrollable container */}
          <div
            className={cn(
              "divide-y divide-slate-200 overflow-y-auto custom-scrollbar pr-2",
              vocabulary.length > 8 && "pb-4"
            )}
            style={{ maxHeight }}
          >
            {vocabulary.map((item, index) => {
              const badge = getPosBadge(item.pos);
              return (
                <div
                  key={index}
                  className="grid grid-cols-2 gap-4 py-3 first:pt-0 hover:bg-indigo-50/50 transition-colors duration-150 rounded-md px-2 -mx-2"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs pointer-events-none transition-none",
                        badge.className
                      )}
                    >
                      {badge.label}
                    </Badge>
                    <p className="font-semibold text-indigo-700 leading-relaxed">{item.vi}</p>
                  </div>
                  <p className="text-slate-600 justify-self-end text-right leading-relaxed">{item.en}</p>
                </div>
              );
            })}
          </div>

          {/* Fade gradient at bottom to indicate scrollability */}
          {vocabulary.length > 8 && (
            <div
              className="absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-lg"
              aria-hidden="true"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
//