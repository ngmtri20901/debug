"use client"

import type React from "react"

import { useState } from "react"
import { Volume2, Bookmark, BookmarkCheck } from "lucide-react"
import { TbMessageLanguage } from "react-icons/tb";
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip"
// import { toast } from "sonner" // TODO: Install sonner or use alternative toast solution
import { audioManager } from "@/shared/utils/audio"

interface FlashcardFrontProps {
  data: {
    id: string
    vietnamese: string
    english: string[]
    type: string[] | string
    vietnamese_sentence: string
    english_sentence: string
    image_url: string | null
    audio_url: string | null
    common_meaning: string
    is_multimeaning?: boolean
    is_common?: boolean

    // New pronunciation field from backend
    pronunciation?: string
  }
  saved: boolean
  onSave: (id: string) => void
}

export function FlashcardFront({ data, saved, onSave }: FlashcardFrontProps) {
  const [showTranslation, setShowTranslation] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const playAudio = async () => {
    if (isPlayingAudio) {
      // toast.info("Audio is already playing") // TODO: Add toast notification
      return
    }
    
    setIsPlayingAudio(true)
    
    try {
      if (data.audio_url && data.flashcard_type === 'APP') {
        // For APP flashcards, use the stored audio URL with audio manager
        console.log("Playing APP flashcard audio:", data.audio_url)
        await audioManager.playPronunciation(data.audio_url)
      } else if (data.flashcard_type === 'CUSTOM') {
        // For custom flashcards, use Google TTS
        console.log("Playing CUSTOM flashcard audio for:", data.vietnamese)
        await playCustomFlashcardAudio(data.id, data.vietnamese)
      } else if (data.audio_url) {
        // Fallback for any audio URL
        console.log("Playing fallback audio:", data.audio_url)
        await audioManager.playPronunciation(data.audio_url)
      } else {
        console.log("No audio available for:", data.vietnamese)
        // toast.info("No audio available for this flashcard") // TODO: Add toast notification
      }
    } catch (error) {
      console.error("Failed to play audio:", error)
      // toast.error("Failed to play audio") // TODO: Add toast notification
    } finally {
      setIsPlayingAudio(false)
    }
  }


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

  // Format word type for display
  const formatWordType = (type: string[] | string): string => {
    if (Array.isArray(type)) {
      return type.join(", ")
    }
    return type
  }

  // Get primary English translation
  const primaryTranslation = Array.isArray(data.english) ? data.english[0] : data.english

  // Safely escape special regex characters in the term to highlight
  const escapeRegExp = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  // Highlight the exact Vietnamese term in the sentence without using innerHTML (XSS-safe)
  const highlightTermInSentence = (sentence: string, term: string): React.ReactNode => {
    if (!sentence || !term) return sentence

    const escaped = escapeRegExp(term)

    // Prefer Unicode-aware, letter-bounded matching; fall back gracefully if unsupported
    let regex: RegExp
    try {
      regex = new RegExp(`(?<!\\\p{L})(${escaped})(?!\\\p{L})`, "giu")
    } catch {
      // Fallback for environments without lookbehind/unicode property escapes support
      regex = new RegExp(`(${escaped})`, "gi")
    }

    const parts: React.ReactNode[] = []
    let lastIndex = 0

    for (const match of sentence.matchAll(regex)) {
      const start = match.index ?? 0
      const end = start + match[0].length

      if (start > lastIndex) {
        parts.push(sentence.slice(lastIndex, start))
      }

      parts.push(
        <mark
          key={`hl-${start}`}
          className="rounded-md px-1 bg-amber-200/70 text-gray-900 ring-1 ring-amber-300 underline decoration-amber-500/50 decoration-2 underline-offset-2"
        >
          {match[0]}
        </mark>
      )

      lastIndex = end
    }

    if (lastIndex === 0) return sentence
    if (lastIndex < sentence.length) {
      parts.push(sentence.slice(lastIndex))
    }

    return parts
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
      {/* Save button */}
      <div className="flex justify-end mb-4">
        <Button variant="ghost" size="sm" onClick={handleSave} className="p-2 hover:bg-gray-100">
          {saved ? <BookmarkCheck className="h-5 w-5 text-blue-600" /> : <Bookmark className="h-5 w-5 text-gray-500" />}
        </Button>
      </div>

      <div className="flex gap-8 h-full">
        {/* Image section */}
        <div className="flex-shrink-0">
          {data.image_url ? (
            <img
              src={data.image_url}
              alt={data.vietnamese}
              className="w-48 h-48 object-cover rounded-xl border-2 border-gray-200"
              loading="lazy"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">📚</div>
                <div className="text-sm">No image</div>
              </div>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="flex-1 flex flex-col justify-center space-y-6">
          {/* Vietnamese word and audio */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-4xl font-bold text-gray-800">{data.vietnamese}</h2>
              {/* IPA Pronunciation display */}
              {data.pronunciation && (
                <p className="text-lg text-gray-500 mt-1 font-mono">
                  /{data.pronunciation}/
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                playAudio()
              }}
              className={`p-3 hover:bg-gray-100 rounded-full ${isPlayingAudio ? 'animate-pulse bg-blue-100' : ''}`}
              disabled={isPlayingAudio}
              title={isPlayingAudio ? "Playing audio..." : "Play pronunciation"}
            >
              <Volume2 className={`h-6 w-6 ${isPlayingAudio ? 'text-blue-700' : 'text-blue-600'}`} />
            </Button>
          </div>

          {/* Word type and badges */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {formatWordType(data.type)}
            </Badge>
            {data.is_multimeaning && (
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                Multi-meaning
              </Badge>
            )}
          </div>


          {/* Vietnamese example sentence */}
          {data.vietnamese_sentence ? (
            <div className="space-y-1">
              <p className="text-sm text-gray-500 font-medium">Example sentence:</p>
              <p className="text-md md:text-lg text-gray-700 italic">
                <span className="text-gray-400">"</span>
                {highlightTermInSentence(data.vietnamese_sentence, data.vietnamese)}
                <span className="text-gray-400">"</span>
              </p>

              {/* English translation with hover - CHỈ DÙNG TOOLTIP */}
              {data.english_sentence && (
                <div className="flex items-center gap-1 mt-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon" // Sử dụng size="icon" cho các nút chỉ chứa icon
                          className="p-1 h-auto text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                          aria-label="Xem dịch câu ví dụ"
                        >
                          <TbMessageLanguage className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start">
                        <p className="text-sm text-gray-700 italic">"{data.english_sentence}"</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-gray-500 font-medium">Example sentence:</p>
              <p className="text-md md:text-lg text-gray-400 italic">
                No example sentence available
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
