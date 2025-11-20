/**
 * Navigation types for Learn module
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { Exercise, Topic, Lesson } from '../types'

/**
 * Learn stack navigator param list
 */
export type LearnStackParamList = {
  Dashboard: undefined
  TopicsList: {
    zoneId: string
    zoneName: string
  }
  LessonsList: {
    topicSlug: string
    topicId: string
    topicName: string
  }
  LessonDetail: {
    topicSlug: string
    lessonSlug: string
    lessonId: string
    lessonTitle: string
  }
  ExerciseSession: {
    exercise: Exercise
    topicSlug: string
    lessonSlug: string
  }
  ExerciseComplete: {
    score: number
    correctAnswers: number
    incorrectAnswers: number
    unsureAnswers: number
    totalQuestions: number
    accuracy: number
    timeSpent: number
    coinsEarned: number
    xpEarned: number
    lessonCompleted: boolean
    topicSlug: string
    lessonSlug: string
  }
}

/**
 * Navigation prop types for each screen
 */
export type DashboardNavigationProp = NativeStackNavigationProp<
  LearnStackParamList,
  'Dashboard'
>

export type TopicsListNavigationProp = NativeStackNavigationProp<
  LearnStackParamList,
  'TopicsList'
>

export type LessonsListNavigationProp = NativeStackNavigationProp<
  LearnStackParamList,
  'LessonsList'
>

export type LessonDetailNavigationProp = NativeStackNavigationProp<
  LearnStackParamList,
  'LessonDetail'
>

export type ExerciseSessionNavigationProp = NativeStackNavigationProp<
  LearnStackParamList,
  'ExerciseSession'
>

export type ExerciseCompleteNavigationProp = NativeStackNavigationProp<
  LearnStackParamList,
  'ExerciseComplete'
>

/**
 * Route prop types for each screen
 */
export type DashboardRouteProp = RouteProp<LearnStackParamList, 'Dashboard'>
export type TopicsListRouteProp = RouteProp<LearnStackParamList, 'TopicsList'>
export type LessonsListRouteProp = RouteProp<LearnStackParamList, 'LessonsList'>
export type LessonDetailRouteProp = RouteProp<LearnStackParamList, 'LessonDetail'>
export type ExerciseSessionRouteProp = RouteProp<LearnStackParamList, 'ExerciseSession'>
export type ExerciseCompleteRouteProp = RouteProp<LearnStackParamList, 'ExerciseComplete'>
