/**
 * Exercise type definitions and constants for Learn module
 */

import type { QuestionType } from '../types'

export interface ExerciseTypeMetadata {
  type: QuestionType
  label: string
  description: string
  icon: string
  color: string
  difficultyLevel: 'easy' | 'medium' | 'hard'
  estimatedTimeSeconds: number
}

/**
 * Exercise type metadata
 */
export const EXERCISE_TYPES: Record<QuestionType, ExerciseTypeMetadata> = {
  'multiple-choice': {
    type: 'multiple-choice',
    label: 'Multiple Choice',
    description: 'Choose the correct answer from multiple options',
    icon: '✓',
    color: '#10B981',
    difficultyLevel: 'easy',
    estimatedTimeSeconds: 30,
  },
  'word-matching': {
    type: 'word-matching',
    label: 'Word Matching',
    description: 'Match Vietnamese words with their English translations',
    icon: '🔗',
    color: '#3B82F6',
    difficultyLevel: 'easy',
    estimatedTimeSeconds: 45,
  },
  'synonyms-matching': {
    type: 'synonyms-matching',
    label: 'Synonyms Matching',
    description: 'Match words with their synonyms',
    icon: '↔️',
    color: '#8B5CF6',
    difficultyLevel: 'medium',
    estimatedTimeSeconds: 45,
  },
  'choose-words': {
    type: 'choose-words',
    label: 'Choose Words',
    description: 'Build sentences by selecting the correct words',
    icon: '📝',
    color: '#F59E0B',
    difficultyLevel: 'medium',
    estimatedTimeSeconds: 60,
  },
  'error-correction': {
    type: 'error-correction',
    label: 'Error Correction',
    description: 'Identify and correct errors in Vietnamese sentences',
    icon: '🔍',
    color: '#EF4444',
    difficultyLevel: 'hard',
    estimatedTimeSeconds: 75,
  },
  'grammar-structure': {
    type: 'grammar-structure',
    label: 'Grammar Structure',
    description: 'Apply grammar rules to complete sentences',
    icon: '📚',
    color: '#06B6D4',
    difficultyLevel: 'medium',
    estimatedTimeSeconds: 45,
  },
  'dialogue-completion': {
    type: 'dialogue-completion',
    label: 'Dialogue Completion',
    description: 'Complete conversations with appropriate responses',
    icon: '💬',
    color: '#EC4899',
    difficultyLevel: 'medium',
    estimatedTimeSeconds: 60,
  },
  'role-play': {
    type: 'role-play',
    label: 'Role Play',
    description: 'Participate in interactive conversations',
    icon: '🎭',
    color: '#F43F5E',
    difficultyLevel: 'hard',
    estimatedTimeSeconds: 90,
  },
}

/**
 * Get exercise type metadata
 */
export function getExerciseTypeMetadata(type: QuestionType): ExerciseTypeMetadata {
  return EXERCISE_TYPES[type]
}

/**
 * Get exercise type label
 */
export function getExerciseTypeLabel(type: QuestionType): string {
  return EXERCISE_TYPES[type].label
}

/**
 * Get exercise type icon
 */
export function getExerciseTypeIcon(type: QuestionType): string {
  return EXERCISE_TYPES[type].icon
}

/**
 * Get exercise type color
 */
export function getExerciseTypeColor(type: QuestionType): string {
  return EXERCISE_TYPES[type].color
}

/**
 * Get all exercise types sorted by difficulty
 */
export function getAllExerciseTypes(): ExerciseTypeMetadata[] {
  const difficultyOrder = { easy: 1, medium: 2, hard: 3 }
  return Object.values(EXERCISE_TYPES).sort(
    (a, b) => difficultyOrder[a.difficultyLevel] - difficultyOrder[b.difficultyLevel]
  )
}

/**
 * Get exercise types by difficulty level
 */
export function getExerciseTypesByDifficulty(
  difficulty: 'easy' | 'medium' | 'hard'
): ExerciseTypeMetadata[] {
  return Object.values(EXERCISE_TYPES).filter((type) => type.difficultyLevel === difficulty)
}

/**
 * Calculate estimated time for an exercise based on question types
 */
export function calculateEstimatedTime(questionTypes: QuestionType[]): number {
  return questionTypes.reduce(
    (total, type) => total + EXERCISE_TYPES[type].estimatedTimeSeconds,
    0
  )
}

/**
 * Format time in seconds to human-readable format
 */
export function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (remainingSeconds === 0) {
    return `${minutes}m`
  }
  return `${minutes}m ${remainingSeconds}s`
}
