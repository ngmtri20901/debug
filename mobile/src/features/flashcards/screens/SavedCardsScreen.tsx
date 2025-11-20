/**
 * Saved Cards Screen
 * User's bookmarked flashcards
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { SavedCardsNavigationProp } from '../navigation/types'
import { Header } from '@/shared/components/Header'
import { FlashCard } from '../components/FlashCard'
import { useSavedFlashcards } from '../hooks/useSavedFlashcards'
import { flashcardAPI } from '../services/flashcardService'
import type { FlashcardData } from '../types/flashcard.types'
import { colors, spacing, borderRadius, typography, shadows } from '@/shared/theme/colors'
import { audioService } from '../services/audioService'
import { supabase } from '@/shared/lib/supabase/client'

type FilterType = 'all' | 'app' | 'custom'

export const SavedCardsScreen: React.FC = () => {
  const navigation = useNavigation<SavedCardsNavigationProp>()
  const { savedCards, toggleSave, loading: savedLoading } = useSavedFlashcards()

  const [flashcards, setFlashcards] = useState<FlashcardData[]>([])
  const [filteredCards, setFilteredCards] = useState<FlashcardData[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const [selectedCard, setSelectedCard] = useState<FlashcardData | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Fetch saved flashcards
  const fetchSavedFlashcards = useCallback(async () => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setFlashcards([])
        return
      }

      const { flashcards: data } = await flashcardAPI.getSavedFlashcards(user.id)
      setFlashcards(data)
    } catch (error) {
      console.error('Failed to fetch saved flashcards:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSavedFlashcards()
  }, [fetchSavedFlashcards])

  // Filter and search logic
  useEffect(() => {
    let filtered = flashcards

    // Apply type filter
    if (activeFilter === 'app') {
      filtered = filtered.filter((card) => !card.is_custom)
    } else if (activeFilter === 'custom') {
      filtered = filtered.filter((card) => card.is_custom)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (card) =>
          card.vietnamese.toLowerCase().includes(query) ||
          card.english.toLowerCase().includes(query)
      )
    }

    setFilteredCards(filtered)
  }, [flashcards, activeFilter, searchQuery])

  const handleCardPress = useCallback((flashcard: FlashcardData) => {
    setSelectedCard(flashcard)
    setModalVisible(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalVisible(false)
    audioService.stop()
  }, [])

  const handleUnsave = useCallback(
    async (flashcardId: string) => {
      await toggleSave(flashcardId)
      // Remove from local state
      setFlashcards((prev) => prev.filter((card) => card.id !== flashcardId))
    },
    [toggleSave]
  )

  const handleEdit = useCallback(
    (flashcard: FlashcardData) => {
      navigation.navigate('CreateFlashcard', { flashcard })
    },
    [navigation]
  )

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

  const handleStartReview = useCallback(() => {
    if (filteredCards.length > 0) {
      navigation.navigate('ReviewMode', {
        cards: filteredCards,
      })
    }
  }, [navigation, filteredCards])

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
            {item.topic_id && (
              <Text style={styles.topic} numberOfLines={1}>
                {item.topic_id}
              </Text>
            )}
          </View>

          <View style={styles.flashcardActions}>
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => handlePlayAudio(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.iconText}>🔊</Text>
            </TouchableOpacity>

            {item.is_custom && (
              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => handleEdit(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.iconText}>✏️</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => handleUnsave(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.iconText}>🔖</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleCardPress, handlePlayAudio, handleEdit, handleUnsave]
  )

  const renderEmpty = useCallback(() => {
    if (loading) return null
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📝</Text>
        <Text style={styles.emptyText}>
          {searchQuery
            ? 'No flashcards match your search'
            : 'No saved flashcards yet'}
        </Text>
        <Text style={styles.emptySubtext}>
          {searchQuery
            ? 'Try a different search term'
            : 'Save flashcards while reviewing to find them here'}
        </Text>
      </View>
    )
  }, [loading, searchQuery])

  const appCount = flashcards.filter((card) => !card.is_custom).length
  const customCount = flashcards.filter((card) => card.is_custom).length

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        title="My Vocabulary"
        subtitle={`${flashcards.length} saved`}
        leftIcon="‹"
        onLeftPress={() => navigation.goBack()}
      />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'all' && styles.filterTabTextActive,
              ]}
            >
              All ({flashcards.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'app' && styles.filterTabActive]}
            onPress={() => setActiveFilter('app')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'app' && styles.filterTabTextActive,
              ]}
            >
              App Cards ({appCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'custom' && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter('custom')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'custom' && styles.filterTabTextActive,
              ]}
            >
              My Custom ({customCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search flashcards..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Start Review Button */}
        {filteredCards.length > 0 && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={handleStartReview}
          >
            <Text style={styles.reviewButtonText}>
              Review {filteredCards.length} cards
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Flashcard List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading saved cards...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          renderItem={renderFlashcardItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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

  // Filters
  filtersContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
  },
  filterTabActive: {
    backgroundColor: colors.primary[600],
  },
  filterTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterTabTextActive: {
    color: colors.text.inverse,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    padding: 0,
  },
  clearIcon: {
    fontSize: 18,
    color: colors.text.tertiary,
    paddingHorizontal: spacing.sm,
  },

  // Review Button
  reviewButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  reviewButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.inverse,
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
    marginBottom: 2,
  },
  topic: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textTransform: 'capitalize',
  },
  flashcardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionIcon: {
    padding: spacing.xs,
  },
  iconText: {
    fontSize: 18,
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
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
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
