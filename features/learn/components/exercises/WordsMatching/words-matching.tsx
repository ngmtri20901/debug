"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WordPair {
  id: number
  english: string
  vietnamese: string
}

interface Position {
  x: number
  y: number
}

interface WordsMatchingProps {
  pairs: WordPair[]
  onComplete?: (isCorrect: boolean) => void
  controlled?: boolean
  onAnswerChange?: (matchedPairIds: number[]) => void
  readOnly?: boolean
}

export function WordsMatching({ pairs, onComplete, controlled = false, onAnswerChange, readOnly = false }: WordsMatchingProps) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [selectedRight, setSelectedRight] = useState<number | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set())
  const [hoverRight, setHoverRight] = useState<number | null>(null)
  const [line, setLine] = useState<{ start: Position; end: Position } | null>(null)
  const [incorrectPair, setIncorrectPair] = useState<{ left: number | null; right: number | null }>({
    left: null,
    right: null,
  })
  const [showStars, setShowStars] = useState(false)
  const [lines, setLines] = useState<any[]>([])

  const leftRefs = useRef<(HTMLDivElement | null)[]>([])
  const rightRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Shuffle the Vietnamese words once on mount, but keep the order fixed
  const shuffledIndices = useMemo(() => {
    return [...pairs.map((_, i) => i)].sort(() => Math.random() - 0.5)
  }, [pairs])

  // Get the shuffled Vietnamese words using the shuffled indices
  const vietnameseWords = useMemo(() => {
    return shuffledIndices.map((index) => pairs[index].vietnamese)
  }, [shuffledIndices, pairs])

  // Map from shuffled index to original word pair id
  const shuffledIndexToWordPairId = useMemo(() => {
    const map: Record<number, number> = {}
    shuffledIndices.forEach((originalIndex, shuffledIndex) => {
      map[shuffledIndex] = pairs[originalIndex].id
    })
    return map
  }, [shuffledIndices, pairs])

  // Map from word pair id to shuffled index
  const wordPairIdToShuffledIndex = useMemo(() => {
    const map: Record<number, number> = {}
    shuffledIndices.forEach((originalIndex, shuffledIndex) => {
      map[pairs[originalIndex].id] = shuffledIndex
    })
    return map
  }, [shuffledIndices, pairs])

  // Report progress upward in controlled mode
  useEffect(() => {
    if (controlled && !readOnly) {
      onAnswerChange?.(Array.from(matchedPairs))
    }
    // Intentionally omit onAnswerChange to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled, matchedPairs, readOnly])

  const handleLeftClick = (id: number) => {
    if (readOnly) return
    if (matchedPairs.has(id)) return

    // If right is already selected, check for match
    if (selectedRight !== null) {
      const correctShuffledIndex = wordPairIdToShuffledIndex[id]
      const isMatch = selectedRight === correctShuffledIndex

      if (isMatch) {
        // Correct match
        setMatchedPairs(new Set([...matchedPairs, id]))
        setSelectedLeft(null)
        setSelectedRight(null)
        setLine(null)
        setShowStars(true)
        setTimeout(() => setShowStars(false), 1500)
        return
      } else {
        // Incorrect match
        setIncorrectPair({ left: id, right: selectedRight })
        setTimeout(() => {
          setIncorrectPair({ left: null, right: null })
        }, 1000)
      }
    }

    // Toggle selection
    setSelectedLeft(selectedLeft === id ? null : id)
    setSelectedRight(null)
  }

  const handleRightClick = (index: number) => {
    if (readOnly) return
    if (matchedRightIndices[index]) return

    // If left is already selected, check for match
    if (selectedLeft !== null) {
      const correctWordPairId = shuffledIndexToWordPairId[index]
      const isMatch = selectedLeft === correctWordPairId

      if (isMatch) {
        // Correct match
        setMatchedPairs(new Set([...matchedPairs, selectedLeft]))
        setSelectedLeft(null)
        setSelectedRight(null)
        setLine(null)
        setShowStars(true)
        setTimeout(() => setShowStars(false), 1500)
        return
      } else {
        // Incorrect match
        setIncorrectPair({ left: selectedLeft, right: index })
        setTimeout(() => {
          setIncorrectPair({ left: null, right: null })
        }, 1000)
      }
    }

    // Toggle selection
    setSelectedRight(selectedRight === index ? null : index)
    setSelectedLeft(null)
  }

  // Calculate line position when hovering over right items
  useEffect(() => {
    if (!containerRef.current || selectedLeft === null || hoverRight === null) {
      setLine(null)
      return
    }

    // Don't draw line if the left word is already matched
    if (matchedPairs.has(selectedLeft)) {
      setLine(null)
      return
    }

    const leftElement = leftRefs.current[pairs.findIndex((p) => p.id === selectedLeft)]
    const rightElement = rightRefs.current[hoverRight]

    if (!leftElement || !rightElement) {
      setLine(null)
      return
    }

    const containerRect = containerRef.current.getBoundingClientRect()
    const leftRect = leftElement.getBoundingClientRect()
    const rightRect = rightElement.getBoundingClientRect()

    // Start at the right edge of the left card
    const start = {
      x: leftRect.right - containerRect.left,
      y: leftRect.top + leftRect.height / 2 - containerRect.top,
    }

    // End at the left edge of the right card
    const end = {
      x: rightRect.left - containerRect.left,
      y: rightRect.top + rightRect.height / 2 - containerRect.top,
    }

    setLine({ start, end })
  }, [selectedLeft, hoverRight, matchedPairs, pairs])

  // Memoize the matched pair IDs for the right column
  const matchedRightIndices = useMemo(() => {
    const indices: Record<number, boolean> = {}

    matchedPairs.forEach((id) => {
      const index = wordPairIdToShuffledIndex[id]
      if (index !== undefined) {
        indices[index] = true
      }
    })

    return indices
  }, [matchedPairs, wordPairIdToShuffledIndex])

  function getWordMatchingTitles() {
    return [
      "Match the English words with their Vietnamese meanings",
      "Find the correct pairs of words",
      "Connect each word with its translation",
      "Pair the words with their correct meanings",
      "Link the English words to the right Vietnamese words",
      "Make the correct matches",
      "Which words go together?",
      "Choose the pairs that match"
    ];
  }
  const randomTitle = useMemo(() => {
    const titles = getWordMatchingTitles();
    return titles[Math.floor(Math.random() * titles.length)];
  }, []);

  return (
    <div
      className="max-w-2xl mx-auto p-6 relative"
      ref={containerRef}
      onMouseLeave={() => {
        setHoverRight(null)
        if (!selectedLeft && !selectedRight) {
          setLine(null)
        }
      }}
    >
      <h1 className="text-2xl font-bold mb-8">{randomTitle}</h1>

      {/* SVG for drawing lines */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        {line && (
          <line
            x1={line.start.x}
            y1={line.start.y}
            x2={line.end.x}
            y2={line.end.y}
            stroke="orange"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
        {lines.map((line, index) => (
          <line
            key={index}
            x1={line.start.x}
            y1={line.start.y}
            x2={line.end.x}
            y2={line.end.y}
            stroke="green"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          {pairs.map((pair, idx) => (
            <Card
              key={pair.id}
              ref={(el) => (leftRefs.current[idx] = el)}
              className={cn(
                "p-4 cursor-pointer transition-colors relative",
                selectedLeft === pair.id && "bg-orange-100 border-orange-500",
                matchedPairs.has(pair.id) ? "bg-gray-100 border-gray-300 text-gray-500" : "",
                incorrectPair.left === pair.id && "border-2 border-red-500",
                matchedPairs.has(pair.id) && showStars && "border-2 border-green-500",
              )}
              onClick={() => handleLeftClick(pair.id)}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full",
                    matchedPairs.has(pair.id) ? "bg-gray-200 text-gray-500" : "bg-gray-100",
                  )}
                >
                  {idx + 1}
                </span>
                <span className="text-lg">{pair.english}</span>
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {vietnameseWords.map((word, index) => (
            <Card
              key={index}
              ref={(el) => (rightRefs.current[index] = el)}
              className={cn(
                "p-4 cursor-pointer transition-colors relative",
                selectedRight === index && "bg-orange-100 border-orange-500",
                matchedRightIndices[index] ? "bg-gray-100 border-gray-300 text-gray-500" : "",
                incorrectPair.right === index && "border-2 border-red-500",
                matchedRightIndices[index] && showStars && "border-2 border-green-500",
              )}
              onClick={() => handleRightClick(index)}
              onMouseEnter={() => {
                if (selectedLeft !== null && !matchedRightIndices[index]) {
                  setHoverRight(index)
                }
              }}
              onMouseLeave={() => {
                if (hoverRight === index) {
                  setHoverRight(null)
                }
              }}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full",
                    matchedRightIndices[index] ? "bg-gray-200 text-gray-500" : "bg-gray-100",
                  )}
                >
                  {index + 6}
                </span>
                <span className="text-lg">{word}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
      {/* No Play Again in controlled flow */}
    </div>
  )
}
