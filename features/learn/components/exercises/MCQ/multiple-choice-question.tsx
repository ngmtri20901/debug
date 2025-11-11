"use client"

import { useMemo, useState, useEffect } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { cn } from "@/shared/utils/cn"
import { CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import Image from "next/image"

// Default questions for image-question type
const defaultImageQuestions = [
  "What does this image show?",
  "What is shown in the picture?",
  "What is depicted in this image?",
  "What is this an picture of?",
  "What can you see in the picture?",
  "Identify what's in the image.",
  "Name what the image shows.",
  "Choose the best description of the picture.",
  "Which option best describes the image?"
]

// Default questions for image-choices type
const defaultImageChoicesQuestions = [
  "Select the picture for",
  "Choose the correct image for",
  "Pick the image that matches",
  "Which picture shows",
  "Identify the image for",
  "Click on the picture that represents",
  "Find the correct image for the word",
  "Select the image that best illustrates",
  "Which image corresponds to",
  "Point to the picture that matches the word"
]

// Default questions for word-translation type
const defaultWordTranslationQuestions = [
  "What does",
  "Select the correct meaning of",
  "Choose the right translation for",
  "Pick the correct meaning of the word",
  "Which is the correct meaning of",
  "Identify the correct translation of",
  "Choose the option that correctly translates",
  "Find the correct meaning of the word",
  "Which option gives the right meaning of"
]

// Types of multiple choice questions
export type QuestionType =
  | "text-only" // Type 1: Passage + question + text choices
  | "image-question" // Type 2: Image + question + text choices
  | "word-translation" // Type 3: Word + translation choices
  | "image-choices" // Type 4: Question + image choices

// Choice structure
export interface Choice {
  id: string
  text: string
  imageUrl?: string
}

// Props for the component
export interface MultipleChoiceQuestionProps {
  type: QuestionType
  questionText?: string
  passage?: string
  questionImage?: string
  targetWord?: string
  choices: Choice[]
  correctChoiceId: string
  explanation?: string
  showCorrectAnswer?: boolean
  lockAfterSubmit?: boolean
  onComplete?: (isCorrect: boolean, selectedChoice?: Choice) => void
  // Controlled mode for container-managed flow
  controlled?: boolean
  value?: string | null
  onAnswerChange?: (choiceId: string | null) => void
  disableInlineFeedback?: boolean
  hideActions?: boolean
  readOnly?: boolean
}

export function MultipleChoiceQuestion({
  type,
  questionText,
  passage,
  questionImage,
  targetWord,
  choices,
  correctChoiceId,
  explanation,
  showCorrectAnswer = true,
  lockAfterSubmit = false,
  onComplete,
  controlled = false,
  value = null,
  onAnswerChange,
  disableInlineFeedback = false,
  hideActions = false,
  readOnly = false,
}: MultipleChoiceQuestionProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(value)
  const [feedback, setFeedback] = useState<{
    visible: boolean
    isCorrect: boolean
    message: string
  }>({ visible: false, isCorrect: false, message: "" })
  const [submitted, setSubmitted] = useState<boolean>(false)
  const correctAnswerText = useMemo(
    () => choices.find((opt) => opt.id === correctChoiceId)?.text,
    [choices, correctChoiceId],
  )

  const isSelectionLocked = controlled ? !!readOnly : submitted && lockAfterSubmit

  // Sync external value when controlled
  useEffect(() => {
    if (controlled) {
      setSelectedChoiceId(value ?? null)
    }
  }, [controlled, value])

  const handleChoiceSelect = (choiceId: string) => {
    if (isSelectionLocked) return
    if (controlled) {
      onAnswerChange?.(choiceId)
    } else {
      setSelectedChoiceId(choiceId)
      setFeedback({ visible: false, isCorrect: false, message: "" })
    }
  }

  const handleCheck = () => {
    if (!selectedChoiceId) return

    const isCorrect = selectedChoiceId === correctChoiceId
    const selectedChoice = choices.find((choice) => choice.id === selectedChoiceId)

    if (!controlled) {
      setFeedback({
        visible: true,
        isCorrect,
        message: isCorrect ? "Correct! Great job!" : "Not quite right. Try again!",
      })
      setSubmitted(true)
      if (onComplete && selectedChoice) {
        onComplete(isCorrect, selectedChoice)
      }
    }
  }

  const handleReset = () => {
    if (controlled) {
      onAnswerChange?.(null)
    } else {
      setSelectedChoiceId(null)
      setFeedback({ visible: false, isCorrect: false, message: "" })
      setSubmitted(false)
    }
  }

  // Render the question content based on type
  const renderQuestionContent = () => {
    // Helper function to get question text based on type - memoized per question
    const getQuestionText = useMemo(() => {
      if (questionText) return questionText

      switch (type) {
        case "image-question":
          // Use questionImage as seed for consistent randomization per question
          const seed = questionImage || type
          const hash = seed.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0)
            return a & a
          }, 0)
          const index = Math.abs(hash) % defaultImageQuestions.length
          return defaultImageQuestions[index]
        case "image-choices":
          // Use targetWord as seed for consistent randomization per question
          const seedChoices = targetWord || type
          const hashChoices = seedChoices.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0)
            return a & a
          }, 0)
          const indexChoices = Math.abs(hashChoices) % defaultImageChoicesQuestions.length
          const questionPrefix = defaultImageChoicesQuestions[indexChoices]
          return targetWord ? `${questionPrefix} "${targetWord}"` : "Choose the appropriate image"
        case "word-translation":
          // Use targetWord as seed for consistent randomization per question
          const seedTranslation = targetWord || type
          const hashTranslation = seedTranslation.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0)
            return a & a
          }, 0)
          const indexTranslation = Math.abs(hashTranslation) % defaultWordTranslationQuestions.length
          const questionPrefixTranslation = defaultWordTranslationQuestions[indexTranslation]
          return targetWord ? `${questionPrefixTranslation} ` : "Choose the correct translation"
        default:
          return "Select the correct answer"
      }
    }, [questionText, type, questionImage, targetWord])

    switch (type) {
      case "text-only":
        return (
          <div className="mb-6">
            {passage && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <p className="text-gray-700">{passage}</p>
                </CardContent>
              </Card>
            )}
            <h3 className="text-xl font-medium mb-2">{getQuestionText}</h3>
          </div>
        )

      case "image-question":
        console.log('[MCQ] Rendering image-question with questionImage:', questionImage)
        return (
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            {questionImage && (
              <div className="md:w-1/2">
                <div className="relative h-64 w-full rounded-lg overflow-hidden">
                  <Image src={questionImage || "/placeholder.svg"} alt="Question image" fill className="object-cover" />
                </div>
              </div>
            )}
            <div className="md:w-1/2">
              <h3 className="text-xl font-medium mb-2">{getQuestionText}</h3>
            </div>
          </div>
        )

      case "word-translation":
        return (
          <div className="mb-6 text-center">
            <h3 className="text-xl font-medium mb-2">{getQuestionText}</h3>
            {targetWord && <div className="text-3xl font-bold text-primary my-4">{targetWord}</div>}
          </div>
        )

      case "image-choices":
        return (
          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">{getQuestionText}</h3>
          </div>
        )

      default:
        return (
          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">{getQuestionText}</h3>
          </div>
        )
    }
  }

  // Render choices based on type
  const renderChoices = () => {
    switch (type) {
      case "image-choices":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {choices.map((choice) => (
              <Card
                key={choice.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary",
                  selectedChoiceId === choice.id && "ring-2 ring-primary border-primary",
                  feedback.visible &&
                    selectedChoiceId === choice.id &&
                    (feedback.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"),
                )}
                onClick={() => handleChoiceSelect(choice.id)}
              >
                <CardContent className="p-4 flex flex-col items-center">
                  {choice.imageUrl && (
                    <div className="relative h-32 w-full mb-2 rounded overflow-hidden">
                      <Image
                        src={choice.imageUrl || "/placeholder.svg"}
                        alt={choice.text}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <p className="text-center font-medium">{choice.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )

      default:
        return (
          <div className="space-y-3">
            {choices.map((choice) => (
              <Button
                key={choice.id}
                variant="outline"
                className={cn(
                  "w-full justify-start text-left h-auto py-3 px-4",
                  selectedChoiceId === choice.id && "border-primary bg-primary/5",
                  feedback.visible &&
                    selectedChoiceId === choice.id &&
                    (feedback.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"),
                )}
                onClick={() => handleChoiceSelect(choice.id)}
                disabled={isSelectionLocked}
              >
                <span>{choice.text}</span>
              </Button>
            ))}
          </div>
        )
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {renderQuestionContent()}

      <div className="mb-6">{renderChoices()}</div>

      {/* Feedback Alert (hidden when controlled/disabled) */}
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
          {!controlled && (
            <Button onClick={handleCheck} disabled={!selectedChoiceId || isSelectionLocked}>
              Check Answer
            </Button>
          )}
        </div>
      )}

      {!controlled && submitted && (explanation || showCorrectAnswer) && (
        <Card className="mt-6">
          <CardContent className="p-4">
            {explanation && (
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">Explanation:</div>
                <div className="text-gray-800">{explanation}</div>
              </div>
            )}
            {showCorrectAnswer && !feedback.isCorrect && (
              <div className="mt-1">
                <div className="text-sm text-gray-600 mb-1">Correct answer:</div>
                <div className="font-medium text-green-700">
                  {correctAnswerText}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
