"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useExercise, ExerciseProvider } from "@/features/learn/contexts"
import Link from "next/link"
import type {
  Exercise,
  MultipleChoiceQuestion,
  ChooseWordsQuestion,
  ErrorCorrectionQuestion,
  SynonymMatchingQuestion,
  WordMatchingQuestion,
  DialogueCompletionQuestion,
  RolePlayQuestion,
} from "@/features/learn/types"

import { MultipleChoiceQuestion as MCQ } from "./MCQ/multiple-choice-question"
import { ChooseWords } from "./ChooseWords/choose-words"
import { SynonymsMatching } from "./SynonymsMatching/synonyms-matching"
import { WordsMatching } from "./WordsMatching/words-matching"
import { ErrorCorrection } from "./writing/ErrorCorrection"
import { DialogueCompletion } from "./dialogue/DialogueCompletion"
import { RolePlay } from "./dialogue/RolePlay"
import { useSidebar } from "@/components/ui/sidebar"
import { getLessonBySlug } from "@/data/exercisesData"
import { calculateAccuracy, isExercisePassed } from "@/features/learn/utils"

type ContainerProps = {
  exercise: Exercise
  topicSlug: string
  lessonSlug: string
}

// Helpers to parse and clamp `q`
function parseQ(searchParams: ReadonlyURLSearchParams, total: number): number {
  const raw = searchParams.get("q")
  const idx = Math.max(1, Math.min(total, raw ? parseInt(raw, 10) || 1 : 1))
  return idx
}

function useUrlIndex(total: number) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = parseQ(searchParams, total)
  const setIndex = useCallback(
    (nextIdx: number) => {
      const sp = new URLSearchParams(searchParams.toString())
      sp.set("q", String(Math.max(1, Math.min(total, nextIdx + 1))))
      router.replace(`?${sp.toString()}`)
    },
    [router, searchParams, total]
  )
  return { urlIndex: q - 1, setIndex }
}

function Toolbar() {
  const { nextQuestion, isAnswered, skipQuestion } = useExercise()

  return (
    <div className="sticky bottom-0 left-0 right-0 z-10 mt-8 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-end gap-3">
        <SubmitButton />
        <Button variant="outline" onClick={skipQuestion} disabled={isAnswered}>
          Skip
        </Button>
        <Button onClick={nextQuestion} disabled={!isAnswered}>
          Next
        </Button>
      </div>
    </div>
  )
}

// New enhanced stage component with completion actions and layout tweaks
function ExerciseStageEx({ topicSlug, lessonSlug }: { topicSlug: string; lessonSlug: string }) {
  const { exercise, progress, resetExercise, gradeResult, currentQuestion, isAnswered } = useExercise()
  const router = useRouter()

  if (!exercise) return null

  const totalQuestions = exercise.questions.length
  const answeredCount = progress.correctAnswers + progress.incorrectAnswers

  if (progress.completed) {
    const total = exercise.questions.length
    const correct = progress.correctAnswers
    const accuracy = calculateAccuracy(progress)
    const passed = isExercisePassed(accuracy, undefined, exercise.zoneLevel)
    // Compute next lesson slug within the same topic (demo)
    const info = getLessonBySlug(topicSlug, lessonSlug)
    const nextLessonSlug = (() => {
      if (!info) return undefined
      const idx = info.chapter.lessons.findIndex(l => l.slug === info.lesson.slug)
      const next = info.chapter.lessons[idx + 1]
      return next?.slug
    })()
    return (
      <Card className="mx-auto max-w-3xl">
        <CardContent className="p-8 text-center space-y-4">
          <div className="text-3xl font-semibold">Exercise Complete</div>
          <div className="text-muted-foreground">Nice work staying focused.</div>
          <div className="mt-2 flex items-center justify-center gap-6">
            <div className="rounded-lg border px-6 py-4">
              <div className="text-sm text-muted-foreground">Score</div>
              <div className="text-2xl font-bold">{correct}/{total}</div>
            </div>
            <div className="rounded-lg border px-6 py-4">
              <div className="text-sm text-muted-foreground">Accuracy</div>
              <div className="text-2xl font-bold">{accuracy}%</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" onClick={() => resetExercise()}>Retry</Button>
            <Link href={`/learn/${topicSlug}/${lessonSlug}`} className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full">Back to Lesson</Button>
            </Link>
            {passed && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  if (nextLessonSlug) {
                    router.push(`/learn/${topicSlug}/${nextLessonSlug}`)
                  } else {
                    router.push(`/learn/${topicSlug}`)
                  }
                }}
              >
                Next Lesson
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderCorrectAnswer = () => {
    if (!currentQuestion) return null
    switch (currentQuestion.type) {
      case "multiple-choice": {
        const q = currentQuestion as MultipleChoiceQuestion
        return q.choices.find(c => c.id === q.correctChoiceId)?.text
      }
      case "choose-words": {
        const q = currentQuestion as ChooseWordsQuestion
        const qd = (q as any).question_data
        if (qd && qd.data) {
          if (qd.subtype === "fill_in_blanks") {
            return (qd.data?.blanks?.correct || []).join(" ")
          }
          return qd.data?.canonical_sentence || (qd.data?.tokens || []).join(" ")
        }
        // Legacy fallback
        return (q as any).correctAnswer?.join(" ")
      }
      case "error-correction": {
        const q = currentQuestion as ErrorCorrectionQuestion
        return q.target
      }
      case "dialogue-completion": {
        const q = currentQuestion as DialogueCompletionQuestion
        return q.choices.find(c => c.id === q.correctChoiceId)?.text
      }
      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24">
      <div className="mb-6">
        <Progress value={(answeredCount / totalQuestions) * 100} />
        <div className="mt-2 text-sm text-right text-muted-foreground">
          {answeredCount}/{totalQuestions}
        </div>
      </div>

      {isAnswered && gradeResult && (
        <Alert variant={gradeResult.isCorrect ? "default" : "destructive"} className="mb-6">
          <AlertDescription>
            {gradeResult.feedback}
            {!gradeResult.isCorrect && renderCorrectAnswer() && (
              <div className="mt-2 text-sm">Correct answer: {renderCorrectAnswer()}</div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <QuestionRenderer />
      <Toolbar />
    </div>
  )
}

function SubmitButton() {
  const { submitAnswer, isAnswered, userAnswer, currentQuestion } = useExercise()

  const canSubmit = useMemo(() => {
    if (!currentQuestion) return false
    if (isAnswered) return false
    switch (currentQuestion.type) {
  case "multiple-choice":
        return typeof userAnswer === "string" && !!userAnswer
      case "choose-words":
        return Array.isArray(userAnswer) && userAnswer.length > 0
      case "error-correction":
      case "dialogue-completion":
        return typeof userAnswer === "string" && userAnswer.trim().length > 0
      case "synonyms-matching":
      case "word-matching":
        return Array.isArray(userAnswer) && userAnswer.length > 0
      case "role-play":
        return Array.isArray(userAnswer) && userAnswer.length > 0
      default:
        return false
    }
  }, [currentQuestion, isAnswered, userAnswer])

  return (
    <Button onClick={submitAnswer} disabled={!canSubmit}>
      Submit
    </Button>
  )
}

function QuestionRenderer() {
  const { currentQuestion, userAnswer, setUserAnswer, isAnswered, submitAnswer } = useExercise()
  const [, setMatchReady] = useState(false)

  const handleMatchingAnswerChange = useCallback(
    (ids: number[], length: number) => {
      setUserAnswer(ids)
      setMatchReady(ids.length === length)
    },
    [setUserAnswer, setMatchReady],
  )

  const handleChooseWordsAnswerChange = useCallback(
    (answer: string[]) => {
      setUserAnswer(answer)
    },
    [setUserAnswer],
  )

  if (!currentQuestion) return null

  const commonControlled = {
    controlled: true,
    hideActions: true,
    disableInlineFeedback: true,
  }

  switch (currentQuestion.type) {
    case "multiple-choice": {
      const q = currentQuestion as MultipleChoiceQuestion
      console.log('[QuestionRenderer] MCQ question image:', q.questionImage)
      return (
        <MCQ
          {...commonControlled}
          readOnly={isAnswered}
          type={q.questionType as any}
          questionText={q.questionText}
          passage={q.passage}
          questionImage={q.questionImage}
          targetWord={q.targetWord}
          choices={q.choices}
          correctChoiceId={q.correctChoiceId}
          explanation={""}
          value={(userAnswer as string) ?? null}
          onAnswerChange={(v) => setUserAnswer(v)}
        />
      )
    }

    case "role-play": {
      const q = currentQuestion as RolePlayQuestion
      return (
        <RolePlay
          title={q.title}
          steps={q.steps}
          onComplete={(_isPerfect, _score, selectedIndexes) => {
            // Save the per-step selected choice indexes so gradeQuestion can compute score
            if (Array.isArray(selectedIndexes)) {
              setUserAnswer(selectedIndexes)
            }
            // Don't auto-submit, let user manually submit to see results
          }}
        />
      )
    }


    case "choose-words": {
      const q = currentQuestion as ChooseWordsQuestion
      const qd = q.question_data
      console.log('[QuestionRenderer] ChooseWords question audioUrl:', q.audioUrl)

      // Map unified question_data to ChooseWords props
      const shuffle = (arr: string[]): string[] => {
        const a = [...arr]
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[a[i], a[j]] = [a[j], a[i]]
        }
        return a
      }

      let questionText = ""
      let sentenceText = ""
      let words: string[] = []
      let correctAnswer: string[] = []
      let subtype: any = qd?.subtype
      let highlighted: string[] | undefined = qd?.ui?.highlight_tokens

      if (qd && qd.data) {
        if (qd.subtype === "translation") {
          questionText = "Dịch sang tiếng Việt"
          sentenceText = qd.data.source_sentence || ""
          // Shuffle tokens for user to arrange
          words = shuffle(qd.data.tokens || [])
          correctAnswer = qd.data.tokens || []
        } else if (qd.subtype === "fill_in_blanks") {
          questionText = "Điền vào chỗ trống"
          const tokens: string[] = qd.data.canonical_sentence?.split(" ") || []
          const blanks = qd.data.blanks
          const blankIndices = blanks?.indices || []
          sentenceText = tokens
            .map((t: string, i: number) => (blankIndices.includes(i) ? "___" : t))
            .join(" ")
          const bank = [
            ...(blanks?.correct || []),
            ...(blanks?.word_bank || []),
          ]
          // de-duplicate while preserving order
          const seen = new Set<string>()
          words = bank.filter(w => (seen.has(w) ? false : (seen.add(w), true)))
          correctAnswer = blanks?.correct || []
        } else if (qd.subtype === "sentence_scramble") {
          // Use random title from ChooseWords component
          questionText = "Can you make the correct sentence?" // Will be overridden by randomTitle in ChooseWords
          sentenceText = ""
          // Shuffle tokens for user to arrange - this ensures random order different from database
          words = shuffle(qd.data.tokens || [])
          correctAnswer = qd.data.tokens || []
        } else {
          // Legacy fallback
          questionText = "Sắp xếp thành câu đúng"
          sentenceText = ""
          words = qd.data.tokens || []
          correctAnswer = qd.data.tokens || []
        }
      } else {
        // Legacy fallback
        questionText = (q as any).question
        sentenceText = (q as any).sentence
        words = (q as any).words
        correctAnswer = (q as any).correctAnswer
        subtype = (q as any).exerciseType
        highlighted = (q as any).highlightedWords
      }

      return (
        <ChooseWords
          {...commonControlled}
          readOnly={isAnswered}
          question={questionText}
          sentence={sentenceText}
          words={words}
          type={subtype}
          highlightedWords={highlighted}
          audioUrl={q.audioUrl}
          characterImageUrl={(q as any).characterImageUrl}
          value={(userAnswer as string[]) ?? null}
          onAnswerChange={handleChooseWordsAnswerChange}
        />
      )
    }

    case "error-correction": {
      const q = currentQuestion as ErrorCorrectionQuestion
      return (
        <ErrorCorrection
          {...commonControlled}
          readOnly={isAnswered}
          question={q.question}
          faultySentence={q.faultySentence}
          target={q.target}
          hint={q.hint}
          value={(userAnswer as string) ?? ""}
          onAnswerChange={(ans) => setUserAnswer(ans)}
        />
      )
    }

    case "dialogue-completion": {
      const q = currentQuestion as DialogueCompletionQuestion
      return (
        <DialogueCompletion
          {...commonControlled}
          readOnly={isAnswered}
          context={q.context}
          choices={q.choices}
          correctChoiceId={q.correctChoiceId}
          explanation={q.explanation}
          value={(userAnswer as string) ?? null}
          onAnswerChange={(ans) => setUserAnswer(ans ?? null)}
        />
      )
    }

    case "synonyms-matching": {
      const q = currentQuestion as SynonymMatchingQuestion
      return (
        <SynonymsMatching
          controlled
          readOnly={isAnswered}
          pairs={q.pairs as any}
          onAnswerChange={(ids) => handleMatchingAnswerChange(ids, q.pairs.length)}
        />
      )
    }

    case "word-matching": {
      const q = currentQuestion as WordMatchingQuestion
      return (
        <WordsMatching
          controlled
          readOnly={isAnswered}
          pairs={q.pairs as any}
          onAnswerChange={(ids) => handleMatchingAnswerChange(ids, q.pairs.length)}
        />
      )
    }

    default:
      return <div>Unsupported question type: {(currentQuestion as any).type}</div>
  }
}

function ExerciseStage() {
  const { exercise, progress } = useExercise()

  if (!exercise) return null

  if (progress.completed) {
    const total = exercise.questions.length
    const correct = progress.correctAnswers
    const accuracy = total ? Math.round((correct / total) * 100) : 0
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-2">
          <div className="text-2xl font-semibold">Exercise Complete</div>
          <div>
            Score: {correct}/{total} • Accuracy {accuracy}%
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <QuestionRenderer />
      <Toolbar />
    </>
  )
}

export function ExerciseContainer({ exercise, topicSlug, lessonSlug }: ContainerProps) {
  const { urlIndex, setIndex } = useUrlIndex(exercise.questions.length)
  const { setOpen, setOpenMobile } = useSidebar()
  useEffect(() => {
    try {
      setOpen(false)
      setOpenMobile(false)
    } catch {}
  }, [setOpen, setOpenMobile])

  return (
    <ExerciseProvider
      exerciseData={exercise}
      topicSlug={topicSlug}
      lessonSlug={lessonSlug}
      urlQuestionIndex={urlIndex}
      onQuestionChange={setIndex}
    >
      <ExerciseStageEx topicSlug={topicSlug} lessonSlug={lessonSlug} />
    </ExerciseProvider>
  )
}

// SSR page wrapper helper
export function ExerciseContainerShell(props: ContainerProps) {
  return (
    <Suspense>
      <ExerciseContainer {...props} />
    </Suspense>
  )
}



