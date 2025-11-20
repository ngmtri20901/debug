/**
 * Flashcards Dashboard Screen
 * Main hub for the Flashcards module
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import type { DashboardNavigationProp } from '../navigation/types'
import { Header } from '@/shared/components/Header'
import { QuickAction } from '../components/QuickAction'
import { TopicCard } from '../components/TopicCard'
import { useRandomFlashcards } from '../hooks/useRandomFlashcards'
import { flashcardAPI } from '../services/flashcardService'
import type { FlashcardTopic } from '../types/flashcard.types'
import { colors, spacing, borderRadius, typography, shadows } from '@/shared/theme/colors'

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>()
  const [topics, setTopics] = useState<FlashcardTopic[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch random flashcards for daily practice
  const { data: dailyCards, isLoading: cardsLoading } = useRandomFlashcards({
    count: 20,
    commonWordsOnly: false,
  })

  // Fetch topics
  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true)
      const data = await flashcardAPI.getAllTopics()
      setTopics(data)
    } catch (error) {
      console.error('Failed to fetch topics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchTopics()
    setRefreshing(false)
  }, [fetchTopics])

  const handleStartReview = useCallback(() => {
    if (dailyCards && dailyCards.length > 0) {
      navigation.navigate('ReviewMode', {
        cards: dailyCards,
      })
    }
  }, [navigation, dailyCards])

  const handleTopicPress = useCallback(
    (topic: FlashcardTopic) => {
      navigation.navigate('TopicDetail', { topic })
    },
    [navigation]
  )

  const handleSearch = useCallback(() => {
    navigation.navigate('Search')
  }, [navigation])

  const handleCreateNew = useCallback(() => {
    navigation.navigate('CreateFlashcard', {})
  }, [navigation])

  const handleSavedCards = useCallback(() => {
    navigation.navigate('SavedCards')
  }, [navigation])

  const handleStatistics = useCallback(() => {
    navigation.navigate('Statistics')
  }, [navigation])

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        title="Vocabulary Bank"
        rightIcon="🔍"
        onRightPress={handleSearch}
      />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Hero Section - Daily Practice */}
        <LinearGradient
          colors={colors.gradients.violetPink}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>📚</Text>
            <Text style={styles.heroTitle}>Daily Practice</Text>
            <Text style={styles.heroSubtitle}>
              {cardsLoading
                ? 'Loading cards...'
                : `${dailyCards?.length || 0} cards ready for you`}
            </Text>
            <TouchableOpacity
              style={styles.heroCTA}
              onPress={handleStartReview}
              disabled={!dailyCards || dailyCards.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.heroCTAText}>Start Review</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickAction
              icon="➕"
              title="Create New"
              subtitle="Add card"
              onPress={handleCreateNew}
              color={colors.success.main}
            />
            <QuickAction
              icon="🔖"
              title="Saved Cards"
              subtitle="My collection"
              onPress={handleSavedCards}
              color={colors.warning.main}
            />
            <QuickAction
              icon="📊"
              title="Statistics"
              subtitle="Track progress"
              onPress={handleStatistics}
              color={colors.info.main}
            />
          </View>
        </View>

        {/* Topics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore Topics</Text>
            <Text style={styles.sectionSubtitle}>
              {topics.length} topic{topics.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {loading && topics.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading topics...</Text>
            </View>
          ) : (
            <View style={styles.topicList}>
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onPress={() => handleTopicPress(topic)}
                  progress={0} // TODO: Calculate actual progress from user stats
                />
              ))}
            </View>
          )}
        </View>

        {/* Bottom Padding */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },

  // Hero Section
  heroCard: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.inverse,
    opacity: 0.9,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  heroCTA: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 160,
  },
  heroCTAText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.primary[700],
    textAlign: 'center',
  },

  // Sections
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // Topics
  topicList: {
    // Topics will be rendered as vertical list
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
})
