/**
 * Practice exercise types (React Native)
 * Copied from web with mobile adaptations
 */

// Question Types
export type QuestionType =
  | 'multiple-choice'
  | 'word-matching'
  | 'synonyms-matching'
  | 'choose-words'
  | 'error-correction'
  | 'grammar-structure'
  | 'dialogue-completion'
  | 'role-play'

// Multiple Choice Question Types
export type MCQType =
  | 'text-only'
  | 'image-question'
  | 'word-translation'
  | 'image-choices'
  | 'grammar-structure'

// Choose Words Exercise Types
export type ChooseWordsType = 'translation' | 'fill_in_blanks' | 'sentence_scramble'

export type ChooseWordsSubtype = ChooseWordsType

// Unified question_data schema for choose-words
export interface ChooseWordsQuestionData {
  spec_version: number
  subtype: ChooseWordsSubtype
  data: {
    canonical_sentence: string
    tokens: string[]
    // Only for translation
    source_sentence?: string
    // Only for fill-in-blanks
    blanks?: {
      indices: number[]
      correct: string[]
      word_bank?: string[]
    }
  }
  ui?: {
    highlight_tokens?: string[]
  }
}

// Choice for Multiple Choice Questions
export interface Choice {
  id: string
  text: string
  imageUrl?: string
}

// Word Pair for Word Matching
export interface WordPair {
  id: number
  english: string
  vietnamese: string
}

// Synonym Pair for Synonym Matching
export interface SynonymPair {
  id: number
  word1: string
  word2: string
  meaning?: string
}

// Base Question Interface
export interface BaseQuestion {
  id: string
  type: QuestionType
}

// Multiple Choice Question
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice'
  questionType: MCQType
  questionText?: string
  passage?: string
  questionImage?: string
  targetWord?: string
  choices: Choice[]
  correctChoiceId: string
  hint?: string
}

// Word Matching Question
export interface WordMatchingQuestion extends BaseQuestion {
  type: 'word-matching'
  pairs: WordPair[]
}

// Synonym Matching Question
export interface SynonymMatchingQuestion extends BaseQuestion {
  type: 'synonyms-matching'
  pairs: SynonymPair[]
}

// Choose Words Question
export interface ChooseWordsQuestion extends BaseQuestion {
  type: 'choose-words'
  // New unified schema source of truth
  question_data?: ChooseWordsQuestionData

  // Legacy/optional fields for backward compatibility during transition
  exerciseType?: ChooseWordsType
  question?: string
  sentence?: string
  words?: string[]
  correctAnswer?: string[]
  highlightedWords?: string[]
  audioUrl?: string
  characterImageUrl?: string
}

// Dialogue Line
export interface DialogueLine {
  who: 'A' | 'B' | string // Support both generic A/B and specific speaker names
  text: string
}

// Dialogue Choice
export interface DialogueChoice {
  id: string
  text: string
}

// Role-play Step
export interface RoleplayStep {
  bot: string
  choices: { text: string }[]
  expected: number
  tips?: string
}

// Error Correction Question
export interface ErrorCorrectionQuestion extends BaseQuestion {
  type: 'error-correction'
  question: string
  faultySentence: string
  target: string
  hint?: string
}

// Dialogue Completion Question
export interface DialogueCompletionQuestion extends BaseQuestion {
  type: 'dialogue-completion'
  context: DialogueLine[]
  choices: DialogueChoice[]
  correctChoiceId: string
  explanation?: string
}

// Role-play Question
export interface RolePlayQuestion extends BaseQuestion {
  type: 'role-play'
  title: string
  steps: RoleplayStep[]
}

// Grammar Structure Question (similar to MultipleChoiceQuestion but with different type)
export interface GrammarStructureQuestion extends BaseQuestion {
  type: 'grammar-structure'
  questionType: MCQType
  questionText?: string
  passage?: string
  questionImage?: string
  targetWord?: string
  choices: Choice[]
  correctChoiceId: string
  hint?: string
}

// Union type for all question types
export type Question =
  | MultipleChoiceQuestion
  | WordMatchingQuestion
  | SynonymMatchingQuestion
  | ChooseWordsQuestion
  | ErrorCorrectionQuestion
  | DialogueCompletionQuestion
  | RolePlayQuestion
  | GrammarStructureQuestion

// Exercise Interface
export interface Exercise {
  id: string
  title: string
  description: string
  topicId: string
  chapterId: string
  lessonId: string
  coinReward: number
  xpReward: number
  zoneId?: number
  zoneLevel?: number
  questions: Question[]
}

// Exercise Progress Interface
export interface ExerciseProgress {
  currentQuestionIndex: number
  correctAnswers: number
  incorrectAnswers: number
  unsureAnswers?: number
  startTime: number
  endTime?: number
  completed: boolean
  timeSpent?: number // in seconds
}

// Exercise Session (for tracking in database)
export interface ExerciseSession {
  id: string
  userId: string
  exerciseId: string
  lessonId: string
  topicId: string
  status: 'in_progress' | 'completed' | 'abandoned'
  progress: ExerciseProgress
  answers: QuestionAnswer[]
  startedAt: string
  completedAt?: string
  score?: number
  coinsEarned?: number
  xpEarned?: number
}

// Question Answer (for storing user answers)
export interface QuestionAnswer {
  questionId: string
  questionType: QuestionType
  userAnswer: any // Type depends on question type
  correctAnswer: any
  isCorrect: boolean
  timeSpent?: number // in seconds
  attemptNumber?: number
}

// Session Results (for completion)
export interface SessionResults {
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  unsureAnswers: number
  accuracy: number // percentage
  totalTimeSpent: number // in seconds
  answers: QuestionAnswer[]
}

// Completion Response
export interface CompletionResponse {
  success: boolean
  coinsEarned: number
  xpEarned: number
  newLevel?: number
  achievements?: string[]
  lessonCompleted: boolean
  topicProgress: number
}
