"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SynonymPair {
  id: number
  word1: string
  word2: string
  meaning?: string // Optional English meaning for reference
}

interface SynonymsMatchingProps {
  pairs: SynonymPair[]
  onComplete?: (isCorrect: boolean) => void
  // Controlled: report progress to container; container handles submit/finalize
  controlled?: boolean
  onAnswerChange?: (matchedPairIds: number[]) => void
  readOnly?: boolean
}

export function SynonymsMatching({ pairs, onComplete, controlled = false, onAnswerChange, readOnly = false }: SynonymsMatchingProps) {
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set())
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set())
  const [hoverWord, setHoverWord] = useState<number | null>(null)
  const [lines, setLines] = useState<any[]>([])

  const [incorrectPair, setIncorrectPair] = useState<{ first: number | null; second: number | null }>({
    first: null,
    second: null,
  })
  const [showStars, setShowStars] = useState(false)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)

  const wordRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Select random synonym pairs
  const selectedPairs = useMemo(() => {
    return pairs
  }, [pairs])

  // Create a flat array of all words from both columns
  const allWords = useMemo(() => {
    const words: { id: number; text: string; pairId: number }[] = []
    selectedPairs.forEach((pair) => {
      words.push({ id: words.length, text: pair.word1, pairId: pair.id })
      words.push({ id: words.length, text: pair.word2, pairId: pair.id })
    })
    return words.sort(() => Math.random() - 0.5) // Shuffle the words
  }, [selectedPairs])

  // Get the correct pair ID for each word
  const wordToPairId = useMemo(() => {
    const map: Record<number, number> = {}
    allWords.forEach((word) => {
      map[word.id] = word.pairId
    })
    return map
  }, [allWords])

  function getSynonymMatchingTitles() {
    const titles = {
      h1: [
        "Find the Matching Synonyms",
        "Pair the Words with Their Synonyms",
        "Connect Each Word with Its Synonym",
        "Synonym Matching Challenge",
        "Match Words with the Same Meaning"
      ],
      h2: [
        "Link words that share similar meanings",
        "Test your synonym knowledge",
        "Which words go together?",
        "Check your vocabulary connections",
        "Practice recognizing synonyms"
      ]
    };
  
    return titles;
  }

  // Generate random titles once when component mounts
  const randomTitles = useMemo(() => {
    const titles = getSynonymMatchingTitles()
    return {
      h1: titles.h1[Math.floor(Math.random() * titles.h1.length)],
      h2: titles.h2[Math.floor(Math.random() * titles.h2.length)]
    }
  }, [])

  

  // Report progress upward in controlled mode
  useEffect(() => {
    if (controlled && !readOnly) {
      onAnswerChange?.(Array.from(matchedPairs))
    }
    // Intentionally omit onAnswerChange to avoid effect loops on new function identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled, matchedPairs, readOnly])

  const handleWordClick = (wordId: number) => {
    if (readOnly) return
    if (selectedWords.has(wordId)) {
      // Deselect if already selected
      const newSelectedWords = new Set(selectedWords)
      newSelectedWords.delete(wordId)
      setSelectedWords(newSelectedWords)
      setLastSelectedIndex(null)
      return
    }

    if (selectedWords.size === 0) {
      // First word selected
      setSelectedWords(new Set([wordId]))
      setLastSelectedIndex(wordId)
      return
    }

    // Second word selected - check if it's a match with the first word
    const firstWordId = lastSelectedIndex
    if (firstWordId !== null) {
      const pairId1 = wordToPairId[firstWordId]
      const pairId2 = wordToPairId[wordId]

      if (pairId1 === pairId2) {
        // Correct match
        setMatchedPairs(new Set([...matchedPairs, pairId1]))
        setSelectedWords(new Set())
        setLastSelectedIndex(null)
        setShowStars(true)
        setTimeout(() => setShowStars(false), 1500)
      } else {
        // Incorrect match
        setIncorrectPair({ first: firstWordId, second: wordId })
        setTimeout(() => {
          setIncorrectPair({ first: null, second: null })
          setSelectedWords(new Set())
          setLastSelectedIndex(null)
        }, 1000)
      }
    }
  }

  // Check if a word is matched
  const isWordMatched = (wordId: number) => {
    const pairId = wordToPairId[wordId]
    return matchedPairs.has(pairId)
  }

  return (
    <>
      <style jsx>{`
        @keyframes star {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-star {
          animation: star 1.5s ease-out forwards;
          font-size: 1.5rem;
        }
        @keyframes pulse-shadow {
          0% {
            box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(255, 165, 0, 0.8);
          }
          100% {
            box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);
          }
        }
        .pulse-highlight {
          animation: pulse-shadow 1.5s infinite ease-in-out;
        }
      `}</style>
      <div className="max-w-4xl mx-auto p-6 relative" ref={containerRef}>
        <h1 className="text-2xl font-bold mb-8">{randomTitles.h1}</h1>
        <h2 className="text-lg font-medium mb-8">{randomTitles.h2}</h2> 
        
        {/* Stars animation for correct matches 
        {showStars && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-star text-yellow-400"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.5 + Math.random() * 1}s`,
                }}
              >
                ✦
              </div>
            ))}
          </div>
        )}
          */}

        <div className="grid grid-cols-2 gap-x-14 gap-y-5">
          {allWords.map((word, index) => (
            <Card
              key={word.id}
              ref={(el) => (wordRefs.current[word.id] = el)}
              className={cn(
                "p-4 cursor-pointer transition-all duration-300 relative",
                selectedWords.has(word.id) && "bg-orange-100 border-orange-500",
                isWordMatched(word.id) ? "bg-gray-100 border-gray-300 text-gray-500" : "",
                incorrectPair.first === word.id || incorrectPair.second === word.id ? "border-2 border-red-500" : "",
                isWordMatched(word.id) && showStars && "border-2 border-green-500",
                // Add highlight effect with animation for hovered word when a word is selected
                hoverWord === word.id &&
                  lastSelectedIndex !== null &&
                  lastSelectedIndex !== word.id &&
                  !isWordMatched(word.id) &&
                  "scale-105 bg-orange-50 border-orange-300 pulse-highlight",
              )}
              onClick={() => !isWordMatched(word.id) && handleWordClick(word.id)}
              onMouseEnter={() => setHoverWord(word.id)}
              onMouseLeave={() => setHoverWord(null)}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full",
                    isWordMatched(word.id) ? "bg-gray-200 text-gray-500" : "bg-gray-100",
                  )}
                >
                  {index + 1}
                </span>
                <span className="text-lg">{word.text}</span>
              </div>
            </Card>
          ))}
        </div>
        {/* No Play Again; container manages navigation */}
      </div>
    </>
  )
}

