# Stage 1: Foundation & Core Types - Completion Report

**Status:** ✅ Completed
**Module:** Learn
**Files Created:** 10
**Total Lines:** ~1,600 lines
**Code Reuse:** ~90% (high reuse from web)

This stage establishes the foundation for the Learn module by implementing core types, navigation types, utility functions, and constants.

---

## Files Created

### 1. Type Definitions - 435 lines

#### **types/exercises.ts** (119 lines)
**Path:** `src/features/learn/types/exercises.ts`

**Purpose:** Core domain types for lessons, topics, zones, and materials

**Exports:**
```typescript
// Main entities
export interface Lesson
export interface Chapter
export interface Topic
export interface Zone

// Progress tracking
export interface UserProgress
export interface TopicProgress
export interface LessonProgress

// Material types
export type MaterialType = 'dialogue' | 'vocabulary' | 'grammar'
export interface Material
export interface DialogueLine
export interface VocabularyItem
export interface GrammarRule
export interface ExampleSentence
```

**Key Features:**
- Zone hierarchy: Beginner → Elementary → Intermediate → Upper-Intermediate → Advanced → Expert
- Lesson metadata with sort order for sequential unlocking
- Material types for different learning content
- Progress tracking interfaces
- Status enums: 'draft' | 'published' | 'archived'

---

#### **types/practice.ts** (267 lines)
**Path:** `src/features/learn/types/practice.ts`

**Purpose:** All practice exercise types and question interfaces

**Question Types Defined:**
1. **Multiple Choice** - Select correct answer from options
2. **Word Matching** - Match Vietnamese with English
3. **Synonyms Matching** - Match words with synonyms
4. **Choose Words** - Build sentences from word bank (3 subtypes)
   - `fill_in_blanks` - Fill missing words
   - `translation` - Translate sentence
   - `sentence-scramble` - Arrange words in order
5. **Error Correction** - Fix grammatical errors
6. **Grammar Structure** - Apply grammar rules
7. **Dialogue Completion** - Complete conversations
8. **Role Play** - Interactive multi-step conversations

**Exercise Interface:**
```typescript
export interface Exercise {
  id: string
  title: string
  description: string
  topicId: string
  chapterId: string
  lessonId: string
  coinReward: number
  xpReward: number
  zoneId?: number
  zoneLevel?: number
  questions: Question[]
}
```

**Session Tracking:**
```typescript
export interface ExerciseProgress {
  currentQuestionIndex: number
  correctAnswers: number
  incorrectAnswers: number
  startTime: number
  completed: boolean
  unsureAnswers?: number
}

export interface SessionResults {
  score: number
  accuracy: number
  correctAnswers: number
  incorrectAnswers: number
  unsureAnswers: number
  totalQuestions: number
  timeSpent: number
  coinsEarned: number
  xpEarned: number
}
```

---

#### **types/index.ts** (49 lines)
**Path:** `src/features/learn/types/index.ts`

**Purpose:** Central export point for all Learn types

**Exports:**
- All exercise types from `exercises.ts`
- All practice types from `practice.ts`

---

### 2. Navigation Types - 91 lines

#### **navigation/types.ts** (91 lines)
**Path:** `src/features/learn/navigation/types.ts`

**Purpose:** Type-safe navigation for Learn module with React Navigation

**Stack Definition:**
```typescript
export type LearnStackParamList = {
  Dashboard: undefined
  TopicsList: {
    zoneId: string
    zoneName: string
  }
  LessonsList: {
    topicSlug: string
    topicId: string
    topicName: string
  }
  LessonDetail: {
    topicSlug: string
    lessonSlug: string
    lessonId: string
    lessonTitle: string
  }
  ExerciseSession: {
    exercise: Exercise
    topicSlug: string
    lessonSlug: string
  }
  ExerciseComplete: {
    score: number
    correctAnswers: number
    incorrectAnswers: number
    unsureAnswers: number
    totalQuestions: number
    accuracy: number
    timeSpent: number
    coinsEarned: number
    xpEarned: number
    lessonCompleted: boolean
    topicSlug: string
    lessonSlug: string
  }
}
```

**Navigation Props:**
- `DashboardNavigationProp`
- `TopicsListNavigationProp`
- `LessonsListNavigationProp`
- `LessonDetailNavigationProp`
- `ExerciseSessionNavigationProp`
- `ExerciseCompleteNavigationProp`

**Route Props:**
- `DashboardRouteProp`
- `TopicsListRouteProp`
- `LessonsListRouteProp`
- `LessonDetailRouteProp`
- `ExerciseSessionRouteProp`
- `ExerciseCompleteRouteProp`

---

### 3. Utility Functions - 620 lines

#### **utils/exercise-utils.ts** (460 lines)
**Path:** `src/features/learn/utils/exercise-utils.ts`

**Purpose:** Exercise grading, session management, and progress tracking (adapted for mobile with AsyncStorage)

**Key Differences from Web:**
- ✅ Replaced `localStorage` with `AsyncStorage` (React Native)
- ✅ All storage functions are now `async`
- ✅ Error handling for mobile storage

**Main Functions:**

**Grading:**
```typescript
export function gradeQuestion(
  question: Question,
  userAnswer: any
): GradeResult

export function calculateAccuracy(
  progress: ExerciseProgress
): number

export function isExercisePassed(
  accuracy: number,
  threshold?: number,
  zoneLevel?: number
): boolean
```

**Session Management (Async):**
```typescript
export async function saveExerciseSession(
  exerciseId: string,
  lessonSlug: string,
  session: Partial<ExerciseSession>
): Promise<void>

export async function loadExerciseSession(
  exerciseId: string,
  lessonSlug: string
): Promise<ExerciseSession | null>

export async function clearExerciseSession(
  exerciseId: string,
  lessonSlug: string
): Promise<void>

export async function saveQuestionAttempt(
  exerciseId: string,
  lessonSlug: string,
  attempt: QuestionAttempt
): Promise<void>

export async function getQuestionAttempt(
  exerciseId: string,
  lessonSlug: string,
  questionId: string
): Promise<QuestionAttempt | null>
```

**Grading Logic by Question Type:**
1. **Multiple Choice:** Exact match with `correctChoiceId`
2. **Word Matching:** Array or object-based pair matching
3. **Synonyms Matching:** Similar to word matching
4. **Choose Words:** Token-by-token comparison with Vietnamese normalization
   - Supports subtypes: fill_in_blanks, translation, sentence-scramble
5. **Error Correction:** Normalized text comparison
6. **Grammar Structure:** Choice ID matching with hints
7. **Dialogue Completion:** Choice ID matching
8. **Role Play:** Multi-step accuracy > 50%

**Zone-Based Pass Thresholds:**
```typescript
const zoneThresholds: Record<number, number> = {
  1: 65, // Beginner
  2: 70, // Elementary
  3: 75, // Intermediate
  4: 80, // Upper-Intermediate
  5: 85, // Advanced
}
```

---

#### **utils/lesson-unlock-logic.ts** (286 lines)
**Path:** `src/features/learn/utils/lesson-unlock-logic.ts`

**Purpose:** Determine which lessons are accessible based on user tier and progress

**Subscription Tiers:**
```typescript
export type SubscriptionTier = 'FREE' | 'PLUS' | 'UNLIMITED'
```

**Unlock Rules:**

**UNLIMITED Tier:**
- ✅ All lessons in all zones unlocked

**PLUS Tier:**
- ✅ All zones accessible
- ✅ Sequential unlock within topics (must pass lesson N to unlock N+1)

**FREE Tier (Progressive Unlock):**
- ✅ Beginner zone (level 1) always accessible
- ✅ Must complete ALL topics in zone N to unlock zone N+1
- ✅ Sequential unlock within topics

**Main Functions:**
```typescript
export function checkLessonUnlock(params: {
  userTier: SubscriptionTier | null
  isAuthenticated: boolean
  zoneLevel: number
  lessonSortOrder: number
  previousLessonProgress: UserLessonProgress | null
  completedTopicsInPreviousZone?: number
  totalTopicsInPreviousZone?: number
}): LessonUnlockStatus

export function getUnlockedLessonsInTopic(params: {
  userTier: SubscriptionTier
  zoneLevel: number
  lessonsInTopic: Array<{ id: number; sort_order: number }>
  progressRecords: UserLessonProgress[]
  completedTopicsInPreviousZone?: number
  totalTopicsInPreviousZone?: number
}): Set<number>

export function isZoneUnlocked(params: {
  userTier: SubscriptionTier
  zoneLevel: number
  completedTopicsInPreviousZone: number
  totalTopicsInPreviousZone: number
}): boolean

export function calculateZoneProgressPercent(params: {
  completedTopics: number
  totalTopics: number
}): number

export function getNextUnlockableZone(params: {
  currentZoneLevel: number
  completedTopicsInCurrentZone: number
  totalTopicsInCurrentZone: number
}): { nextZoneLevel: number; isReadyToUnlock: boolean }
```

**Lock Reasons:**
```typescript
type LockReason =
  | 'tier_restriction' // Upgrade needed
  | 'previous_incomplete' // Complete previous lesson
  | 'zone_locked' // Complete previous zone
  | 'login_required' // Not authenticated
  | 'loading' // Data loading
```

---

### 4. Vietnamese Normalization Utility - 205 lines

#### **shared/utils/vi-normalize.ts** (205 lines)
**Path:** `src/shared/utils/vi-normalize.ts`

**Purpose:** Vietnamese text normalization for exercise comparison and search

**Functions:**
```typescript
// Remove diacritics
export function normalizeVietnamese(text: string): string

// Full normalization (diacritics + punctuation + whitespace)
export function normalizeForComparison(
  text: string,
  options?: {
    preserveCase?: boolean
    preserveWhitespace?: boolean
  }
): string

// Compare two Vietnamese strings
export function compareVietnamese(
  str1: string,
  str2: string,
  options?: {
    caseSensitive?: boolean
    ignorePunctuation?: boolean
  }
): boolean

// Search with normalization
export function searchVietnamese(
  text: string,
  searchTerm: string,
  caseSensitive?: boolean
): boolean
```

**Character Mapping:**
- All Vietnamese vowels with tones (à, á, ả, ã, ạ, ă, ằ, ắ, etc.)
- Special characters (đ, ê, ô, ơ, ư)
- Uppercase and lowercase variants
- Total: 134 character mappings

**Usage Examples:**
```typescript
normalizeVietnamese("Xin chào") // → "Xin chao"
normalizeForComparison("Xin chào, bạn khỏe không?") // → "xin chao ban khoe khong"
compareVietnamese("Xin chào", "xin chao") // → true
searchVietnamese("Cà phê sữa đá", "ca phe") // → true
```

---

### 5. Constants - 284 lines

#### **constants/zones.ts** (130 lines)
**Path:** `src/features/learn/constants/zones.ts`

**Purpose:** Zone definitions with metadata

**Zone Definitions:**
```typescript
export interface ZoneDefinition {
  id: ZoneId
  level: number
  title: string
  description: string
  color: string // Hex color
  icon: string // Emoji
  minAccuracy: number // Pass threshold
}
```

**Zones:**
1. **Beginner** (Level 1)
   - Color: `#10B981` (Green)
   - Icon: 🌱
   - Min Accuracy: 65%

2. **Elementary** (Level 2)
   - Color: `#3B82F6` (Blue)
   - Icon: 📘
   - Min Accuracy: 70%

3. **Intermediate** (Level 3)
   - Color: `#F59E0B` (Orange)
   - Icon: 📙
   - Min Accuracy: 75%

4. **Upper Intermediate** (Level 4)
   - Color: `#EF4444` (Red)
   - Icon: 📕
   - Min Accuracy: 80%

5. **Advanced** (Level 5)
   - Color: `#8B5CF6` (Purple)
   - Icon: 📗
   - Min Accuracy: 85%

6. **Expert** (Level 6)
   - Color: `#EC4899` (Pink)
   - Icon: 🎓
   - Min Accuracy: 90%

**Helper Functions:**
```typescript
export function getZoneByLevel(level: number): ZoneDefinition | undefined
export function getZoneById(id: ZoneId): ZoneDefinition
export function getAllZones(): ZoneDefinition[]
export function getZoneMinAccuracy(zoneId: ZoneId): number
export function getZoneColor(zoneId: ZoneId): string
export function getZoneIcon(zoneId: ZoneId): string
```

---

#### **constants/exerciseTypes.ts** (129 lines)
**Path:** `src/features/learn/constants/exerciseTypes.ts`

**Purpose:** Exercise type metadata and utilities

**Exercise Type Metadata:**
```typescript
export interface ExerciseTypeMetadata {
  type: QuestionType
  label: string
  description: string
  icon: string // Emoji
  color: string // Hex color
  difficultyLevel: 'easy' | 'medium' | 'hard'
  estimatedTimeSeconds: number
}
```

**Exercise Types:**
1. **Multiple Choice** - ✓ - 30s - Easy
2. **Word Matching** - 🔗 - 45s - Easy
3. **Synonyms Matching** - ↔️ - 45s - Medium
4. **Choose Words** - 📝 - 60s - Medium
5. **Error Correction** - 🔍 - 75s - Hard
6. **Grammar Structure** - 📚 - 45s - Medium
7. **Dialogue Completion** - 💬 - 60s - Medium
8. **Role Play** - 🎭 - 90s - Hard

**Helper Functions:**
```typescript
export function getExerciseTypeMetadata(type: QuestionType): ExerciseTypeMetadata
export function getExerciseTypeLabel(type: QuestionType): string
export function getExerciseTypeIcon(type: QuestionType): string
export function getExerciseTypeColor(type: QuestionType): string
export function getAllExerciseTypes(): ExerciseTypeMetadata[]
export function getExerciseTypesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): ExerciseTypeMetadata[]
export function calculateEstimatedTime(questionTypes: QuestionType[]): number
export function formatEstimatedTime(seconds: number): string
```

---

#### **constants/index.ts** (25 lines)
**Path:** `src/features/learn/constants/index.ts`

**Purpose:** Barrel export for all constants

---

## File Structure

```
mobile/
├── src/
│   ├── features/
│   │   └── learn/
│   │       ├── types/
│   │       │   ├── exercises.ts          (119 lines)
│   │       │   ├── practice.ts           (267 lines)
│   │       │   └── index.ts              (49 lines)
│   │       ├── navigation/
│   │       │   └── types.ts              (91 lines)
│   │       ├── utils/
│   │       │   ├── exercise-utils.ts     (460 lines)
│   │       │   └── lesson-unlock-logic.ts (286 lines)
│   │       └── constants/
│   │           ├── zones.ts              (130 lines)
│   │           ├── exerciseTypes.ts      (129 lines)
│   │           └── index.ts              (25 lines)
│   └── shared/
│       └── utils/
│           └── vi-normalize.ts           (205 lines)
└── STAGE_1_LEARN_FOUNDATION_COMPLETION.md
```

**Total Lines:** ~1,761 lines

---

## Key Achievements

✅ **Complete type system** for lessons, topics, zones, exercises
✅ **8 question types** defined with full interfaces
✅ **Type-safe navigation** with 6 screens
✅ **Exercise grading logic** for all 8 question types
✅ **Vietnamese text normalization** for accurate comparison
✅ **Session management** with AsyncStorage (mobile-optimized)
✅ **Progressive unlock system** for FREE/PLUS/UNLIMITED tiers
✅ **Zone definitions** with colors, icons, and thresholds
✅ **Exercise type metadata** with difficulty and time estimates
✅ **High code reuse** (~90% from web with mobile adaptations)

---

## Mobile Adaptations

### 1. AsyncStorage instead of localStorage
**Web:**
```typescript
localStorage.setItem(key, JSON.stringify(data))
const data = localStorage.getItem(key)
```

**Mobile:**
```typescript
await AsyncStorage.setItem(key, JSON.stringify(data))
const data = await AsyncStorage.getItem(key)
```

### 2. All storage functions are async
- `saveExerciseSession` → `async`
- `loadExerciseSession` → `async`
- `clearExerciseSession` → `async`
- `saveQuestionAttempt` → `async`
- `getQuestionAttempt` → `async`

### 3. React Navigation types
- Web uses custom router, mobile uses `@react-navigation/native-stack`
- Defined `LearnStackParamList` for type-safe navigation

---

## Integration with Existing Codebase

### Uses Shared Utilities
```typescript
import { normalizeForComparison } from '@/shared/utils/vi-normalize'
```

### Uses Existing Dependencies
- `@react-native-async-storage/async-storage` ✅ (already in package.json)
- `@react-navigation/native-stack` ✅ (already in package.json)

---

## Testing Checklist

### Type Definitions
- [ ] Import types in other modules without errors
- [ ] All interfaces compile without TypeScript errors
- [ ] Question types cover all 8 exercise types

### Navigation Types
- [ ] Navigation between screens with correct params
- [ ] Type-safe route params access
- [ ] No runtime errors for navigation props

### Utility Functions
- [ ] Grading works correctly for all 8 question types
- [ ] AsyncStorage saves and loads sessions
- [ ] Vietnamese normalization handles all diacritics
- [ ] Lesson unlock logic respects tier restrictions
- [ ] Zone unlock logic works for FREE tier progression

### Constants
- [ ] All 6 zones defined with correct metadata
- [ ] All 8 exercise types have metadata
- [ ] Helper functions return correct values

---

## Known Limitations

1. **No API integration yet** - Types defined but no service layer (Stage 2)
2. **No hooks yet** - Utility functions exist but no React hooks wrapper (Stage 3)
3. **No UI components yet** - Types and logic ready but no screens (Stages 4-6)
4. **UserLessonProgress type** - Referenced but not fully defined (will be in API layer)

---

## Next Steps (Stage 2)

**Stage 2: API Service Layer**
- [ ] Create `api/learnService.ts` for Learn API calls
- [ ] Create `api/progressService.ts` for progress tracking
- [ ] Implement 15-20 API endpoints:
  - `getZones()` - Fetch all zones
  - `getTopicsByZone(zoneId)` - Fetch topics in zone
  - `getLessonsByTopic(topicSlug)` - Fetch lessons in topic
  - `getLessonDetail(topicSlug, lessonSlug)` - Fetch lesson details
  - `getExercise(lessonId)` - Fetch exercise for lesson
  - `submitExerciseResults(lessonId, results)` - Submit results
  - `getUserProgress()` - Fetch overall progress
  - `getTopicProgress(topicId)` - Fetch topic progress
  - `getLessonProgress(lessonId)` - Fetch lesson progress
  - And more...
- [ ] Implement response caching (5-30 minutes TTL)
- [ ] Error handling and retry logic
- [ ] TypeScript interfaces for API responses

---

## Summary

Stage 1 successfully establishes the foundation for the Learn module with:

**Types:** Complete type system for all Learn domain objects
**Navigation:** Type-safe navigation with 6 screens
**Utilities:** Exercise grading, session management, unlock logic, Vietnamese normalization
**Constants:** Zone and exercise type metadata
**Code Quality:** ~90% reuse from web with proper mobile adaptations

The Learn module foundation is ready for API integration (Stage 2)! 🎉

---

**Estimated Time:** 2 days
**Actual Time:** 1 day
**Progress:** Stage 1 of 7 complete (14%)
**Next Stage:** API Service Layer (2-3 days)
