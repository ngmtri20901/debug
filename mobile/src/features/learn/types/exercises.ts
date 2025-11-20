/**
 * Learn module core types (React Native)
 * Copied from web with mobile adaptations
 */

export interface Lesson {
  id: string
  title: string
  order: number
  content?: string
  slug?: string
  topic_id?: string
  status?: 'draft' | 'published'
  description?: string
  estimated_duration?: number // in minutes
}

export interface Chapter {
  id: string
  title: string
  unlockPrice: number
  lessons: Lesson[]
  order?: number
}

export interface Topic {
  id: string
  title: string
  chapters: Chapter[]
  zone: 'beginner' | 'elementary' | 'intermediate' | 'upper-intermediate' | 'advanced' | 'expert'
  description?: string
  image?: string
  slug?: string
  lessonCount?: number
  zone_id?: number
}

export interface Zone {
  id: 'beginner' | 'elementary' | 'intermediate' | 'upper-intermediate' | 'advanced' | 'expert'
  title: string
  description: string
  topics: Topic[]
  level?: number
  color?: string
  icon?: string
}

export interface UserProgress {
  completedLessons: string[]
  unlockedChapters: string[]
  coins: number
  xp?: number
  streak?: number
  lastActiveDate?: string
}

export interface TopicProgress {
  topicId: string
  completedLessons: number
  totalLessons: number
  progress: number // 0-100
  lastAccessedDate?: string
}

export interface LessonProgress {
  lessonId: string
  status: 'not_started' | 'in_progress' | 'completed'
  completedAt?: string
  exerciseScore?: number
  exerciseAttempts?: number
}

// Lesson Materials Types
export type MaterialType =
  | 'video'
  | 'image'
  | 'dialogue'
  | 'storybook'
  | 'vocabulary'
  | 'grammar'
  | 'examples'
  | 'notes'
  | 'audio'

export interface Material {
  id: string
  side: 'main' | 'sidebar'
  type: MaterialType
  title: string | null
  explanation: string | null | any // Can be string or object
  data: any
  media_url: string | null
  order_index: number
}

export interface DialogueLine {
  who: 'A' | 'B' | string
  text: string
  audio_url?: string
}

export interface VocabularyItem {
  id: string
  vietnamese: string
  english: string
  pronunciation?: string
  example?: string
  audio_url?: string
  image_url?: string
}

export interface GrammarRule {
  id: string
  title: string
  explanation: string
  examples: string[]
  notes?: string
}

export interface ExampleSentence {
  id: string
  vietnamese: string
  english: string
  highlighted_words?: string[]
  audio_url?: string
}

// User lesson progress tracking (from database)
export interface UserLessonProgress {
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
}
