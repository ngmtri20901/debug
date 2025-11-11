"use client"

import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { cn } from "@/shared/utils/cn"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"
import { normalizeForComparison } from "@/shared/utils/vi-normalize"

export interface ErrorCorrectionItem {
  id: string
  prompt: string
  faultySentence: string
  target: string
  hint?: string
}

interface ErrorCorrectionProps {
  question: string
  faultySentence: string
  target: string
  hint?: string
  onComplete?: (isCorrect: boolean, answer?: string) => void
  // Controlled mode for container
  controlled?: boolean
  value?: string | null
  onAnswerChange?: (answer: string) => void
  disableInlineFeedback?: boolean
  hideActions?: boolean
  readOnly?: boolean
}

export function ErrorCorrection({
  question,
  faultySentence,
  target,
  hint,
  onComplete,
  controlled = false,
  value = null,
  onAnswerChange,
  disableInlineFeedback = false,
  hideActions = false,
  readOnly = false,
}: ErrorCorrectionProps) {
  const [input, setInput] = useState<string>(value ?? faultySentence)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [result, setResult] = useState<{
    isCorrect: boolean
    message: string
  } | null>(null)

  const diffWords = (a: string, b: string): Array<{ type: "equal" | "add" | "del"; text: string }> => {
    const A = a.split(/\s+/), B = b.split(/\s+/)
    const dp: number[][] = Array(A.length + 1)
      .fill(null)
      .map(() => Array(B.length + 1).fill(0))
    for (let i = 1; i <= A.length; i++) {
      for (let j = 1; j <= B.length; j++) {
        dp[i][j] = A[i - 1] === B[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
    const res: Array<{ type: "equal" | "add" | "del"; text: string }> = []
    let i = A.length, j = B.length
    while (i > 0 && j > 0) {
      if (A[i - 1] === B[j - 1]) {
        res.unshift({ type: "equal", text: A[i - 1] })
        i--; j--
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        res.unshift({ type: "del", text: A[i - 1] })
        i--
      } else {
        res.unshift({ type: "add", text: B[j - 1] })
        j--
      }
    }
    while (i > 0) { res.unshift({ type: "del", text: A[i - 1] }); i-- }
    while (j > 0) { res.unshift({ type: "add", text: B[j - 1] }); j-- }
    return res
  }

  const handleCheck = () => {
    // Use Vietnamese normalization that handles diacritics and punctuation
    const normalizedInput = normalizeForComparison(input)
    const normalizedTarget = normalizeForComparison(target)
    const isCorrect = normalizedInput === normalizedTarget
    const message = isCorrect ? "Correct! Great job!" : "Not quite right. Try again!"

    if (!controlled) {
      setResult({ isCorrect, message })
      setSubmitted(true)
      if (onComplete) {
        onComplete(isCorrect, input)
      }
    }
  }

  const handleReset = () => {
    setInput(faultySentence)
    setSubmitted(false)
    setResult(null)
  }

  const fillCorrectAnswer = () => {
    setInput(target)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{question}</h2>
        <p className="text-gray-600">Original sentence: <span className="font-medium">{faultySentence}</span></p>
      </div>

      <Card>
        <CardContent className="p-6">
          <textarea
            className="w-full rounded-md border p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={4}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (controlled) onAnswerChange?.(e.target.value)
            }}
            placeholder="Correct the sentence here..."
            disabled={readOnly}
          />
          {hint && (
            <div className="mt-3 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
              💡 Hint: {hint}
            </div>
          )}
        </CardContent>
      </Card>

      {!hideActions && (
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          {!controlled && (
            <Button variant="outline" onClick={fillCorrectAnswer}>
              Show Correct Answer
            </Button>
          )}
          {!controlled && (
            <Button onClick={handleCheck} disabled={submitted}>
              Check Answer
            </Button>
          )}
        </div>
      )}

      {!controlled && submitted && result && (
        <Alert className={cn("mb-6", result.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
          <div className="flex items-center">
            {result.isCorrect ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <AlertDescription>{result.message}</AlertDescription>
          </div>
        </Alert>
      )}

      {!controlled && submitted && result && !result.isCorrect && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-2">Reference answer:</div>
            <div className="bg-gray-50 p-3 rounded-md font-medium">{target}</div>
            <div className="mt-3 text-sm">
              <div className="text-gray-600 mb-2">Differences:</div>
              <div className="flex flex-wrap gap-1">
                {diffWords(input, target).map((d, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "rounded px-2 py-1 text-sm",
                      d.type === "equal" && "bg-gray-100",
                      d.type === "add" && "bg-green-100 text-green-800",
                      d.type === "del" && "bg-red-100 text-red-800 line-through"
                    )}
                  >
                    {d.text}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
