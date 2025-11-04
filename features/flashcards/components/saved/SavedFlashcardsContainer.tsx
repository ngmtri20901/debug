'use client'

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Separator } from "@/shared/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Input } from "@/shared/components/ui/input"
import { toast } from "sonner"
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Grid3x3,
  List,
  Star,
  Crown,
  Sparkles,
  TrendingUp,
  Calendar,
  Target,
  ArrowLeft,
  BarChart3
} from "lucide-react"

import { SavedFlashcardsList } from "@/features/flashcards/components/saved/saved-flashcards-list"
import { UnsaveConfirmationModal } from "@/shared/components/ui/unsave-confirmation-modal"
import { CountdownToast } from "@/shared/components/ui/countdown-toast"
import { createClient } from "@/shared/lib/supabase/client"
import { syncCustomFlashcardsToSaved } from "@/features/flashcards/services/flashcardSyncService"
import { deleteCustomFlashcard } from "@/features/flashcards/actions/delete"
import { unsaveAppFlashcard } from "@/features/flashcards/actions/unsave"
import { searchVietnamese } from "@/shared/utils/vi-normalize"
import type { SavedFlashcardsData, SavedFlashcardDetails } from "@/features/flashcards/data/saved-flashcards-loader"

interface PendingUnsave {
  flashcardId: string
  originalFlashcard: SavedFlashcardDetails
  timeoutId: NodeJS.Timeout
}

const FREE_LIMITS = {
  APP_FLASHCARDS: 25,
  CUSTOM_FLASHCARDS: 10
}

const PLUS_LIMITS = {
  APP_FLASHCARDS: 100,
  CUSTOM_FLASHCARDS: 25
}

const UNLIMITED_LIMITS = {
  APP_FLASHCARDS: 999999,
  CUSTOM_FLASHCARDS: 999999
}

export default function SavedFlashcardsContainer({ initialData }: { initialData: SavedFlashcardsData }) {
  const router = useRouter()

  // State from server data
  const [savedFlashcardsDetails, setSavedFlashcardsDetails] = useState<SavedFlashcardDetails[]>(initialData.savedFlashcards)
  const [topics] = useState(initialData.topics)
  const [syncStatus, setSyncStatus] = useState(initialData.syncStatus)

  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date_desc')
  const [activeTab, setActiveTab] = useState('all')

  // Unsave confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalData, setConfirmModalData] = useState<{
    flashcardId: string
    flashcardText: string
    actionType: 'unsave' | 'delete'
  } | null>(null)

  // Countdown toast state
  const [showCountdownToast, setShowCountdownToast] = useState(false)
  const [pendingUnsave, setPendingUnsave] = useState<PendingUnsave | null>(null)

  // Wrapper functions for the SavedFlashcardsList component
  const handleUnsaveFlashcard = (flashcardId: string, flashcardText: string, actionType: 'unsave' | 'delete') => {
    startUnsaveCountdown(flashcardId, flashcardText, actionType)
  }

  const handleToggleFavorite = (flashcardId: string) => {
    handleToggleFavoriteInternal(flashcardId)
  }

  const handleUnsaveClick = (flashcardId: string, flashcardText: string, actionType: 'unsave' | 'delete') => {
    // Check if user has disabled the confirmation modal
    const storageKey = actionType === 'delete' ? 'hideDeleteModal' : 'hideUnsaveModal'
    const hideModal = sessionStorage.getItem(storageKey) === 'true'

    if (hideModal) {
      // Skip modal and go directly to countdown
      startUnsaveCountdown(flashcardId, flashcardText, actionType)
    } else {
      // Show confirmation modal
      setConfirmModalData({ flashcardId, flashcardText, actionType })
      setShowConfirmModal(true)
    }
  }

  const handleConfirmUnsave = () => {
    if (confirmModalData) {
      startUnsaveCountdown(confirmModalData.flashcardId, confirmModalData.flashcardText, confirmModalData.actionType)
    }
    setShowConfirmModal(false)
    setConfirmModalData(null)
  }

  const startUnsaveCountdown = (flashcardId: string, flashcardText: string, actionType: 'unsave' | 'delete') => {
    // Find the flashcard to save its data for potential restoration
    const flashcard = savedFlashcardsDetails.find(f => f.id === flashcardId)
    if (!flashcard) {
      console.error('❌ Flashcard not found:', flashcardId)
      return
    }

    console.log('🗑️ Starting unsave countdown:', { flashcardId, flashcard, actionType })

    // Optimistically remove from UI
    setSavedFlashcardsDetails(prev => prev.filter(f => f.id !== flashcardId))

    // Set up the 5-second countdown
    const timeoutId = setTimeout(async () => {
      console.log('⏰ Countdown complete, executing deletion:', actionType)
      // Execute the action (unsave or delete) using server actions
      try {
        if (actionType === 'delete') {
          // Extract the actual custom flashcard ID from the saved flashcard ID
          const customFlashcardId = flashcard.flashcard_id.replace('custom_', '')

          console.log('🗑️ [Client] Calling deleteCustomFlashcard server action:', {
            savedFlashcardId: flashcard.id,
            customFlashcardId,
            fullFlashcardId: flashcard.flashcard_id
          })

          // Call server action to delete custom flashcard from both tables
          const result = await deleteCustomFlashcard(customFlashcardId)

          if (!result.success) {
            throw new Error(result.error || 'Failed to delete flashcard')
          }

          console.log('✅ [Client] Custom flashcard successfully deleted')
          toast.success("Custom flashcard deleted successfully")

          // Refresh server data
          router.refresh()
        } else {
          // Just unsave the flashcard (APP flashcard)
          console.log('🗑️ [Client] Calling unsaveAppFlashcard server action:', {
            savedFlashcardId: flashcard.id,
            flashcardType: flashcard.flashcard_type
          })

          // Call server action to unsave APP flashcard
          const result = await unsaveAppFlashcard(flashcard.id)

          if (!result.success) {
            throw new Error(result.error || 'Failed to unsave flashcard')
          }

          console.log('✅ [Client] Flashcard successfully unsaved')
          toast.success("Flashcard removed from your collection")

          // Refresh server data
          router.refresh()
        }
      } catch (err) {
        console.error(`❌ [Client] Failed to ${actionType} flashcard:`, err)
        // Restore the flashcard on error
        setSavedFlashcardsDetails(prev => [...prev, flashcard])
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        toast.error(`Failed to ${actionType} flashcard: ${errorMessage}`)
      }

      // Clean up countdown state
      setShowCountdownToast(false)
      setPendingUnsave(null)
    }, 5000)  // 5 seconds to match the countdown display

    // Set up countdown state
    setPendingUnsave({
      flashcardId,
      originalFlashcard: flashcard,
      timeoutId
    })
    setShowCountdownToast(true)
  }

  const handleUndoUnsave = () => {
    if (pendingUnsave) {
      // Clear the timeout
      clearTimeout(pendingUnsave.timeoutId)

      // Restore the flashcard to UI
      setSavedFlashcardsDetails(prev => [...prev, pendingUnsave.originalFlashcard])

      // Clean up state
      setShowCountdownToast(false)
      setPendingUnsave(null)

      toast.success("Flashcard restored!")
    }
  }

  const handleCountdownComplete = () => {
    // Countdown completed, flashcard was deleted
    setShowCountdownToast(false)
    setPendingUnsave(null)
    toast.success("Flashcard removed from your collection")
  }

  const handleCountdownDismiss = () => {
    // User manually dismissed the countdown toast
    setShowCountdownToast(false)
    // Note: Don't clear pendingUnsave - let the timeout continue in background
  }

  const handleToggleFavoriteInternal = async (flashcardId: string) => {
    // Find the saved flashcard to get the actual flashcard_id
    const savedCard = savedFlashcardsDetails.find(f => f.id === flashcardId)
    if (!savedCard) return

    const newFavoriteStatus = !savedCard.is_favorite

    console.log('⭐ Toggling favorite:', {
      flashcardId,
      currentStatus: savedCard.is_favorite,
      newStatus: newFavoriteStatus
    })

    // Optimistic update
    setSavedFlashcardsDetails(prev =>
      prev.map(f =>
        f.id === flashcardId ? { ...f, is_favorite: newFavoriteStatus } : f
      )
    )

    try {
      const supabase = createClient()

      const { error: favoriteError } = await supabase
        .from('saved_flashcards')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', savedCard.id)
        .eq('UserID', initialData.userId)

      if (favoriteError) {
        console.error('❌ Favorite update error:', favoriteError)
        throw favoriteError
      }

      console.log('✅ Favorite status updated successfully')

      // Refresh server data
      router.refresh()
    } catch (err) {
      console.error('❌ Failed to toggle favorite:', err)
      // Revert optimistic update on error
      setSavedFlashcardsDetails(prev =>
        prev.map(f =>
          f.id === flashcardId ? { ...f, is_favorite: savedCard.is_favorite } : f
        )
      )
      toast.error("Failed to update favorite status. Please try again.")
    }
  }

  const handleSyncFlashcards = async () => {
    if (!syncStatus?.needsSync || syncStatus.unsyncedCount === 0) return

    try {
      console.log(`🔄 Syncing ${syncStatus.unsyncedCount} unsynced flashcards...`)
      const result = await syncCustomFlashcardsToSaved(initialData.userId)

      if (result.success && result.synced > 0) {
        toast.success(`Synchronized ${result.synced} custom flashcard${result.synced > 1 ? 's' : ''} to your collection`)
        // Refresh server data
        router.refresh()
      } else if (result.success && result.synced === 0) {
        console.log('✅ All custom flashcards are already synchronized')
      }
    } catch (error) {
      console.error('❌ Error during sync:', error)
      toast.error('Failed to sync flashcards')
    }
  }

  // Memoized filtered and sorted flashcards for better performance
  const filteredFlashcards = useMemo(() => {
    const filtered = savedFlashcardsDetails.filter(flashcard => {
      const vietnameseText = flashcard.vietnamese || flashcard.vietnamese_text || ''
      const englishText = flashcard.english?.join(' ') || flashcard.english_text || ''

      // Use Vietnamese normalization for search - allows matching without diacritics
      const matchesSearch = searchTerm.trim() === '' ||
        searchVietnamese(vietnameseText, searchTerm) ||
        englishText.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesTopic = selectedTopic === 'all' || flashcard.topic === selectedTopic

      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'app' && flashcard.flashcard_type === 'APP') ||
        (activeTab === 'custom' && flashcard.flashcard_type === 'CUSTOM') ||
        (activeTab === 'favorites' && flashcard.is_favorite)

      return matchesSearch && matchesTopic && matchesTab
    })

    return filtered
  }, [savedFlashcardsDetails, searchTerm, selectedTopic, activeTab])

  const sortedFlashcards = useMemo(() => {
    return [...filteredFlashcards].sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
        case 'date_asc':
          return new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime()
        case 'alpha_asc':
          const aText = a.vietnamese || a.vietnamese_text || ''
          const bText = b.vietnamese || b.vietnamese_text || ''
          return aText.localeCompare(bText)
        case 'alpha_desc':
          const aTextDesc = a.vietnamese || a.vietnamese_text || ''
          const bTextDesc = b.vietnamese || b.vietnamese_text || ''
          return bTextDesc.localeCompare(aTextDesc)
        default:
          return 0
      }
    })
  }, [filteredFlashcards, sortBy])

  const appFlashcards = useMemo(() => savedFlashcardsDetails.filter(f => f.flashcard_type === 'APP'), [savedFlashcardsDetails])
  const customFlashcards = useMemo(() => savedFlashcardsDetails.filter(f => f.flashcard_type === 'CUSTOM'), [savedFlashcardsDetails])
  const favoriteFlashcards = useMemo(() => savedFlashcardsDetails.filter(f => f.is_favorite), [savedFlashcardsDetails])

  // Get limits based on subscription type
  const limits =
    initialData.userStats.subscription_type === 'UNLIMITED' ? UNLIMITED_LIMITS :
    initialData.userStats.subscription_type === 'PLUS' ? PLUS_LIMITS :
    FREE_LIMITS
  const isNearLimit = (
    initialData.userStats.appFlashcards >= limits.APP_FLASHCARDS * 0.8 ||
    initialData.userStats.customFlashcards >= limits.CUSTOM_FLASHCARDS * 0.8
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              My Flashcards
            </h1>
            <p className="text-gray-600 mt-1">Manage and review your saved flashcards</p>
          </div>
        </div>
      </div>

      {/* Dashboard Summary - Only App Flashcards and My Flashcards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">App Flashcards</p>
                <p className="text-2xl font-bold text-gray-900">
                  {initialData.userStats.appFlashcards}/{limits.APP_FLASHCARDS === 999999 ? '∞' : limits.APP_FLASHCARDS}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Flashcards</p>
                <p className="text-2xl font-bold text-gray-900">
                  {initialData.userStats.customFlashcards}/{limits.CUSTOM_FLASHCARDS === 999999 ? '∞' : limits.CUSTOM_FLASHCARDS}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Prompt for Free Users */}
      {initialData.userStats.subscription_type === 'FREE' && isNearLimit && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-8 w-8 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    Upgrade to Plus
                  </h3>
                  <p className="text-sm text-gray-700">
                    You're approaching your save limit. Unlock unlimited flashcards!
                  </p>
                </div>
              </div>
              <Link href="/pricing">
                <Button variant="default" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700">
                  View Plans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Status */}
      {syncStatus && syncStatus.needsSync && syncStatus.unsyncedCount > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {syncStatus.unsyncedCount} custom flashcard{syncStatus.unsyncedCount > 1 ? 's' : ''} need syncing
                </p>
              </div>
              <Button onClick={handleSyncFlashcards} size="sm" variant="outline">
                Sync Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search flashcards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Topic Filter */}
            <div className="w-full md:w-48">
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="All Topics" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.name}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="w-full md:w-56">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Date Added (Newest)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Date Added (Newest)</SelectItem>
                  <SelectItem value="date_asc">Date Added (Oldest)</SelectItem>
                  <SelectItem value="alpha_asc">Alphabetical (A-Z)</SelectItem>
                  <SelectItem value="alpha_desc">Alphabetical (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({savedFlashcardsDetails.length})
          </TabsTrigger>
          <TabsTrigger value="app">
            App Cards ({appFlashcards.length})
          </TabsTrigger>
          <TabsTrigger value="custom">
            My Cards ({customFlashcards.length})
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Star className="h-4 w-4 mr-1 fill-current" /> Favorites ({favoriteFlashcards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {sortedFlashcards.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No flashcards to display</h3>
                <p className="text-gray-600 mb-4">
                  Total in state: {savedFlashcardsDetails.length}, Filtered: {filteredFlashcards.length}
                </p>
                <Link href="/flashcards/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Flashcard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <SavedFlashcardsList
              flashcards={sortedFlashcards}
              viewMode={viewMode}
              onUnsave={handleUnsaveFlashcard}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Unsave Confirmation Modal */}
      <UnsaveConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmUnsave}
        flashcardText={confirmModalData?.flashcardText || ''}
        actionType={confirmModalData?.actionType || 'unsave'}
      />

      {/* Countdown Toast */}
      {showCountdownToast && pendingUnsave && (
        <CountdownToast
          flashcardText={pendingUnsave.originalFlashcard.vietnamese || pendingUnsave.originalFlashcard.vietnamese_text || ''}
          onUndo={handleUndoUnsave}
          onComplete={handleCountdownComplete}
          onDismiss={handleCountdownDismiss}
          duration={5}
        />
      )}
    </div>
  )
}
