"use client"

import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Progress } from "@/shared/components/ui/progress"
import { cn } from "@/shared/utils/cn"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"

export interface RoleplayChoice {
  text: string
}

export interface RoleplayStep {
  bot: string
  choices: RoleplayChoice[]
  expected: number
  tips?: string
}

interface RolePlayProps {
  title: string // This now contains the context from question_data
  steps: RoleplayStep[]
  onComplete?: (isCorrect: boolean, score?: number, selectedIndexes?: number[]) => void
}

const DialogueBubble: React.FC<{ who: "A" | "B"; text: string; isCorrect?: boolean }> = ({ who, text, isCorrect }) => {
  const isA = who === "A"
  return (
    <div className={cn("flex mb-3", isA ? "justify-start" : "justify-end")}>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 text-sm relative",
        isA ? "bg-gray-100 text-gray-800" : isCorrect === true ? "bg-green-100 text-green-800" : isCorrect === false ? "bg-red-100 text-red-800" : "bg-primary text-white"
      )}>
        <div className="text-xs opacity-70 mb-1 font-medium">{who}</div>
        <div>{text}</div>
        {isCorrect !== undefined && (
          <div className="absolute -bottom-2 right-2 text-xs">
            {isCorrect ? "✅" : "❌"}
          </div>
        )}
      </div>
    </div>
  )
}

export function RolePlay({
  title,
  steps,
  onComplete,
}: RolePlayProps) {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [history, setHistory] = useState<Array<{ bot: string; user: string; correct: boolean; index: number }>>([])
  const [submitted, setSubmitted] = useState<boolean>(false)

  const current = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  const handleChoiceSelect = (choiceIndex: number) => {
    if (submitted) return
    setSelectedChoice(choiceIndex)
  }

  const handleNext = () => {
    if (selectedChoice === null || submitted) return

    const correct = selectedChoice === current.expected
    const userText = current.choices[selectedChoice].text
  const entry = { bot: current.bot, user: userText, correct, index: selectedChoice }

    const newHistory = [...history, entry]
    setHistory(newHistory)
    setSubmitted(true)

    // Auto-advance after a short delay
    setTimeout(() => {
      if (isLastStep) {
        // Complete the role-play and call onComplete
        const totalCorrect = newHistory.filter((h) => h.correct).length
        const score = totalCorrect / steps.length
        const isPerfect = score === 1

        if (onComplete) {
          const selectedIndexes = newHistory.map(h => h.index)
          onComplete(isPerfect, score, selectedIndexes)
        }
      } else {
        setCurrentStep(currentStep + 1)
        setSelectedChoice(null)
        setSubmitted(false)
      }
    }, 1500)
  }

  const totalCorrect = history.filter((h) => h.correct).length
  const totalSteps = steps.length
  const currentScore = totalCorrect / totalSteps

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Interactive Role-play</h2>
        <p className="text-gray-600 mb-2">{title}</p>
        <div className="text-sm text-gray-500 mb-4">
          Step {currentStep + 1} of {totalSteps}
        </div>
        <Progress value={(currentStep + 1) / totalSteps * 100} className="w-full max-w-md mx-auto" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* History */}
            {history.map((entry, idx) => (
              <div key={idx} className="space-y-2">
                <DialogueBubble who="A" text={entry.bot} />
                <DialogueBubble who="B" text={entry.user} isCorrect={entry.correct} />
              </div>
            ))}

            {/* Current step */}
            <div className="space-y-4">
              <DialogueBubble who="A" text={current.bot} />

                <div className="space-y-3">
                  <div className="text-sm text-gray-600">Choose your response:</div>
                  {current.choices.map((choice, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left h-auto py-3 px-4",
                        selectedChoice === idx && "border-primary bg-primary/5",
                        submitted &&
                          selectedChoice === idx &&
                          (idx === current.expected ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"),
                      )}
                      onClick={() => handleChoiceSelect(idx)}
                      disabled={submitted}
                    >
                      {choice.text}
                    </Button>
                  ))}
                </div>

                {current.tips && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                    💡 Tip: {current.tips}
                  </div>
                )}

                {submitted && (
                  <Alert className={cn(
                    selectedChoice === current.expected ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  )}>
                    <div className="flex items-center">
                      {selectedChoice === current.expected ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <AlertDescription>
                        {selectedChoice === current.expected ? "Great response!" : "Not the best choice. The recommended response was shown above."}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleNext} disabled={selectedChoice === null || submitted}>
          {submitted ? "Next" : "Say this"}
        </Button>
      </div>
    </div>
  )
}
