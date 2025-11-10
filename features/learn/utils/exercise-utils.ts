"use client"

import type { Exercise, Question, ExerciseProgress, MultipleChoiceQuestion, ChooseWordsQuestion, GrammarStructureQuestion } from "@/features/learn/types"

// Grading result interface
export interface GradeResult {
  isCorrect: boolean
  score: number
  feedback?: string
}

// Question attempt interface for localStorage
export interface QuestionAttempt {
  questionId: string
  userAnswer: any
  grade: GradeResult
  timeSpentMs: number
  timestamp: number
  // Optional status to log non-answer events like skips
  status?: "answered" | "skipped"
  // Question type for analytics
  questionType?: string
}

// Exercise session interface for localStorage
export interface ExerciseSession {
  exerciseId: string
  version: string
  status: "in_progress" | "completed"
  startedAt: number
  lastUpdatedAt: number
  currentQuestionIndex: number
  attempts: QuestionAttempt[]
  progress: ExerciseProgress
  // Optional skip management state
  skipCounts?: Record<string, number>
  skippedQueueIds?: string[]
  phase?: "main" | "skipped"
}

// Storage keys
const STORAGE_KEY_PREFIX = "exercise"
const VERSION = "1.0.0"

// Client-side grading functions
export function gradeQuestion(question: Question, userAnswer: any): GradeResult {
  switch (question.type) {
    case "multiple-choice": {
      const isCorrectMC = userAnswer === question.correctChoiceId
      return {
        isCorrect: isCorrectMC,
        score: isCorrectMC ? 1 : 0,
        feedback: isCorrectMC ? "Correct!" : `Incorrect. The correct answer is: ${question.choices.find(c => c.id === question.correctChoiceId)?.text}`
      }
    }

    case "word-matching": {
      // For word matching, check if all pairs are correctly matched
      const correctPairs = question.pairs.length
      let correctMatchesWM = 0
      if (Array.isArray(userAnswer)) {
        // New controlled mode: array of matched pair ids
        correctMatchesWM = userAnswer.filter((id: any) =>
          question.pairs.some(pair => pair.id === id)
        ).length
      } else {
        // Legacy object mapping
        correctMatchesWM = Object.values(userAnswer || {}).filter((match: any) =>
          question.pairs.some(pair => pair.id === match.pairId && pair.vietnamese === match.vietnamese)
        ).length
      }
      const isCorrectWM = correctMatchesWM === correctPairs
      return {
        isCorrect: isCorrectWM,
        score: correctMatchesWM / correctPairs,
        feedback: isCorrectWM ? "Perfect matching!" : `${correctMatchesWM}/${correctPairs} pairs correct`
      }
    }

    case "synonyms-matching": {
      const totalPairs = question.pairs.length
      let correctMatchesSM = 0
      if (Array.isArray(userAnswer)) {
        // New controlled mode: array of matched pair ids
        correctMatchesSM = userAnswer.filter((id: any) =>
          question.pairs.some(pair => pair.id === id)
        ).length
      } else {
        correctMatchesSM = Object.values(userAnswer || {}).filter((match: any) =>
          question.pairs.some(pair => pair.id === match.pairId && pair.word2 === match.word2)
        ).length
      }
      const isCorrectSM = correctMatchesSM === totalPairs
      return {
        isCorrect: isCorrectSM,
        score: correctMatchesSM / totalPairs,
        feedback: isCorrectSM ? "All synonyms matched correctly!" : `${correctMatchesSM}/${totalPairs} pairs correct`
      }
    }

    case "choose-words": {
      const q = question as ChooseWordsQuestion as any
      const qd = q.question_data as any
      const userWords: string[] = Array.isArray(userAnswer) ? userAnswer : []

      if (qd && qd.subtype && qd.data) {
        const subtype = qd.subtype as string
        if (subtype === "fill_in_blanks") {
          const correct: string[] = qd.data?.blanks?.correct || []
          let correctCount = 0
          for (let i = 0; i < correct.length; i++) {
            if (userWords[i] === correct[i]) correctCount++
          }
          const isCorrectCW = correct.length > 0 && correctCount === correct.length && userWords.length === correct.length
          return {
            isCorrect: isCorrectCW,
            score: correct.length ? correctCount / correct.length : 0,
            feedback: isCorrectCW ? "All blanks correct!" : `${correctCount}/${correct.length} blanks correct`
          }
        } else {
          if (subtype === "translation") {
            // For translation, evaluate equality against canonical sentence
            // but compute partial progress using provided token chunks.
            const correctTokens: string[] = qd.data?.tokens || []
            const userSentence = userWords.join(" ").trim()
            const canonicalSentence = (qd.data?.canonical_sentence || correctTokens.join(" ")).trim()
            const normalize = (s: string) => s.replace(/\s+/g, " ").trim()

            let correctCount = 0
            const len = Math.min(userWords.length, correctTokens.length)
            for (let i = 0; i < len; i++) {
              if (userWords[i] === correctTokens[i]) correctCount++
            }

            const isCorrectCW = (
              correctTokens.length > 0 &&
              userWords.length === correctTokens.length &&
              normalize(userSentence) === normalize(canonicalSentence)
            )
            return {
              isCorrect: isCorrectCW,
              score: correctTokens.length ? correctCount / correctTokens.length : 0,
              feedback: isCorrectCW ? "Perfect translation!" : `${correctCount}/${correctTokens.length} tokens in correct order`
            }
          } else {
            // sentence-scramble or other token-ordered variants
            const correctTokens: string[] = qd.data?.tokens || []
            let correctCount = 0
            const len = Math.min(userWords.length, correctTokens.length)
            for (let i = 0; i < len; i++) {
              if (userWords[i] === correctTokens[i]) correctCount++
            }
            const isCorrectCW = (
              correctTokens.length > 0 &&
              userWords.length === correctTokens.length &&
              userWords.every((w, i) => w === correctTokens[i])
            )
            return {
              isCorrect: isCorrectCW,
              score: correctTokens.length ? correctCount / correctTokens.length : 0,
              feedback: isCorrectCW ? "Perfect sentence!" : `${correctCount}/${correctTokens.length} tokens in correct order`
            }
          }
        }
      }

      // Legacy fallback
      const correctWords: string[] = (question as any).correctAnswer || []
      const correctCount = userWords.filter((word: string) => correctWords.includes(word)).length
      const isCorrectCW = correctWords.length > 0 && correctCount === correctWords.length && userWords.length === correctWords.length
      return {
        isCorrect: isCorrectCW,
        score: correctWords.length ? correctCount / correctWords.length : 0,
        feedback: isCorrectCW ? "Perfect translation!" : `${correctCount}/${correctWords.length || 0} words correct`
      }
    }

    case "error-correction": {
      const isCorrectCorrection = userAnswer?.trim().toLowerCase() === question.target.toLowerCase()
      return {
        isCorrect: isCorrectCorrection,
        score: isCorrectCorrection ? 1 : 0,
        feedback: isCorrectCorrection ? "Correct correction!" : `The correct sentence is: "${question.target}"`
      }
    }

    case "grammar-structure": {
      const q = question as GrammarStructureQuestion
      const isCorrectGrammar = userAnswer === q.correctChoiceId
      return {
        isCorrect: isCorrectGrammar,
        score: isCorrectGrammar ? 1 : 0,
        feedback: isCorrectGrammar ? "Correct grammar!" : `Incorrect. ${q.hint || "Please review the grammar rule."}`
      }
    }

    case "dialogue-completion": {
      const isCorrectDialogue = userAnswer === question.correctChoiceId
      return {
        isCorrect: isCorrectDialogue,
        score: isCorrectDialogue ? 1 : 0,
        feedback: isCorrectDialogue ? "Good dialogue completion!" : "Try a more appropriate response"
      }
    }

    case "role-play": {
      // For role-play, check if user selected the expected choice for each step
      const userChoices = userAnswer || []
      const totalSteps = question.steps.length
      const correctSteps = question.steps.filter((step, index) =>
        userChoices[index] === step.expected
      ).length
      const accuracy = correctSteps / totalSteps
      const isCorrectRP = accuracy > 0.5 // More than 50% correct steps
      return {
        isCorrect: isCorrectRP,
        score: accuracy,
        feedback: isCorrectRP
          ? `Great role-play! ${correctSteps}/${totalSteps} steps correct (${Math.round(accuracy * 100)}% accuracy)`
          : `${correctSteps}/${totalSteps} steps correct (${Math.round(accuracy * 100)}% accuracy). Try to get more than 50% correct next time!`
      }
    }

    default:
      return {
        isCorrect: false,
        score: 0,
        feedback: "Unknown question type"
      }
  }
}

// LocalStorage management
export function getStorageKey(exerciseId: string, lessonSlug?: string): string {
  return `${STORAGE_KEY_PREFIX}:${exerciseId}:${lessonSlug || 'default'}:${VERSION}`
}

export function saveExerciseSession(
  exerciseId: string,
  lessonSlug: string,
  session: Partial<ExerciseSession>
): void {
  try {
    const key = getStorageKey(exerciseId, lessonSlug)
    const existingSession = loadExerciseSession(exerciseId, lessonSlug)

    const updatedSession: ExerciseSession = {
      exerciseId,
      version: VERSION,
      status: "in_progress",
      startedAt: Date.now(),
      currentQuestionIndex: 0,
      attempts: [],
      progress: {
        currentQuestionIndex: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        startTime: Date.now(),
        completed: false,
      },
      ...existingSession,
      ...session,
      lastUpdatedAt: Date.now(),
    }

    localStorage.setItem(key, JSON.stringify(updatedSession))
  } catch (error) {
    console.warn("Failed to save exercise session:", error)
  }
}

export function loadExerciseSession(exerciseId: string, lessonSlug: string): ExerciseSession | null {
  try {
    const key = getStorageKey(exerciseId, lessonSlug)
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const session: ExerciseSession = JSON.parse(stored)

    // Check version compatibility
    if (session.version !== VERSION) {
      console.warn("Exercise session version mismatch, starting fresh")
      return null
    }

    return session
  } catch (error) {
    console.warn("Failed to load exercise session:", error)
    return null
  }
}

export function clearExerciseSession(exerciseId: string, lessonSlug: string): void {
  try {
    const key = getStorageKey(exerciseId, lessonSlug)
    localStorage.removeItem(key)
  } catch (error) {
    console.warn("Failed to clear exercise session:", error)
  }
}

export function saveQuestionAttempt(
  exerciseId: string,
  lessonSlug: string,
  attempt: QuestionAttempt
): void {
  const session = loadExerciseSession(exerciseId, lessonSlug)
  if (!session) return

  // Remove any existing attempt for this question
  session.attempts = session.attempts.filter(a => a.questionId !== attempt.questionId)
  session.attempts.push(attempt)

  saveExerciseSession(exerciseId, lessonSlug, session)
}

export function getQuestionAttempt(
  exerciseId: string,
  lessonSlug: string,
  questionId: string
): QuestionAttempt | null {
  const session = loadExerciseSession(exerciseId, lessonSlug)
  if (!session) return null

  return session.attempts.find(a => a.questionId === questionId) || null
}

// Utility functions
export function calculateAccuracy(progress: ExerciseProgress): number {
  const total = progress.correctAnswers + progress.incorrectAnswers
  return total > 0 ? Math.round((progress.correctAnswers / total) * 100) : 0
}

export function isExercisePassed(accuracy: number, threshold?: number, zoneLevel?: number): boolean {
  // If threshold is provided, use it
  if (threshold !== undefined) {
    return accuracy >= threshold
  }
  
  // If zoneLevel is provided, use zone-based thresholds
  if (zoneLevel !== undefined) {
    const zoneThresholds: Record<number, number> = {
      1: 65, // Beginner
      2: 70, // Elementary
      3: 75, // Intermediate
      4: 80, // Upper-Intermediate
      5: 85, // Advanced
    }
    const zoneThreshold = zoneThresholds[zoneLevel] || 80
    return accuracy >= zoneThreshold
  }
  
  // Default fallback to 80%
  return accuracy >= 80
}

export function getResumeQuestionIndex(session: ExerciseSession | null, totalQuestions: number): number {
  if (!session) return 0

  // If completed, start from beginning
  if (session.status === "completed") return 0

  // Resume from last attempted question, but don't go beyond available questions
  return Math.min(session.currentQuestionIndex, totalQuestions - 1)
}
