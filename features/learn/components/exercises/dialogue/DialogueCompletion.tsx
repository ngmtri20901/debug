"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"

export interface DialogueLine {
  who: "A" | "B" | string // Support both generic A/B and specific speaker names
  text: string
}

export interface DialogueChoice {
  id: string
  text: string
}

// Default questions for dialogue completion
const defaultDialogueQuestions = [
  "As the speaker, what’s your next line?",
  "What is the appropriate next line in the dialogue?",
  "Choose the best continuation of the conversation.",
  "Which response completes the dialogue correctly?",
  "Select the sentence that best continues the dialogue.",
  "What should be said next in this conversation?",
  "Pick the correct line to complete the dialogue.",
  "Which option fits naturally as the next line?",
  "Identify the correct response to continue the conversation.",
  "Complete the dialogue by choosing the best line."
]

interface DialogueCompletionProps {
  context: DialogueLine[]
  choices: DialogueChoice[]
  correctChoiceId: string
  explanation?: string
  showCorrectAnswer?: boolean
  lockAfterSubmit?: boolean
  onComplete?: (isCorrect: boolean, selectedChoice?: DialogueChoice) => void
  // Controlled mode for container-managed flow
  controlled?: boolean
  value?: string | null
  onAnswerChange?: (choiceId: string | null) => void
  disableInlineFeedback?: boolean
  hideActions?: boolean
  readOnly?: boolean
}

const DialogueBubble: React.FC<{ 
  who: "A" | "B" | string; 
  text: string; 
  isFirstSpeaker: boolean 
}> = ({ who, text, isFirstSpeaker }) => {
  // First speaker (like Hương) appears on the left, second speaker (like Nam) on the right
  const isLeftSide = isFirstSpeaker
  
  return (
    <div className={cn("flex mb-3", isLeftSide ? "justify-start" : "justify-end")}>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3 text-sm relative",
        isLeftSide ? "bg-gray-100 text-gray-800" : "bg-primary text-white"
      )}>
        <div className="text-xs opacity-70 mb-1 font-medium">{who}</div>
        <div>{text}</div>
      </div>
    </div>
  )
}

export function DialogueCompletion({
  context,
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
}: DialogueCompletionProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{
    visible: boolean
    isCorrect: boolean
    message: string
  }>({ visible: false, isCorrect: false, message: "" })

  const isSelectionLocked = controlled ? !!readOnly : submitted && lockAfterSubmit

  // Sync external value when controlled
  useEffect(() => {
    if (controlled) {
      setSelectedChoiceId(value ?? null)
    }
  }, [controlled, value])

  // Generate random question based on context
  const questionText = useMemo(() => {
    // Ensure context is an array before calling map
    const contextArray = Array.isArray(context) ? context : []
    const seed = contextArray.map(line => line.text).join('') || 'dialogue'
    const hash = seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    const index = Math.abs(hash) % defaultDialogueQuestions.length
    return defaultDialogueQuestions[index]
  }, [context])

  const correctAnswerText = useMemo(
    () => choices.find((choice) => choice.id === correctChoiceId)?.text,
    [choices, correctChoiceId],
  )

  // Determine the first and second speakers based on the context
  const speakers = useMemo(() => {
    const uniqueSpeakers = Array.from(new Set(context.map(line => line.who)))
    return {
      firstSpeaker: uniqueSpeakers[0] || "A",
      secondSpeaker: uniqueSpeakers[1] || "B"
    }
  }, [context])

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
        message: isCorrect ? "Great response!" : "Not quite right. Try again!",
      })
      setSubmitted(true)
      if (onComplete && selectedChoice) {
        onComplete(isCorrect, selectedChoice)
      }
    }
  }

  const handleReset = () => {
    setSelectedChoiceId(null)
    setSubmitted(false)
    setFeedback({ visible: false, isCorrect: false, message: "" })
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{questionText}</h2>
        <p className="text-gray-600">Complete the dialogue by choosing the best response.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Dialogue */}
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-4 font-medium">Dialogue</div>
            <div className="space-y-3">
              {Array.isArray(context) ? context.map((line, idx) => (
                <DialogueBubble 
                  key={idx} 
                  who={line.who} 
                  text={line.text} 
                  isFirstSpeaker={line.who === speakers.firstSpeaker}
                />
              )) : (
                <div className="text-sm text-gray-500 italic">No dialogue context available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right side - Choices */}
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-4 font-medium">Choose a response</div>
            <div className="space-y-3">
              {choices.map((choice) => (
                <Button
                  key={choice.id}
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left h-auto py-3 px-4",
                    selectedChoiceId === choice.id && "border-primary bg-primary/5",
                    submitted &&
                      selectedChoiceId === choice.id &&
                      (feedback.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"),
                  )}
                  onClick={() => handleChoiceSelect(choice.id)}
                  disabled={isSelectionLocked}
                >
                  {choice.text}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {!hideActions && (
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          {!controlled && (
            <Button onClick={handleCheck} disabled={!selectedChoiceId || submitted}>
              Check Answer
            </Button>
          )}
        </div>
      )}

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

      {!controlled && submitted && (explanation || (showCorrectAnswer && !feedback.isCorrect)) && (
        <Card>
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
