/**
 * Zustand store for exercise session state management
 * Manages current exercise session, answers, and progress
 */

import { create } from 'zustand'
import type { Exercise, Question, ExerciseProgress, QuestionAnswer } from '../types'
import { gradeQuestion, type GradeResult } from '../utils/exercise-utils'

interface ExerciseSessionState {
  // Current exercise
  exercise: Exercise | null

  // Current question index
  currentQuestionIndex: number

  // User answers
  answers: Map<string, QuestionAnswer>

  // Progress tracking
  progress: ExerciseProgress

  // Session timing
  sessionStartTime: number | null
  questionStartTime: number | null

  // Actions
  startSession: (exercise: Exercise) => void
  endSession: () => void
  resetSession: () => void

  // Question navigation
  goToQuestion: (index: number) => void
  goToNextQuestion: () => void
  goToPreviousQuestion: () => void

  // Answer handling
  submitAnswer: (questionId: string, answer: any) => GradeResult
  getAnswer: (questionId: string) => QuestionAnswer | undefined

  // Progress
  getProgress: () => ExerciseProgress
  calculateResults: () => {
    score: number
    accuracy: number
    correctAnswers: number
    incorrectAnswers: number
    totalQuestions: number
    timeSpent: number
  }
}

export const useExerciseSessionStore = create<ExerciseSessionState>((set, get) => ({
  // Initial state
  exercise: null,
  currentQuestionIndex: 0,
  answers: new Map(),
  progress: {
    currentQuestionIndex: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    startTime: 0,
    completed: false,
  },
  sessionStartTime: null,
  questionStartTime: null,

  // Start a new session
  startSession: (exercise: Exercise) => {
    const now = Date.now()
    set({
      exercise,
      currentQuestionIndex: 0,
      answers: new Map(),
      progress: {
        currentQuestionIndex: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        startTime: now,
        completed: false,
      },
      sessionStartTime: now,
      questionStartTime: now,
    })
  },

  // End session and mark as completed
  endSession: () => {
    set((state) => ({
      progress: {
        ...state.progress,
        completed: true,
      },
      questionStartTime: null,
    }))
  },

  // Reset session to initial state
  resetSession: () => {
    set({
      exercise: null,
      currentQuestionIndex: 0,
      answers: new Map(),
      progress: {
        currentQuestionIndex: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        startTime: 0,
        completed: false,
      },
      sessionStartTime: null,
      questionStartTime: null,
    })
  },

  // Go to specific question
  goToQuestion: (index: number) => {
    const state = get()
    const exercise = state.exercise

    if (!exercise) return

    if (index >= 0 && index < exercise.questions.length) {
      set({
        currentQuestionIndex: index,
        questionStartTime: Date.now(),
        progress: {
          ...state.progress,
          currentQuestionIndex: index,
        },
      })
    }
  },

  // Go to next question
  goToNextQuestion: () => {
    const state = get()
    const exercise = state.exercise

    if (!exercise) return

    const nextIndex = state.currentQuestionIndex + 1
    if (nextIndex < exercise.questions.length) {
      state.goToQuestion(nextIndex)
    }
  },

  // Go to previous question
  goToPreviousQuestion: () => {
    const state = get()
    const prevIndex = state.currentQuestionIndex - 1
    if (prevIndex >= 0) {
      state.goToQuestion(prevIndex)
    }
  },

  // Submit answer and get grade
  submitAnswer: (questionId: string, answer: any): GradeResult => {
    const state = get()
    const exercise = state.exercise

    if (!exercise) {
      return {
        isCorrect: false,
        score: 0,
        feedback: 'No exercise loaded',
      }
    }

    // Find the question
    const question = exercise.questions.find((q) => q.id === questionId)

    if (!question) {
      return {
        isCorrect: false,
        score: 0,
        feedback: 'Question not found',
      }
    }

    // Grade the answer
    const grade = gradeQuestion(question, answer)

    // Calculate time spent on this question
    const timeSpentMs = state.questionStartTime
      ? Date.now() - state.questionStartTime
      : 0

    // Store the answer
    const questionAnswer: QuestionAnswer = {
      questionId,
      answer,
      grade,
      timeSpentMs,
      timestamp: Date.now(),
    }

    const newAnswers = new Map(state.answers)
    newAnswers.set(questionId, questionAnswer)

    // Update progress
    const isNewAnswer = !state.answers.has(questionId)
    const previousAnswer = state.answers.get(questionId)

    let correctAnswers = state.progress.correctAnswers
    let incorrectAnswers = state.progress.incorrectAnswers

    if (isNewAnswer) {
      // New answer
      if (grade.isCorrect) {
        correctAnswers++
      } else {
        incorrectAnswers++
      }
    } else if (previousAnswer) {
      // Updating existing answer
      // Remove previous answer from counts
      if (previousAnswer.grade.isCorrect) {
        correctAnswers--
      } else {
        incorrectAnswers--
      }
      // Add new answer to counts
      if (grade.isCorrect) {
        correctAnswers++
      } else {
        incorrectAnswers++
      }
    }

    set({
      answers: newAnswers,
      progress: {
        ...state.progress,
        correctAnswers,
        incorrectAnswers,
      },
    })

    return grade
  },

  // Get answer for a question
  getAnswer: (questionId: string): QuestionAnswer | undefined => {
    return get().answers.get(questionId)
  },

  // Get current progress
  getProgress: (): ExerciseProgress => {
    return get().progress
  },

  // Calculate final results
  calculateResults: () => {
    const state = get()
    const exercise = state.exercise

    if (!exercise) {
      return {
        score: 0,
        accuracy: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalQuestions: 0,
        timeSpent: 0,
      }
    }

    const totalQuestions = exercise.questions.length
    const correctAnswers = state.progress.correctAnswers
    const incorrectAnswers = state.progress.incorrectAnswers
    const answeredQuestions = correctAnswers + incorrectAnswers

    // Calculate score (0-100)
    const score = totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0

    // Calculate accuracy (only for answered questions)
    const accuracy = answeredQuestions > 0
      ? Math.round((correctAnswers / answeredQuestions) * 100)
      : 0

    // Calculate time spent in seconds
    const timeSpent = state.sessionStartTime
      ? Math.round((Date.now() - state.sessionStartTime) / 1000)
      : 0

    return {
      score,
      accuracy,
      correctAnswers,
      incorrectAnswers,
      totalQuestions,
      timeSpent,
    }
  },
}))
