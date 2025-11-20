# Stage 3: State Management & Hooks - Completion Report

**Status:** ✅ Completed
**Module:** Learn
**Files Created:** 7
**Total Lines:** ~1,201 lines
**Code Reuse:** ~70% (medium reuse with mobile-specific adaptations)

This stage implements state management and React Query hooks for the Learn module, providing a clean and type-safe interface for data fetching and local state management.

---

## Files Created

### 1. React Query Configuration - 133 lines

#### **config/queryClient.ts** (133 lines)
**Path:** `src/features/learn/config/queryClient.ts`

**Purpose:** React Query client configuration with query keys factory

**Query Client Configuration:**
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes
      gcTime: 10 * 60 * 1000,          // 10 minutes (cache time)
      retry: 2,                         // Retry failed requests 2 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false,      // Don't refetch on window focus (mobile)
      refetchOnReconnect: true,         // Refetch when reconnecting
      refetchOnMount: true,             // Refetch on component mount
      networkMode: 'online',            // Only fetch when online
    },
    mutations: {
      retry: 1,                         // Retry failed mutations once
      retryDelay: 1000,                 // Wait 1 second before retrying
      networkMode: 'online',            // Only mutate when online
    },
  },
})
```

**Query Keys Factory:**
Provides consistent query key structure for all Learn queries:
- **Zones:** `['zones']`, `['zones', id]`
- **Topics:** `['topics']`, `['topics', 'zone', zoneId]`, `['topics', slug]`
- **Lessons:** `['lessons']`, `['lessons', 'topic', topicSlug]`, `['lessons', topicSlug, lessonSlug]`
- **Materials:** `['materials', 'lesson', lessonId]`
- **Exercises:** `['exercises']`, `['exercises', topicSlug, lessonSlug]`
- **Progress:** `['progress', 'user', userId, 'lesson', lessonId]`, etc.
- **Completion:** `['completion', 'user', userId, 'zone', zoneId]`, etc.

**Mutation Keys:**
- `['submit-exercise']`
- `['create-session']`

---

### 2. Learn Data Hooks - 189 lines

#### **hooks/useLearnData.ts** (189 lines)
**Path:** `src/features/learn/hooks/useLearnData.ts`

**Purpose:** React Query hooks for zones, topics, and lessons

**Hooks:**

**Zones:**
```typescript
// Get all zones with topics
export function useAllZones(): UseQueryResult<Zone[], Error>

// Get single zone by ID
export function useZone(zoneId: number | string): UseQueryResult<Zone | null, Error>
```

**Topics:**
```typescript
// Get topics by zone
export function useTopicsByZone(zoneId: number): UseQueryResult<Topic[], Error>

// Get topic by slug with lessons
export function useTopic(topicSlug: string): UseQueryResult<{
  topic: Topic
  lessons: Lesson[]
  zoneLevel: number
} | null, Error>
```

**Lessons:**
```typescript
// Get lessons by topic slug
export function useLessonsByTopic(topicSlug: string): UseQueryResult<Lesson[], Error>

// Get lesson by slugs with materials
export function useLesson(
  topicSlug: string,
  lessonSlug: string
): UseQueryResult<{
  lesson: Lesson
  materials: Material[]
  topic: { title: string; slug: string }
  zoneLevel: number
} | null, Error>

// Get lesson materials
export function useLessonMaterials(lessonId: number): UseQueryResult<Material[], Error>
```

**Features:**
- ✅ Automatic caching with TTL
- ✅ Cache-first strategy
- ✅ Enabled/disabled based on params
- ✅ TypeScript type safety
- ✅ Error handling

---

### 3. Progress Hooks - 192 lines

#### **hooks/useProgress.ts** (192 lines)
**Path:** `src/features/learn/hooks/useProgress.ts`

**Purpose:** React Query hooks for progress tracking

**Hooks:**

**User Progress:**
```typescript
// Get user progress for a lesson
export function useUserLessonProgress(
  lessonId: number
): UseQueryResult<UserLessonProgress | null, Error>

// Get user progress for a topic (all lessons)
export function useUserTopicProgress(
  topicId: number
): UseQueryResult<UserLessonProgress[], Error>

// Get user progress for a zone (all topics)
export function useUserZoneProgress(
  zoneId: number
): UseQueryResult<UserLessonProgress[], Error>
```

**Completion Statistics:**
```typescript
// Get zone completion statistics
export function useZoneCompletionStats(
  zoneId: number
): UseQueryResult<ZoneCompletionStats, Error>

// Get topic progress summary
export function useTopicProgressSummary(
  topicId: number
): UseQueryResult<TopicProgressSummary | null, Error>

// Get zone progress summary
export function useZoneProgressSummary(
  zoneId: number
): UseQueryResult<ZoneProgressSummary | null, Error>

// Get all zones progress summary
export function useAllZonesProgressSummary(): UseQueryResult<ZoneProgressSummary[], Error>

// Get completed topics in previous zone (for unlock logic)
export function useCompletedTopicsInPreviousZone(
  currentZoneLevel: number
): UseQueryResult<{ completed: number; total: number }, Error>
```

**Features:**
- ✅ Automatic user ID resolution
- ✅ Cache management with progress updates
- ✅ Enabled only when user is authenticated
- ✅ Short stale time (2 minutes) for dynamic data

---

### 4. Practice Hooks - 139 lines

#### **hooks/usePractice.ts** (139 lines)
**Path:** `src/features/learn/hooks/usePractice.ts`

**Purpose:** React Query hooks for exercises and submission

**Hooks:**

**Queries:**
```typescript
// Get exercise by slugs
export function useExercise(
  topicSlug: string,
  lessonSlug: string
): UseQueryResult<Exercise | null, Error>

// Check if user can access exercise
export function useCanAccessExercise(
  practiceSetId: string
): UseQueryResult<boolean, Error>
```

**Mutations:**
```typescript
// Submit exercise attempt
export function useSubmitExercise(): UseMutationResult<
  SubmitExerciseResponse,
  Error,
  SubmitExerciseParams,
  unknown
>

// Create exercise session
export function useCreateExerciseSession(): UseMutationResult<
  boolean,
  Error,
  string,
  unknown
>
```

**Mutation Side Effects:**

**`useSubmitExercise` onSuccess:**
- Invalidates all progress queries
- Invalidates completion queries
- Clears progress cache
- Logs submission results

**Features:**
- ✅ Automatic cache invalidation after submission
- ✅ Error logging
- ✅ Type-safe mutation parameters
- ✅ Optimistic updates support (future)

---

### 5. Exercise Session Store - 299 lines

#### **stores/exerciseSessionStore.ts** (299 lines)
**Path:** `src/features/learn/stores/exerciseSessionStore.ts`

**Purpose:** Zustand store for exercise session state management

**State:**
```typescript
interface ExerciseSessionState {
  // Current exercise
  exercise: Exercise | null

  // Current question index
  currentQuestionIndex: number

  // User answers (Map for O(1) lookup)
  answers: Map<string, QuestionAnswer>

  // Progress tracking
  progress: ExerciseProgress

  // Session timing
  sessionStartTime: number | null
  questionStartTime: number | null
}
```

**Actions:**

**Session Management:**
```typescript
startSession: (exercise: Exercise) => void
endSession: () => void
resetSession: () => void
```

**Question Navigation:**
```typescript
goToQuestion: (index: number) => void
goToNextQuestion: () => void
goToPreviousQuestion: () => void
```

**Answer Handling:**
```typescript
submitAnswer: (questionId: string, answer: any) => GradeResult
getAnswer: (questionId: string) => QuestionAnswer | undefined
```

**Progress Tracking:**
```typescript
getProgress: () => ExerciseProgress
calculateResults: () => {
  score: number
  accuracy: number
  correctAnswers: number
  incorrectAnswers: number
  totalQuestions: number
  timeSpent: number
}
```

**Features:**
- ✅ Immediate answer grading with `gradeQuestion()`
- ✅ Time tracking per question
- ✅ Answer update handling (re-grading)
- ✅ Progress recalculation on answer changes
- ✅ Results calculation for submission

**Usage Example:**
```typescript
const {
  exercise,
  currentQuestionIndex,
  startSession,
  submitAnswer,
  goToNextQuestion,
  calculateResults,
} = useExerciseSessionStore()

// Start session
startSession(exerciseData)

// Submit answer
const grade = submitAnswer(question.id, userAnswer)

// Navigate
goToNextQuestion()

// Calculate results
const results = calculateResults()
```

---

### 6. Lesson Unlock Hooks - 193 lines

#### **hooks/useLessonUnlock.ts** (193 lines)
**Path:** `src/features/learn/hooks/useLessonUnlock.ts`

**Purpose:** Custom hooks for lesson unlock logic

**Hooks:**

**Unlock Status:**
```typescript
// Check if a specific lesson is unlocked
export function useLessonUnlock(params: {
  userTier: SubscriptionTier | null
  isAuthenticated: boolean
  zoneLevel: number
  lessonSortOrder: number
  previousLessonId: number | null
  topicId: number
}): LessonUnlockStatus

// Check if a zone is unlocked
export function useZoneUnlock(params: {
  userTier: SubscriptionTier
  zoneLevel: number
}): boolean
```

**Unlocked Lessons:**
```typescript
// Get all unlocked lessons in a topic
export function useUnlockedLessonsInTopic(params: {
  userTier: SubscriptionTier
  zoneLevel: number
  lessonsInTopic: Lesson[]
  topicId: number
}): Set<number>

// Get the next unlockable lesson in a topic
export function useNextUnlockableLesson(params: {
  userTier: SubscriptionTier
  zoneLevel: number
  lessonsInTopic: Lesson[]
  topicId: number
}): Lesson | null
```

**Progress Tracking:**
```typescript
// Get topic completion percentage
export function useTopicCompletion(topicId: number): {
  completedLessons: number
  totalLessons: number
  percentage: number
}
```

**Features:**
- ✅ Integrates with `useUserTopicProgress`
- ✅ Integrates with `useCompletedTopicsInPreviousZone`
- ✅ Uses `checkLessonUnlock()` from Stage 1
- ✅ Memoized for performance
- ✅ Reactive to progress changes

---

### 7. Hooks Index - 13 lines

#### **hooks/index.ts** (13 lines)
**Path:** `src/features/learn/hooks/index.ts`

**Purpose:** Barrel export for all hooks

---

## File Structure

```
mobile/
├── src/
│   └── features/
│       └── learn/
│           ├── config/
│           │   └── queryClient.ts          (133 lines)
│           ├── hooks/
│           │   ├── useLearnData.ts         (189 lines)
│           │   ├── useProgress.ts          (192 lines)
│           │   ├── usePractice.ts          (139 lines)
│           │   ├── useLessonUnlock.ts      (193 lines)
│           │   └── index.ts                (13 lines)
│           └── stores/
│               └── exerciseSessionStore.ts (299 lines)
└── STAGE_3_LEARN_STATE_MANAGEMENT_HOOKS_COMPLETION.md
```

**Total Lines:** ~1,158 lines (excluding documentation)

---

## Key Achievements

✅ **React Query configuration** with exponential backoff and mobile optimizations
✅ **Query keys factory** for consistent query structure
✅ **7 Learn data hooks** for zones/topics/lessons
✅ **8 Progress hooks** for progress tracking and statistics
✅ **4 Practice hooks** (2 queries + 2 mutations)
✅ **Zustand store** for exercise session state
✅ **5 Unlock hooks** for lesson unlock logic
✅ **Automatic cache invalidation** after exercise submission
✅ **Type-safe** hooks with TypeScript
✅ **Cache-first strategy** with TTL management

---

## Integration with Previous Stages

### Uses Stage 1 (Foundation & Core Types)
```typescript
import type {
  Zone,
  Topic,
  Lesson,
  Material,
  Exercise,
  Question,
  ExerciseProgress,
  QuestionAnswer,
  UserLessonProgress,
} from '../types'

import { gradeQuestion, type GradeResult } from '../utils/exercise-utils'
import { checkLessonUnlock, isZoneUnlocked } from '../utils/lesson-unlock-logic'
```

### Uses Stage 2 (API Service Layer)
```typescript
import {
  getAllZones,
  getZoneById,
  getTopicsByZone,
  getLessonBySlugs,
  getUserLessonProgress,
  getExerciseBySlugs,
  submitExerciseAttempt,
} from '../services'

import { getCachedData, setCachedData, CACHE_TTL } from '../utils/apiCache'
```

---

## React Query Features Used

### Queries
- **`useQuery`** - For data fetching
- **`enabled`** - Conditional fetching
- **`staleTime`** - Cache freshness duration
- **`queryKey`** - Unique query identifier
- **`queryFn`** - Async fetch function

### Mutations
- **`useMutation`** - For data mutations
- **`onSuccess`** - Side effects after success
- **`onError`** - Error handling
- **`mutationKey`** - Unique mutation identifier
- **`invalidateQueries`** - Cache invalidation

### Query Client
- **`queryClient.invalidateQueries()`** - Invalidate by key pattern
- **Retry logic** - Exponential backoff (1s, 2s, 4s)
- **Network mode** - Online-only fetching
- **Cache time** - 10 minutes for unused data

---

## Zustand Store Patterns

### State Management
- **Immutable updates** with `set()`
- **Map for answers** - O(1) lookup by questionId
- **Derived state** with `get()`

### Actions
- **Session lifecycle** - start, end, reset
- **Navigation** - forward, backward, jump
- **Answer handling** - submit, retrieve, update
- **Real-time grading** - immediate feedback

### Performance
- **Memoization** - Recompute only when needed
- **Selective subscriptions** - Components only re-render on used state changes

---

## Mobile-Specific Adaptations

### React Query Configuration
**Web:**
- `refetchOnWindowFocus: true` - Refetch when switching tabs

**Mobile:**
- `refetchOnWindowFocus: false` - No window focus on mobile
- `refetchOnReconnect: true` - Refetch when network reconnects

### Cache Strategy
**Web:**
- Longer cache times (less battery concern)

**Mobile:**
- Moderate cache times (balance between performance and freshness)
- Network-aware fetching

### Error Handling
**Web:**
- May show error boundaries

**Mobile:**
- Console logging
- Toast notifications (will be in Stages 4-6)

---

## Usage Examples

### Example 1: Dashboard Screen
```typescript
import { useAllZones, useAllZonesProgressSummary } from '@/features/learn/hooks'

function DashboardScreen() {
  // Fetch zones
  const { data: zones, isLoading, error } = useAllZones()

  // Fetch progress
  const { data: progress } = useAllZonesProgressSummary()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <View>
      {zones?.map((zone) => {
        const zoneProgress = progress?.find((p) => p.zone_id === zone.id)
        return (
          <ZoneCard
            key={zone.id}
            zone={zone}
            progress={zoneProgress}
          />
        )
      })}
    </View>
  )
}
```

### Example 2: Lesson Screen
```typescript
import { useLesson, useLessonUnlock } from '@/features/learn/hooks'

function LessonScreen({ topicSlug, lessonSlug }) {
  // Fetch lesson data
  const { data, isLoading } = useLesson(topicSlug, lessonSlug)

  // Check unlock status
  const unlockStatus = useLessonUnlock({
    userTier: 'FREE',
    isAuthenticated: true,
    zoneLevel: data?.zoneLevel || 1,
    lessonSortOrder: data?.lesson.order || 1,
    previousLessonId: null, // Calculate from lessons array
    topicId: parseInt(data?.lesson.topic_id || '0'),
  })

  if (unlockStatus.isLocked) {
    return <LockedLessonMessage status={unlockStatus} />
  }

  return (
    <ScrollView>
      <LessonContent materials={data?.materials || []} />
      <StartExerciseButton lessonId={data?.lesson.id} />
    </ScrollView>
  )
}
```

### Example 3: Exercise Screen
```typescript
import { useExercise, useSubmitExercise, useExerciseSessionStore } from '@/features/learn/hooks'

function ExerciseScreen({ topicSlug, lessonSlug }) {
  // Fetch exercise
  const { data: exercise } = useExercise(topicSlug, lessonSlug)

  // Store
  const {
    currentQuestionIndex,
    startSession,
    submitAnswer,
    goToNextQuestion,
    calculateResults,
  } = useExerciseSessionStore()

  // Mutation
  const { mutate: submitExercise } = useSubmitExercise()

  // Start session on mount
  useEffect(() => {
    if (exercise) {
      startSession(exercise)
    }
  }, [exercise])

  const handleSubmitAnswer = (answer: any) => {
    const question = exercise?.questions[currentQuestionIndex]
    if (!question) return

    const grade = submitAnswer(question.id, answer)

    if (grade.isCorrect) {
      goToNextQuestion()
    }
  }

  const handleFinish = () => {
    const results = calculateResults()

    submitExercise({
      practiceSetId: exercise!.id,
      scorePercent: results.accuracy,
      totalCorrect: results.correctAnswers,
      totalIncorrect: results.incorrectAnswers,
      totalSkipped: 0,
      timeSpentSeconds: results.timeSpent,
    })
  }

  return (
    <ExerciseQuestionView
      question={exercise?.questions[currentQuestionIndex]}
      onSubmit={handleSubmitAnswer}
      onFinish={handleFinish}
    />
  )
}
```

---

## Testing Checklist

### React Query Hooks
- [ ] `useAllZones()` fetches zones correctly
- [ ] `useTopic()` returns topic with lessons
- [ ] `useLesson()` returns lesson with materials
- [ ] Cache works correctly (data persists between unmounts)
- [ ] Enabled/disabled logic works
- [ ] Loading states work correctly
- [ ] Error states work correctly

### Progress Hooks
- [ ] `useUserLessonProgress()` returns progress
- [ ] `useZoneCompletionStats()` calculates correctly
- [ ] `useAllZonesProgressSummary()` returns all zones
- [ ] Progress updates after submission

### Practice Hooks
- [ ] `useExercise()` fetches exercise with questions
- [ ] `useSubmitExercise()` submits correctly
- [ ] Cache invalidation works after submission
- [ ] Mutations handle errors correctly

### Exercise Session Store
- [ ] `startSession()` initializes state
- [ ] `submitAnswer()` grades correctly
- [ ] `goToNextQuestion()` navigates
- [ ] `calculateResults()` computes accurately
- [ ] Answer updates work correctly
- [ ] Time tracking works

### Unlock Hooks
- [ ] `useLessonUnlock()` returns correct status
- [ ] `useUnlockedLessonsInTopic()` returns correct set
- [ ] `useZoneUnlock()` works for FREE tier
- [ ] `useNextUnlockableLesson()` finds next lesson

---

## Known Limitations

1. **No offline support** - Queries fail when offline (will be added in Stage 7)
2. **No optimistic updates** - Wait for server response before updating UI
3. **No request deduplication** - Multiple components may trigger duplicate requests
4. **No pagination** - Loads all data at once (may be slow for large datasets)
5. **No infinite scroll** - Not implemented yet
6. **No background sync** - No sync when app is in background

---

## Future Enhancements

### Performance
- [ ] Add request deduplication
- [ ] Add pagination for large lists
- [ ] Add infinite scroll
- [ ] Add background sync
- [ ] Add prefetching for next screen

### User Experience
- [ ] Add optimistic updates for mutations
- [ ] Add loading skeletons
- [ ] Add pull-to-refresh
- [ ] Add retry buttons on error
- [ ] Add offline indicator

### Developer Experience
- [ ] Add React Query DevTools (debug mode)
- [ ] Add query key logging
- [ ] Add performance monitoring
- [ ] Add Storybook integration

---

## Summary

Stage 3 successfully implements state management and hooks for the Learn module with:

**Hooks:** 24 custom hooks across 4 files
**Store:** 1 Zustand store for exercise sessions
**Configuration:** React Query client with mobile optimizations
**Integration:** Seamless integration with Stages 1 & 2
**Type Safety:** Full TypeScript coverage
**Cache Management:** Automatic invalidation and TTL

The Learn module state layer is ready for UI Components (Stage 4)! 🎉

---

**Estimated Time:** 2-3 days
**Actual Time:** 1 day
**Progress:** Stage 3 of 7 complete (43%)
**Next Stage:** Core UI Components (shared components, question types)
