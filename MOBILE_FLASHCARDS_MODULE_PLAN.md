# React Native Mobile - Flashcards Module Detailed Plan
## Logic, Hooks, Services & Implementation Flow

**Module:** Flashcards
**Priority:** HIGHEST (Phase 1 of mobile development)
**Estimated Time:** 3-4 weeks

---

## 📐 Architecture Overview

### **Current Web Implementation (Reusable Logic)**

```
features/flashcards/
├── types/              # TypeScript interfaces (REUSE 100%)
├── services/           # API client layer (REUSE 95%)
├── hooks/              # React hooks (ADAPT for mobile)
├── utils/              # Helper functions (REUSE 100%)
├── actions/            # Server actions (ADAPT for mobile API)
└── components/         # UI components (REBUILD for RN)
```

**Key Principle:** Reuse all business logic, types, and API services. Only rebuild UI components for React Native.

---

## 🎯 Development Stages (6 Stages)

### **Stage 1: Foundation & Core Types** (Days 1-2)
**Goal:** Setup types, API client, and basic infrastructure

#### **Files to Reuse (Copy Directly from Web)**

1. **`types/flashcard.types.ts`** ✅ REUSE 100%
   ```typescript
   export interface FlashcardData {
     id: string
     vietnamese: string
     english: string[]
     type: string[] | string
     is_multiword: boolean
     is_multimeaning: boolean
     common_meaning: string
     vietnamese_sentence: string
     english_sentence: string
     topic: string[]
     is_common: boolean
     image_url: string | null
     audio_url: string | null
     pronunciation?: string
     // Saved metadata
     saved_id?: string
     saved_at?: string
     flashcard_type?: 'APP' | 'CUSTOM'
     tags?: string[]
     review_count?: number
     last_reviewed?: string
     notes?: string
     is_favorite?: boolean
   }

   export interface FlashcardTopic {
     id: string
     title: string
     description: string
     count: number
     imageUrl: string
   }

   export interface WordType {
     id: string
     name: string
     title: string
     description: string
     count: number
     imageUrl: string
   }

   export interface RandomFlashcardParams {
     count?: number
     commonWordsOnly?: boolean
   }
   ```
   **Purpose:** Define all data structures for flashcards, topics, and word types

   **Mobile Notes:** No changes needed, copy as-is

2. **`types/session.types.ts`** ✅ REUSE 100%
   ```typescript
   export interface SessionFilterRequest {
     topic?: string
     complexity?: string // all, simple, complex
     common_words_only?: boolean
     num_cards: number // 10-50
   }

   export interface SessionValidationResponse {
     available_count: number
     insufficient: boolean
     suggestions?: SuggestionOption[]
   }

   export interface SuggestionOption {
     id: string
     title: string
     description: string
     filters: SessionFilterRequest
     estimated_count: number
     impact: {
       removed_restrictions?: string[]
       expanded_complexity?: boolean
       expanded_topics?: boolean
       additional_count?: number
     }
   }
   ```
   **Purpose:** Types for custom review session validation and generation

   **Mobile Notes:** Essential for review session feature

3. **`utils/apiClient.ts`** ⚠️ ADAPT for React Native

   **Web version:**
   ```typescript
   export const apiRequest = async<T>(
     endpoint: string,
     options?: RequestInit
   ): Promise<T> => {
     const response = await fetch(
       `${process.env.REACT_APP_API_URL}${endpoint}`,
       {
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${token}`
         },
         ...options
       }
     )
     if (!response.ok) {
       throw new APIError(response.status, await response.text())
     }
     return response.json()
   }
   ```

   **Mobile adaptation:**
   ```typescript
   // mobile/src/features/flashcards/utils/apiClient.ts
   import Config from 'react-native-config' // or use @env
   import AsyncStorage from '@react-native-async-storage/async-storage'

   export const apiRequest = async<T>(
     endpoint: string,
     options?: RequestInit
   ): Promise<T> => {
     // Get token from AsyncStorage instead of localStorage
     const token = await AsyncStorage.getItem('auth_token')

     const response = await fetch(
       `${Config.API_URL}${endpoint}`, // Use react-native-config
       {
         headers: {
           'Content-Type': 'application/json',
           ...(token && { Authorization: `Bearer ${token}` })
         },
         ...options
       }
     )

     if (!response.ok) {
       throw new APIError(response.status, await response.text())
     }
     return response.json()
   }
   ```
   **Purpose:** Base API client for all flashcard requests

   **Mobile Changes:**
   - Replace `process.env` with `react-native-config`
   - Use `AsyncStorage` instead of `localStorage` for token
   - Same error handling logic

4. **`utils/transformers.ts`** ✅ REUSE 100%
   ```typescript
   export function transformBackendFlashcard(backend: any): FlashcardData {
     return {
       id: backend.id,
       vietnamese: backend.vietnamese,
       english: backend.english,
       type: backend.type,
       is_multiword: backend.is_multiword,
       is_multimeaning: backend.is_multimeaning,
       common_meaning: backend.common_meaning,
       vietnamese_sentence: backend.vietnamese_sentence,
       english_sentence: backend.english_sentence,
       topic: backend.topic,
       is_common: backend.common_class === "common",
       image_url: backend.image_url,
       audio_url: backend.audio_url,
       pronunciation: backend.pronunciation,
       // ... saved metadata
     }
   }

   export function transformBackendTopic(backend: BackendTopicResponse): FlashcardTopic {
     return {
       id: backend.id,
       title: backend.title,
       description: backend.description,
       count: backend.count,
       imageUrl: backend.imageUrl || "/placeholder.svg?height=200&width=400"
     }
   }
   ```
   **Purpose:** Transform backend API responses to frontend types

   **Mobile Notes:** No changes needed

---

### **Stage 2: API Service Layer** (Days 2-3)
**Goal:** Setup all API endpoints for flashcard operations

#### **Files to Reuse**

1. **`services/flashcardService.ts`** ✅ REUSE 95%

   **Complete API Methods (25+ endpoints):**

   ```typescript
   export const flashcardAPI = {
     // === BROWSE & DISCOVERY ===

     // Get random flashcards (CORE - Daily practice)
     async getRandomFlashcards({ count = 20, commonWordsOnly = false }): Promise<FlashcardData[]>
     // 📱 Mobile: Used for daily flashcard deck

     // Search flashcards by query
     async searchFlashcards(query: string, limit = 50): Promise<FlashcardData[]>
     // 📱 Mobile: SearchBar component

     // Get all topics (Food, Travel, Business, etc.)
     async getAllTopics(complexity?: string): Promise<FlashcardTopic[]>
     // 📱 Mobile: Browse by topic screen

     // Get flashcards by topic with pagination
     async getFlashcardsByTopic(topicId: string, complexity?: string, skip = 0, limit = 20):
       Promise<{flashcards: FlashcardData[], total: number, hasMore: boolean}>
     // 📱 Mobile: Topic detail screen with infinite scroll

     // Get all word types (Verb, Noun, Adjective, etc.)
     async getAllWordTypes(complexity?: string): Promise<WordType[]>
     // 📱 Mobile: Browse by word type screen

     // Get flashcards by word type
     async getFlashcardsByType(wordType: string, complexity?: string): Promise<FlashcardData[]>
     // 📱 Mobile: Word type detail screen

     // === SPECIAL CATEGORIES ===

     // Get multi-word expression flashcards
     async getMultiwordFlashcards(complexity?: string): Promise<FlashcardData[]>
     // 📱 Mobile: Special category

     // Get multi-meaning flashcards
     async getMultimeaningFlashcards(complexity?: string): Promise<FlashcardData[]>
     // 📱 Mobile: Special category

     // === COMPLEXITY FILTERS ===

     // Get flashcards by complexity (simple/complex)
     async getFlashcardsByComplexity(complexity: string, skip = 0, limit = 100): Promise<FlashcardData[]>

     // Get complexity counts for filtering UI
     async getComplexityCounts(): Promise<{all: number, simple: number, complex: number}>

     // === SAVED FLASHCARDS ===

     // Get user's saved flashcards
     async getSavedFlashcards(userId: string): Promise<{flashcards: FlashcardData[], total: number}>
     // 📱 Mobile: Saved cards screen

     // Get saved count (for badge display)
     async getSavedFlashcardsCount(userId: string): Promise<{count: number}>

     // Get flashcards by array of IDs
     async getFlashcardsByIds(flashcardIds: string[]): Promise<FlashcardData[]>
     // 📱 Mobile: Bulk fetch for review session

     // === SINGLE CARD ===

     // Get single flashcard by ID
     async getFlashcardById(id: string): Promise<FlashcardData>

     // Get flashcard audio URL (TTS)
     async getFlashcardAudio(flashcardId: string):
       Promise<{flashcard_id: string, audio_url: string | null, vietnamese: string}>
     // 📱 Mobile: Audio playback
   }
   ```

   **Purpose:** Complete API service layer for all flashcard operations

   **Mobile Changes:**
   - No logic changes needed
   - All endpoints use `apiRequest` which was already adapted in Stage 1
   - Pagination support built-in for mobile infinite scroll

2. **`services/sessions.ts`** ✅ REUSE 95%

   ```typescript
   class SessionAPI {
     // Validate session filters before creating review session
     async validateSessionFilters(
       filters: SessionFilterRequest,
       userId?: string
     ): Promise<SessionValidationResponse>
     // 📱 Mobile: Check if enough cards available
     // Shows suggestions if insufficient

     // Generate flashcards for custom session
     async generateSessionCards(
       request: SessionGenerationRequest
     ): Promise<SessionGenerationResponse>
     // 📱 Mobile: Create review session with filters

     // Helper to build filters from form
     buildFiltersFromForm(formData: {...}): SessionFilterRequest

     // Format suggestion for display
     formatSuggestionForDisplay(suggestion: SuggestionOption): string
   }

   export const sessionAPI = new SessionAPI()
   ```

   **Purpose:** Custom review session creation with validation

   **Mobile Notes:** Essential for "Custom Review" feature

3. **`services/statisticsService.ts`** ✅ REUSE 90%

   ```typescript
   // Record completed practice session
   export async function recordPracticeSession(
     sessionData: PracticeSessionData
   ): Promise<boolean>
   // 📱 Mobile: Call after review session completes
   // Updates: total cards reviewed, accuracy, streak, time spent

   // Get quick stats for dashboard
   export async function getUserQuickStats(): Promise<UserStatistics | null>
   // Returns: totalCardsReviewed, accuracyRate, currentStreak, totalTimeMinutes
   // 📱 Mobile: Profile screen summary

   // Get detailed stats with date range
   export async function getUserDetailedStats(
     daysBack: number = 30
   ): Promise<DetailedStatistics[] | null>
   // 📱 Mobile: Statistics screen with charts

   // Get user's current streak
   export async function getUserStreak(): Promise<number>
   // 📱 Mobile: Streak counter display

   // Export stats as CSV (Premium feature)
   export async function exportStatisticsCSV(
     daysBack: number = 30
   ): Promise<string | null>
   // 📱 Mobile: Export to file system
   ```

   **Purpose:** Track learning progress and statistics

   **Mobile Changes:**
   - Add in-memory cache (5min TTL) - same as web
   - Replace Supabase client with mobile version

---

### **Stage 3: Data Utilities & Caching** (Day 3)
**Goal:** Setup caching, storage, and helper utilities

#### **Files to Reuse**

1. **`utils/daily-cache.ts`** ⚠️ ADAPT for AsyncStorage

   **Web version (localStorage):**
   ```typescript
   export function saveDailyFlashcards(flashcards: FlashcardData[]): void {
     const timezone = getUserTimezone()
     const today = getTodayDateString(timezone)
     const expiry = getEndOfDayTimestamp(timezone)

     localStorage.setItem(FLASHCARDS_CACHE_KEY, JSON.stringify({
       flashcards,
       date: today,
       expiry,
       timezone
     }))
   }

   export function loadDailyFlashcards(): FlashcardData[] | null {
     const cached = localStorage.getItem(FLASHCARDS_CACHE_KEY)
     if (!cached) return null

     const { flashcards, date, expiry } = JSON.parse(cached)
     const today = getTodayDateString(getUserTimezone())

     if (date === today && Date.now() < expiry) {
       return flashcards
     }

     localStorage.removeItem(FLASHCARDS_CACHE_KEY)
     return null
   }
   ```

   **Mobile version (AsyncStorage):**
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage'

   export async function saveDailyFlashcards(flashcards: FlashcardData[]): Promise<void> {
     const timezone = getUserTimezone()
     const today = getTodayDateString(timezone)
     const expiry = getEndOfDayTimestamp(timezone)

     await AsyncStorage.setItem(FLASHCARDS_CACHE_KEY, JSON.stringify({
       flashcards,
       date: today,
       expiry,
       timezone
     }))
   }

   export async function loadDailyFlashcards(): Promise<FlashcardData[] | null> {
     const cached = await AsyncStorage.getItem(FLASHCARDS_CACHE_KEY)
     if (!cached) return null

     const { flashcards, date, expiry } = JSON.parse(cached)
     const today = getTodayDateString(getUserTimezone())

     if (date === today && Date.now() < expiry) {
       return flashcards
     }

     await AsyncStorage.removeItem(FLASHCARDS_CACHE_KEY)
     return null
   }

   // Helper functions (REUSE 100%)
   export function getUserTimezone(): string
   export function getTodayDateString(timezone: string): string
   export function getEndOfDayTimestamp(timezone: string): number
   ```

   **Purpose:** Cache daily flashcards to avoid refetching

   **Mobile Changes:**
   - Convert all localStorage → AsyncStorage (sync → async)
   - Keep same expiry logic (end of day in user's timezone)

2. **Audio Service** 🆕 NEW for Mobile

   ```typescript
   // mobile/src/features/flashcards/services/audioService.ts
   import Sound from 'react-native-sound'
   import { flashcardAPI } from './flashcardService'

   class AudioService {
     private currentSound: Sound | null = null
     private audioCache = new Map<string, Sound>()

     // Play Vietnamese pronunciation
     async playPronunciation(flashcardId: string, vietnamese: string): Promise<void> {
       // Check cache first
       if (this.audioCache.has(flashcardId)) {
         const sound = this.audioCache.get(flashcardId)!
         sound.play()
         return
       }

       // Fetch audio URL from backend
       const { audio_url } = await flashcardAPI.getFlashcardAudio(flashcardId)

       if (!audio_url) {
         // Fallback to TTS if no audio
         await this.playTTS(vietnamese)
         return
       }

       // Load and play audio
       const sound = new Sound(audio_url, '', (error) => {
         if (error) {
           console.error('Failed to load audio:', error)
           return
         }
         sound.play()
         this.audioCache.set(flashcardId, sound)
       })

       this.currentSound = sound
     }

     // Text-to-Speech fallback
     async playTTS(text: string): Promise<void> {
       // Use TTS API endpoint
       const response = await fetch('/api/flashcards/tts', {
         method: 'POST',
         body: JSON.stringify({ text, language: 'vi' })
       })
       const { audio_url } = await response.json()

       const sound = new Sound(audio_url, '', (error) => {
         if (!error) sound.play()
       })
     }

     // Stop current audio
     stop(): void {
       if (this.currentSound) {
         this.currentSound.stop()
       }
     }

     // Release resources
     release(): void {
       this.audioCache.forEach(sound => sound.release())
       this.audioCache.clear()
     }
   }

   export const audioService = new AudioService()
   ```

   **Purpose:** Handle audio playback for pronunciation

   **Libraries:** `react-native-sound` or `expo-av`

---

### **Stage 4: React Hooks Layer** (Days 4-6)
**Goal:** Implement all custom hooks for state management

#### **Hooks to Implement**

1. **`hooks/useRandomFlashcards.ts`** ⚠️ ADAPT (Remove web-specific)

   **Web version:**
   ```typescript
   export function useRandomFlashcards(params: UseRandomFlashcardsParams = {}): UseRandomFlashcardsReturn {
     const { count = 20, commonWordsOnly = false } = params
     const [data, setData] = useState<FlashcardData[] | undefined>(undefined)
     const [isLoading, setIsLoading] = useState(true)
     const [error, setError] = useState<Error | null>(null)

     const fetchFlashcards = useCallback(async () => {
       setIsLoading(true)
       try {
         const result = await flashcardAPI.getRandomFlashcards({ count, commonWordsOnly })
         setData(result)
       } catch (err) {
         setError(err instanceof Error ? err : new Error('Failed to fetch'))
       } finally {
         setIsLoading(false)
       }
     }, [count, commonWordsOnly])

     useEffect(() => {
       fetchFlashcards()
     }, [fetchFlashcards])

     const refetch = useCallback(async () => {
       return await fetchFlashcards()
     }, [fetchFlashcards])

     return { data, isLoading, refetch, error }
   }
   ```

   **Mobile version (with cache):**
   ```typescript
   export function useRandomFlashcards(params: UseRandomFlashcardsParams = {}): UseRandomFlashcardsReturn {
     const { count = 20, commonWordsOnly = false } = params
     const [data, setData] = useState<FlashcardData[] | undefined>(undefined)
     const [isLoading, setIsLoading] = useState(true)
     const [error, setError] = useState<Error | null>(null)

     const fetchFlashcards = useCallback(async () => {
       setIsLoading(true)
       try {
         // Check cache first (mobile optimization)
         const cached = await loadDailyFlashcards()
         if (cached && cached.length >= count) {
           setData(cached.slice(0, count))
           setIsLoading(false)
           return { data: cached.slice(0, count) }
         }

         // Fetch from API
         const result = await flashcardAPI.getRandomFlashcards({ count, commonWordsOnly })
         setData(result)

         // Save to cache
         await saveDailyFlashcards(result)

         return { data: result }
       } catch (err) {
         setError(err instanceof Error ? err : new Error('Failed to fetch'))
         return { data: undefined }
       } finally {
         setIsLoading(false)
       }
     }, [count, commonWordsOnly])

     useEffect(() => {
       fetchFlashcards()
     }, [fetchFlashcards])

     const refetch = useCallback(async () => {
       return await fetchFlashcards()
     }, [fetchFlashcards])

     return { data, isLoading, refetch, error }
   }
   ```

   **Purpose:** Fetch random flashcards for daily practice

   **Mobile Optimizations:**
   - Add AsyncStorage cache check first
   - Only fetch from API if cache miss or insufficient cards
   - Auto-save to cache after fetch

2. **`hooks/useSavedFlashcards.ts`** ⚠️ ADAPT for Mobile Supabase

   **Core Logic (Same):**
   ```typescript
   export function useSavedFlashcards() {
     const [savedCards, setSavedCards] = useState<Set<string>>(new Set())
     const [loading, setLoading] = useState(false)

     // Load saved cards on mount
     useEffect(() => {
       const loadSavedCards = async () => {
         const supabase = createClient() // Mobile Supabase client
         const { data: { user } } = await supabase.auth.getUser()
         if (!user) return

         setLoading(true)

         const { data: savedFlashcards, error } = await supabase
           .from('saved_flashcards')
           .select('flashcard_id')
           .eq('UserID', user.id)
           .eq('flashcard_type', 'APP')

         if (savedFlashcards) {
           const ids = savedFlashcards.map(sf => sf.flashcard_id)
           setSavedCards(new Set(ids))

           // Sync to AsyncStorage as backup
           await AsyncStorage.setItem(`saved_flashcards_${user.id}`, JSON.stringify(ids))
         }

         setLoading(false)
       }

       loadSavedCards()
     }, [])

     // Toggle save/unsave
     const toggleSave = useCallback(async (flashcardId: string, topic?: string) => {
       const supabase = createClient()
       const { data: { user } } = await supabase.auth.getUser()
       if (!user) {
         // Show login toast
         return false
       }

       setLoading(true)

       const isSaved = savedCards.has(flashcardId)

       if (isSaved) {
         // Remove from DB
         await supabase
           .from('saved_flashcards')
           .delete()
           .eq('UserID', user.id)
           .eq('flashcard_id', flashcardId)

         // Update local state
         setSavedCards(prev => {
           const next = new Set(prev)
           next.delete(flashcardId)
           return next
         })
       } else {
         // Add to DB
         await supabase
           .from('saved_flashcards')
           .insert({
             UserID: user.id,
             flashcard_id: flashcardId,
             flashcard_type: 'APP',
             topic: topic || null,
             saved_at: new Date().toISOString()
           })

         // Update local state
         setSavedCards(prev => {
           const next = new Set(prev)
           next.add(flashcardId)
           return next
         })
       }

       setLoading(false)
       return true
     }, [savedCards])

     const isFlashcardSaved = useCallback((flashcardId: string): boolean => {
       return savedCards.has(flashcardId)
     }, [savedCards])

     return { savedCards, toggleSave, isFlashcardSaved, loading }
   }
   ```

   **Purpose:** Manage saved flashcards (save/unsave)

   **Mobile Changes:**
   - Use mobile Supabase client
   - Sync to AsyncStorage as offline backup
   - Same optimistic updates logic

3. **`hooks/useFlashcardReview.ts`** ⚠️ ADAPT (Remove web-specific timers)

   **Core State Management:**
   ```typescript
   export const useFlashcardReview = ({
     cards,
     onSessionComplete,
     enableTimer = true
   }: UseFlashcardReviewProps) => {
     const [currentCardIndex, setCurrentCardIndex] = useState(0)
     const [isFlipped, setIsFlipped] = useState(false)
     const [timer, setTimer] = useState(reviewTimeSeconds)
     const [isTimerActive, setIsTimerActive] = useState(false)
     const [cardResults, setCardResults] = useState<CardResult[]>([])
     const [startTime, setStartTime] = useState<Date | null>(null)
     const [savedCards, setSavedCards] = useState<Set<string>>(new Set())

     // Timer countdown (1 second interval)
     useEffect(() => {
       if (!enableTimer || !isTimerActive || timer <= 0) return

       const intervalId = setInterval(() => {
         setTimer(prev => prev - 1)
       }, 1000)

       return () => clearInterval(intervalId)
     }, [enableTimer, isTimerActive, timer])

     // Auto-flip when timer reaches 0
     useEffect(() => {
       if (enableTimer && timer === 0 && isTimerActive) {
         setIsFlipped(true)
         setIsTimerActive(false)
         playFlipSound() // Mobile audio
       }
     }, [enableTimer, timer, isTimerActive])

     // Start new card
     const startNewCard = useCallback(() => {
       setIsFlipped(false)
       setTimer(reviewTimeSeconds)
       if (enableTimer) {
         setIsTimerActive(true)
       }
       setStartTime(new Date())
     }, [enableTimer, reviewTimeSeconds])

     // Handle card result (correct/incorrect/unsure)
     const handleCardResult = useCallback((result: 'correct' | 'incorrect' | 'unsure') => {
       // Play sound effect
       if (result === 'correct') playCorrectSound()
       else if (result === 'incorrect') playIncorrectSound()

       const timeSpent = Date.now() - (startTime?.getTime() || Date.now())
       const cardResult: CardResult = {
         cardId: cards[currentCardIndex].id,
         result,
         timeSpent
       }

       setCardResults(prev => [...prev, cardResult])

       // Move to next card or complete session
       if (currentCardIndex < cards.length - 1) {
         setCurrentCardIndex(prev => prev + 1)
       } else {
         onSessionComplete?.()
       }

       setIsTimerActive(false)
     }, [cards, currentCardIndex, startTime, onSessionComplete])

     // Manual flip
     const handleFlipCard = useCallback(() => {
       setIsFlipped(prev => {
         if (!prev) {
           playFlipSound()
           setIsTimerActive(false)
         }
         return !prev
       })
     }, [])

     // Get progress stats
     const getProgressStats = useCallback(() => {
       const correct = cardResults.filter(r => r.result === 'correct').length
       const incorrect = cardResults.filter(r => r.result === 'incorrect').length
       const unsure = cardResults.filter(r => r.result === 'unsure').length
       const total = cardResults.length

       return {
         correct,
         incorrect,
         unsure,
         total,
         remaining: cards.length - total,
         accuracy: total > 0 ? (correct / total) * 100 : 0
       }
     }, [cardResults, cards.length])

     const currentCard = cards[currentCardIndex] || null

     return {
       // State
       currentCard,
       currentCardIndex,
       isFlipped,
       timer,
       isTimerActive,
       cardResults,
       savedCards,
       startTime,

       // Actions
       handleCardResult,
       handleFlipCard,

       // Computed
       getProgressStats,
       hasMoreCards: currentCardIndex < cards.length - 1,
       progress: cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0
     }
   }
   ```

   **Purpose:** Manage review session state (card navigation, timer, results)

   **Mobile Changes:**
   - Remove web-specific tab visibility tracking
   - Use React Native Audio library for sounds
   - Same core logic for timer and progress

4. **`hooks/useSessionValidation.ts`** ✅ REUSE 100%

   ```typescript
   export const useSessionValidation = (): UseSessionValidationReturn => {
     const [isValidating, setIsValidating] = useState(false)
     const [validationResult, setValidationResult] = useState<SessionValidationResponse | null>(null)
     const [error, setError] = useState<string | null>(null)

     const validateSession = useCallback(async (
       filters: SessionFilterRequest,
       userId?: string
     ): Promise<SessionValidationResponse | null> => {
       setIsValidating(true)
       setError(null)

       try {
         const result = await sessionAPI.validateSessionFilters(filters, userId)
         setValidationResult(result)

         if (result.insufficient) {
           console.log(`⚠️ Insufficient cards: ${result.available_count}/${filters.num_cards}`)
           // Show suggestions modal
         }

         return result
       } catch (error) {
         setError(error.message)
         return null
       } finally {
         setIsValidating(false)
       }
     }, [])

     const clearValidation = useCallback(() => {
       setValidationResult(null)
       setError(null)
     }, [])

     return {
       isValidating,
       validationResult,
       validateSession,
       clearValidation,
       error
     }
   }
   ```

   **Purpose:** Validate custom review session before creation

   **Mobile Notes:** No changes needed, pure logic hook

5. **`hooks/useProgressiveSession.ts`** ✅ REUSE 100%

   ```typescript
   export const useProgressiveSession = (): UseProgressiveSessionReturn => {
     const [steps, setSteps] = useState<ProgressStep[]>([
       { id: 'validate', label: 'Validating session filters', status: 'pending' },
       { id: 'generate', label: 'Generating flashcards', status: 'pending' },
       { id: 'save', label: 'Creating session', status: 'pending' },
       { id: 'redirect', label: 'Preparing review interface', status: 'pending' }
     ])

     const updateStep = useCallback((stepId: string, status: StepStatus, description?: string) => {
       setSteps(prev => prev.map(step =>
         step.id === stepId ? { ...step, status, ...(description && { description }) } : step
       ))
     }, [])

     const hasError = steps.some(step => step.status === 'error')
     const isCompleted = steps.every(step => step.status === 'completed')

     return { steps, updateStep, hasError, isCompleted }
   }
   ```

   **Purpose:** Progressive loading UI for session creation

   **Mobile Notes:** Use for loading modal/screen

6. **New Mobile-Specific Hooks** 🆕

   **`hooks/useCardFlip.ts`** - Flip animation
   ```typescript
   import { useSharedValue, withTiming, interpolate } from 'react-native-reanimated'

   export const useCardFlip = () => {
     const flipValue = useSharedValue(0)

     const flip = useCallback(() => {
       flipValue.value = withTiming(flipValue.value === 0 ? 1 : 0, { duration: 300 })
     }, [])

     const frontRotation = interpolate(flipValue.value, [0, 1], [0, 180])
     const backRotation = interpolate(flipValue.value, [0, 1], [180, 360])

     return { flipValue, flip, frontRotation, backRotation }
   }
   ```

   **`hooks/useCardSwipe.ts`** - Swipe gestures
   ```typescript
   import { useSharedValue } from 'react-native-reanimated'
   import { Gesture } from 'react-native-gesture-handler'

   export const useCardSwipe = (onSwipeLeft: () => void, onSwipeRight: () => void) => {
     const translateX = useSharedValue(0)

     const panGesture = Gesture.Pan()
       .onUpdate((event) => {
         translateX.value = event.translationX
       })
       .onEnd((event) => {
         if (event.translationX < -100) {
           onSwipeLeft()
         } else if (event.translationX > 100) {
           onSwipeRight()
         }
         translateX.value = withTiming(0)
       })

     return { panGesture, translateX }
   }
   ```

---

### **Stage 5: Browse & Display Features** (Days 7-10)
**Goal:** Implement browse by topic, word type, search

#### **Screens & Logic**

1. **FlashcardBrowseScreen** - Main entry point

   **Data Fetching:**
   ```typescript
   const BrowseScreen = () => {
     // Fetch topics
     const { data: topics } = useQuery({
       queryKey: ['flashcards', 'topics'],
       queryFn: () => flashcardAPI.getAllTopics()
     })

     // Fetch word types
     const { data: wordTypes } = useQuery({
       queryKey: ['flashcards', 'wordTypes'],
       queryFn: () => flashcardAPI.getAllWordTypes()
     })

     // Fetch complexity counts
     const { data: complexityCounts } = useQuery({
       queryKey: ['flashcards', 'complexityCounts'],
       queryFn: () => flashcardAPI.getComplexityCounts()
     })

     return (
       <ScrollView>
         {/* Topic Grid */}
         <TopicGrid topics={topics} onTopicPress={(id) => navigate('TopicDetail', { topicId: id })} />

         {/* Word Type Grid */}
         <WordTypeGrid wordTypes={wordTypes} onTypePress={(id) => navigate('WordTypeDetail', { typeId: id })} />

         {/* Complexity Filter */}
         <ComplexityFilter counts={complexityCounts} onSelect={(complexity) => setFilter(complexity)} />
       </ScrollView>
     )
   }
   ```

   **Flow:**
   1. User opens Browse screen
   2. Fetch topics + word types + complexity counts (parallel)
   3. Display in grid layout
   4. On tap → Navigate to detail screen

2. **TopicDetailScreen** - Flashcards by topic

   **Infinite Scroll with Pagination:**
   ```typescript
   const TopicDetailScreen = ({ route }) => {
     const { topicId } = route.params
     const [flashcards, setFlashcards] = useState<FlashcardData[]>([])
     const [page, setPage] = useState(0)
     const [hasMore, setHasMore] = useState(true)
     const [loading, setLoading] = useState(false)

     const loadMore = async () => {
       if (loading || !hasMore) return

       setLoading(true)
       const skip = page * 20
       const { flashcards: newCards, hasMore: more } = await flashcardAPI.getFlashcardsByTopic(
         topicId,
         complexityFilter,
         skip,
         20
       )

       setFlashcards(prev => [...prev, ...newCards])
       setHasMore(more)
       setPage(prev => prev + 1)
       setLoading(false)
     }

     useEffect(() => {
       loadMore()
     }, [])

     return (
       <FlatList
         data={flashcards}
         renderItem={({ item }) => <FlashcardCard data={item} />}
         onEndReached={loadMore}
         onEndReachedThreshold={0.5}
         ListFooterComponent={loading ? <Spinner /> : null}
       />
     )
   }
   ```

   **Flow:**
   1. User taps topic from browse screen
   2. Load first 20 flashcards
   3. Display in FlatList
   4. On scroll to bottom → Load next 20
   5. Repeat until `hasMore = false`

3. **SearchScreen** - Search flashcards

   **Debounced Search:**
   ```typescript
   import { useDebounce } from '@/shared/hooks/useDebounce'

   const SearchScreen = () => {
     const [query, setQuery] = useState('')
     const debouncedQuery = useDebounce(query, 500) // 500ms delay

     const { data: results, isLoading } = useQuery({
       queryKey: ['flashcards', 'search', debouncedQuery],
       queryFn: () => flashcardAPI.searchFlashcards(debouncedQuery, 50),
       enabled: debouncedQuery.length >= 2
     })

     return (
       <View>
         <SearchBar
           placeholder="Search Vietnamese or English..."
           value={query}
           onChangeText={setQuery}
         />

         {isLoading && <Spinner />}

         <FlatList
           data={results}
           renderItem={({ item }) => <FlashcardSearchResult data={item} />}
           ListEmptyComponent={<EmptyState message="No results found" />}
         />
       </View>
     )
   }
   ```

   **Flow:**
   1. User types in search bar
   2. Wait 500ms after last keystroke (debounce)
   3. Send API request if query >= 2 chars
   4. Display results
   5. On tap result → Show flashcard detail

---

### **Stage 6: Review Session Feature** (Days 11-14)
**Goal:** Full review session flow with timer, results, statistics

#### **Flow Diagram**

```
SessionConfig Screen (filters)
    ↓
  Validate filters (useSessionValidation)
    ↓
  [Insufficient cards?]
    ├─ Yes → Show suggestions modal
    │         → User selects suggestion
    │         → Re-validate
    └─ No → Generate session (sessionAPI.generateSessionCards)
              ↓
            Create session in DB (createReviewSession action)
              ↓
            Map cards to session (createSessionCardMappings action)
              ↓
            Navigate to ReviewScreen
              ↓
            Review cards one by one (useFlashcardReview)
              ├─ Flip card (manual or timer)
              ├─ Mark correct/incorrect/unsure
              ├─ Move to next card
              └─ Repeat until last card
                  ↓
                Complete session
                  ↓
                Record statistics (recordPracticeSession)
                  ↓
                Show summary modal
                  ├─ Accuracy: 85%
                  ├─ Time: 5min 23s
                  ├─ Correct: 17/20
                  └─ [Restart] [Return to Browse]
```

#### **Implementation**

1. **SessionConfigScreen** - Configure review session

   ```typescript
   const SessionConfigScreen = () => {
     const [filters, setFilters] = useState<SessionFilterRequest>({
       topic: undefined,
       complexity: 'all',
       common_words_only: false,
       num_cards: 10
     })

     const { validateSession, validationResult, isValidating } = useSessionValidation()
     const { steps, updateStep } = useProgressiveSession()
     const [showSuggestions, setShowSuggestions] = useState(false)

     const handleStartSession = async () => {
       // Step 1: Validate
       updateStep('validate', 'loading')
       const result = await validateSession(filters, userId)

       if (!result) {
         updateStep('validate', 'error', 'Validation failed')
         return
       }

       if (result.insufficient) {
         updateStep('validate', 'completed', `Only ${result.available_count} cards available`)
         setShowSuggestions(true)
         return
       }

       updateStep('validate', 'completed', `${result.available_count} cards available`)

       // Step 2: Generate flashcards
       updateStep('generate', 'loading')
       const sessionData = await sessionAPI.generateSessionCards({
         user_id: userId,
         filters,
         session_metadata: {}
       })
       updateStep('generate', 'completed', `${sessionData.actual_count} cards generated`)

       // Step 3: Save to DB
       updateStep('save', 'loading')
       const reviewSession = await createReviewSession({
         session_type: 'custom',
         total_cards: sessionData.actual_count,
         session_config: filters,
         filters_applied: sessionData.filters_applied
       })

       if (!reviewSession.success) {
         updateStep('save', 'error', reviewSession.error)
         return
       }

       // Map cards to session
       await createSessionCardMappings({
         session_id: reviewSession.data.id,
         flashcards: sessionData.flashcards
       })
       updateStep('save', 'completed', 'Session saved')

       // Step 4: Navigate to review
       updateStep('redirect', 'loading')
       navigate('ReviewSession', {
         sessionId: reviewSession.data.id,
         flashcards: sessionData.flashcards
       })
       updateStep('redirect', 'completed')
     }

     return (
       <View>
         {/* Filter inputs */}
         <TopicPicker value={filters.topic} onChange={(topic) => setFilters({...filters, topic})} />
         <ComplexityPicker value={filters.complexity} onChange={(c) => setFilters({...filters, complexity: c})} />
         <Switch label="Common words only" value={filters.common_words_only} onValueChange={(v) => setFilters({...filters, common_words_only: v})} />
         <Slider label="Number of cards" min={10} max={50} value={filters.num_cards} onChange={(n) => setFilters({...filters, num_cards: n})} />

         <Button title="Start Review" onPress={handleStartSession} loading={isValidating} />

         {/* Progressive loading modal */}
         <ProgressiveLoadingModal steps={steps} visible={steps.some(s => s.status === 'loading')} />

         {/* Insufficient cards modal */}
         <InsufficientCardsModal
           visible={showSuggestions}
           availableCount={validationResult?.available_count || 0}
           requestedCount={filters.num_cards}
           suggestions={validationResult?.suggestions || []}
           onSelectSuggestion={(suggestion) => {
             setFilters(suggestion.filters)
             setShowSuggestions(false)
           }}
           onClose={() => setShowSuggestions(false)}
         />
       </View>
     )
   }
   ```

2. **ReviewSessionScreen** - Review cards

   ```typescript
   const ReviewSessionScreen = ({ route }) => {
     const { flashcards } = route.params
     const [sessionComplete, setSessionComplete] = useState(false)

     const {
       currentCard,
       currentCardIndex,
       isFlipped,
       timer,
       handleCardResult,
       handleFlipCard,
       getProgressStats,
       progress
     } = useFlashcardReview({
       cards: flashcards,
       onSessionComplete: () => setSessionComplete(true),
       enableTimer: true
     })

     const handleComplete = async () => {
       const stats = getProgressStats()

       // Record to backend
       await recordPracticeSession({
         flashcardCount: flashcards.length,
         correctCount: stats.correct,
         timeMinutes: Math.round((Date.now() - sessionStartTime) / 60000),
         topics: [...new Set(flashcards.flatMap(f => f.topic))]
       })

       navigate('SessionSummary', { stats })
     }

     if (sessionComplete) {
       return <SessionSummaryModal stats={getProgressStats()} onClose={handleComplete} />
     }

     return (
       <View style={{ flex: 1 }}>
         {/* Progress bar */}
         <ProgressBar progress={progress} />

         {/* Timer */}
         {timer > 0 && <TimerDisplay seconds={timer} />}

         {/* Flashcard */}
         <FlashcardCard
           data={currentCard}
           isFlipped={isFlipped}
           onFlip={handleFlipCard}
         />

         {/* Controls */}
         {isFlipped && (
           <View style={styles.controls}>
             <Button title="❌ Incorrect" onPress={() => handleCardResult('incorrect')} color="red" />
             <Button title="🤔 Unsure" onPress={() => handleCardResult('unsure')} color="orange" />
             <Button title="✅ Correct" onPress={() => handleCardResult('correct')} color="green" />
           </View>
         )}
       </View>
     )
   }
   ```

---

### **Stage 7: Statistics Feature (Simplified)** (Days 15-16)
**Goal:** Display learning statistics with mobile-friendly charts

#### **Implementation**

```typescript
const StatisticsScreen = () => {
  const [timeRange, setTimeRange] = useState<7 | 30>(7) // 7 or 30 days

  // Fetch stats
  const { data: quickStats } = useQuery({
    queryKey: ['flashcards', 'stats', 'quick'],
    queryFn: () => getUserQuickStats()
  })

  const { data: detailedStats } = useQuery({
    queryKey: ['flashcards', 'stats', 'detailed', timeRange],
    queryFn: () => getUserDetailedStats(timeRange)
  })

  if (!quickStats || !detailedStats) {
    return <LoadingState />
  }

  // Prepare chart data
  const chartData = detailedStats.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    cardsReviewed: stat.flashcards_reviewed,
    accuracy: stat.accuracy_rate
  }))

  return (
    <ScrollView>
      {/* Summary cards */}
      <StatsSummaryCards
        totalCards={quickStats.totalCardsReviewed}
        accuracy={quickStats.accuracyRate}
        streak={quickStats.currentStreak}
        totalTime={quickStats.totalTimeMinutes}
      />

      {/* Time range selector */}
      <SegmentedControl
        values={['7 days', '30 days']}
        selectedIndex={timeRange === 7 ? 0 : 1}
        onChange={(index) => setTimeRange(index === 0 ? 7 : 30)}
      />

      {/* Charts (react-native-chart-kit) */}
      <LineChart
        data={{
          labels: chartData.map(d => d.date),
          datasets: [{
            data: chartData.map(d => d.cardsReviewed)
          }]
        }}
        width={Dimensions.get('window').width - 32}
        height={220}
        chartConfig={{
          backgroundColor: '#1e2923',
          backgroundGradientFrom: '#08130D',
          backgroundGradientTo: '#1e2923',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`
        }}
        bezier
        style={{ marginVertical: 8, borderRadius: 16 }}
      />

      {/* Accuracy chart */}
      <BarChart
        data={{
          labels: chartData.slice(-7).map(d => d.date),
          datasets: [{
            data: chartData.slice(-7).map(d => d.accuracy)
          }]
        }}
        width={Dimensions.get('window').width - 32}
        height={220}
        yAxisSuffix="%"
        chartConfig={{...}}
      />
    </ScrollView>
  )
}
```

**Libraries:** `react-native-chart-kit` (simpler than Recharts, mobile-optimized)

---

## 📦 Complete File Checklist

### **Types** ✅ Reuse 100%
- [x] `types/flashcard.types.ts` - All flashcard interfaces
- [x] `types/session.types.ts` - Review session types

### **Services** ✅ Reuse 95%
- [x] `services/flashcardService.ts` - API endpoints (25+ methods)
- [x] `services/sessions.ts` - Session validation & generation
- [x] `services/statisticsService.ts` - Stats tracking
- [ ] `services/audioService.ts` - 🆕 Audio playback (NEW)

### **Utils** ⚠️ Adapt for Mobile
- [x] `utils/apiClient.ts` - Base API client (adapt for RN)
- [x] `utils/transformers.ts` - Data transformers (no changes)
- [ ] `utils/daily-cache.ts` - localStorage → AsyncStorage
- [ ] `utils/storage.ts` - 🆕 AsyncStorage wrapper (NEW)

### **Hooks** ⚠️ Adapt for Mobile
- [ ] `hooks/useRandomFlashcards.ts` - Fetch random cards (add cache)
- [ ] `hooks/useSavedFlashcards.ts` - Save/unsave cards (mobile Supabase)
- [ ] `hooks/useFlashcardReview.ts` - Review session state (remove web-specific)
- [x] `hooks/useSessionValidation.ts` - Validate session (no changes)
- [x] `hooks/useProgressiveSession.ts` - Loading steps (no changes)
- [ ] `hooks/useCardFlip.ts` - 🆕 Flip animation (NEW)
- [ ] `hooks/useCardSwipe.ts` - 🆕 Swipe gestures (NEW)

### **Actions** ⚠️ Adapt for Mobile API
- [ ] `actions/review.ts` - Create review session (convert to mobile API call)
- [ ] `actions/create.ts` - Create custom flashcard (Phase 6)
- [ ] `actions/delete.ts` - Delete custom flashcard (Phase 6)
- [ ] `actions/unsave.ts` - Unsave flashcard (use hook instead)

---

## 🔄 Key Logic Flows

### **Flow 1: Daily Random Flashcards**
```
App Launch
  ↓
useRandomFlashcards({ count: 20, commonWordsOnly: true })
  ↓
Check AsyncStorage cache (loadDailyFlashcards)
  ├─ Cache hit (same day) → Return cached cards
  └─ Cache miss → Fetch from API
      ↓
    flashcardAPI.getRandomFlashcards()
      ↓
    transformBackendFlashcard() for each card
      ↓
    saveDailyFlashcards() to AsyncStorage
      ↓
    Return cards to UI
```

### **Flow 2: Save/Unsave Flashcard**
```
User taps heart icon
  ↓
useSavedFlashcards().toggleSave(flashcardId)
  ↓
Check if already saved (savedCards.has(id))
  ├─ Saved → Delete from Supabase + Update Set
  └─ Not saved → Insert to Supabase + Update Set
      ↓
    Optimistic update (UI shows immediately)
      ↓
    Sync to AsyncStorage as backup
      ↓
    Show toast notification
```

### **Flow 3: Custom Review Session**
```
User opens SessionConfig screen
  ↓
Select filters (topic, complexity, num_cards)
  ↓
Tap "Start Review"
  ↓
useSessionValidation().validateSession(filters)
  ↓
sessionAPI.validateSessionFilters() → POST /api/v1/flashcards/session/validate
  ↓
[Sufficient cards?]
  ├─ No → Show InsufficientCardsModal with suggestions
  │        → User selects suggestion
  │        → Re-validate with new filters
  └─ Yes → Continue
      ↓
    sessionAPI.generateSessionCards() → POST /api/v1/flashcards/session/generate
      ↓
    createReviewSession() → Insert to review_sessions table
      ↓
    createSessionCardMappings() → Insert to review_session_cards table
      ↓
    Navigate to ReviewSession screen with flashcards
      ↓
    useFlashcardReview() manages card-by-card review
      ↓
    User marks each card (correct/incorrect/unsure)
      ↓
    Session complete → recordPracticeSession()
      ↓
    Update statistics in DB
      ↓
    Show SessionSummaryModal
```

### **Flow 4: Browse by Topic**
```
User taps "Food" topic
  ↓
Navigate to TopicDetailScreen(topicId: 'food')
  ↓
Load first page:
  flashcardAPI.getFlashcardsByTopic('food', 'all', skip=0, limit=20)
  ↓
Display in FlatList
  ↓
User scrolls to bottom (onEndReached)
  ↓
Load next page:
  flashcardAPI.getFlashcardsByTopic('food', 'all', skip=20, limit=20)
  ↓
Append to existing flashcards
  ↓
Repeat until hasMore = false
```

### **Flow 5: Search Flashcards**
```
User types in SearchBar: "xin chào"
  ↓
useDebounce(query, 500ms)
  ↓
After 500ms idle:
  flashcardAPI.searchFlashcards("xin chào", limit=50)
  ↓
Display results in FlatList
  ↓
User taps result → Navigate to FlashcardDetail
```

---

## 🎯 Mobile-Specific Optimizations

### **1. Caching Strategy**
- **Daily flashcards:** Cache in AsyncStorage until end of day
- **Topics/Word types:** Cache for 1 hour
- **Saved card IDs:** Cache indefinitely, sync on changes
- **Statistics:** Cache for 5 minutes

### **2. Offline Support**
- Save last fetched flashcards to AsyncStorage
- Show cached data while refetching
- Queue save/unsave actions when offline
- Sync when connection restored

### **3. Performance**
- Use `FlatList` instead of `ScrollView` for long lists
- Implement `windowSize` for FlatList virtualization
- Lazy load images with `FastImage`
- Memoize expensive computations with `useMemo`

### **4. Native Features**
- Haptic feedback on card flip/result
- Native audio playback with background support
- Push notifications for daily reminders
- Share flashcards via native share sheet

---

## ✅ Success Criteria

### **Stage 1-3 (Foundation)** - Days 1-3
- [ ] All types, services, utils ported to mobile
- [ ] API client working with mobile Supabase
- [ ] AsyncStorage cache implemented

### **Stage 4 (Hooks)** - Days 4-6
- [ ] All hooks working on mobile
- [ ] Flip & swipe animations smooth
- [ ] Audio playback functional

### **Stage 5 (Browse)** - Days 7-10
- [ ] Browse by topic/word type working
- [ ] Search with debounce working
- [ ] Infinite scroll pagination working

### **Stage 6 (Review)** - Days 11-14
- [ ] Custom session creation working
- [ ] Review session with timer working
- [ ] Results recording to database
- [ ] Summary statistics displaying

### **Stage 7 (Statistics)** - Days 15-16
- [ ] Quick stats displaying
- [ ] Charts rendering correctly
- [ ] Export CSV working (premium)

---

**Total Lines of Reusable Code:** ~2,500 lines
**Total New Mobile Code:** ~1,500 lines
**Reuse Rate:** ~63%

**Estimated Timeline:** 16 days (3.2 weeks)

---

**Next Steps:**
1. Review this plan with team
2. Setup React Native project structure
3. Begin Stage 1 implementation
4. Daily progress tracking with commits

**Plan Version:** 1.0
**Created:** 2025-11-20
