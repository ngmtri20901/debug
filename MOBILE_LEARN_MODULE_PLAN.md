# MOBILE LEARN MODULE - Implementation Plan

## Executive Summary

The Learn module is the core language learning experience with structured lessons, exercises, and progress tracking. This plan breaks down implementation into **7 manageable stages** over **18-20 days**.

**Estimated Timeline:** 18-20 days
**Estimated Code:** ~15,000 lines
**Code Reuse Rate:** ~55-60% (lower than Flashcards due to mobile-specific exercise UI)

---

## Module Overview

### **Architecture**
```
Zones (6 levels) → Topics → Lessons → Materials + Practice Exercises
```

### **Key Features**
1. **Learning Path:** Browse zones, topics, and lessons
2. **Lesson Content:** Dialogue player, vocabulary, grammar, examples, storybook
3. **Practice Exercises:** 8 different exercise types with mobile-optimized UI
4. **Progress System:** Track completion, earn coins/XP, unlock lessons
5. **User Engagement:** Streak tracking, achievements, leaderboard

### **Exercise Types (8 Total)**
1. **Multiple Choice** (5 subtypes: text, image-question, word-translation, image-choices, grammar)
2. **Word Matching** (drag-and-drop Vietnamese ↔ English)
3. **Synonyms Matching** (match similar words)
4. **Choose Words** (3 subtypes: translation, fill-in-blanks, sentence-scramble)
5. **Error Correction** (fix faulty sentence)
6. **Dialogue Completion** (select appropriate response)
7. **Role Play** (interactive conversation)
8. **Grammar Structure** (identify grammar patterns)

---

## Stage-by-Stage Breakdown

---

## **Stage 1: Foundation & Core Types (Days 1-2)**

**Goal:** Set up data structures, types, and API client for Learn module

### **Tasks:**

#### 1.1 Types Setup
**Reuse from Web:**
- `types/exercises.ts` - Lesson, Chapter, Topic, Zone, UserProgress (~39 lines)
- `types/practice.ts` - All question types, Exercise interface (~195 lines)
- **Reuse:** 100% (copy directly)

**Files to Create:**
```
mobile/src/features/learn/
├── types/
│   ├── exercises.ts          # Lesson/Topic/Zone types
│   ├── practice.ts            # Question/Exercise types
│   └── index.ts               # Exports
└── navigation/
    └── types.ts               # Navigation param list
```

#### 1.2 Navigation Types
**New for Mobile:**
```typescript
type LearnStackParamList = {
  Dashboard: undefined  // Zones overview
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

#### 1.3 Constants & Utils
**Reuse from Web:**
- Zone definitions (beginner, elementary, etc.)
- Exercise utility functions
- Lesson unlock logic

**Estimated Lines:** ~500 lines
**Reuse Rate:** 95%

---

## **Stage 2: API Service Layer (Days 2-4)**

**Goal:** Implement all API methods for fetching lessons, exercises, and progress

### **Tasks:**

#### 2.1 Learn Service
**API Methods to Implement:**
```typescript
export const learnAPI = {
  // Zones & Topics
  async getAllZones(): Promise<Zone[]>
  async getTopicsByZone(zoneId: string): Promise<Topic[]>
  async getTopicBySlug(slug: string): Promise<Topic | null>

  // Lessons
  async getLessonsByTopic(topicId: string): Promise<Lesson[]>
  async getLessonBySlug(topicSlug: string, lessonSlug: string): Promise<Lesson | null>
  async getLessonMaterials(lessonId: string): Promise<Material[]>

  // Exercises
  async getExerciseBySlugs(topicSlug: string, lessonSlug: string): Promise<Exercise | null>
  async canAccessExercise(exerciseId: string, userId: string): Promise<boolean>

  // Progress
  async getUserProgress(userId: string): Promise<UserProgress>
  async getTopicProgress(userId: string, topicId: string): Promise<TopicProgress>
  async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress>

  // Session
  async createExerciseSession(exerciseId: string, userId: string): Promise<Session>
  async updateExerciseSession(sessionId: string, data: SessionUpdate): Promise<boolean>
  async completeExerciseSession(sessionId: string, results: SessionResults): Promise<CompletionResponse>
}
```

**Reuse from Web:**
- `api/practice.ts` - Exercise fetching logic (~400 lines)
- `api/lesson-progress.ts` - Progress tracking (~300 lines)
- **Adaptation needed:** Replace `createClient()` with mobile Supabase client

**Files to Create:**
```
mobile/src/features/learn/services/
├── learnService.ts            # 25+ API methods
├── progressService.ts         # Progress tracking
└── sessionService.ts          # Exercise sessions
```

**Estimated Lines:** ~800 lines
**Reuse Rate:** 85%

---

## **Stage 3: State Management & Hooks (Days 5-6)**

**Goal:** Create React hooks and context for state management

### **Tasks:**

#### 3.1 Context Providers
**Reuse from Web:**
- `contexts/ExerciseContext.tsx` - Exercise session state
- `contexts/UserProgressContext.tsx` - User progress state

**Adaptation:**
- Remove SSR-specific code
- Use AsyncStorage for caching
- Add mobile-specific state (orientation, keyboard)

#### 3.2 Custom Hooks
**Create:**
```typescript
// Progress hooks
useUserProgress() - Get/update user progress
useTopicProgress(topicId) - Topic-specific progress
useLessonUnlock(lessonId) - Check if lesson is unlocked

// Exercise hooks
useExerciseSession(exercise) - Manage exercise session
useExerciseNavigation() - Navigate between questions
useExerciseTimer() - Track time spent
useExerciseResultSaver() - Save results to DB

// Audio hooks
useDialogueAudio(audioUrl) - Play dialogue audio
useTextToSpeech(text) - TTS for words/sentences
```

**Files to Create:**
```
mobile/src/features/learn/
├── contexts/
│   ├── ExerciseContext.tsx
│   ├── UserProgressContext.tsx
│   └── index.ts
└── hooks/
    ├── useUserProgress.ts
    ├── useTopicProgress.ts
    ├── useLessonUnlock.ts
    ├── useExerciseSession.ts
    ├── useExerciseNavigation.ts
    ├── useExerciseTimer.ts
    ├── useExerciseResultSaver.ts
    ├── useDialogueAudio.ts
    └── index.ts
```

**Estimated Lines:** ~1,200 lines
**Reuse Rate:** 70% (contexts), 40% (hooks - mobile-specific)

---

## **Stage 4: Core UI Components (Days 7-8)**

**Goal:** Build reusable UI components for Learn module

### **Tasks:**

#### 4.1 Display Components
**Create:**
```typescript
<ZoneCard />           // Zone display card
<TopicCard />          // Topic with progress
<LessonCard />         // Lesson with lock/unlock state
<ProgressBar />        // Linear progress indicator
<CoinsDisplay />       // User coins counter
<XPBadge />           // XP earned badge
<StreakIndicator />   // Streak days with fire emoji
<LessonMaterial />    // Material card (dialogue, vocab, etc.)
```

#### 4.2 Exercise Components (Base)
**Create:**
```typescript
<ExerciseHeader />     // Question counter, timer, quit button
<ExerciseProgress />   // Progress bar
<QuestionCard />       // Question display wrapper
<AnswerFeedback />     // Correct/incorrect feedback
<ExplanationModal />   // Show explanation after answer
<ExerciseComplete />   // Completion screen with stats
```

**Files to Create:**
```
mobile/src/features/learn/components/
├── zone/
│   ├── ZoneCard.tsx
│   └── ZoneHeader.tsx
├── topic/
│   ├── TopicCard.tsx
│   └── TopicProgress.tsx
├── lesson/
│   ├── LessonCard.tsx
│   ├── LessonMaterial.tsx
│   ├── DialoguePlayer.tsx
│   ├── VocabularyList.tsx
│   ├── GrammarCarousel.tsx
│   └── ExampleSentences.tsx
└── exercise/
    ├── base/
    │   ├── ExerciseHeader.tsx
    │   ├── ExerciseProgress.tsx
    │   ├── QuestionCard.tsx
    │   ├── AnswerFeedback.tsx
    │   └── ExplanationModal.tsx
    └── ExerciseComplete.tsx
```

**Estimated Lines:** ~1,800 lines
**Reuse Rate:** 30% (mostly new mobile UI)

---

## **Stage 5: Exercise Type Implementations (Days 9-13)**

**Goal:** Implement all 8 exercise types with mobile-optimized UI

**This is the most complex stage** - breaking into sub-stages:

### **5.1 Multiple Choice (Day 9)**
**5 Subtypes:**
- Text-only MCQ
- Image question MCQ
- Word translation MCQ
- Image choices MCQ
- Grammar structure MCQ

**Component:**
```typescript
<MultipleChoiceExercise
  question={question}
  onAnswer={(choiceId) => void}
  onNext={() => void}
/>
```

**Features:**
- Radio button selection
- Image display for image-based questions
- Explanation modal
- Audio playback for word translation

**Lines:** ~350 lines
**Reuse:** 50%

---

### **5.2 Word Matching (Day 10)**
**Drag-and-drop matching Vietnamese ↔ English words**

**Component:**
```typescript
<WordMatchingExercise
  pairs={pairs}
  onComplete={(matches) => void}
/>
```

**Mobile Considerations:**
- Use `react-native-gesture-handler` for drag-and-drop
- Two columns: Vietnamese (left) | English (right)
- Draw lines when matched (or use highlight)
- Shuffle both columns initially

**Lines:** ~400 lines
**Reuse:** 30% (mostly new mobile UI)

---

### **5.3 Synonyms Matching (Day 10)**
**Similar to Word Matching but with synonyms**

**Component:**
```typescript
<SynonymsMatchingExercise
  pairs={pairs}
  onComplete={(matches) => void}
/>
```

**Lines:** ~250 lines
**Reuse:** 40%

---

### **5.4 Choose Words (Day 11)**
**3 Subtypes:**
- **Translation:** Choose Vietnamese words to form English sentence
- **Fill-in-blanks:** Select missing words
- **Sentence Scramble:** Arrange words in correct order

**Component:**
```typescript
<ChooseWordsExercise
  questionData={questionData}
  onAnswer={(answer) => void}
/>
```

**Mobile Considerations:**
- Horizontal scrollable word bank
- Tap to select/deselect
- Visual feedback for selection
- Show correctness after submission

**Lines:** ~500 lines
**Reuse:** 45%

---

### **5.5 Error Correction (Day 12)**
**Find and fix error in sentence**

**Component:**
```typescript
<ErrorCorrectionExercise
  faultySentence={sentence}
  target={correctWord}
  onAnswer={(correctedSentence) => void}
/>
```

**Mobile Considerations:**
- Highlight error when found
- Text input for correction
- Keyboard handling

**Lines:** ~300 lines
**Reuse:** 50%

---

### **5.6 Dialogue Completion (Day 12)**
**Select appropriate response in dialogue**

**Component:**
```typescript
<DialogueCompletionExercise
  context={context}
  choices={choices}
  onAnswer={(choiceId) => void}
/>
```

**Lines:** ~350 lines
**Reuse:** 60%

---

### **5.7 Role Play (Day 13)**
**Interactive conversation with bot**

**Component:**
```typescript
<RolePlayExercise
  steps={steps}
  onComplete={(results) => void}
/>
```

**Mobile Considerations:**
- Chat-like UI
- User selects from choices
- Bot responds immediately
- Track correctness per step

**Lines:** ~450 lines
**Reuse:** 40%

---

### **5.8 Grammar Structure (Day 13)**
**Similar to MCQ but focused on grammar**

**Lines:** ~200 lines
**Reuse:** 70%

---

**Files to Create:**
```
mobile/src/features/learn/components/exercise/types/
├── MultipleChoice/
│   ├── MultipleChoiceExercise.tsx
│   ├── TextOnlyMCQ.tsx
│   ├── ImageQuestionMCQ.tsx
│   ├── WordTranslationMCQ.tsx
│   ├── ImageChoicesMCQ.tsx
│   └── GrammarMCQ.tsx
├── WordMatching/
│   ├── WordMatchingExercise.tsx
│   ├── MatchingColumn.tsx
│   └── MatchingLine.tsx
├── SynonymsMatching/
│   └── SynonymsMatchingExercise.tsx
├── ChooseWords/
│   ├── ChooseWordsExercise.tsx
│   ├── TranslationType.tsx
│   ├── FillInBlanksType.tsx
│   └── SentenceScrambleType.tsx
├── ErrorCorrection/
│   └── ErrorCorrectionExercise.tsx
├── DialogueCompletion/
│   └── DialogueCompletionExercise.tsx
├── RolePlay/
│   ├── RolePlayExercise.tsx
│   └── ChatMessage.tsx
└── GrammarStructure/
    └── GrammarStructureExercise.tsx
```

**Stage 5 Total:**
- **Estimated Lines:** ~2,800 lines
- **Reuse Rate:** 45% average

---

## **Stage 6: Main Screens (Days 14-16)**

**Goal:** Implement all navigation screens

### **6.1 Learn Dashboard (Day 14)**
**Zones Overview Screen**

**Features:**
- 6 zone cards (beginner → expert)
- User progress summary
- Streak indicator
- Coins display
- Continue learning CTA

**Component Structure:**
```typescript
<LearnDashboardScreen>
  <Header coins={coins} streak={streak} />
  <ContinueLearning lesson={currentLesson} />
  <ZonesList zones={zones} progress={progress} />
</LearnDashboardScreen>
```

**Lines:** ~350 lines

---

### **6.2 Topics List Screen (Day 14)**
**Topics within a zone**

**Features:**
- Topic cards with progress
- Zone header
- Lock indicator for locked topics
- Completion percentage

**Lines:** ~300 lines

---

### **6.3 Lessons List Screen (Day 15)**
**Lessons within a topic**

**Features:**
- Lesson cards with lock/unlock state
- Topic progress bar
- Unlock cost display (coins)
- Lesson completion checkmarks

**Lines:** ~350 lines

---

### **6.4 Lesson Detail Screen (Day 15)**
**Lesson content before exercise**

**Features:**
- Materials (dialogue, vocabulary, grammar, examples)
- Dialogue player with audio
- Vocabulary list
- Grammar carousel
- Example sentences
- Start Exercise button

**Component Structure:**
```typescript
<LessonDetailScreen>
  <LessonHeader title={lesson.title} />
  <MaterialsSection>
    <DialoguePlayer dialogue={dialogue} />
    <VocabularyList words={vocabulary} />
    <GrammarCarousel rules={grammar} />
    <ExampleSentences examples={examples} />
  </MaterialsSection>
  <StartExerciseButton onStart={navigateToExercise} />
</LessonDetailScreen>
```

**Lines:** ~450 lines

---

### **6.5 Exercise Session Screen (Day 16)**
**Main exercise screen (renders appropriate exercise type)**

**Features:**
- Exercise header (question X of Y, timer, quit)
- Progress bar
- Dynamic exercise component based on type
- Answer feedback
- Next question navigation
- Explanation modal

**Component Structure:**
```typescript
<ExerciseSessionScreen>
  <ExerciseHeader
    currentQuestion={currentIndex + 1}
    totalQuestions={questions.length}
    onQuit={handleQuit}
  />
  <ExerciseProgress progress={progress} />

  {/* Dynamic exercise component */}
  {renderExercise(currentQuestion)}

  <AnswerFeedback
    isCorrect={isCorrect}
    explanation={explanation}
  />
  <ExplanationModal ... />
</ExerciseSessionScreen>
```

**Lines:** ~400 lines

---

### **6.6 Exercise Complete Screen (Day 16)**
**Results screen after exercise completion**

**Features:**
- Score display (X/Y correct)
- Accuracy percentage
- Coins earned
- XP earned
- Confetti animation (react-native-confetti-cannon)
- Continue learning button
- Review mistakes button

**Lines:** ~250 lines

---

**Files to Create:**
```
mobile/src/features/learn/screens/
├── LearnDashboardScreen.tsx       # Zones overview
├── TopicsListScreen.tsx           # Topics in zone
├── LessonsListScreen.tsx          # Lessons in topic
├── LessonDetailScreen.tsx         # Lesson content
├── ExerciseSessionScreen.tsx      # Exercise player
├── ExerciseCompleteScreen.tsx     # Results
└── index.ts                       # Exports
```

**Stage 6 Total:**
- **Estimated Lines:** ~2,100 lines
- **Reuse Rate:** 35%

---

## **Stage 7: Polish & Optimization (Days 17-18)**

**Goal:** Final touches, testing, and optimization

### **Tasks:**

#### 7.1 Animations & Transitions
- Screen transitions (slide, fade)
- Answer feedback animations
- Progress bar animations
- Confetti on completion
- Card flip animations

#### 7.2 Offline Support
- Cache lessons/exercises locally
- Queue exercise results for sync
- Offline indicator

#### 7.3 Performance Optimization
- Lazy load exercise components
- Image optimization
- Audio preloading
- Memoization for heavy components

#### 7.4 Testing
- Unit tests for hooks
- Integration tests for exercise flows
- E2E tests for complete lesson flow
- Test on iOS and Android

#### 7.5 Documentation
- Component documentation
- API documentation
- User flow diagrams
- Stage completion report

**Estimated Lines:** ~500 lines (tests, docs)

---

## **Optional: Stage 8 - Advanced Features (Days 19-20)**

**If time permits:**

### **8.1 Leaderboard**
- Weekly/monthly leaderboard
- Friends comparison
- XP rankings

### **8.2 Achievements**
- Unlock badges
- Milestone tracking
- Achievement notifications

### **8.3 Review System**
- Review missed questions
- Practice weak areas
- Custom practice sets

**Estimated Lines:** ~800 lines

---

## **Dependencies Required**

### **New Dependencies (not in Flashcards):**
```json
{
  "react-native-confetti-cannon": "^1.5.2",  // Completion confetti
  "react-native-linear-gradient": "^2.8.0",   // Already added
  "react-native-draggable-flatlist": "^4.0.1", // Drag-and-drop exercises
  "@react-native-community/slider": "^4.5.0"   // Audio player slider
}
```

### **Already Available:**
- react-native-gesture-handler (for drag-and-drop)
- react-native-reanimated (for animations)
- react-native-sound (for audio)
- expo-image-picker (if needed for materials)
- AsyncStorage (for caching)

---

## **Summary**

| Stage | Description | Days | Lines | Reuse % |
|-------|-------------|------|-------|---------|
| 1 | Foundation & Types | 1-2 | 500 | 95% |
| 2 | API Service Layer | 2-4 | 800 | 85% |
| 3 | State Management & Hooks | 5-6 | 1,200 | 55% |
| 4 | Core UI Components | 7-8 | 1,800 | 30% |
| 5 | Exercise Type Implementations | 9-13 | 2,800 | 45% |
| 6 | Main Screens | 14-16 | 2,100 | 35% |
| 7 | Polish & Optimization | 17-18 | 500 | - |
| 8 | Advanced Features (Optional) | 19-20 | 800 | 40% |

**Total Estimated:**
- **Timeline:** 18-20 days
- **Lines of Code:** ~10,500 lines (core) + 800 (optional) = ~11,300 lines
- **Overall Reuse Rate:** ~55-60%

---

## **Key Differences from Flashcards Module**

1. **More Complex Exercise Types:** 8 types vs 1 flashcard type
2. **Interactive Exercises:** Drag-and-drop, role-play, dialogue
3. **Progress System:** Zones → Topics → Lessons → Exercises
4. **Unlock Mechanism:** Coins-based lesson unlocking
5. **Rich Content:** Materials (dialogue, vocabulary, grammar, examples)
6. **Lower Reuse Rate:** More mobile-specific UI (55% vs 63%)

---

## **Recommended Approach**

### **Phase 1 (MVP): Stages 1-6** (16 days)
Get all core features working:
- Complete learning path navigation
- All 8 exercise types functional
- Progress tracking
- Basic UI/UX

### **Phase 2 (Polish): Stage 7** (2 days)
Improve UX and performance:
- Animations
- Offline support
- Testing
- Documentation

### **Phase 3 (Optional): Stage 8** (2 days)
Add engagement features:
- Leaderboard
- Achievements
- Review system

---

## **Risk Assessment**

### **High Complexity:**
- **Exercise Types:** 8 different UIs to build (especially drag-and-drop)
- **Audio Integration:** Multiple audio sources (dialogue, TTS, pronunciation)
- **Progress Sync:** Complex progress tracking across zones/topics/lessons

### **Mitigation:**
- Start with simplest exercise types (MCQ, Error Correction)
- Reuse audio service from Flashcards
- Use existing web logic for progress calculation

### **Medium Complexity:**
- **Lesson Materials:** Various material types (dialogue, vocab, grammar)
- **Unlock System:** Coins-based unlock with validation

### **Low Complexity:**
- **Navigation:** Similar to Flashcards stack navigation
- **Types & API:** High reuse from web

---

## **Success Criteria**

✅ All 8 exercise types working smoothly
✅ Complete learning path navigation (zones → exercises)
✅ Progress tracking and persistence
✅ Unlock system with coins
✅ Audio playback for dialogue and words
✅ Offline capability for downloaded lessons
✅ Smooth animations and transitions
✅ 60fps performance on mid-range devices

---

## **Next Steps**

1. **Review this plan** with stakeholders
2. **Prioritize exercise types** (start with MCQ, Choose Words)
3. **Design exercise UI mockups** for mobile
4. **Set up development environment** with new dependencies
5. **Start Stage 1** when approved

---

**Ready to start building? Let me know if you want to:**
- Adjust timeline/priorities
- See detailed UI mockups for exercises
- Start with Stage 1 implementation
- Focus on specific exercise types first
