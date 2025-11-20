/**
 * Navigation types for Flashcards module
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { FlashcardData, FlashcardTopic } from '../types/flashcard.types'

/**
 * Flashcards stack navigator param list
 */
export type FlashcardsStackParamList = {
  Dashboard: undefined
  ReviewMode: {
    cards: FlashcardData[]
    topicId?: string
    topicName?: string
  }
  TopicDetail: {
    topic: FlashcardTopic
  }
  SavedCards: undefined
  CreateFlashcard: {
    flashcard?: FlashcardData // For editing
  }
  Statistics: undefined
  Search: undefined
}

/**
 * Navigation prop types for each screen
 */
export type DashboardNavigationProp = NativeStackNavigationProp<
  FlashcardsStackParamList,
  'Dashboard'
>

export type ReviewModeNavigationProp = NativeStackNavigationProp<
  FlashcardsStackParamList,
  'ReviewMode'
>

export type TopicDetailNavigationProp = NativeStackNavigationProp<
  FlashcardsStackParamList,
  'TopicDetail'
>

export type SavedCardsNavigationProp = NativeStackNavigationProp<
  FlashcardsStackParamList,
  'SavedCards'
>

export type CreateFlashcardNavigationProp = NativeStackNavigationProp<
  FlashcardsStackParamList,
  'CreateFlashcard'
>

export type StatisticsNavigationProp = NativeStackNavigationProp<
  FlashcardsStackParamList,
  'Statistics'
>

export type SearchNavigationProp = NativeStackNavigationProp<
  FlashcardsStackParamList,
  'Search'
>

/**
 * Route prop types for each screen
 */
export type DashboardRouteProp = RouteProp<FlashcardsStackParamList, 'Dashboard'>
export type ReviewModeRouteProp = RouteProp<FlashcardsStackParamList, 'ReviewMode'>
export type TopicDetailRouteProp = RouteProp<FlashcardsStackParamList, 'TopicDetail'>
export type SavedCardsRouteProp = RouteProp<FlashcardsStackParamList, 'SavedCards'>
export type CreateFlashcardRouteProp = RouteProp<FlashcardsStackParamList, 'CreateFlashcard'>
export type StatisticsRouteProp = RouteProp<FlashcardsStackParamList, 'Statistics'>
export type SearchRouteProp = RouteProp<FlashcardsStackParamList, 'Search'>
