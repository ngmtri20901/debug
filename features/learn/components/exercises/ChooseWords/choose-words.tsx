"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Volume2, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Types for our component
export type ExerciseType = "translation" | "fill_in_blanks" | "sentence_scramble"

export interface ChooseWordsProps {
  question: string
  sentence: string
  words: string[]
  type: ExerciseType
  onComplete?: (isCorrect: boolean, answer?: string[]) => void
  correctAnswer?: string[]
  highlightedWords?: string[]
  audioUrl?: string
  characterImageUrl?: string
  controlled?: boolean
  value?: string[] | null
  onAnswerChange?: (answer: string[]) => void
  disableInlineFeedback?: boolean
  hideActions?: boolean
  readOnly?: boolean
}

// Word item with unique ID
interface WordItem {
  id: string
  content: string
  position?: number // Position for fill-in-blanks
}

// Word component
interface WordProps {
  word: WordItem
  onClick: (word: WordItem) => void
  isSelected?: boolean
}

const Word = ({ word, onClick, isSelected }: WordProps) => {
  return (
    <Button
      variant="outline"
      className={cn("m-1 transition-all", isSelected && "bg-primary/10 border-primary")}
      onClick={() => onClick(word)}
    >
      {word.position !== undefined && <span className="mr-1 text-primary font-medium">({word.position})</span>}
      {word.content}
    </Button>
  )
}

export function ChooseWords({
  question,
  sentence,
  words,
  type,
  onComplete,
  correctAnswer,
  highlightedWords = [],
  audioUrl,
  characterImageUrl,
  controlled = false,
  value = null,
  onAnswerChange,
  disableInlineFeedback = false,
  hideActions = false,
  readOnly = false,
}: ChooseWordsProps) {
  // Create word items with unique IDs
  const createWordItems = (wordList: string[]): WordItem[] => {
    return wordList.map((word, index) => ({
      id: `word-${word}-${index}`,
      content: word,
    }))
  }

  const [availableWords, setAvailableWords] = useState<WordItem[]>(createWordItems(words))
  const [selectedWords, setSelectedWords] = useState<WordItem[]>([])
  const [feedback, setFeedback] = useState<{
    visible: boolean
    isCorrect: boolean
    message: string
  }>({ visible: false, isCorrect: false, message: "" })
  const [blankPositions, setBlankPositions] = useState<number[]>([])

  function getSentenceScrambleTitles() {
    return [
      "Can you make the correct sentence?",
      "Can you put these words in the right order?",
      "Can you build the correct sentence?",
      "Can you arrange the words to form a sentence?",
      "Can you unscramble these words into a sentence?",
      "Can you create the correct sentence from these words?",
      "Can you fix the word order to make a sentence?",
      "Can you reorder the words correctly?",
      "Can you piece the words together into a sentence?",
      "Can you make sense of these words?"
    ];
  }

  const randomTitle = useMemo(() => {
    const titles = getSentenceScrambleTitles();
    return titles[Math.floor(Math.random() * titles.length)];
  }, [])

  // Find blank positions in the sentence for fill_in_blanks type
  useEffect(() => {
    if (type === "fill_in_blanks") {
      const positions: number[] = []
      const parts = sentence.split(" ")
      parts.forEach((part, index) => {
        if (part === "___") {
          positions.push(positions.length + 1)
        }
      })
      setBlankPositions(positions)
    }
  }, [sentence, type])

  // Reset exercise when incoming content actually changes (not just new array refs)
  const resetKeyRef = useRef<string>("")
  useEffect(() => {
    const key = `${question}|${sentence}|${words.join("||")}`
    if (resetKeyRef.current === key) return
    resetKeyRef.current = key
    setAvailableWords(createWordItems(words))
    setSelectedWords([])
    setFeedback({ visible: false, isCorrect: false, message: "" })
  }, [words, sentence, question])

  // Sync from parent in controlled mode so previously saved answers render
  // and readOnly view shows the user's selection.
  useEffect(() => {
    if (!controlled) return
    const incoming = Array.isArray(value) ? value : []
    // Build items from current words and split into selected/available
    const allItems = createWordItems(words)
    const usedIndexes: number[] = []
    const selected: WordItem[] = []

    for (const token of incoming) {
      const idx = allItems.findIndex((it, i) => it.content === token && !usedIndexes.includes(i))
      if (idx >= 0) {
        selected.push(allItems[idx])
        usedIndexes.push(idx)
      }
    }

    // For sentence scramble, shuffle available words to randomize order
    const available = allItems.filter((_, i) => !usedIndexes.includes(i))
    const shuffledAvailable = type === "sentence_scramble" ? 
      available.sort(() => Math.random() - 0.5) : available
    
    setSelectedWords(selected)
    setAvailableWords(shuffledAvailable)
  }, [controlled, value, words, type])

  // Handle clicking on a word in the word bank
  const handleWordBankClick = (word: WordItem) => {
    if (controlled && readOnly) return
    // For fill_in_blanks, assign the next available position
    const updatedWord = { ...word }

    if (type === "fill_in_blanks") {
      const usedPositions = selectedWords.map((w) => w.position).filter((p) => p !== undefined) as number[]
      const availablePositions = blankPositions.filter((p) => !usedPositions.includes(p))

      if (availablePositions.length > 0) {
        updatedWord.position = availablePositions[0]
      }
    }

    // Move word from available to selected
    setAvailableWords((prev) => prev.filter((w) => w.id !== word.id))
    setSelectedWords((prev) => [...prev, updatedWord])

    // Hide feedback when user makes changes
    if (feedback.visible) {
      setFeedback({ visible: false, isCorrect: false, message: "" })
    }
  }

  // Handle clicking on a word in the answer area
  const handleAnswerWordClick = (word: WordItem) => {
    if (controlled && readOnly) return
    // Move word from selected back to available
    setSelectedWords((prev) => prev.filter((w) => w.id !== word.id))
    // Add word to the end of available words instead of original position
    setAvailableWords((prev) => [...prev, { ...word, position: undefined }])

    // Hide feedback when user makes changes
    if (feedback.visible) {
      setFeedback({ visible: false, isCorrect: false, message: "" })
    }
  }

  const handleCheck = () => {
    if (correctAnswer) {
      let isCorrect = false

      if (type === "fill_in_blanks") {
        // For fill_in_blanks, check if words are in the correct positions
        const userAnswerByPosition = new Map<number, string>()
        selectedWords.forEach((word) => {
          if (word.position !== undefined) {
            userAnswerByPosition.set(word.position, word.content)
          }
        })

        // Check if all positions are filled and with correct words
        isCorrect = correctAnswer.every((word, index) => userAnswerByPosition.get(index + 1) === word)
      } else {
        // For other types, check the sequence
        const userAnswer = selectedWords.map((item) => item.content)
        isCorrect = userAnswer.join(" ") === correctAnswer.join(" ")
      }

      if (!controlled) {
        setFeedback({
          visible: true,
          isCorrect,
          message: isCorrect ? "Correct! Great job!" : "Not quite right. Try again!",
        })
        if (onComplete) {
          onComplete(
            isCorrect,
            selectedWords.map((w) => w.content),
          )
        }
      }
    }
  }

  const handleReset = () => {
    setAvailableWords(createWordItems(words))
    setSelectedWords([])
    setFeedback({ visible: false, isCorrect: false, message: "" })
  }

  // Use ref to track previous answer to prevent infinite loops
  const prevAnswerRef = useRef<string[]>([])
  
  // Report answer changes upward only after render to avoid parent setState during child render
  useEffect(() => {
    if (controlled) {
      const currentAnswer = selectedWords.map((w) => w.content)
      const prevAnswer = prevAnswerRef.current
      
      // Only call onAnswerChange if the answer has actually changed
      if (JSON.stringify(currentAnswer) !== JSON.stringify(prevAnswer)) {
        prevAnswerRef.current = currentAnswer
        onAnswerChange?.(currentAnswer)
      }
    }
    // Intentionally omit onAnswerChange to avoid effect loop on changing callback identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled, selectedWords])

  // Render sentence with numbered blanks for fill_in_blanks type
  const renderSentence = () => {
    if (type === "fill_in_blanks") {
      const parts = sentence.split(" ")
      let blankCount = 0

      return parts.map((part, index) => {
        if (part === "___") {
          blankCount++
          return (
            <span key={index} className="mx-1">
              <span className="text-primary font-medium">({blankCount})</span>
              <span className="border-b-2 border-primary px-2">___</span>
            </span>
          )
        }
        return (
          <span key={index} className="mr-1">
            {part}
          </span>
        )
      })
    } else if (type === "translation" && sentence) {
      // For translation, show the source sentence as reference
      return (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">English:</div>
          <div className="text-lg font-medium">{sentence}</div>
          <div className="text-sm text-gray-600">Vietnamese (arrange the words below):</div>
        </div>
      )
    } else if (highlightedWords && highlightedWords.length > 0) {
      const parts = sentence.split(" ")
      return parts.map((part, index) => {
        const isHighlighted = highlightedWords.includes(part)
        return (
          <span key={index} className={cn("mr-1", isHighlighted && "text-primary font-medium underline")}>
            {part}
          </span>
        )
      })
    }
    return sentence
  }

  // Sort selected words by position for fill_in_blanks
  const sortedSelectedWords = () => {
    if (type === "fill_in_blanks") {
      return [...selectedWords].sort((a, b) => {
        const posA = a.position || Number.MAX_SAFE_INTEGER
        const posB = b.position || Number.MAX_SAFE_INTEGER
        return posA - posB
      })
    }
    return selectedWords
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {type === "sentence_scramble" ? randomTitle : question}
        </h2>

        <div className="flex items-center mb-4">
          {characterImageUrl && (
            <div className="mr-4">
              <img src={characterImageUrl || "/placeholder.svg"} alt="Character" className="w-16 h-16 object-contain" />
            </div>
          )}

          <Card className="p-3 flex items-center">
            {audioUrl && (
              <Button variant="ghost" size="icon" className="mr-2" onClick={() => new Audio(audioUrl).play()}>
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
            <div className="text-lg">{renderSentence()}</div>
          </Card>
        </div>
      </div>

      {/* Answer Area */}
      <div
        className={cn(
          "min-h-24 w-full border-2 border-dashed rounded-md p-4 mb-6 flex flex-wrap items-center",
          selectedWords.length > 0 ? "border-primary bg-primary/5" : "border-gray-300 bg-gray-50",
        )}
      >
        {selectedWords.length > 0 ? (
          sortedSelectedWords().map((word) => (
            <Word key={word.id} word={word} onClick={handleAnswerWordClick} isSelected={true} />
          ))
        ) : (
          <div className="w-full text-center text-gray-400">
            {type === "translation" && "Click words below to form the Vietnamese translation"}
            {type === "fill_in_blanks" && "Click words below to fill in the blanks"}
            {type === "sentence_scramble" && "Click words below to unscramble the sentence"}
          </div>
        )}
      </div>

      {/* Word Bank */}
      <div className="p-4 border-2 border-gray-200 rounded-md mb-6">
        <div className="flex flex-wrap">
          {availableWords.map((word) => (
            <Word key={word.id} word={word} onClick={handleWordBankClick} />
          ))}
        </div>
      </div>

      {/* Feedback Alert */}
      {!controlled && !disableInlineFeedback && feedback.visible && (
        <Alert className={cn("mb-6", feedback.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
          <div className="flex items-center">
            {feedback.isCorrect ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <AlertDescription>{feedback.message}</AlertDescription>
          </div>
        </Alert>
      )}

      {!hideActions && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          {!controlled && <Button onClick={handleCheck}>Check Answer</Button>}
        </div>
      )}
    </div>
  )
}
