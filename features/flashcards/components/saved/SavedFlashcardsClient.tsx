'use client'

import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
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
import { useUserProfile, useAuth } from "@/shared/hooks/use-user-profile"
import { savedFlashcardsAPI, getFlashcardDetailsByIds } from "@/features/flashcards/services/savedFlashcardsService"
import PageWithLoading from "@/shared/components/ui/PageWithLoading"
import { useLoading } from "@/shared/hooks/use-loading"
import { createClient } from "@/shared/lib/supabase/client"
import { syncCustomFlashcardsToSaved, checkSyncStatus } from "@/features/flashcards/services/flashcardSyncService"
import { deleteCustomFlashcard, unsaveAppFlashcard } from "@/features/flashcards/actions/flashcard-actions"
import { useInfiniteQuery, useQueryClient, useQuery } from "@tanstack/react-query"
import { FlashcardListSkeleton, FlashcardSkeleton } from "@/features/flashcards/components/core/flashcard-skeleton"

interface SavedFlashcardDetails {
  id: string
  flashcard_id: string
  flashcard_type: 'APP' | 'CUSTOM'
  topic?: string | null  // Allow null to match DB schema
  saved_at: string
  is_favorite: boolean
  review_count: number
  last_reviewed?: string | null
  tags: string[]
  notes?: string | null
  // App flashcard data
  vietnamese?: string
  english?: string[]
  image_url?: string
  word_type?: string
  audio_url?: string
  pronunciation?: string
  // Custom flashcard data
  vietnamese_text?: string
  english_text?: string
}

interface UserStats {
  appFlashcards: number
  customFlashcards: number
  subscription_type: 'FREE' | 'PLUS' | 'UNLIMITED'
}

interface PendingUnsave {
  flashcardId: string
  originalFlashcard: SavedFlashcardDetails
  timeoutId: NodeJS.Timeout
}

interface FlashcardTopic {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  sort_order?: number | null
}

const FREE_LIMITS = {
  APP_FLASHCARDS: 25,
  CUSTOM_FLASHCARDS: 10
}

const PLUS_LIMITS = {
  APP_FLASHCARDS: 999999,
  CUSTOM_FLASHCARDS: 999999
}

export default function SavedFlashcardsClient() {
  const { user, isAuthenticated } = useAuth()
  const { profile } = useUserProfile()

  // Client-side mounting state to prevent hydration issues
  const [isMounted, setIsMounted] = useState(false)
  const { withLoading } = useLoading()

  // React Query hooks for data fetching
  const queryClient = useQueryClient()
  
  // Fetch user stats
  const { data: userStats, isLoading: loadingStats } = useQuery({
    queryKey: ['saved-flashcard-stats'],
    queryFn: async () => {
      return await savedFlashcardsAPI.getUserStats()
    },
    enabled: isMounted && isAuthenticated && !!user,
    refetchOnWindowFocus: false,
  })

  // Infinite query for saved flashcards
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error: queryError,
    isLoading: queryLoading,
    status,
    fetchStatus
  } = useInfiniteQuery({
    queryKey: ['saved-flashcards'],
    queryFn: ({ pageParam }) => {
      console.log('🎯 queryFn called with pageParam:', pageParam)
      return fetchSavedFlashcardsPage(pageParam as string | undefined)
    },
    getNextPageParam: (lastPage: { items: SavedFlashcardDetails[]; nextCursor?: string }) => lastPage.nextCursor,
    initialPageParam: undefined,
    refetchOnWindowFocus: false,
    enabled: isMounted && isAuthenticated && !!user,
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retrying
  })

  // Log query status changes
  useEffect(() => {
    console.log('📊 Query status changed:', { status, fetchStatus, isLoading: queryLoading, hasError: !!queryError, dataPages: data?.pages?.length || 0 })
  }, [status, fetchStatus, queryLoading, queryError, data])

  // State for UI components
  const [savedFlashcardsDetails, setSavedFlashcardsDetails] = useState<SavedFlashcardDetails[]>([])
  const [error, setError] = useState<string | null>(null)
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

  const isLoading = queryLoading || loadingStats

  // Wrapper functions for the SavedFlashcardsList component
  const handleUnsaveFlashcard = (flashcardId: string, flashcardText: string, actionType: 'unsave' | 'delete') => {
    startUnsaveCountdown(flashcardId, flashcardText, actionType)
  }

  const handleToggleFavorite = (flashcardId: string) => {
    handleToggleFavoriteInternal(flashcardId)
  }


  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true)
    console.log('🚀 Component mounted')
  }, [])

  // Log authentication status
  useEffect(() => {
    console.log('🔐 Auth status:', { isMounted, isAuthenticated, hasUser: !!user, userId: user?.id })
  }, [isMounted, isAuthenticated, user])

  // Process saved flashcards data when it changes
  useEffect(() => {
    if (!isMounted) return

    const loadData = async () => {
      console.log('🔄 Starting data load...', { user: !!user, isAuthenticated })
      await withLoading(async () => {
        await Promise.all([
          fetchTopics(),
          checkAndSyncFlashcards()
        ])
      })
    }

    if (isAuthenticated && user) {
      loadData()
    } else {
      console.log('⚠️ User not authenticated, skipping data load')
    }
  }, [withLoading, user, isAuthenticated, isMounted])

  const fetchSavedFlashcardsPage = async (cursor?: string) => {
    try {
      console.log('🔄 fetchSavedFlashcardsPage called with cursor:', cursor)
      setError(null)
      
      // Step 1: Get saved flashcards from Supabase (contains flashcard_id and flashcard_type)
      const { items: savedCards, nextCursor } = await savedFlashcardsAPI.getSavedFlashcardsPaginated(cursor)
      console.log('📊 getSavedFlashcardsPaginated returned:', { 
        savedCardsCount: savedCards.length, 
        nextCursor,
        appCards: savedCards.filter(c => c.flashcard_type === 'APP').length,
        customCards: savedCards.filter(c => c.flashcard_type === 'CUSTOM').length
      })

      if (savedCards.length === 0) {
        console.log('⚠️ No saved cards found')
        return { items: [], nextCursor: undefined }
      }

      // Step 2: Extract APP flashcard IDs from saved_flashcards.flashcard_id column
      // These are the actual APP flashcard IDs that need to be fetched from FastAPI
      const appFlashcardIds = savedCards
        .filter(card => card.flashcard_type === 'APP')
        .map(card => card.flashcard_id)
        .filter((id): id is string => !!id) // Filter out any null/undefined IDs

      console.log('🔍 APP flashcard IDs to fetch:', appFlashcardIds)

      let flashcardDetails: Array<{
        id: string
        vietnamese?: string
        english?: string[]
        image_url?: string
        type?: string
        word_type?: string
        audio_url?: string
        pronunciation?: string
      }> = []
      
      if (appFlashcardIds.length > 0) {
        try {
          console.log('🌐 Fetching APP flashcard details from FastAPI for', appFlashcardIds.length, 'flashcards')
          
          // Use a shorter timeout (5 seconds) to prevent hanging
          const timeoutPromise = new Promise<typeof flashcardDetails>((_, reject) => {
            setTimeout(() => reject(new Error('APP flashcard fetch timeout after 5 seconds')), 5000)
          })

          flashcardDetails = await Promise.race([
            getFlashcardDetailsByIds(appFlashcardIds),
            timeoutPromise
          ])
          
          console.log('✅ Successfully fetched APP flashcard details:', {
            requested: appFlashcardIds.length,
            received: flashcardDetails?.length || 0,
            ids: flashcardDetails?.map(d => d.id) || []
          })
        } catch (err) {
          console.error('❌ Error fetching app flashcard details:', err)
          console.warn('⚠️ Continuing without APP flashcard details - will show placeholder data')
          // Set empty array to continue with placeholder data
          flashcardDetails = []
          // Don't show toast here to avoid spamming - error is logged for debugging
        }
      } else {
        console.log('ℹ️ No APP flashcards to fetch details for')
      }

      // Get custom flashcard details from Supabase
      const customFlashcardIds = savedCards
        .filter(card => card.flashcard_type === 'CUSTOM')
        .map(card => card.flashcard_id.replace('custom_', ''))

      let customFlashcardDetails: Array<{ id: string; vietnamese_text?: string; english_text?: string; image_url?: string | null; topic?: string | null }> = []
      if (customFlashcardIds.length > 0) {
        try {
          customFlashcardDetails = await savedFlashcardsAPI.getCustomFlashcardsByIds(customFlashcardIds)
        } catch (err) {
          console.error('❌ Error fetching custom flashcard details:', err)
        }
      }

      // Step 3: Map saved flashcards with their details
      // For APP flashcards: match flashcard_id from saved_flashcards with id from FastAPI response
      // For CUSTOM flashcards: match flashcard_id (with 'custom_' prefix removed) with id from custom_flashcards table
      const savedFlashcardsWithDetails: SavedFlashcardDetails[] = savedCards.map((savedCard: any) => {
        if (savedCard.flashcard_type === 'APP') {
          // Match saved_flashcards.flashcard_id with FastAPI flashcard.id
          const detail = flashcardDetails.find((d: any) => d.id === savedCard.flashcard_id)
          
          if (!detail) {
            console.warn(`⚠️ No detail found for APP flashcard ID: ${savedCard.flashcard_id}`, {
              availableIds: flashcardDetails.map(d => d.id),
              searchingFor: savedCard.flashcard_id
            })
          }
          
          // Return saved flashcard with APP flashcard details merged
          return {
            ...savedCard,
            vietnamese: detail?.vietnamese || `App Card ${savedCard.flashcard_id?.slice(-4) || 'N/A'}`,
            english: Array.isArray(detail?.english) 
              ? detail.english 
              : (detail?.english ? [detail.english] : ['No translation available']),
            image_url: detail?.image_url || '/placeholder.svg',
            word_type: detail?.type || detail?.word_type || 'word',
            audio_url: detail?.audio_url || null,
            pronunciation: detail?.pronunciation || null,
          }
        } else {
          const cleanCustomId = savedCard.flashcard_id.replace('custom_', '')
          const customDetail = customFlashcardDetails.find(d => d.id === cleanCustomId)
          
          // Handle image URLs for custom flashcards
          let imageUrl = '/placeholder.svg'
          if (customDetail?.image_url) {
            console.log('🖼️ Processing image URL for custom flashcard:', {
              flashcardId: cleanCustomId,
              originalUrl: customDetail.image_url,
              isFullUrl: customDetail.image_url.startsWith('http')
            })
            
            // If it's already a full URL (Supabase storage), use it as is
            if (customDetail.image_url.startsWith('http')) {
              imageUrl = customDetail.image_url
              console.log('✅ Using full URL:', imageUrl)
            } else {
              // If it's a relative path, convert it to Supabase storage URL
              // Format: "flashcards/filename.png" -> "https://project.supabase.co/storage/v1/object/public/images/flashcards/filename.png"
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
              const bucketName = 'images'
              const cleanPath = customDetail.image_url.startsWith('/') 
                ? customDetail.image_url.slice(1) 
                : customDetail.image_url
              
              imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${cleanPath}`
              console.log('🔗 Converted to Supabase URL:', imageUrl)
            }
          } else {
            console.log('⚠️ No image URL for custom flashcard:', cleanCustomId)
          }
          
          return {
            ...savedCard,
            vietnamese_text: customDetail?.vietnamese_text || `Custom Card ${cleanCustomId.slice(-4)}`,
            english_text: customDetail?.english_text || 'Loading...',
            image_url: imageUrl,
            topic: customDetail?.topic || savedCard.topic,
          }
        }
      })

      console.log('✅ Processed saved flashcards with details:', savedFlashcardsWithDetails)
      return { items: savedFlashcardsWithDetails, nextCursor }
    } catch (error) {
      console.error('❌ Error loading saved flashcards:', error)
      throw error

    }
  }


  // Update state when data changes (replace deprecated onSuccess)
  useEffect(() => {
    if (data?.pages) {
      console.log('🔄 Data changed - Raw data:', data)
      console.log('🔄 Data changed - Pages count:', data.pages.length)
      const all = data.pages.flatMap((page: any) => page.items)
      console.log('🔄 Data changed - Flattened items count:', all.length)
      console.log('🔄 Data changed - First 3 items:', all.slice(0, 3))
      setSavedFlashcardsDetails(all)
    } else {
      console.log('⚠️ No data.pages available:', { data, hasData: !!data, hasPages: !!(data?.pages) })
    }
  }, [data])

  // Handle errors (replace deprecated onError)
  useEffect(() => {
    if (queryError) {
      console.error('❌ useInfiniteQuery error:', queryError)
      setError(queryError instanceof Error ? queryError.message : 'Failed to load saved flashcards')
    }
  }, [queryError])


  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetchingNextPage) {
        fetchNextPage()
      }
    }, { rootMargin: '300px' })

    io.observe(loadMoreRef.current)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
  /*

  const loadUserStats = async () => {
    try {
      const stats = await savedFlashcardsAPI.getUserStats()
      const userStats: UserStats = {
        appFlashcards: stats.appFlashcards,
        customFlashcards: stats.customFlashcards,
        subscription_type: 'FREE' // This would come from user profile/subscription info
      }
      setUserStats(userStats)
    } catch (err) {
      console.error('Failed to load user stats:', err)
      // Set default stats on error
      setUserStats({
        appFlashcards: 0,
        customFlashcards: 0,
        subscription_type: 'FREE'
      })

    }

    if (isAuthenticated && user) {
      loadAdditionalData()
    } else {
      console.log('⚠️ User not authenticated, skipping additional data load')
    }
  }, [user, isAuthenticated, isMounted])
  */


  const [topics, setTopics] = useState<FlashcardTopic[]>([])
  const [syncStatus, setSyncStatus] = useState<{
    needsSync: boolean
    unsyncedCount: number
  } | null>(null)

  const fetchTopics = async () => {
    try {
      console.log('🔄 Starting to fetch topics...')
      
      // MVP: Only get topics from custom_flashcards table (exclude APP flashcards)
      console.log('📚 Fetching custom topics...')
      const customTopics = await savedFlashcardsAPI.getCustomFlashcardTopics()
      console.log('✅ Custom topics fetched:', customTopics)
      
      // Set only custom topics (no APP topics for MVP)
      setTopics(customTopics)
      console.log('🎨 Topics loaded:', { customTopics: customTopics.length, total: customTopics.length })
    } catch (error) {
      console.error('❌ Error fetching topics:', error)
      toast.error('Failed to load topics')
    }
  }

  const checkAndSyncFlashcards = async () => {
    if (!user) return

    try {
      // Check if synchronization is needed
      const status = await checkSyncStatus(user.id)
      setSyncStatus(status)

      if (status.needsSync && status.unsyncedCount > 0) {
        console.log(`🔄 Found ${status.unsyncedCount} unsynced flashcards`)

        // Automatically sync the flashcards
        const result = await syncCustomFlashcardsToSaved(user.id)

        if (result.success && result.synced > 0) {
          toast.success(`Synchronized ${result.synced} custom flashcard${result.synced > 1 ? 's' : ''} to your collection`)

          // Data will be refreshed automatically via React Query


          // Update sync status
          const newStatus = await checkSyncStatus(user.id)
          setSyncStatus(newStatus)
        } else if (result.success && result.synced === 0) {
          console.log('✅ All custom flashcards are already synchronized')
        } else {
          console.error('❌ Sync failed:', result)
        }
      } else {
        console.log('✅ All custom flashcards are already synchronized')
      }
    } catch (error) {
      console.error('❌ Error during sync check:', error)
    }
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

    // Optimistically remove from UI and cache
    setSavedFlashcardsDetails(prev => prev.filter(f => f.id !== flashcardId))
    queryClient.setQueryData(['saved-flashcards'], (old: any) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          items: page.items.filter((f: any) => f.id !== flashcardId)
        }))
      }
    })

    // Set up the 5-second countdown (matching the UI display)
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

          console.log('📊 [Client] Server action result:', result)

          if (!result.success) {
            throw new Error(result.error || 'Failed to delete flashcard')
          }

          console.log('✅ [Client] Custom flashcard successfully deleted')
          toast.success("Custom flashcard deleted successfully")

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['saved-flashcards'] })
          queryClient.invalidateQueries({ queryKey: ['saved-flashcard-stats'] })
        } else {
          // Just unsave the flashcard (APP flashcard)
          console.log('🗑️ [Client] Calling unsaveAppFlashcard server action:', {
            savedFlashcardId: flashcard.id,
            flashcardType: flashcard.flashcard_type
          })

          // Call server action to unsave APP flashcard
          const result = await unsaveAppFlashcard(flashcard.id)

          console.log('📊 [Client] Server action result:', result)

          if (!result.success) {
            throw new Error(result.error || 'Failed to unsave flashcard')
          }

          console.log('✅ [Client] Flashcard successfully unsaved')
          toast.success("Flashcard removed from your collection")

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['saved-flashcards'] })
          queryClient.invalidateQueries({ queryKey: ['saved-flashcard-stats'] })
        }
      } catch (err) {
        console.error(`❌ [Client] Failed to ${actionType} flashcard:`, err)
        // Restore the flashcard on error
        setSavedFlashcardsDetails(prev => [...prev, flashcard])
        queryClient.setQueryData(['saved-flashcards'], (old: { pages: Array<{ items: SavedFlashcardDetails[]; nextCursor?: string }> } | undefined) => {
          if (!old) return old
          const pages = [...old.pages]
          pages[0] = { ...pages[0], items: [flashcard, ...pages[0].items] }
          return { ...old, pages }
        })
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

      // Restore the flashcard to UI and cache
      setSavedFlashcardsDetails(prev => [...prev, pendingUnsave.originalFlashcard])
      queryClient.setQueryData(['saved-flashcards'], (old: { pages: Array<{ items: SavedFlashcardDetails[]; nextCursor?: string }> } | undefined) => {
        if (!old) return old
        const pages = [...old.pages]
        pages[0] = { ...pages[0], items: [pendingUnsave.originalFlashcard, ...pages[0].items] }
        return { ...old, pages }
      })

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
    queryClient.setQueryData(['saved-flashcards'], (old: { pages: Array<{ items: SavedFlashcardDetails[]; nextCursor?: string }> } | undefined) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map((page: { items: SavedFlashcardDetails[]; nextCursor?: string }) => ({
          ...page,
          items: page.items.map((f: SavedFlashcardDetails) =>
            f.id === flashcardId ? { ...f, is_favorite: newFavoriteStatus } : f
          )
        }))
      }
    })

    try {
      const supabase = createClient()

      const updateQuery = supabase
        .from('saved_flashcards')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', savedCard.id)
        .eq('UserID', user?.id || '')  // Column name is UserID

      const { error: favoriteError } = await updateQuery

      if (favoriteError) {
        console.error('❌ Favorite update error:', favoriteError)
        throw favoriteError
      }

      console.log('✅ Favorite status updated successfully')

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['saved-flashcards'] })
    } catch (err) {
      console.error('❌ Failed to toggle favorite:', err)
      // Revert optimistic update on error
      setSavedFlashcardsDetails(prev =>
        prev.map(f =>
          f.id === flashcardId ? { ...f, is_favorite: savedCard.is_favorite } : f
        )
      )
      queryClient.setQueryData(['saved-flashcards'], (old: { pages: Array<{ items: SavedFlashcardDetails[]; nextCursor?: string }> } | undefined) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: { items: SavedFlashcardDetails[]; nextCursor?: string }) => ({
            ...page,
            items: page.items.map((f: SavedFlashcardDetails) =>
              f.id === flashcardId ? { ...f, is_favorite: savedCard.is_favorite } : f
            )
          }))
        }
      })
      toast.error("Failed to update favorite status. Please try again.")
    }
  }

  // Memoized filtered and sorted flashcards for better performance
  const filteredFlashcards = useMemo(() => {
    console.log('🔍 Filtering flashcards:', {
      total: savedFlashcardsDetails.length,
      searchTerm,
      selectedTopic,
      activeTab,
      firstCard: savedFlashcardsDetails[0]
    })

    const filtered = savedFlashcardsDetails.filter(flashcard => {
      const vietnameseText = flashcard.vietnamese || flashcard.vietnamese_text || ''
      const englishText = flashcard.english?.join(' ') || flashcard.english_text || ''

      const matchesSearch =
        vietnameseText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        englishText.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesTopic = selectedTopic === 'all' || flashcard.topic === selectedTopic

      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'app' && flashcard.flashcard_type === 'APP') ||
        (activeTab === 'custom' && flashcard.flashcard_type === 'CUSTOM') ||
        (activeTab === 'favorites' && flashcard.is_favorite)

      const result = matchesSearch && matchesTopic && matchesTab
      if (!result && savedFlashcardsDetails.length < 5) {
        console.log('❌ Filtered out card:', {
          id: flashcard.id,
          vietnamese: vietnameseText,
          english: englishText,
          type: flashcard.flashcard_type,
          topic: flashcard.topic,
          matchesSearch,
          matchesTopic,
          matchesTab
        })
      }

      return result
    })

    console.log('✅ Filtered result:', filtered.length, 'cards')
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

  // Debug logging (moved here after sortedFlashcards is defined)
  console.log('🔍 Debug Info:', {
    isMounted,
    isAuthenticated,
    user: !!user,
    userId: user?.id,
    queryLoading,
    queryError,
    dataPages: data?.pages?.length || 0,
    totalItems: savedFlashcardsDetails.length,
    filteredItems: filteredFlashcards.length,
    sortedItems: sortedFlashcards.length
  })

  const appFlashcards = useMemo(() => savedFlashcardsDetails.filter(f => f.flashcard_type === 'APP'), [savedFlashcardsDetails])
  const customFlashcards = useMemo(() => savedFlashcardsDetails.filter(f => f.flashcard_type === 'CUSTOM'), [savedFlashcardsDetails])
  const favoriteFlashcards = useMemo(() => savedFlashcardsDetails.filter(f => f.is_favorite), [savedFlashcardsDetails])

  // Transform userStats to match expected format
  const transformedUserStats: UserStats = {
    appFlashcards: (userStats as any)?.appFlashcards || 0,
    customFlashcards: (userStats as any)?.customFlashcards || 0,
    subscription_type: profile?.subscription_type || 'FREE'
  }

  const limits = (transformedUserStats.subscription_type === 'PLUS' || transformedUserStats.subscription_type === 'UNLIMITED') ? PLUS_LIMITS : FREE_LIMITS
  const isNearLimit = transformedUserStats && (
    transformedUserStats.appFlashcards >= limits.APP_FLASHCARDS * 0.8 ||
    transformedUserStats.customFlashcards >= limits.CUSTOM_FLASHCARDS * 0.8
  )

  // Don't render anything until mounted to prevent hydration issues
  if (!isMounted) {
    return null
  }

  return (
    <PageWithLoading isLoading={isLoading}>

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
                  {transformedUserStats.appFlashcards}/{limits.APP_FLASHCARDS === 999999 ? '∞' : limits.APP_FLASHCARDS}
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
                  {transformedUserStats.customFlashcards}/{limits.CUSTOM_FLASHCARDS === 999999 ? '∞' : limits.CUSTOM_FLASHCARDS}
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
      {transformedUserStats.subscription_type === 'FREE' && isNearLimit && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Crown className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">
                    You've used {transformedUserStats.appFlashcards}/{limits.APP_FLASHCARDS} App Flashcards and {transformedUserStats.customFlashcards}/{limits.CUSTOM_FLASHCARDS} Self-Created Flashcards
                  </p>
                  <p className="text-sm text-amber-700">Upgrade to Plus for unlimited access!</p>
                </div>
              </div>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to Plus
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {(error || queryError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-sm font-medium">
                Error: {error || (queryError instanceof Error ? queryError.message : 'Failed to load data')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search flashcards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.name}>
                      {topic.icon && <span className="mr-2">{topic.icon}</span>}
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Date Added (Newest)</SelectItem>
                  <SelectItem value="date_asc">Date Added (Oldest)</SelectItem>
                  <SelectItem value="alpha_asc">Alphabetical (A-Z)</SelectItem>
                  <SelectItem value="alpha_desc">Alphabetical (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different collections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            <Star className="h-4 w-4 mr-1" />
            Favorites ({favoriteFlashcards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">

          {/* Debug: Show if flashcards array is empty */}
          {sortedFlashcards.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No flashcards to display</p>
              <p className="text-sm text-gray-400 mt-2">
                Total in state: {savedFlashcardsDetails.length}, Filtered: {filteredFlashcards.length}
              </p>
            </div>
          ) : (
            <SavedFlashcardsList
              flashcards={sortedFlashcards}
              viewMode={viewMode}
              onUnsave={handleUnsaveFlashcard}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          {isFetchingNextPage && (
            viewMode === 'list' ? (
              <FlashcardListSkeleton count={6} />
            ) : (
              <FlashcardSkeleton count={6} />
            )
          )}
          <div ref={loadMoreRef} />
        </TabsContent>
      </Tabs>

      {sortedFlashcards.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No flashcards found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedTopic !== 'all'
                ? "Try adjusting your search or filters"
                : "Start building your flashcard collection"}
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Flashcard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
      <UnsaveConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false)
          setConfirmModalData(null)
        }}
        onConfirm={handleConfirmUnsave}
        flashcardText={confirmModalData?.flashcardText || ''}
        actionType={confirmModalData?.actionType || 'unsave'}
      />

      {/* Countdown Toast - positioned fixed */}
      {showCountdownToast && pendingUnsave && (
        <div className="fixed bottom-4 right-4 z-50">
          <CountdownToast
            message={`Flashcard "${pendingUnsave.originalFlashcard.vietnamese || pendingUnsave.originalFlashcard.vietnamese_text || 'Unknown'}" will be deleted`}
            duration={5}
            onUndo={handleUndoUnsave}
            onComplete={handleCountdownComplete}
            onDismiss={() => {
              setShowCountdownToast(false)
              if (pendingUnsave) {
                clearTimeout(pendingUnsave.timeoutId)
                setPendingUnsave(null)
              }
            }}
          />
        </div>
      )}
      </div>
    </PageWithLoading>
  )
}
