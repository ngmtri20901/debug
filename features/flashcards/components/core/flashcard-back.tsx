"use client"

import type React from "react"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
// import { toast } from "sonner" // TODO: Install sonner or use alternative toast solution

interface FlashcardBackProps {
  data: {
    id: string
    vietnamese: string
    english: string[]
    common_meaning: string
    is_multimeaning?: boolean
    is_multiword?: boolean
    // Custom flashcard fields
    flashcard_type?: 'APP' | 'CUSTOM'
    ipa_pronunciation?: string
  }
  saved: boolean
  onSave: (id: string) => void
}

export function FlashcardBack({ data, saved, onSave }: FlashcardBackProps) {
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("Save button clicked for card:", data.id)
    try {
      onSave(data.id)
    } catch (error) {
      console.error("Error saving flashcard:", error)
      // toast.error("Failed to save flashcard") // TODO: Add toast notification
    }
  }

  // Get other meanings (excluding the common meaning)
  const otherMeanings = data.english ? data.english.filter(meaning => meaning !== data.common_meaning) : []

  return (
    <div className="w-full h-full bg-white rounded-3xl p-6 shadow-lg border border-gray-200 flex flex-col">
      {/* Save button */}
      <div className="flex justify-end mb-4">
        <Button variant="ghost" size="sm" onClick={handleSave} className="p-2 hover:bg-gray-100">
          {saved ? (
            <BookmarkCheck className="h-5 w-5 text-green-600" />
          ) : (
            <Bookmark className="h-5 w-5 text-gray-500" />
          )}
        </Button>
      </div>

      <div className="flex-1 flex flex-col space-y-6 min-h-0">

        {/* Primary meaning */}
        <div className="flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Primary Meaning</h3>
          <p className="text-2xl font-medium text-green-700 bg-green-50 rounded-lg p-4 border border-green-200">
            {data.common_meaning || (data.english && data.english.length > 0 ? data.english[0] : "No translation available")}
          </p>

          {/* IPA pronunciation for custom flashcards */}
          {data.flashcard_type === 'CUSTOM' && data.ipa_pronunciation && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 italic">
                IPA: <span className="font-mono text-blue-600">{data.ipa_pronunciation}</span>
              </p>
            </div>
          )}
        </div>

        {/* Other meanings - only show if there are multiple meanings */}
        {otherMeanings && otherMeanings.length > 0 && (
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-xl font-semibold text-gray-800 mb-3 flex-shrink-0">
              Other Meanings ({otherMeanings.length})
            </h3>
            
            {/* Scrollable area for other meanings */}
            <ScrollArea className="flex-1 max-h-48 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="space-y-3">
                {otherMeanings.map((meaning, idx) => (
                  <p key={idx} className="text-base text-gray-700 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    • {meaning}
                  </p>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}
