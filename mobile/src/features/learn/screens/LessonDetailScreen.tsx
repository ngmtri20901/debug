/**
 * Lesson Detail Screen
 * Displays lesson materials (dialogue, vocabulary, grammar) and exercises
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { LearnStackParamList } from '../navigation/types'
import { useLesson } from '../hooks/useLearnData'
import { useExercise } from '../hooks/usePractice'
import { Button, Card, Badge, MaterialView } from '../components'

type NavigationProp = NativeStackNavigationProp<LearnStackParamList, 'LessonDetail'>
type RouteProps = RouteProp<LearnStackParamList, 'LessonDetail'>

export function LessonDetailScreen() {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute<RouteProps>()
  const { topicSlug, lessonSlug } = route.params

  // Fetch lesson and exercise data
  const {
    data: lessonData,
    isLoading: lessonLoading,
    refetch: refetchLesson,
  } = useLesson(topicSlug, lessonSlug)

  const {
    data: exercise,
    isLoading: exerciseLoading,
    refetch: refetchExercise,
  } = useExercise(topicSlug, lessonSlug)

  const lesson = lessonData?.lesson
  const materials = lessonData?.materials || []

  const isLoading = lessonLoading || exerciseLoading
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchLesson(), refetchExercise()])
    setRefreshing(false)
  }, [refetchLesson, refetchExercise])

  const handleStartExercise = () => {
    if (!exercise) return

    navigation.navigate('ExerciseSession', {
      exercise,
      topicSlug,
      lessonSlug,
    })
  }

  const renderHeader = () => {
    if (!lesson) return null

    return (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{lesson.title}</Text>
          {lesson.description && (
            <Text style={styles.headerDescription}>{lesson.description}</Text>
          )}
          <View style={styles.headerMeta}>
            {lesson.estimated_time && (
              <Badge
                label={`⏱ ${lesson.estimated_time} min`}
                variant="info"
                size="small"
              />
            )}
            {lesson.difficulty && (
              <Badge
                label={lesson.difficulty}
                variant="neutral"
                size="small"
              />
            )}
          </View>
        </View>
      </View>
    )
  }

  const renderMaterials = () => {
    if (materials.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No learning materials available</Text>
        </View>
      )
    }

    return (
      <View style={styles.materialsSection}>
        <Text style={styles.sectionTitle}>Learning Materials</Text>
        <View style={styles.materialsList}>
          {materials.map((material) => (
            <MaterialView key={material.id} material={material} />
          ))}
        </View>
      </View>
    )
  }

  const renderExerciseSection = () => {
    if (!exercise) {
      return (
        <Card style={styles.exerciseCard}>
          <Text style={styles.exerciseUnavailable}>
            Practice exercises coming soon!
          </Text>
        </Card>
      )
    }

    const questionCount = exercise.questions.length

    return (
      <View style={styles.exerciseSection}>
        <Text style={styles.sectionTitle}>Practice Exercise</Text>
        <Card style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <View>
              <Text style={styles.exerciseTitle}>{exercise.title}</Text>
              {exercise.description && (
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              )}
            </View>
            <View style={styles.exerciseIcon}>
              <Text style={styles.exerciseIconText}>📝</Text>
            </View>
          </View>

          <View style={styles.exerciseStats}>
            <View style={styles.exerciseStat}>
              <Text style={styles.exerciseStatLabel}>Questions</Text>
              <Text style={styles.exerciseStatValue}>{questionCount}</Text>
            </View>
            <View style={styles.exerciseStatDivider} />
            <View style={styles.exerciseStat}>
              <Text style={styles.exerciseStatLabel}>Pass Score</Text>
              <Text style={styles.exerciseStatValue}>
                {exercise.pass_threshold || 70}%
              </Text>
            </View>
          </View>

          <Button
            title="Start Exercise"
            onPress={handleStartExercise}
            variant="primary"
            size="large"
            fullWidth
          />
        </Card>
      </View>
    )
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    )
  }

  if (!lesson) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lesson not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderHeader()}
      {renderMaterials()}
      {renderExerciseSection()}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  materialsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  materialsList: {
    gap: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  exerciseSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  exerciseCard: {
    marginBottom: 0,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  exerciseIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseIconText: {
    fontSize: 28,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  exerciseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  exerciseStat: {
    flex: 1,
    alignItems: 'center',
  },
  exerciseStatLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  exerciseStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  exerciseStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  exerciseUnavailable: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 20,
  },
})
