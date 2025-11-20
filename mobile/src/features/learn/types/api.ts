/**
 * API response types for Learn module
 * Database schema types from Supabase
 */

import type { UserLessonProgress } from './exercises'

// Database table types (from Supabase schema)
export interface ZoneRow {
  id: number
  name: string
  level: number
  description: string | null
  created_at: string
}

export interface TopicRow {
  topic_id: number
  title: string
  slug: string
  zone_id: number
  description: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface LessonRow {
  id: number
  topic_id: number
  title: string
  slug: string
  content: string | null
  sort_order: number
  status: 'draft' | 'published' | 'archived'
  description: string | null
  estimated_duration: number | null
  created_at: string
  updated_at: string
}

export interface MaterialRow {
  id: number
  lesson_id: number
  material_type: 'dialogue' | 'vocabulary' | 'grammar'
  content: any // JSON content
  sort_order: number
  created_at: string
}

export interface PracticeSetRow {
  id: string
  lesson_id: number
  title: string
  description: string | null
  coin_reward: number
  xp_reward: number
  reward_coins: number | null
  pass_threshold: number
  status: 'ACTIVE' | 'ARCHIVED'
  is_active: boolean
  sequence_order: number
  created_at: string
  updated_at: string
}

export interface QuestionRow {
  id: string
  question_type: string
  question_subtype: string | null
  question_data: any // JSON data
  correct_choice_id: string | null
  metadata: any | null // JSON metadata
  image_url: any | null // JSON or string
  audio_url: any | null // JSON or string
  created_at: string
  updated_at: string
}

export interface PracticeSetQuestionRow {
  practice_set_id: string
  question_id: string
  sort_order: number
}

export interface PracticeResultRow {
  id: string
  user_id: string
  practice_set_id: string
  practice_date: string
  score_percent: number
  total_correct: number
  total_incorrect: number
  total_skipped: number | null
  time_spent_seconds: number | null
  weak_question_types: any | null // JSON
  coins_earned: number | null
  xp_earned: number | null
  is_first_pass: boolean | null
  status: 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

export interface UserLessonProgressRow {
  id: string
  user_id: string
  lesson_id: number
  topic_id: number
  best_score_percent: number
  total_attempts: number
  pass_threshold: number
  status: 'not_started' | 'in_progress' | 'passed'
  first_attempted_at: string | null
  last_attempted_at: string | null
  passed_at: string | null
  created_at: string
  updated_at: string
}

// API response types
export interface ZoneWithTopicsResponse extends ZoneRow {
  topics: TopicRow[]
}

export interface TopicWithLessonsResponse extends TopicRow {
  lessons: LessonRow[]
  zones: { level: number } | null
}

export interface LessonWithMaterialsResponse extends LessonRow {
  materials: MaterialRow[]
  topics: {
    title: string
    slug: string
    zone_id: number
    zones: { level: number } | null
  } | null
}

export interface ExerciseWithQuestionsResponse extends PracticeSetRow {
  questions: Array<{
    sort_order: number
    questions: QuestionRow
  }>
  lessons: {
    topic_id: number
    topics: {
      zone_id: number
      zones: { level: number } | null
    } | null
  } | null
}

// Submit exercise params
export interface SubmitExerciseParams {
  practiceSetId: string
  scorePercent: number
  totalCorrect: number
  totalIncorrect: number
  totalSkipped: number
  timeSpentSeconds: number
  weakQuestionTypes?: Record<string, any>
}

// Submit exercise response
export interface SubmitExerciseResponse {
  success: boolean
  result: PracticeResultRow | null
  error?: string
  coinsEarned?: number
  xpEarned?: number
  isFirstPass?: boolean
}

// Zone completion stats
export interface ZoneCompletionStats {
  completed: number
  total: number
}

// Topic progress summary
export interface TopicProgressSummary {
  topic_id: number
  title: string
  slug: string
  total_lessons: number
  completed_lessons: number
  progress_percent: number
  is_completed: boolean
}

// Zone progress summary
export interface ZoneProgressSummary {
  zone_id: number
  name: string
  level: number
  total_topics: number
  completed_topics: number
  progress_percent: number
  is_unlocked: boolean
}
