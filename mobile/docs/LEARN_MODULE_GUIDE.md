# Learn Module - Developer Guide

**Version:** 1.0.0
**Last Updated:** 2025-11-20
**Module:** Mobile React Native - Vietnamese Language Learning

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Core Concepts](#core-concepts)
5. [Getting Started](#getting-started)
6. [Components](#components)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Navigation](#navigation)
10. [Offline Support](#offline-support)
11. [Performance](#performance)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)

---

## Overview

The Learn module is the core language learning experience in the Vietnamese Learning mobile app. It provides a structured learning path with:

- **6 Proficiency Zones** (Beginner → Expert)
- **Multiple Topics** per zone
- **Sequential Lessons** with materials and exercises
- **8 Question Types** for interactive practice
- **Progress Tracking** with coins and XP rewards
- **Offline Support** for cached lessons

### Key Features

✅ Zone-based learning progression
✅ Interactive exercises with real-time feedback
✅ Progress tracking and rewards
✅ Offline capability
✅ Tier-based content unlocking (FREE/PLUS/UNLIMITED)
✅ Performance optimized
✅ Type-safe with TypeScript

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Navigation Layer                      │
│              (React Navigation Stack)                    │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                     Screens Layer                        │
│  Dashboard → Topics → Lessons → Detail → Exercise       │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                   Components Layer                       │
│    Shared | Questions | Materials                       │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                State Management Layer                    │
│    React Query (Server) | Zustand (Client)              │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                   Services Layer                         │
│    Learn | Progress | Practice | Cache                  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│         Supabase (Remote) | AsyncStorage (Local)        │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action
    ↓
Screen Component
    ↓
React Query Hook
    ↓
Service Layer
    ↓
Supabase API
    ↓
Cache Layer (AsyncStorage)
    ↓
Component Re-render
```

---

## File Structure

```
mobile/src/features/learn/
├── components/
│   ├── shared/               # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Badge.tsx
│   │   ├── LockIcon.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── index.ts
│   ├── questions/            # Question type components
│   │   ├── MultipleChoiceQuestion.tsx
│   │   ├── WordMatchingQuestion.tsx
│   │   ├── ChooseWordsQuestion.tsx
│   │   ├── ErrorCorrectionQuestion.tsx
│   │   └── DialogueQuestion.tsx
│   ├── materials/            # Material display components
│   │   └── MaterialView.tsx
│   └── index.ts
├── config/
│   └── queryClient.ts        # React Query configuration
├── constants/
│   ├── zones.ts              # Zone definitions
│   └── exerciseTypes.ts      # Exercise type constants
├── hooks/
│   ├── useLearnData.ts       # Data fetching hooks
│   ├── useProgress.ts        # Progress tracking hooks
│   ├── usePractice.ts        # Exercise hooks
│   └── useLessonUnlock.ts    # Unlock logic hooks
├── navigation/
│   └── types.ts              # Navigation types
├── screens/
│   ├── LearnDashboardScreen.tsx
│   ├── TopicsListScreen.tsx
│   ├── LessonsListScreen.tsx
│   ├── LessonDetailScreen.tsx
│   ├── ExerciseSessionScreen.tsx
│   ├── ExerciseCompleteScreen.tsx
│   └── index.ts
├── services/
│   ├── learnService.ts       # Zones/Topics/Lessons API
│   ├── progressService.ts    # Progress tracking API
│   ├── practiceService.ts    # Exercise API
│   └── apiCache.ts           # In-memory cache
├── stores/
│   └── exerciseSessionStore.ts  # Zustand store
├── types/
│   ├── exercises.ts          # Domain types
│   ├── practice.ts           # Question types
│   ├── api.ts                # API types
│   └── index.ts
└── utils/
    ├── exercise-utils.ts     # Exercise grading
    ├── lesson-unlock-logic.ts # Unlock logic
    ├── vi-normalize.ts       # Vietnamese text utils
    ├── animations.ts         # Animation utilities
    ├── performance.ts        # Performance utilities
    └── offline.ts            # Offline support
```

**Total Files:** ~45
**Total Lines:** ~10,500

---

## Core Concepts

### 1. Zones

Zones represent proficiency levels:

```typescript
const ZONES = {
  beginner: { level: 1, color: '#10B981', icon: '🌱' },
  elementary: { level: 2, color: '#3B82F6', icon: '🌿' },
  intermediate: { level: 3, color: '#8B5CF6', icon: '🌳' },
  upperIntermediate: { level: 4, color: '#F59E0B', icon: '🌲' },
  advanced: { level: 5, color: '#EF4444', icon: '🏔️' },
  expert: { level: 6, color: '#6366F1', icon: '⛰️' },
}
```

### 2. Topics

Topics contain related lessons within a zone.

### 3. Lessons

Lessons have:
- **Materials** (dialogue, vocabulary, grammar, images)
- **Practice Exercises** (questions with grading)

### 4. Question Types

8 question types supported:

1. **Multiple Choice** (5 subtypes)
2. **Word Matching**
3. **Synonyms Matching**
4. **Choose Words** (3 subtypes)
5. **Error Correction**
6. **Grammar Structure**
7. **Dialogue Completion**
8. **Role Play**

### 5. Progress Tracking

Progress is tracked at multiple levels:
- Zone completion percentage
- Topic completion count
- Lesson pass/fail status
- Exercise scores and attempts

### 6. Unlock Logic

Three subscription tiers:

- **FREE**: Sequential zone unlock (must complete 100% of zone N to unlock N+1)
- **PLUS**: All zones unlocked, sequential lessons within topics
- **UNLIMITED**: Everything unlocked

---

## Getting Started

### Prerequisites

```bash
# Dependencies
npm install @react-navigation/native @react-navigation/native-stack
npm install @tanstack/react-query
npm install zustand
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage
npm install @react-native-community/netinfo
npm install react-native-reanimated
```

### Basic Usage

#### 1. Wrap App with Providers

```typescript
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/features/learn/config/queryClient'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <LearnNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  )
}
```

#### 2. Set up Navigation

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { LearnStackParamList } from '@/features/learn/navigation/types'
import {
  LearnDashboardScreen,
  TopicsListScreen,
  LessonsListScreen,
  LessonDetailScreen,
  ExerciseSessionScreen,
  ExerciseCompleteScreen,
} from '@/features/learn/screens'

const Stack = createNativeStackNavigator<LearnStackParamList>()

function LearnNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={LearnDashboardScreen} />
      <Stack.Screen name="TopicsList" component={TopicsListScreen} />
      <Stack.Screen name="LessonsList" component={LessonsListScreen} />
      <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
      <Stack.Screen name="ExerciseSession" component={ExerciseSessionScreen} />
      <Stack.Screen name="ExerciseComplete" component={ExerciseCompleteScreen} />
    </Stack.Navigator>
  )
}
```

#### 3. Fetch Data with Hooks

```typescript
import { useAllZones } from '@/features/learn/hooks/useLearnData'

function MyComponent() {
  const { data: zones, isLoading, error } = useAllZones()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return <ZonesList zones={zones} />
}
```

---

## Components

### Shared Components

#### Button

```typescript
<Button
  title="Start Exercise"
  onPress={handlePress}
  variant="primary"  // primary | secondary | outline | danger | success
  size="large"       // small | medium | large
  disabled={false}
  loading={false}
  fullWidth
/>
```

#### Card

```typescript
<Card style={styles.card} elevated onPress={handlePress}>
  <Text>Card content</Text>
</Card>
```

#### ProgressBar

```typescript
<ProgressBar
  progress={75}           // 0-100
  height={8}
  color="#10B981"
  showPercentage={true}
/>
```

#### Badge

```typescript
<Badge
  label="Complete"
  variant="success"  // success | warning | error | info | neutral
  size="medium"      // small | medium | large
/>
```

### Question Components

#### Multiple Choice

```typescript
<MultipleChoiceQuestionComponent
  question={question}
  onSubmit={(answer) => console.log(answer)}
  disabled={false}
  showFeedback={true}
  isCorrect={true}
  feedbackMessage="Great job!"
/>
```

#### Word Matching

```typescript
<WordMatchingQuestionComponent
  question={question}
  onSubmit={(matchedPairs) => console.log(matchedPairs)}
/>
```

---

## State Management

### React Query (Server State)

Used for fetching and caching server data:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { getAllZones } from '@/features/learn/services/learnService'

// Fetching zones
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['zones'],
  queryFn: getAllZones,
  staleTime: 30 * 60 * 1000, // 30 minutes
})

// Submitting exercise
const submitMutation = useMutation({
  mutationFn: submitExerciseAttempt,
  onSuccess: (data) => {
    console.log('Submitted!', data)
  },
})
```

### Zustand (Client State)

Used for exercise session state:

```typescript
import { useExerciseSessionStore } from '@/features/learn/stores/exerciseSessionStore'

function ExerciseScreen() {
  const {
    currentQuestionIndex,
    submitAnswer,
    goToNextQuestion,
    calculateResults,
  } = useExerciseSessionStore()

  const handleSubmit = (answer: any) => {
    const grade = submitAnswer(currentQuestion.id, answer)
    if (grade.isCorrect) {
      goToNextQuestion()
    }
  }
}
```

---

## API Integration

### Service Functions

#### Learn Service

```typescript
import {
  getAllZones,
  getZoneById,
  getTopicsByZone,
  getLessonBySlugs,
} from '@/features/learn/services/learnService'

// Fetch all zones
const zones = await getAllZones()

// Fetch topics in zone
const topics = await getTopicsByZone(zoneId)

// Fetch lesson by slugs
const lesson = await getLessonBySlugs('greetings', 'hello')
```

#### Progress Service

```typescript
import {
  getUserLessonProgress,
  getZoneCompletionStats,
} from '@/features/learn/services/progressService'

// Get lesson progress
const progress = await getUserLessonProgress(userId, lessonId)

// Get zone stats
const stats = await getZoneCompletionStats({ userId, zoneLevel: 1 })
```

#### Practice Service

```typescript
import {
  getExerciseBySlugs,
  submitExerciseAttempt,
} from '@/features/learn/services/practiceService'

// Get exercise
const exercise = await getExerciseBySlugs('greetings', 'hello')

// Submit attempt
const result = await submitExerciseAttempt({
  exerciseId: exercise.id,
  answers: [/* ... */],
  score: 85,
})
```

---

## Navigation

### Navigation Flow

```
Dashboard
   ↓ (tap zone)
TopicsList
   ↓ (tap topic)
LessonsList
   ↓ (tap lesson)
LessonDetail
   ↓ (tap start exercise)
ExerciseSession
   ↓ (finish exercise)
ExerciseComplete
   ↓ (tap continue)
Dashboard
```

### Navigation Types

```typescript
type LearnStackParamList = {
  Dashboard: undefined
  TopicsList: { zoneId: string }
  LessonsList: { topicSlug: string }
  LessonDetail: { topicSlug: string; lessonSlug: string }
  ExerciseSession: {
    exercise: Exercise
    topicSlug: string
    lessonSlug: string
  }
  ExerciseComplete: {
    score: number
    correctAnswers: number
    totalQuestions: number
    coinsEarned: number
    xpEarned: number
  }
}
```

### Navigation Usage

```typescript
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

type NavigationProp = NativeStackNavigationProp<LearnStackParamList, 'Dashboard'>

function MyScreen() {
  const navigation = useNavigation<NavigationProp>()

  const handlePress = () => {
    navigation.navigate('TopicsList', { zoneId: '1' })
  }
}
```

---

## Offline Support

### Network Status

```typescript
import { useNetworkStatus } from '@/features/learn/utils/offline'

function MyComponent() {
  const { isOffline, isConnected, connectionType } = useNetworkStatus()

  return (
    <View>
      {isOffline && <OfflineBanner />}
    </View>
  )
}
```

### Offline Cache

```typescript
import { OfflineCache } from '@/features/learn/utils/offline'

// Save to cache
await OfflineCache.set('zones', zonesData)

// Get from cache
const cached = await OfflineCache.get('zones')

// Check freshness
const isFresh = await OfflineCache.isFresh('zones', 30 * 60 * 1000)
```

### Sync Queue

```typescript
import { SyncQueue } from '@/features/learn/utils/offline'

// Add to queue (when offline)
await SyncQueue.enqueue({
  type: 'exercise',
  data: { exerciseId, answers, score },
})

// Sync when online
await syncPendingSubmissions(async (submission) => {
  await submitExerciseAttempt(submission.data)
})
```

---

## Performance

### Memoization

```typescript
import { useMemoizedSelector } from '@/features/learn/utils/performance'

const completedCount = useMemoizedSelector(
  lessons,
  (lessons) => lessons.filter(l => l.completed).length
)
```

### Image Preloading

```typescript
import { preloadImages } from '@/features/learn/utils/performance'

useEffect(() => {
  const imageUrls = materials
    .filter(m => m.type === 'image')
    .map(m => m.media_url)

  preloadImages(imageUrls)
}, [materials])
```

### Performance Monitoring

```typescript
import { usePerformanceMonitor } from '@/features/learn/utils/performance'

function HeavyComponent() {
  usePerformanceMonitor('HeavyComponent', 16) // 16ms threshold
  // ...
}
```

---

## Testing

### Unit Tests

```typescript
import { renderHook } from '@testing-library/react-hooks'
import { useAllZones } from '@/features/learn/hooks/useLearnData'

describe('useAllZones', () => {
  it('should fetch zones', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAllZones())

    expect(result.current.isLoading).toBe(true)

    await waitForNextUpdate()

    expect(result.current.data).toBeDefined()
    expect(result.current.isLoading).toBe(false)
  })
})
```

### Component Tests

```typescript
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from '@/features/learn/components'

describe('Button', () => {
  it('should call onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <Button title="Press me" onPress={onPress} />
    )

    fireEvent.press(getByText('Press me'))

    expect(onPress).toHaveBeenCalled()
  })
})
```

---

## Troubleshooting

### Common Issues

#### 1. "No zones found"

**Cause:** Network error or database issue
**Solution:** Check Supabase connection and API permissions

#### 2. "Lesson not unlocked"

**Cause:** User tier doesn't allow access
**Solution:** Verify unlock logic in `lesson-unlock-logic.ts`

#### 3. "Exercise not loading"

**Cause:** Missing exercise data or parsing error
**Solution:** Check `practiceService.ts` question parsing logic

#### 4. "Progress not saving"

**Cause:** Offline or API error
**Solution:** Check sync queue and network status

### Debug Mode

Enable debug logging:

```typescript
// In development
if (__DEV__) {
  console.log('[Learn] Zone data:', zones)
}
```

### Error Boundary

Wrap screens with error boundary:

```typescript
import { ErrorBoundary } from '@/features/learn/components'

function LearnNavigator() {
  return (
    <ErrorBoundary>
      <Stack.Navigator>
        {/* screens */}
      </Stack.Navigator>
    </ErrorBoundary>
  )
}
```

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query)
- [React Navigation Documentation](https://reactnavigation.org/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

**Questions?** Contact the development team or check the inline documentation in the code.
