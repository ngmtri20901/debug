"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/shared/hooks/use-toast"

interface StartExerciseButtonProps {
  topicSlug: string
  lessonSlug: string
  practiceSetId: string
  isReview: boolean
}

export function StartExerciseButton({
  topicSlug,
  lessonSlug,
  practiceSetId,
  isReview,
}: StartExerciseButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  const handleStartExercise = async () => {
    try {
      setIsCreatingSession(true)

      // Create session via API
      const response = await fetch("/api/exercise/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          practiceSetId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to start exercise")
      }

      console.log("[StartExerciseButton] Session created:", data.practiceResultId)

      // Navigate to exercise page
      router.push(`/learn/${topicSlug}/${lessonSlug}/exercise`)
    } catch (error) {
      console.error("[StartExerciseButton] Error creating session:", error)

      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to start exercise. Please try again.",
        variant: "destructive",
      })

      setIsCreatingSession(false)
    }
  }

  return (
    <Button
      onClick={handleStartExercise}
      disabled={isCreatingSession}
      className="w-full bg-[#067BC2] hover:bg-[#055a9f] mt-6"
    >
      {isCreatingSession ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isReview ? "Starting Review..." : "Starting Exercise..."}
        </>
      ) : (
        <>{isReview ? "Review Exercise" : "Start Exercise"}</>
      )}
    </Button>
  )
}
