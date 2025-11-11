export interface Lesson {
  id: string
  title: string
  order: number
  content?: string
  slug?: string
}

export interface Chapter {
  id: string
  title: string
  unlockPrice: number
  lessons: Lesson[]
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
}

export interface Zone {
  id: 'beginner' | 'elementary' | 'intermediate' | 'upper-intermediate' | 'advanced' | 'expert'
  title: string
  description: string
  topics: Topic[]
}

export interface UserProgress {
  completedLessons: string[]
  unlockedChapters: string[]
  coins: number
}
