/**
 * Topic Detail Screen
 * Browse and learn flashcards in a specific topic
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { TopicDetailNavigationProp, TopicDetailRouteProp } from '../navigation/types'
import { Header } from '@/shared/components/Header'
import { FlashCard } from '../components/FlashCard'
import { flashcardAPI } from '../services/flashcardService'
import type { FlashcardData } from '../types/flashcard.types'
import { colors, spacing, borderRadius, typography, shadows } from '@/shared/theme/colors'
import { audioService } from '../services/audioService'

const ITEMS_PER_PAGE = 20

export const TopicDetailScreen: React.FC = () => {
  const navigation = useNavigation<TopicDetailNavigationProp>()
  const route = useRoute<TopicDetailRouteProp>()
  const { topic } = route.params

  const [flashcards, setFlashcards] = useState<FlashcardData[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)

  const [selectedCard, setSelectedCard] = useState<FlashcardData | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Fetch flashcards for this topic
  const fetchFlashcards = useCallback(
    async (page: number = 0, append: boolean = false) => {
      if (loading || loadingMore) return

      try {
        if (append) {
          setLoadingMore(true)
        } else {
          setLoading(true)
        }

        const { flashcards: data, total } = await flashcardAPI.getFlashcardsByTopic(
          topic.id,
          undefined, // complexity
          page * ITEMS_PER_PAGE, // skip
          ITEMS_PER_PAGE // limit
        )

        if (append) {
          setFlashcards((prev) => [...prev, ...data])
        } else {
          setFlashcards(data)
        }

        setHasMore((page + 1) * ITEMS_PER_PAGE < total)
        setCurrentPage(page)
      } catch (error) {
        console.error('Failed to fetch flashcards:', error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [topic.id, loading, loadingMore]
  )

  useEffect(() => {
    fetchFlashcards(0, false)
  }, [])

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchFlashcards(currentPage + 1, true)
    }
  }, [fetchFlashcards, currentPage, loadingMore, hasMore])

  const handleCardPress = useCallback((flashcard: FlashcardData) => {
    setSelectedCard(flashcard)
    setModalVisible(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalVisible(false)
    audioService.stop()
  }, [])

  const handleStartLearning = useCallback(() => {
    if (flashcards.length > 0) {
      navigation.navigate('ReviewMode', {
        cards: flashcards,
        topicId: topic.id,
        topicName: topic.name_vietnamese,
      })
    }
  }, [navigation, flashcards, topic])

  const handlePlayAudio = useCallback(
    async (flashcard: FlashcardData) => {
      try {
        await audioService.playPronunciation(flashcard.id, flashcard.vietnamese)
      } catch (error) {
        console.error('Failed to play audio:', error)
      }
    },
    []
  )

  const renderFlashcardItem = useCallback(
    ({ item }: { item: FlashcardData }) => (
      <TouchableOpacity
        style={styles.flashcardRow}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.flashcardContent}>
          <View style={styles.flashcardText}>
            <Text style={styles.vietnamese} numberOfLines={1}>
              {item.vietnamese}
            </Text>
            <Text style={styles.english} numberOfLines={1}>
              {item.english}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.audioButtonSmall}
            onPress={() => handlePlayAudio(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.audioIcon}>🔊</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [handleCardPress, handlePlayAudio]
  )

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator color={colors.primary[600]} />
      </View>
    )
  }, [loadingMore])

  const renderEmpty = useCallback(() => {
    if (loading) return null
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📝</Text>
        <Text style={styles.emptyText}>No flashcards in this topic yet</Text>
      </View>
    )
  }, [loading])

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        title={topic.name_vietnamese}
        subtitle={topic.name_english}
        leftIcon="‹"
        onLeftPress={() => navigation.goBack()}
      />

      {/* Topic Header Banner */}
      <LinearGradient
        colors={colors.gradients.bluePurple}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topicBanner}
      >
        <View style={styles.bannerContent}>
          <Text style={styles.bannerEmoji}>
            {topic.name_vietnamese.includes('Greetings') ? '👋' : '📚'}
          </Text>
          <Text style={styles.bannerTitle}>{topic.name_vietnamese}</Text>
          <Text style={styles.bannerSubtitle}>
            {flashcards.length} {flashcards.length === 1 ? 'word' : 'words'}
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartLearning}
            disabled={flashcards.length === 0}
          >
            <Text style={styles.startButtonText}>Start Learning</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Flashcard List */}
      {loading && flashcards.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading flashcards...</Text>
        </View>
      ) : (
        <FlatList
          data={flashcards}
          renderItem={renderFlashcardItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Flashcard Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleCloseModal}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>

              {selectedCard && (
                <View style={styles.cardWrapper}>
                  <FlashCard flashcard={selectedCard} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },

  // Topic Banner
  topicBanner: {
    padding: spacing.xl,
    ...shadows.md,
  },
  bannerContent: {
    alignItems: 'center',
  },
  bannerEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  bannerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.inverse,
    opacity: 0.9,
    marginBottom: spacing.lg,
  },
  startButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 180,
  },
  startButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary[700],
    textAlign: 'center',
  },

  // List
  listContent: {
    padding: spacing.md,
  },
  flashcardRow: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  flashcardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flashcardText: {
    flex: 1,
    marginRight: spacing.md,
  },
  vietnamese: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  english: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  audioButtonSmall: {
    padding: spacing.sm,
  },
  audioIcon: {
    fontSize: 20,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  loadingMore: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },

  // Empty
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -40,
    right: 0,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  closeIcon: {
    fontSize: 24,
    color: colors.text.primary,
  },
  cardWrapper: {
    marginTop: spacing.lg,
  },
})
