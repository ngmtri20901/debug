/**
 * Lessons List Screen
 * Displays lessons within a selected topic
 */

import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { LearnStackParamList } from '../navigation/types'
import { useTopic } from '../hooks/useLearnData'
import { useTopicCompletion } from '../hooks/useLessonUnlock'
import { Card, ProgressBar, Badge, LockIcon } from '../components'

type NavigationProp = NativeStackNavigationProp<LearnStackParamList, 'LessonsList'>
type RouteProps = RouteProp<LearnStackParamList, 'LessonsList'>

export function LessonsListScreen() {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute<RouteProps>()
  const { topicSlug } = route.params

  // Fetch topic and lessons
  const {
    data: topicData,
    isLoading: topicLoading,
    refetch: refetchTopic,
  } = useTopic(topicSlug)

  const topic = topicData?.topic
  const lessons = topicData?.lessons || []

  // Get topic completion stats
  const completion = useTopicCompletion(topic?.id ? parseInt(topic.id) : 0)

  const isLoading = topicLoading
  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await refetchTopic()
    setRefreshing(false)
  }, [refetchTopic])

  const renderTopicHeader = () => {
    if (!topic) return null

    return (
      <View style={styles.topicHeader}>
        <View style={styles.topicHeaderContent}>
          <Text style={styles.topicHeaderTitle}>{topic.name}</Text>
          {topic.description && (
            <Text style={styles.topicHeaderDescription}>{topic.description}</Text>
          )}
          <View style={styles.topicHeaderStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completion.completedLessons}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completion.totalLessons}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completion.percentage}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>
        </View>
        {completion.totalLessons > 0 && (
          <ProgressBar
            progress={completion.percentage}
            height={8}
            color="#10B981"
            showPercentage={false}
          />
        )}
      </View>
    )
  }

  const renderLessonCard = (lesson: typeof lessons[0], index: number) => {
    // Simple unlock logic: lessons are unlocked sequentially
    const isLocked = index > 0 // Could integrate with useLessonUnlock hook
    const isCompleted = false // Would check from progress data

    return (
      <TouchableOpacity
        key={lesson.id}
        onPress={() => {
          if (!isLocked) {
            navigation.navigate('LessonDetail', {
              topicSlug,
              lessonSlug: lesson.slug,
            })
          }
        }}
        activeOpacity={isLocked ? 1 : 0.7}
        disabled={isLocked}
      >
        <Card style={[styles.lessonCard, isLocked && styles.lessonCardLocked]}>
          <View style={styles.lessonCardContent}>
            {/* Left: Lesson number circle */}
            <View style={[
              styles.lessonNumber,
              isCompleted && styles.lessonNumberCompleted,
              isLocked && styles.lessonNumberLocked,
            ]}>
              {isCompleted ? (
                <Text style={styles.lessonNumberCompletedText}>✓</Text>
              ) : (
                <Text style={[
                  styles.lessonNumberText,
                  isLocked && styles.lessonNumberTextLocked,
                ]}>
                  {lesson.order}
                </Text>
              )}
            </View>

            {/* Middle: Lesson info */}
            <View style={styles.lessonInfo}>
              <View style={styles.lessonTitleRow}>
                <Text style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}>
                  {lesson.title}
                </Text>
                {isCompleted && (
                  <Badge label="Done" variant="success" size="small" />
                )}
              </View>
              {lesson.description && (
                <Text style={[styles.lessonDescription, isLocked && styles.lessonDescriptionLocked]} numberOfLines={2}>
                  {lesson.description}
                </Text>
              )}
              <View style={styles.lessonMeta}>
                {lesson.estimated_time && (
                  <>
                    <Text style={styles.lessonMetaText}>⏱ {lesson.estimated_time} min</Text>
                    <Text style={styles.lessonMetaText}>•</Text>
                  </>
                )}
                <Text style={styles.lessonMetaText}>
                  {lesson.difficulty || 'Beginner'}
                </Text>
              </View>
            </View>

            {/* Right: Lock icon or chevron */}
            <View style={styles.lessonCardRight}>
              {isLocked ? (
                <LockIcon size={24} locked={true} color="#9CA3AF" />
              ) : (
                <Text style={styles.chevron}>›</Text>
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  const renderLessonsList = () => {
    if (lessons.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No lessons available in this topic</Text>
        </View>
      )
    }

    return (
      <View style={styles.lessonsSection}>
        <Text style={styles.sectionTitle}>Lessons</Text>
        <View style={styles.lessonsList}>
          {lessons.map((lesson, index) => renderLessonCard(lesson, index))}
        </View>
      </View>
    )
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading lessons...</Text>
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
      {renderTopicHeader()}
      {renderLessonsList()}
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
  topicHeader: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topicHeaderContent: {
    marginBottom: 16,
  },
  topicHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  topicHeaderDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  topicHeaderStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  lessonsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  lessonsList: {
    gap: 12,
    paddingHorizontal: 16,
  },
  lessonCard: {
    marginBottom: 0,
  },
  lessonCardLocked: {
    opacity: 0.6,
  },
  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lessonNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonNumberCompleted: {
    backgroundColor: '#10B981',
  },
  lessonNumberLocked: {
    backgroundColor: '#F3F4F6',
  },
  lessonNumberText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4F46E5',
  },
  lessonNumberTextLocked: {
    color: '#9CA3AF',
  },
  lessonNumberCompletedText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  lessonInfo: {
    flex: 1,
    gap: 6,
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lessonTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  lessonTitleLocked: {
    color: '#9CA3AF',
  },
  lessonDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  lessonDescriptionLocked: {
    color: '#9CA3AF',
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lessonMetaText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  lessonCardRight: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },
  chevron: {
    fontSize: 32,
    color: '#D1D5DB',
    fontWeight: '300',
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
})
