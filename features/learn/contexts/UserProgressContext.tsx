"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { initialUserProgress } from "@/data/exercisesData"
import type { UserProgress, Lesson } from "@/types/exercises"
import { useToast } from "@/components/ui/use-toast"

interface UserProgressContextType {
  userProgress: UserProgress
  completeLesson: (lessonId: string) => void
  unlockChapter: (chapterId: string, price: number) => boolean
  isLessonLocked: (lesson: Lesson, chapterId: string) => boolean
  canUnlockChapter: (price: number) => boolean
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined)

export const UserProgressProvider = ({ children }: { children: ReactNode }) => {
  const [userProgress, setUserProgress] = useState<UserProgress>(initialUserProgress)
  const { toast } = useToast()

  const completeLesson = (lessonId: string) => {
    if (!userProgress.completedLessons.includes(lessonId)) {
      setUserProgress((prev) => ({
        ...prev,
        completedLessons: [...prev.completedLessons, lessonId],
        coins: prev.coins + 10, // Reward with 10 coins for completing a lesson
      }))
      toast({
        title: "Lesson Completed!",
        description: "You've earned 10 coins.",
        variant: "default",
      })
    }
  }

  const unlockChapter = (chapterId: string, price: number): boolean => {
    if (userProgress.coins < price) {
      toast({
        title: "Not enough coins",
        description: `You need ${price} coins to unlock this chapter.`,
        variant: "destructive",
      })
      return false
    }

    if (!userProgress.unlockedChapters.includes(chapterId)) {
      setUserProgress((prev) => ({
        ...prev,
        unlockedChapters: [...prev.unlockedChapters, chapterId],
        coins: prev.coins - price,
      }))
      toast({
        title: "Chapter Unlocked!",
        description: `You've spent ${price} coins to unlock this chapter.`,
        variant: "default",
      })
      return true
    }
    return true
  }

  const isLessonLocked = (lesson: Lesson, chapterId: string): boolean => {
    // Check if the chapter is unlocked first
    if (!userProgress.unlockedChapters.includes(chapterId)) {
      return true
    }

    // The first lesson in an unlocked chapter is always available
    if (lesson.order === 1) {
      return false
    }

    // For subsequent lessons, check if previous lesson is completed
    const previousLessonId = `${chapterId}-${lesson.order - 1}`
    return !userProgress.completedLessons.includes(previousLessonId)
  }

  const canUnlockChapter = (price: number): boolean => {
    return userProgress.coins >= price
  }

  return (
    <UserProgressContext.Provider
      value={{
        userProgress,
        completeLesson,
        unlockChapter,
        isLessonLocked,
        canUnlockChapter,
      }}
    >
      {children}
    </UserProgressContext.Provider>
  )
}

export const useUserProgress = () => {
  const context = useContext(UserProgressContext)
  if (context === undefined) {
    throw new Error("useUserProgress must be used within a UserProgressProvider")
  }
  return context
}
