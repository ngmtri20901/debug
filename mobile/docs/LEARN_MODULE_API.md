# Learn Module - API Documentation

**Version:** 1.0.0
**Last Updated:** 2025-11-20

Complete API reference for all Learn module services, hooks, and utilities.

---

## Table of Contents

1. [Services](#services)
2. [Hooks](#hooks)
3. [Utilities](#utilities)
4. [Types](#types)
5. [Constants](#constants)

---

## Services

### Learn Service

Location: `src/features/learn/services/learnService.ts`

#### `getAllZones()`

Fetches all learning zones.

```typescript
function getAllZones(): Promise<Zone[]>
```

**Returns:** Array of Zone objects

**Example:**
```typescript
const zones = await getAllZones()
// [{ id: '1', zone_id: 'beginner', name: 'Beginner', level: 1, ... }]
```

---

#### `getZoneById(zoneId)`

Fetches a single zone by ID.

```typescript
function getZoneById(zoneId: number | string): Promise<Zone | null>
```

**Parameters:**
- `zoneId`: Zone ID (number or string)

**Returns:** Zone object or null if not found

---

#### `getTopicsByZone(zoneId)`

Fetches all topics within a zone.

```typescript
function getTopicsByZone(zoneId: number): Promise<Topic[]>
```

**Parameters:**
- `zoneId`: Zone ID (number)

**Returns:** Array of Topic objects

---

#### `getTopicBySlug(slug)`

Fetches a single topic by slug.

```typescript
function getTopicBySlug(slug: string): Promise<{ topic: Topic; zone: Zone } | null>
```

**Parameters:**
- `slug`: Topic slug (e.g., 'greetings')

**Returns:** Object with topic and zone, or null

---

#### `getLessonsByTopic(topicId)`

Fetches all lessons within a topic.

```typescript
function getLessonsByTopic(topicId: number): Promise<Lesson[]>
```

**Parameters:**
- `topicId`: Topic ID (number)

**Returns:** Array of Lesson objects sorted by order

---

#### `getLessonBySlugs(topicSlug, lessonSlug)`

Fetches a lesson with materials.

```typescript
function getLessonBySlugs(
  topicSlug: string,
  lessonSlug: string
): Promise<{
  lesson: Lesson
  topic: Topic
  materials: Material[]
} | null>
```

**Parameters:**
- `topicSlug`: Topic slug
- `lessonSlug`: Lesson slug

**Returns:** Object with lesson, topic, and materials

---

### Progress Service

Location: `src/features/learn/services/progressService.ts`

#### `getUserLessonProgress(userId, lessonId)`

Fetches user progress for a specific lesson.

```typescript
function getUserLessonProgress(
  userId: string,
  lessonId: number
): Promise<UserLessonProgress | null>
```

**Parameters:**
- `userId`: User ID
- `lessonId`: Lesson ID

**Returns:** UserLessonProgress object or null

---

#### `getUserTopicProgress(userId, topicId)`

Fetches all user progress for lessons in a topic.

```typescript
function getUserTopicProgress(
  userId: string,
  topicId: number
): Promise<UserLessonProgress[]>
```

**Returns:** Array of UserLessonProgress objects

---

#### `getZoneCompletionStats(params)`

Calculates zone completion statistics.

```typescript
function getZoneCompletionStats(params: {
  userId: string
  zoneLevel: number
}): Promise<ZoneCompletionStats>
```

**Returns:**
```typescript
{
  completed: number      // Number of completed topics
  total: number          // Total topics in zone
  percentage: number     // Completion percentage (0-100)
}
```

---

#### `getAllZonesProgressSummary(userId)`

Fetches progress summary for all zones.

```typescript
function getAllZonesProgressSummary(
  userId: string
): Promise<ZoneProgressSummary[]>
```

**Returns:** Array of zone progress summaries

---

### Practice Service

Location: `src/features/learn/services/practiceService.ts`

#### `getExerciseBySlugs(topicSlug, lessonSlug)`

Fetches exercise with parsed questions.

```typescript
function getExerciseBySlugs(
  topicSlug: string,
  lessonSlug: string
): Promise<Exercise | null>
```

**Parameters:**
- `topicSlug`: Topic slug
- `lessonSlug`: Lesson slug

**Returns:** Exercise object with questions array

---

#### `submitExerciseAttempt(params)`

Submits exercise attempt and awards rewards.

```typescript
function submitExerciseAttempt(params: {
  exerciseId: string
  topicSlug: string
  lessonSlug: string
  answers: QuestionAnswer[]
  score: number
  timeSpentSeconds: number
}): Promise<SubmitExerciseResponse>
```

**Returns:**
```typescript
{
  success: boolean
  lessonProgress: UserLessonProgress
  rewards: {
    coinsEarned: number
    xpEarned: number
  }
}
```

---

## Hooks

### useLearnData

Location: `src/features/learn/hooks/useLearnData.ts`

#### `useAllZones()`

React Query hook for fetching all zones.

```typescript
function useAllZones(): UseQueryResult<Zone[], Error>
```

**Returns:** React Query result object

**Example:**
```typescript
const { data: zones, isLoading, error, refetch } = useAllZones()
```

---

#### `useZone(zoneId)`

Hook for fetching a single zone.

```typescript
function useZone(zoneId: string): UseQueryResult<Zone | null, Error>
```

---

#### `useTopic(topicSlug)`

Hook for fetching topic with lessons.

```typescript
function useTopic(topicSlug: string): UseQueryResult<{
  topic: Topic
  zone: Zone
  lessons: Lesson[]
} | null, Error>
```

---

#### `useLesson(topicSlug, lessonSlug)`

Hook for fetching lesson with materials.

```typescript
function useLesson(
  topicSlug: string,
  lessonSlug: string
): UseQueryResult<{
  lesson: Lesson
  topic: Topic
  materials: Material[]
} | null, Error>
```

---

### useProgress

Location: `src/features/learn/hooks/useProgress.ts`

#### `useUserLessonProgress(lessonId)`

Hook for fetching lesson progress.

```typescript
function useUserLessonProgress(
  lessonId: number
): UseQueryResult<UserLessonProgress | null, Error>
```

---

#### `useZoneProgress(zoneId)`

Hook for fetching zone progress summary.

```typescript
function useZoneProgress(
  zoneId: number
): UseQueryResult<ZoneProgressSummary | null, Error>
```

---

#### `useAllZonesProgress()`

Hook for fetching all zones progress.

```typescript
function useAllZonesProgress(): UseQueryResult<ZoneProgressSummary[], Error>
```

---

### usePractice

Location: `src/features/learn/hooks/usePractice.ts`

#### `useExercise(topicSlug, lessonSlug)`

Hook for fetching exercise.

```typescript
function useExercise(
  topicSlug: string,
  lessonSlug: string
): UseQueryResult<Exercise | null, Error>
```

---

#### `useSubmitExercise()`

Mutation hook for submitting exercise.

```typescript
function useSubmitExercise(): UseMutationResult<
  SubmitExerciseResponse,
  Error,
  SubmitExerciseParams,
  unknown
>
```

**Example:**
```typescript
const submitMutation = useSubmitExercise()

const handleSubmit = async () => {
  await submitMutation.mutateAsync({
    exerciseId: exercise.id,
    topicSlug: 'greetings',
    lessonSlug: 'hello',
    answers: [],
    score: 85,
    timeSpentSeconds: 120,
  })
}
```

---

### useLessonUnlock

Location: `src/features/learn/hooks/useLessonUnlock.ts`

#### `useLessonUnlock(params)`

Hook for checking lesson unlock status.

```typescript
function useLessonUnlock(params: {
  userTier: SubscriptionTier | null
  isAuthenticated: boolean
  zoneLevel: number
  lessonSortOrder: number
  previousLessonId: number | null
  topicId: number
}): LessonUnlockStatus
```

**Returns:**
```typescript
{
  isUnlocked: boolean
  reason: string
  requiresAuth: boolean
  requiresUpgrade: boolean
}
```

---

#### `useTopicCompletion(topicId)`

Hook for topic completion stats.

```typescript
function useTopicCompletion(topicId: number): {
  completedLessons: number
  totalLessons: number
  percentage: number
}
```

---

### useExerciseSessionStore

Location: `src/features/learn/stores/exerciseSessionStore.ts`

Zustand store for exercise session state.

**State:**
```typescript
{
  exercise: Exercise | null
  currentQuestionIndex: number
  answers: Map<string, QuestionAnswer>
  progress: ExerciseProgress
  sessionStartTime: number | null
  questionStartTime: number | null
}
```

**Actions:**
```typescript
{
  startSession: (exercise: Exercise) => void
  endSession: () => void
  resetSession: () => void
  goToQuestion: (index: number) => void
  goToNextQuestion: () => void
  goToPreviousQuestion: () => void
  submitAnswer: (questionId: string, answer: any) => GradeResult
  getAnswer: (questionId: string) => QuestionAnswer | undefined
  getProgress: () => ExerciseProgress
  calculateResults: () => SessionResults
}
```

**Example:**
```typescript
const {
  exercise,
  currentQuestionIndex,
  submitAnswer,
  goToNextQuestion,
  calculateResults,
} = useExerciseSessionStore()

const handleSubmit = (answer: string) => {
  const grade = submitAnswer(currentQuestion.id, answer)
  if (grade.isCorrect) {
    goToNextQuestion()
  }
}
```

---

## Utilities

### Exercise Utils

Location: `src/features/learn/utils/exercise-utils.ts`

#### `gradeQuestion(question, userAnswer)`

Grades a question based on user answer.

```typescript
function gradeQuestion(
  question: Question,
  userAnswer: any
): GradeResult
```

**Returns:**
```typescript
{
  isCorrect: boolean
  score: number        // 0-100
  feedback?: string
  correctAnswer?: any
}
```

---

#### `saveExerciseSession(exerciseId, lessonSlug, session)`

Saves exercise session to AsyncStorage.

```typescript
async function saveExerciseSession(
  exerciseId: string,
  lessonSlug: string,
  session: Partial<ExerciseSession>
): Promise<void>
```

---

#### `loadExerciseSession(exerciseId, lessonSlug)`

Loads exercise session from AsyncStorage.

```typescript
async function loadExerciseSession(
  exerciseId: string,
  lessonSlug: string
): Promise<ExerciseSession | null>
```

---

### Lesson Unlock Logic

Location: `src/features/learn/utils/lesson-unlock-logic.ts`

#### `checkLessonUnlock(params)`

Checks if a lesson is unlocked for the user.

```typescript
function checkLessonUnlock(params: {
  userTier: SubscriptionTier | null
  isAuthenticated: boolean
  zoneLevel: number
  lessonSortOrder: number
  previousLessonProgress: UserLessonProgress | null
  completedTopicsInPreviousZone: number
  totalTopicsInPreviousZone: number
}): LessonUnlockStatus
```

**Unlock Rules:**
- **UNLIMITED**: All lessons unlocked
- **PLUS**: All zones unlocked, lessons unlock sequentially
- **FREE**: Must complete all topics in zone N to unlock zone N+1

---

### Animations

Location: `src/features/learn/utils/animations.ts`

#### Animation Presets

```typescript
AnimationPresets.correctAnswer    // Success pulse
AnimationPresets.incorrectAnswer  // Shake animation
AnimationPresets.cardEntrance     // Fade + scale in
AnimationPresets.rewardAppear     // Bounce animation
```

**Example:**
```typescript
import { shake, successPulse } from '@/features/learn/utils/animations'

// In animated component
if (isCorrect) {
  animatedValue.value = successPulse()
} else {
  animatedValue.value = shake()
}
```

---

### Performance

Location: `src/features/learn/utils/performance.ts`

#### `useDebounce(value, delay)`

Debounces a value.

```typescript
const debouncedSearch = useDebounce(searchTerm, 300)
```

---

#### `useThrottle(callback, delay)`

Throttles a function call.

```typescript
const throttledScroll = useThrottle(handleScroll, 100)
```

---

#### `useMemoizedSelector(data, selector, deps)`

Memoizes a selector function.

```typescript
const completed = useMemoizedSelector(
  lessons,
  (lessons) => lessons.filter(l => l.completed).length,
  []
)
```

---

#### `preloadImages(imageUrls)`

Preloads images for better performance.

```typescript
await preloadImages([
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
])
```

---

### Offline Support

Location: `src/features/learn/utils/offline.ts`

#### `useNetworkStatus()`

Hook for network status.

```typescript
const { isOffline, isConnected, connectionType } = useNetworkStatus()
```

---

#### `OfflineCache.set(key, data)`

Caches data locally.

```typescript
await OfflineCache.set('zones', zonesData)
```

---

#### `OfflineCache.get(key)`

Retrieves cached data.

```typescript
const cached = await OfflineCache.get<Zone[]>('zones')
```

---

#### `SyncQueue.enqueue(submission)`

Adds submission to sync queue.

```typescript
await SyncQueue.enqueue({
  type: 'exercise',
  data: { exerciseId, answers, score },
})
```

---

#### `syncPendingSubmissions(submitFn)`

Syncs all pending submissions.

```typescript
const { success, failed } = await syncPendingSubmissions(
  async (submission) => {
    await submitExerciseAttempt(submission.data)
  }
)
```

---

## Types

### Core Domain Types

Location: `src/features/learn/types/exercises.ts`

```typescript
interface Zone {
  id: string
  zone_id: ZoneId
  name: string
  level: number
  description: string
  sort_order: number
}

interface Topic {
  id: string
  zone_id: string
  slug: string
  name: string
  description: string
  sort_order: number
}

interface Lesson {
  id: string
  topic_id: string
  slug: string
  title: string
  description: string
  order: number
  estimated_time: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  is_premium: boolean
}

interface Material {
  id: string
  lesson_id: string
  type: 'dialogue' | 'vocabulary' | 'grammar' | 'image' | 'text'
  title?: string
  explanation?: string
  media_url?: string
  data?: any
  sort_order: number
}

interface UserLessonProgress {
  id: string
  user_id: string
  lesson_id: number
  topic_id: number
  best_score_percent: number
  total_attempts: number
  pass_threshold: number
  status: 'not_started' | 'in_progress' | 'passed'
  first_attempted_at: string | null
  last_attempted_at: string | null
  passed_at: string | null
}
```

---

### Question Types

Location: `src/features/learn/types/practice.ts`

```typescript
type QuestionType =
  | 'multiple-choice'
  | 'word-matching'
  | 'synonyms-matching'
  | 'choose-words'
  | 'error-correction'
  | 'grammar-structure'
  | 'dialogue-completion'
  | 'role-play'

interface Exercise {
  id: string
  lesson_id: string
  title: string
  description: string
  questions: Question[]
  pass_threshold: number
  estimated_time: number
}

interface Question {
  id: string
  type: QuestionType
  // ... type-specific fields
}
```

---

## Constants

### Zones

Location: `src/features/learn/constants/zones.ts`

```typescript
const ZONES: Record<ZoneId, ZoneDefinition> = {
  beginner: {
    id: 'beginner',
    level: 1,
    color: '#10B981',
    icon: '🌱',
    minAccuracy: 65,
  },
  // ... other zones
}
```

---

### Exercise Types

Location: `src/features/learn/constants/exerciseTypes.ts`

```typescript
const EXERCISE_TYPES: Record<QuestionType, ExerciseTypeConfig> = {
  'multiple-choice': {
    name: 'Multiple Choice',
    icon: '✓',
    difficulty: 'easy',
  },
  // ... other types
}
```

---

## Error Handling

### Service Errors

All service functions throw errors on failure:

```typescript
try {
  const zones = await getAllZones()
} catch (error) {
  console.error('Failed to fetch zones:', error)
  // Handle error
}
```

### React Query Errors

```typescript
const { data, error } = useAllZones()

if (error) {
  return <ErrorMessage error={error} />
}
```

### Error Boundary

```typescript
import { ErrorBoundary } from '@/features/learn/components'

<ErrorBoundary
  fallback={(error, resetError) => (
    <ErrorScreen error={error} onRetry={resetError} />
  )}
>
  <MyComponent />
</ErrorBoundary>
```

---

## Cache Configuration

### React Query Cache

```typescript
// Default cache times
{
  staleTime: 5 * 60 * 1000,    // 5 minutes
  gcTime: 10 * 60 * 1000,      // 10 minutes (garbage collection)
}
```

### API Cache

```typescript
// Cache TTLs
const CACHE_TTL = {
  ZONES: 30 * 60 * 1000,       // 30 minutes
  TOPICS: 30 * 60 * 1000,      // 30 minutes
  LESSONS: 15 * 60 * 1000,     // 15 minutes
  EXERCISES: 5 * 60 * 1000,    // 5 minutes
  PROGRESS: 2 * 60 * 1000,     // 2 minutes
}
```

---

**End of API Documentation**
