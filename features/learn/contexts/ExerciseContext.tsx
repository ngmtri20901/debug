"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import type { Exercise, ExerciseProgress, Question } from "@/types/practice"
import { useToast } from "@/components/ui/use-toast"
import { useSound } from "@/hooks/useSound"
import { triggerExerciseCompletionProgress, triggerStudyTimeProgress } from "@/lib/quest-integration"
import { useExerciseSession } from "@/hooks/use-exercise-session"
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query/query-keys'
import { useUserProfile } from '@/lib/react-query/hooks/use-user-profile'
import {
  saveExerciseSession,
  loadExerciseSession,
  clearExerciseSession,
  saveQuestionAttempt,
  getQuestionAttempt,
  gradeQuestion,
  calculateAccuracy,
  isExercisePassed,
  type QuestionAttempt,
  type GradeResult
} from "@/lib/exercise-utils"

interface ExerciseContextType {
  exercise: Exercise | null
  progress: ExerciseProgress
  currentQuestion: Question | null
  currentQuestionIndex: number
  isLastQuestion: boolean
  isFirstQuestion: boolean
  questionStartTime: number
  userAnswer: any
  isAnswered: boolean
  gradeResult: GradeResult | null

  // Actions
  setUserAnswer: (answer: any) => void
  submitAnswer: () => void
  skipQuestion: () => void
  nextQuestion: () => void
  previousQuestion: () => void
  jumpToQuestion: (index: number) => void
  completeExercise: () => void
  resetExercise: () => void
  startExercise: (exercise: Exercise, topicSlug: string, lessonSlug: string) => void

  // Review mode
  reviewMode: boolean
  toggleReviewMode: () => void
  getQuestionAttempt: (questionId: string) => QuestionAttempt | null
}

const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined)

interface ExerciseProviderProps {
  children: ReactNode
  exerciseData: Exercise | null
  topicSlug: string
  lessonSlug: string
  urlQuestionIndex: number
  onQuestionChange: (index: number) => void
}

export const ExerciseProvider = ({
  children,
  exerciseData,
  topicSlug,
  lessonSlug,
  urlQuestionIndex,
  onQuestionChange
}: ExerciseProviderProps) => {
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [progress, setProgress] = useState<ExerciseProgress>({
    currentQuestionIndex: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    startTime: Date.now(),
    completed: false,
  })
  const [userAnswer, setUserAnswer] = useState<any>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [reviewMode, setReviewMode] = useState(false)
  // Skip management state
  const [phase, setPhase] = useState<"main" | "skipped">("main")
  const [skippedQueueIds, setSkippedQueueIds] = useState<string[]>([])
  const [skipCounts, setSkipCounts] = useState<Record<string, number>>({})
  const [pendingResultSave, setPendingResultSave] = useState(false)

  const { toast } = useToast()
  const { playSound } = useSound()
  const {
    startExercise: startApiSession,
    submitExercise: submitApiSession,
    checkForResume: checkApiResume
  } = useExerciseSession()
  const queryClient = useQueryClient()
  const { user } = useUserProfile()
  const initialized = useRef(false)
  const isSavingResult = useRef(false)
  const practiceResultId = useRef<string | null>(null)

  // Initialize exercise from data and API session
  useEffect(() => {
    if (!exerciseData || initialized.current) return

    const initializeSession = async () => {
      try {
        // Validate exercise data
        if (!exerciseData.id) {
          console.error('[ExerciseContext] Invalid exercise data - missing id:', exerciseData)
          toast({
            title: "Error",
            description: "Invalid exercise data. Please refresh the page.",
            variant: "destructive"
          })
          return
        }

        // First, check localStorage for local session state
        const localSession = loadExerciseSession(exerciseData.id, lessonSlug)
        
        // Then check for an existing in_progress session from API
        const apiSession = await checkApiResume(exerciseData.id)
        
        if (apiSession) {
          // Resume from API session
          console.log('[ExerciseContext] Resuming from API session:', apiSession.practiceResultId)
          practiceResultId.current = apiSession.practiceResultId
          
          const resumeIndex = localSession 
            ? Math.min(localSession.currentQuestionIndex, exerciseData.questions.length - 1) 
            : 0

          setExercise(exerciseData)
          setProgress(localSession?.progress || {
            currentQuestionIndex: resumeIndex,
            correctAnswers: 0,
            incorrectAnswers: 0,
            startTime: Date.now(),
            completed: false,
          })
          setPhase((localSession?.phase as any) || "main")
          setSkippedQueueIds(localSession?.skippedQueueIds || [])
          setSkipCounts(localSession?.skipCounts || {})
        } else {
          // Start a new session via API
          console.log('[ExerciseContext] Starting new API session for practice_set:', {
            practiceSetId: exerciseData.id,
            type: typeof exerciseData.id,
            exerciseData
          })
          const newSession = await startApiSession(exerciseData.id)
          
          if (newSession) {
            practiceResultId.current = newSession.practiceResultId
            console.log('[ExerciseContext] New session created:', practiceResultId.current)
          } else {
            console.error('[ExerciseContext] Failed to create API session')
            toast({
              title: "Session Error",
              description: "Could not start exercise session. Please refresh and try again.",
              variant: "destructive"
            })
            return
          }

          setExercise(exerciseData)
          setProgress({
            currentQuestionIndex: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            startTime: Date.now(),
            completed: false,
          })
          setPhase("main")
          setSkippedQueueIds([])
          setSkipCounts({})
        }

        initialized.current = true
      } catch (error) {
        console.error('[ExerciseContext] Error initializing session:', error)
        toast({
          title: "Initialization Error",
          description: "Could not initialize exercise. Please try again.",
          variant: "destructive"
        })
      }
    }

    initializeSession()
  }, [exerciseData, lessonSlug, checkApiResume, startApiSession, toast])

  // Sync with URL question index
  useEffect(() => {
    if (!exercise || urlQuestionIndex < 0 || urlQuestionIndex >= exercise.questions.length) return

    const currentQuestion = exercise.questions[urlQuestionIndex]
    if (!currentQuestion) return // Safety check

    const attempt = getQuestionAttempt(exercise.id, lessonSlug, currentQuestion.id)

    setProgress(prev => ({ ...prev, currentQuestionIndex: urlQuestionIndex }))
    setUserAnswer(attempt?.userAnswer || null)
    setIsAnswered(!!attempt)
    setGradeResult(attempt?.grade || null)
    setQuestionStartTime(Date.now())
  }, [urlQuestionIndex, exercise, lessonSlug])

  // Handle completion when progress.completed changes
  useEffect(() => {
    // Debug: Log completion state
    console.log('[ExerciseContext] Completion check:', {
      pendingResultSave,
      isSaving: isSavingResult.current,
      hasExercise: !!exercise,
      completed: progress.completed,
      hasEndTime: !!progress.endTime,
    })

    if (
      !pendingResultSave ||
      isSavingResult.current ||
      !exercise ||
      !progress.completed ||
      !progress.endTime
    ) {
      return
    }

    let cancelled = false
    isSavingResult.current = true

    const handleCompletion = async () => {
      console.log('[ExerciseContext] Starting handleCompletion')
      
      if (!practiceResultId.current) {
        console.error('[ExerciseContext] No practice result ID found, cannot save results')
        toast({
          title: "Session Error",
          description: "Exercise session not found. Your progress may not be saved.",
          variant: "destructive",
        })
        return
      }

      // Get all attempts from localStorage
      const session = loadExerciseSession(exercise.id, lessonSlug)
      const allAttempts = session?.attempts || []

      // Calculate metrics
      const totalQuestions = exercise.questions.length
      const scorePercent = (progress.correctAnswers / totalQuestions) * 100
      const totalSkipped = totalQuestions - progress.correctAnswers - progress.incorrectAnswers
      const timeSpentSeconds = Math.floor((progress.endTime! - progress.startTime) / 1000)
      const studyTimeMinutes = Math.round((progress.endTime! - progress.startTime) / (1000 * 60))
      const accuracy = calculateAccuracy(progress)
      const passed = isExercisePassed(accuracy, undefined, exercise.zoneLevel)

      console.log('[ExerciseContext] Exercise metrics:', {
        practiceResultId: practiceResultId.current,
        totalQuestions,
        scorePercent,
        totalSkipped,
        timeSpentSeconds,
        studyTimeMinutes,
        accuracy,
        passed,
        attemptsCount: allAttempts.length,
      })

      // Submit to API (send the attempts as-is, they already match QuestionAttempt type)
      const submitResult = await submitApiSession({
        practiceResultId: practiceResultId.current,
        practiceSetId: exercise.id,
        scorePercent,
        totalCorrect: progress.correctAnswers,
        totalIncorrect: progress.incorrectAnswers,
        totalSkipped,
        timeSpentSeconds,
        passed,
        attempts: allAttempts,
      })

      if (!submitResult) {
        console.error('[ExerciseContext] Failed to submit exercise results to API')
        toast({
          title: "Save Failed",
          description: "Your progress could not be saved. Please try again.",
          variant: "destructive",
        })
        return
      }

      console.log('[ExerciseContext] Exercise result submitted successfully:', submitResult)

      // ✅ OPTIMISTIC UPDATE + INVALIDATE CACHE
      if (user?.id && (submitResult as any).topicId && (submitResult as any).lessonId) {
        console.log('[ExerciseContext] Applying optimistic update and invalidating cache for topic:', (submitResult as any).topicId)
        
        const topicId = (submitResult as any).topicId
        const lessonId = (submitResult as any).lessonId
        
        // Optimistic update: Cập nhật cache ngay lập tức
        const queryKey = queryKeys.lessonProgress.topic(user.id, topicId)
        const previousData = queryClient.getQueryData(queryKey)
        
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !Array.isArray(old)) return old
          
          // Tìm lesson progress hiện tại hoặc tạo mới
          const existingIndex = old.findIndex((p: any) => p.lesson_id === lessonId)
          
          if (existingIndex >= 0) {
            // Update existing progress
            const updated = [...old]
            updated[existingIndex] = {
              ...updated[existingIndex],
              best_score_percent: Math.max(scorePercent, updated[existingIndex].best_score_percent || 0),
              total_attempts: (updated[existingIndex].total_attempts || 0) + 1,
              status: passed ? 'passed' : 'in_progress',
              last_attempted_at: new Date().toISOString(),
              passed_at: passed ? new Date().toISOString() : updated[existingIndex].passed_at,
            }
            return updated
          } else {
            // Add new progress
            return [...old, {
              lesson_id: lessonId,
              topic_id: topicId,
              best_score_percent: scorePercent,
              total_attempts: 1,
              status: passed ? 'passed' : 'in_progress',
              last_attempted_at: new Date().toISOString(),
              passed_at: passed ? new Date().toISOString() : null,
            }]
          }
        })
        
        // Invalidate để refetch từ server (Realtime sẽ confirm sau)
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lessonProgress.topic(user.id, topicId) 
        })
        
        // Invalidate user progress để cập nhật coins/XP
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.user.progress() 
        })
        
        // Invalidate quest progress
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.quests.progress() 
        })
      }

      // Clear localStorage session after successful save
      clearExerciseSession(exercise.id, lessonSlug)
      practiceResultId.current = null

      // Trigger quest progress tracking
      try {
        await triggerExerciseCompletionProgress(1)
        if (studyTimeMinutes > 0) {
          await triggerStudyTimeProgress(studyTimeMinutes)
        }
      } catch (error) {
        console.warn("[ExerciseContext] Failed to update quest progress:", error)
      }

      // Show completion toast
      const rewardText = submitResult.isFirstPass 
        ? `Earned ${submitResult.coinsEarned} coins and ${submitResult.xpEarned} XP!`
        : 'Keep practicing to improve!'

      toast({
        title: "Exercise Completed!",
        description: `Accuracy: ${accuracy}%. ${passed ? 'Passed!' : 'Try again to improve.'} ${rewardText}`,
        variant: passed ? "default" : "destructive",
      })
    }

    handleCompletion().finally(() => {
      isSavingResult.current = false
      if (!cancelled) {
        setPendingResultSave(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [
    pendingResultSave,
    exercise,
    progress.completed,
    progress.endTime,
    progress.correctAnswers,
    progress.incorrectAnswers,
    progress.startTime,
    lessonSlug,
    toast,
    submitApiSession,
    queryClient,
    user?.id,
  ])

  const startExercise = useCallback((newExercise: Exercise, topicSlug: string, lessonSlug: string) => {
    setExercise(newExercise)
    const session = loadExerciseSession(newExercise.id, lessonSlug)

    if (session) {
      // Resume existing session
      setProgress(session.progress)
      // Schedule URL update after render
      setTimeout(() => onQuestionChange(session.currentQuestionIndex), 0)
    } else {
      // Start new session
      const initialProgress: ExerciseProgress = {
        currentQuestionIndex: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        startTime: Date.now(),
        completed: false,
      }
      setProgress(initialProgress)
      saveExerciseSession(newExercise.id, lessonSlug, {
        status: "in_progress",
        currentQuestionIndex: 0,
        progress: initialProgress,
      })
      // Schedule URL update after render
      setTimeout(() => onQuestionChange(0), 0)
    }

    setUserAnswer(null)
    setIsAnswered(false)
    setGradeResult(null)
    setQuestionStartTime(Date.now())
    setPendingResultSave(false)
  }, [onQuestionChange])

  const submitAnswer = useCallback(() => {
    if (!exercise || !exercise.questions[progress.currentQuestionIndex] || isAnswered) return

    const currentQuestion = exercise.questions[progress.currentQuestionIndex]
    const timeSpent = Date.now() - questionStartTime
    const grade = gradeQuestion(currentQuestion, userAnswer)

    // Play sound effect based on correctness
    if (grade.isCorrect) {
      playSound('correct.mp3')
    } else {
      playSound('incorrect.wav')
    }

    const attempt: QuestionAttempt = {
      questionId: currentQuestion.id,
      userAnswer,
      grade,
      timeSpentMs: timeSpent,
      timestamp: Date.now(),
      questionType: currentQuestion.type,
    }

    // Save attempt
    saveQuestionAttempt(exercise.id, lessonSlug, attempt)

    // Update progress
    const newProgress = {
      ...progress,
      correctAnswers: progress.correctAnswers + (grade.isCorrect ? 1 : 0),
      incorrectAnswers: progress.incorrectAnswers + (grade.isCorrect ? 0 : 1),
    }
    setProgress(newProgress)

    // If we are in skipped phase and the question was in skipped queue, remove it
    if (phase === "skipped") {
      const qid = currentQuestion.id
      if (skippedQueueIds.includes(qid)) {
        const updated = skippedQueueIds.filter(id => id !== qid)
        setSkippedQueueIds(updated)
        // Persist queue update
        saveExerciseSession(exercise.id, lessonSlug, {
          skippedQueueIds: updated,
          skipCounts,
          phase,
        } as any)
      }
    }

    // Save session
    saveExerciseSession(exercise.id, lessonSlug, {
      currentQuestionIndex: progress.currentQuestionIndex,
      progress: newProgress,
    })

    setIsAnswered(true)
    setGradeResult(grade)
  }, [exercise, userAnswer, isAnswered, questionStartTime, progress, lessonSlug, phase, skippedQueueIds, skipCounts, playSound])

  const nextQuestion = useCallback(() => {
    if (!exercise) return

    const total = exercise.questions.length

    if (phase === "main") {
      const nextIndex = progress.currentQuestionIndex + 1
      if (nextIndex >= total) {
        // Main queue done. If we have skipped items, go to skipped phase.
        if (skippedQueueIds.length > 0) {
          setPhase("skipped")
          saveExerciseSession(exercise.id, lessonSlug, { phase: "skipped" } as any)
          const firstId = skippedQueueIds[0]
          const targetIdx = exercise.questions.findIndex(q => q.id === firstId)
          if (targetIdx >= 0) setTimeout(() => onQuestionChange(targetIdx), 0)
          return
        }
        // No skipped items, complete
        const endTime = Date.now()
        const finalProgress = {
          ...progress,
          endTime,
          completed: true,
        }
        setProgress(finalProgress)
        setPendingResultSave(true)
        return
      }
      setTimeout(() => onQuestionChange(nextIndex), 0)
      return
    }

    // Skipped phase
    const currentId = exercise.questions[progress.currentQuestionIndex]?.id
    const pos = currentId ? skippedQueueIds.indexOf(currentId) : -1
    const nextPos = pos >= 0 ? pos + 1 : 0
    if (nextPos < skippedQueueIds.length) {
      const nextId = skippedQueueIds[nextPos]
      const targetIdx = exercise.questions.findIndex(q => q.id === nextId)
      if (targetIdx >= 0) setTimeout(() => onQuestionChange(targetIdx), 0)
      return
    }
    // End of skipped queue → complete
    const endTime = Date.now()
    const finalProgress = {
      ...progress,
      endTime,
      completed: true,
    }
    setProgress(finalProgress)
    setPendingResultSave(true)
  }, [exercise, onQuestionChange, phase, progress, skippedQueueIds])

  const skipQuestion = useCallback(() => {
    if (!exercise) return

    const current = exercise.questions[progress.currentQuestionIndex]
    if (!current) return

    // Play skip sound effect
    playSound('flip.mp3')

    const qid = current.id

    // Update skip count
    setSkipCounts(prev => {
      const nextCount = (prev[qid] || 0) + 1
      const updated = { ...prev, [qid]: nextCount }

      // Persist counts
      saveExerciseSession(exercise.id, lessonSlug, {
        skipCounts: updated,
        skippedQueueIds,
        phase,
      } as any)
      return updated
    })

    const currentSkipCount = (skipCounts[qid] || 0) + 1

    // If third skip → mark incorrect and remove from queue, then advance
    if (currentSkipCount >= 3) {
      // Log an incorrect attempt due to multiple skips
      const attempt: QuestionAttempt = {
        questionId: qid,
        userAnswer: null,
        grade: { isCorrect: false, score: 0, feedback: "Marked incorrect after 3 skips" },
        timeSpentMs: Date.now() - questionStartTime,
        timestamp: Date.now(),
        status: "skipped",
        questionType: current.type,
      }
      saveQuestionAttempt(exercise.id, lessonSlug, attempt)

      // Update progress (count as incorrect)
      const newProgress = {
        ...progress,
        incorrectAnswers: progress.incorrectAnswers + 1,
      }
      setProgress(newProgress)

      // Remove from skipped queue if present
      const pos = skippedQueueIds.indexOf(qid)
      let updatedQueue = skippedQueueIds
      if (pos >= 0) {
        updatedQueue = [...skippedQueueIds.slice(0, pos), ...skippedQueueIds.slice(pos + 1)]
        setSkippedQueueIds(updatedQueue)
      }
      // Persist state
      saveExerciseSession(exercise.id, lessonSlug, {
        skippedQueueIds: updatedQueue,
        skipCounts: { ...skipCounts, [qid]: currentSkipCount },
        progress: newProgress,
        phase,
      } as any)

      // Navigate forward
      if (phase === "main") {
        const nextIndex = progress.currentQuestionIndex + 1
        if (nextIndex < exercise.questions.length) {
          setTimeout(() => onQuestionChange(nextIndex), 0)
          return
        }
        // End of main → go to skipped if available, else complete
        if (updatedQueue.length > 0) {
          setPhase("skipped")
          const firstId = updatedQueue[0]
          const targetIdx = exercise.questions.findIndex(q => q.id === firstId)
          if (targetIdx >= 0) setTimeout(() => onQuestionChange(targetIdx), 0)
          return
        }
        const endTime = Date.now()
        setProgress({ ...newProgress, endTime, completed: true })
        setPendingResultSave(true)
        return
      } else {
        // In skipped phase: move to next item in queue (preserve order)
        const prePos = skippedQueueIds.indexOf(qid)
        const nextId = prePos >= 0 && prePos < updatedQueue.length ? updatedQueue[prePos] : updatedQueue[0]
        if (nextId) {
          const targetIdx = exercise.questions.findIndex(q => q.id === nextId)
          if (targetIdx >= 0) setTimeout(() => onQuestionChange(targetIdx), 0)
          return
        }
        // No more skipped items → complete
        const endTime = Date.now()
        setProgress({ ...newProgress, endTime, completed: true })
        setPendingResultSave(true)
        return
      }
    }

    // First or second skip
    if (phase === "main") {
      // Add to skipped queue if not present
      const queueAfterAdd = skippedQueueIds.includes(qid) ? skippedQueueIds : [...skippedQueueIds, qid]
      if (queueAfterAdd !== skippedQueueIds) {
        setSkippedQueueIds(queueAfterAdd)
        saveExerciseSession(exercise.id, lessonSlug, {
          skippedQueueIds: queueAfterAdd,
          skipCounts: { ...skipCounts, [qid]: currentSkipCount },
          phase,
        } as any)
      } else {
        // still persist counts
        saveExerciseSession(exercise.id, lessonSlug, {
          skipCounts: { ...skipCounts, [qid]: currentSkipCount },
          phase,
        } as any)
      }
      // Go to next main question or transition to skipped phase if main finished
      const nextIndex = progress.currentQuestionIndex + 1
      if (nextIndex < exercise.questions.length) {
        setTimeout(() => onQuestionChange(nextIndex), 0)
        return
      }
      // End of main → go to first skipped
      if (queueAfterAdd.length > 0) {
        setPhase("skipped")
        saveExerciseSession(exercise.id, lessonSlug, { phase: "skipped" } as any)
        const firstId = queueAfterAdd[0]
        const targetIdx = exercise.questions.findIndex(q => q.id === firstId)
        if (targetIdx >= 0) setTimeout(() => onQuestionChange(targetIdx), 0)
        return
      }
      // No skipped items: complete
      const endTime = Date.now()
      setProgress({ ...progress, endTime, completed: true })
      setPendingResultSave(true)
      return
    } else {
      // In skipped phase: move current to end for retry
      const pos = skippedQueueIds.indexOf(qid)
      if (pos >= 0) {
        const updatedQueue = [...skippedQueueIds.slice(0, pos), ...skippedQueueIds.slice(pos + 1), qid]
        setSkippedQueueIds(updatedQueue)
        saveExerciseSession(exercise.id, lessonSlug, {
          skippedQueueIds: updatedQueue,
          skipCounts: { ...skipCounts, [qid]: currentSkipCount },
          phase,
        } as any)
        // Navigate to next in queue if exists
        const nextId = updatedQueue[pos]
        if (nextId && nextId !== qid) {
          const targetIdx = exercise.questions.findIndex(q => q.id === nextId)
          if (targetIdx >= 0) setTimeout(() => onQuestionChange(targetIdx), 0)
        }
        // If only one item remains, staying on same question is fine
      }
    }
  }, [exercise, lessonSlug, onQuestionChange, phase, progress, questionStartTime, skipCounts, skippedQueueIds, playSound])

  const previousQuestion = useCallback(() => {
    if (progress.currentQuestionIndex <= 0) return

    const prevIndex = progress.currentQuestionIndex - 1
    // Use a timeout to avoid setState during render
    setTimeout(() => onQuestionChange(prevIndex), 0)
  }, [progress.currentQuestionIndex, onQuestionChange])

  const jumpToQuestion = useCallback((index: number) => {
    if (!exercise || index < 0 || index >= exercise.questions.length) return
    // Use a timeout to avoid setState during render
    setTimeout(() => onQuestionChange(index), 0)
  }, [exercise, onQuestionChange])

  const completeExercise = useCallback(() => {
    if (!exercise) return

    const endTime = Date.now()
    const finalProgress = {
      ...progress,
      endTime,
      completed: true,
    }
    
    console.log('[ExerciseContext] completeExercise called', {
      exerciseId: exercise.id,
      progress: finalProgress,
    })
    
    setProgress(finalProgress)
    setPendingResultSave(true)
    // Completion handling is now done in the useEffect above
  }, [exercise, progress])

  const resetExercise = useCallback(async () => {
    if (!exercise) return

    clearExerciseSession(exercise.id, lessonSlug)
    initialized.current = false
    practiceResultId.current = null

    // Start a new session via API
    const newSession = await startApiSession(exercise.id)
    if (newSession) {
      practiceResultId.current = newSession.practiceResultId
      console.log('[ExerciseContext] New session created on reset:', practiceResultId.current)
    }

    setProgress({
      currentQuestionIndex: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      startTime: Date.now(),
      completed: false,
    })
    setUserAnswer(null)
    setIsAnswered(false)
    setGradeResult(null)
    setQuestionStartTime(Date.now())
    setReviewMode(false)
    setPhase("main")
    setSkippedQueueIds([])
    setSkipCounts({})
    setPendingResultSave(false)

    // Schedule URL update after render
    setTimeout(() => onQuestionChange(0), 0)
  }, [exercise, lessonSlug, onQuestionChange, startApiSession])

  const toggleReviewMode = useCallback(() => {
    setReviewMode(prev => !prev)
  }, [])

  const currentQuestion = exercise ? exercise.questions[progress.currentQuestionIndex] : null
  const currentQuestionIndex = progress.currentQuestionIndex
  const isLastQuestion = exercise ? currentQuestionIndex === exercise.questions.length - 1 : false
  const isFirstQuestion = currentQuestionIndex === 0

  const getQuestionAttemptById = useCallback((questionId: string) => {
    if (!exercise) return null
    return getQuestionAttempt(exercise.id, lessonSlug, questionId)
  }, [exercise, lessonSlug])

  return (
    <ExerciseContext.Provider
      value={{
        exercise,
        progress,
        currentQuestion,
        currentQuestionIndex,
        isLastQuestion,
        isFirstQuestion,
        questionStartTime,
        userAnswer,
        isAnswered,
        gradeResult,
        setUserAnswer,
        submitAnswer,
        skipQuestion,
        nextQuestion,
        previousQuestion,
        jumpToQuestion,
        completeExercise,
        resetExercise,
        startExercise,
        reviewMode,
        toggleReviewMode,
        getQuestionAttempt: getQuestionAttemptById,
      }}
    >
      {children}
    </ExerciseContext.Provider>
  )
}

export const useExercise = () => {
  const context = useContext(ExerciseContext)
  if (context === undefined) {
    throw new Error("useExercise must be used within an ExerciseProvider")
  }
  return context
}
