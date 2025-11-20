/**
 * Exercise Session Screen
 * Main exercise screen that renders appropriate question components
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { LearnStackParamList } from '../navigation/types'
import { useExerciseSessionStore } from '../stores/exerciseSessionStore'
import { useSubmitExercise } from '../hooks/usePractice'
import {
  MultipleChoiceQuestionComponent,
  WordMatchingQuestionComponent,
  ChooseWordsQuestionComponent,
  ErrorCorrectionQuestionComponent,
  DialogueQuestionComponent,
  ProgressBar,
  Button,
  Card,
} from '../components'
import type { Question } from '../types/practice'

type NavigationProp = NativeStackNavigationProp<LearnStackParamList, 'ExerciseSession'>
type RouteProps = RouteProp<LearnStackParamList, 'ExerciseSession'>

export function ExerciseSessionScreen() {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute<RouteProps>()
  const { exercise, topicSlug, lessonSlug } = route.params

  const {
    currentQuestionIndex,
    answers,
    startSession,
    endSession,
    resetSession,
    goToNextQuestion,
    goToPreviousQuestion,
    submitAnswer,
    getAnswer,
    calculateResults,
  } = useExerciseSessionStore()

  const submitExerciseMutation = useSubmitExercise()

  const [showFeedback, setShowFeedback] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState<any>(null)

  // Initialize session on mount
  useEffect(() => {
    startSession(exercise)
    return () => {
      resetSession()
    }
  }, [exercise.id])

  const currentQuestion = exercise.questions[currentQuestionIndex]
  const totalQuestions = exercise.questions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  const handleAnswerSubmit = useCallback((answer: any) => {
    if (!currentQuestion) return

    const grade = submitAnswer(currentQuestion.id, answer)
    setCurrentFeedback(grade)
    setShowFeedback(true)
  }, [currentQuestion, submitAnswer])

  const handleNext = useCallback(() => {
    setShowFeedback(false)
    setCurrentFeedback(null)

    if (currentQuestionIndex < totalQuestions - 1) {
      goToNextQuestion()
    } else {
      // Exercise complete - calculate results and navigate
      handleCompleteExercise()
    }
  }, [currentQuestionIndex, totalQuestions, goToNextQuestion])

  const handlePrevious = useCallback(() => {
    setShowFeedback(false)
    setCurrentFeedback(null)
    goToPreviousQuestion()
  }, [goToPreviousQuestion])

  const handleCompleteExercise = useCallback(async () => {
    const results = calculateResults()
    endSession()

    // Submit to backend
    try {
      await submitExerciseMutation.mutateAsync({
        exerciseId: exercise.id,
        topicSlug,
        lessonSlug,
        answers: Array.from(answers.values()),
        score: results.score,
        timeSpentSeconds: results.timeSpent,
      })
    } catch (error) {
      console.error('Failed to submit exercise:', error)
    }

    // Navigate to completion screen
    navigation.replace('ExerciseComplete', {
      score: results.score,
      correctAnswers: results.correctAnswers,
      totalQuestions: results.totalQuestions,
      coinsEarned: results.score >= (exercise.pass_threshold || 70) ? 10 : 0,
      xpEarned: results.score >= (exercise.pass_threshold || 70) ? 50 : 0,
    })
  }, [
    calculateResults,
    endSession,
    submitExerciseMutation,
    exercise,
    topicSlug,
    lessonSlug,
    answers,
    navigation,
  ])

  const handleQuit = useCallback(() => {
    Alert.alert(
      'Quit Exercise?',
      'Your progress will be lost. Are you sure you want to quit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => {
            resetSession()
            navigation.goBack()
          },
        },
      ]
    )
  }, [navigation, resetSession])

  const renderExerciseHeader = () => {
    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleQuit} style={styles.quitButton}>
            <Text style={styles.quitButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.questionCounter}>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <ProgressBar
          progress={progress}
          height={6}
          color="#10B981"
          showPercentage={false}
        />
      </View>
    )
  }

  const renderQuestion = () => {
    if (!currentQuestion) return null

    const existingAnswer = getAnswer(currentQuestion.id)
    const isAnswered = !!existingAnswer

    const commonProps = {
      disabled: isAnswered,
      showFeedback,
      isCorrect: currentFeedback?.isCorrect,
      feedbackMessage: currentFeedback?.feedback,
    }

    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <MultipleChoiceQuestionComponent
            question={currentQuestion as any}
            onSubmit={handleAnswerSubmit}
            {...commonProps}
          />
        )

      case 'word-matching':
      case 'synonyms-matching':
        return (
          <WordMatchingQuestionComponent
            question={currentQuestion as any}
            onSubmit={handleAnswerSubmit}
            {...commonProps}
          />
        )

      case 'choose-words':
        return (
          <ChooseWordsQuestionComponent
            question={currentQuestion as any}
            onSubmit={handleAnswerSubmit}
            {...commonProps}
          />
        )

      case 'error-correction':
        return (
          <ErrorCorrectionQuestionComponent
            question={currentQuestion as any}
            onSubmit={handleAnswerSubmit}
            {...commonProps}
          />
        )

      case 'dialogue-completion':
      case 'role-play':
        return (
          <DialogueQuestionComponent
            question={currentQuestion as any}
            onSubmit={handleAnswerSubmit}
            {...commonProps}
          />
        )

      case 'grammar-structure':
        // Grammar structure uses MCQ component
        return (
          <MultipleChoiceQuestionComponent
            question={currentQuestion as any}
            onSubmit={handleAnswerSubmit}
            {...commonProps}
          />
        )

      default:
        return (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>
              Unknown question type: {currentQuestion.type}
            </Text>
          </Card>
        )
    }
  }

  const renderNavigation = () => {
    const isAnswered = !!getAnswer(currentQuestion?.id || '')
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1

    return (
      <View style={styles.navigationContainer}>
        {currentQuestionIndex > 0 && (
          <Button
            title="Previous"
            onPress={handlePrevious}
            variant="outline"
            size="medium"
          />
        )}
        <View style={styles.navigationSpacer} />
        {isAnswered && (
          <Button
            title={isLastQuestion ? 'Finish' : 'Next'}
            onPress={handleNext}
            variant="primary"
            size="medium"
          />
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {renderExerciseHeader()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderQuestion()}
      </ScrollView>
      {renderNavigation()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  quitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quitButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },
  questionCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  errorCard: {
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  navigationSpacer: {
    flex: 1,
  },
})
