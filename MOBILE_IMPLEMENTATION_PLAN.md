# React Native Mobile Implementation Plan
## Vietnamese Learning App - Mobile Version

---

## 📋 Executive Summary

Đây là plan chi tiết để triển khai ứng dụng học tiếng Việt trên React Native, dựa trên codebase web hiện tại. Plan được chia thành 4 phases phát triển theo thứ tự ưu tiên: **Flashcards → Learn → AI Chatbot → User Management**.

**Bottom Navigation:** 4 tabs chính
1. 🎯 **Learn** - Học theo lộ trình có cấu trúc
2. 📇 **Flashcards** - Học từ vựng với flashcard
3. 🤖 **AI** - Chat với AI tutor
4. 👤 **Profile** - Quản lý tài khoản

**Đánh giá khả năng triển khai:**
- ✅ **Có thể triển khai tốt:** Flashcard browse/review, Learn lessons, AI chat cơ bản, User management
- ⚠️ **Cần đơn giản hóa:** Flashcard statistics (dùng chart mobile), một số exercise types phức tạp
- ❌ **Bỏ qua/Ưu tiên cuối:** AI document editing (ProseMirror), Role-play exercises, Advanced AI tools

---

## 1️⃣ FOLDER STRUCTURE - Features-Based Architecture

```
mobile-viovietnamese/
│
├── src/
│   ├── app/                                    # App Entry & Root Configuration
│   │   ├── App.tsx                            # Root component with providers
│   │   ├── navigation/                         # Navigation setup
│   │   │   ├── RootNavigator.tsx              # Main navigator with auth check
│   │   │   ├── BottomTabNavigator.tsx         # Bottom tabs (Learn/Flash/AI/Profile)
│   │   │   ├── AuthNavigator.tsx              # Auth stack (Login/SignUp)
│   │   │   ├── FlashcardNavigator.tsx         # Flashcard stack
│   │   │   ├── LearnNavigator.tsx             # Learn stack
│   │   │   └── types.ts                       # Navigation types
│   │   └── providers/                          # Global providers
│   │       ├── AppProviders.tsx               # Wrapper for all providers
│   │       ├── QueryProvider.tsx              # TanStack Query
│   │       ├── ThemeProvider.tsx              # Theme management
│   │       └── AuthProvider.tsx               # Auth context
│   │
│   ├── features/                               # Feature Modules (Main Logic)
│   │   │
│   │   ├── flashcards/                         # 📇 Flashcard Feature
│   │   │   ├── screens/
│   │   │   │   ├── FlashcardBrowseScreen.tsx  # Browse by topic/type
│   │   │   │   ├── FlashcardReviewScreen.tsx  # Review session
│   │   │   │   ├── FlashcardDetailScreen.tsx  # Single card detail
│   │   │   │   ├── SavedFlashcardsScreen.tsx  # Saved cards
│   │   │   │   ├── FlashcardSearchScreen.tsx  # Search cards
│   │   │   │   └── FlashcardStatsScreen.tsx   # Statistics (simplified)
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── core/
│   │   │   │   │   ├── FlashcardCard.tsx      # Animated flip card
│   │   │   │   │   ├── FlashcardDeck.tsx      # Swipeable deck
│   │   │   │   │   └── FlashcardControls.tsx  # Next/Prev/Audio buttons
│   │   │   │   ├── browse/
│   │   │   │   │   ├── TopicGrid.tsx          # Topic selection grid
│   │   │   │   │   ├── WordTypeFilter.tsx     # Filter by word type
│   │   │   │   │   └── ComplexityFilter.tsx   # Simple/Complex filter
│   │   │   │   ├── review/
│   │   │   │   │   ├── ReviewSessionCard.tsx  # Review UI
│   │   │   │   │   ├── ReviewProgress.tsx     # Progress bar
│   │   │   │   │   └── ReviewSettings.tsx     # Session config
│   │   │   │   ├── saved/
│   │   │   │   │   ├── SavedCardItem.tsx      # Saved card list item
│   │   │   │   │   └── SavedCardsList.tsx     # List with sections
│   │   │   │   └── statistics/
│   │   │   │       ├── SimpleChart.tsx        # Mobile-friendly chart
│   │   │   │       ├── StatsSummary.tsx       # Stats cards
│   │   │   │       └── WeeklyProgress.tsx     # Weekly chart
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useRandomFlashcards.ts     # Fetch random cards
│   │   │   │   ├── useSavedFlashcards.ts      # Saved cards hook
│   │   │   │   ├── useFlashcardSearch.ts      # Search hook
│   │   │   │   ├── useCardFlip.ts             # Flip animation
│   │   │   │   ├── useCardSwipe.ts            # Swipe gestures
│   │   │   │   └── useReviewSession.ts        # Review state
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── flashcardApi.ts            # API client (reuse from web)
│   │   │   │   ├── flashcardCache.ts          # Cache layer
│   │   │   │   └── audioService.ts            # TTS & audio playback
│   │   │   │
│   │   │   ├── store/
│   │   │   │   └── flashcardSlice.ts          # Redux slice (if using Redux)
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── flashcard.types.ts         # TypeScript types (reuse from web)
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── flashcardTransformer.ts    # Data transformers
│   │   │       └── reviewAlgorithm.ts         # Spaced repetition
│   │   │
│   │   ├── learn/                              # 🎯 Learn Feature
│   │   │   ├── screens/
│   │   │   │   ├── LearnHomeScreen.tsx        # Browse topics/zones
│   │   │   │   ├── TopicDetailScreen.tsx      # Chapters & lessons
│   │   │   │   ├── LessonScreen.tsx           # Lesson content
│   │   │   │   ├── ExerciseScreen.tsx         # Exercise interface
│   │   │   │   └── ProgressScreen.tsx         # Learning progress
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── browse/
│   │   │   │   │   ├── ZoneCard.tsx           # Zone selection card
│   │   │   │   │   ├── TopicCard.tsx          # Topic card
│   │   │   │   │   └── ChapterList.tsx        # Chapter list
│   │   │   │   ├── lesson/
│   │   │   │   │   ├── LessonContent.tsx      # Lesson text/media
│   │   │   │   │   ├── LessonProgress.tsx     # Progress indicator
│   │   │   │   │   └── LessonNavigation.tsx   # Prev/Next buttons
│   │   │   │   ├── exercises/
│   │   │   │   │   ├── MultipleChoice.tsx     # MCQ component
│   │   │   │   │   ├── WordMatching.tsx       # Match pairs (drag-drop)
│   │   │   │   │   ├── ChooseWords.tsx        # Fill blanks
│   │   │   │   │   ├── ErrorCorrection.tsx    # Find & fix errors
│   │   │   │   │   ├── GrammarStructure.tsx   # Grammar MCQ
│   │   │   │   │   ├── DialogueCompletion.tsx # Fill dialogue
│   │   │   │   │   └── ExerciseResult.tsx     # Result screen
│   │   │   │   │   # NOTE: Role-play SKIPPED (too complex for Phase 1)
│   │   │   │   └── progress/
│   │   │   │       ├── ProgressChart.tsx      # XP/Level chart
│   │   │   │       ├── StreakCounter.tsx      # Streak display
│   │   │   │       └── CoinBalance.tsx        # Coin display
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useLearningTopics.ts       # Fetch topics
│   │   │   │   ├── useLessonContent.ts        # Fetch lesson
│   │   │   │   ├── useExerciseSession.ts      # Exercise state
│   │   │   │   ├── useUserProgress.ts         # Progress hook
│   │   │   │   └── useUnlockChapter.ts        # Unlock logic
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── learnApi.ts                # API client
│   │   │   │   └── progressService.ts         # Progress sync
│   │   │   │
│   │   │   ├── contexts/
│   │   │   │   ├── ExerciseContext.tsx        # Exercise state (reuse from web)
│   │   │   │   └── UserProgressContext.tsx    # Progress state
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── learn.types.ts             # Types (reuse from web)
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── exerciseGrader.ts          # Grading logic (reuse)
│   │   │       └── exerciseStorage.ts         # AsyncStorage wrapper
│   │   │
│   │   ├── ai/                                 # 🤖 AI Chatbot Feature
│   │   │   ├── screens/
│   │   │   │   ├── ChatHomeScreen.tsx         # Chat list
│   │   │   │   ├── ChatScreen.tsx             # Active chat
│   │   │   │   └── ModelSelectionScreen.tsx   # Choose AI model
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── chat/
│   │   │   │   │   ├── MessageList.tsx        # FlatList of messages
│   │   │   │   │   ├── MessageBubble.tsx      # User/AI message
│   │   │   │   │   ├── StreamingMessage.tsx   # Streaming indicator
│   │   │   │   │   ├── ChatInput.tsx          # Text input with send
│   │   │   │   │   └── SuggestedPrompts.tsx   # Quick suggestions
│   │   │   │   └── models/
│   │   │   │       └── ModelCard.tsx          # Model selector card
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useChat.ts                 # Chat hook (Vercel AI SDK)
│   │   │   │   ├── useChatHistory.ts          # Fetch history
│   │   │   │   └── useStreamResponse.ts       # Handle streaming
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── chatApi.ts                 # Chat API
│   │   │   │   └── aiService.ts               # AI model integration
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── chat.types.ts              # Chat types
│   │   │   │
│   │   │   └── utils/
│   │   │       └── messageFormatter.ts        # Format messages
│   │   │   # NOTE: Document editing SKIPPED (ProseMirror too complex)
│   │   │   # NOTE: Advanced tools (RAG, web search) in Phase 4
│   │   │
│   │   ├── auth/                               # 🔐 Authentication Feature
│   │   │   ├── screens/
│   │   │   │   ├── LoginScreen.tsx            # Email/password + Google
│   │   │   │   ├── SignUpScreen.tsx           # Registration
│   │   │   │   ├── ForgotPasswordScreen.tsx   # Password reset
│   │   │   │   └── OAuthScreen.tsx            # OAuth callback
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx              # Login form
│   │   │   │   ├── SignUpForm.tsx             # Registration form
│   │   │   │   ├── SocialAuthButtons.tsx      # Google/Apple buttons
│   │   │   │   └── AuthHeader.tsx             # Logo & title
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts                 # Auth hook
│   │   │   │   ├── useSession.ts              # Session management
│   │   │   │   └── useOAuth.ts                # OAuth flow
│   │   │   │
│   │   │   ├── services/
│   │   │   │   └── authService.ts             # Supabase auth
│   │   │   │
│   │   │   └── types/
│   │   │       └── auth.types.ts              # Auth types
│   │   │
│   │   └── profile/                            # 👤 User Profile Feature
│   │       ├── screens/
│   │       │   ├── ProfileScreen.tsx          # Profile overview
│   │       │   ├── SettingsScreen.tsx         # App settings
│   │       │   ├── EditProfileScreen.tsx      # Edit profile
│   │       │   └── AboutScreen.tsx            # About app
│   │       │
│   │       ├── components/
│   │       │   ├── ProfileHeader.tsx          # Avatar & name
│   │       │   ├── ProfileStats.tsx           # Coins/XP/Streak
│   │       │   ├── SettingsList.tsx           # Settings list
│   │       │   └── SettingsItem.tsx           # Individual setting
│   │       │
│   │       ├── hooks/
│   │       │   ├── useProfile.ts              # User profile
│   │       │   ├── useSettings.ts             # App settings
│   │       │   └── useUpdateProfile.ts        # Update profile
│   │       │
│   │       ├── services/
│   │       │   └── profileService.ts          # Profile API
│   │       │
│   │       └── types/
│   │           └── profile.types.ts           # Profile types
│   │
│   ├── shared/                                 # Shared Resources
│   │   ├── components/
│   │   │   ├── ui/                            # Reusable UI components
│   │   │   │   ├── Button.tsx                 # Primary button
│   │   │   │   ├── Card.tsx                   # Card container
│   │   │   │   ├── Input.tsx                  # Text input
│   │   │   │   ├── Badge.tsx                  # Status badge
│   │   │   │   ├── Avatar.tsx                 # User avatar
│   │   │   │   ├── Tabs.tsx                   # Tab component
│   │   │   │   ├── Modal.tsx                  # Modal dialog
│   │   │   │   ├── Spinner.tsx                # Loading spinner
│   │   │   │   ├── Toast.tsx                  # Toast notification
│   │   │   │   ├── ProgressBar.tsx            # Progress bar
│   │   │   │   ├── Checkbox.tsx               # Checkbox
│   │   │   │   ├── RadioButton.tsx            # Radio button
│   │   │   │   ├── Slider.tsx                 # Slider input
│   │   │   │   ├── Switch.tsx                 # Toggle switch
│   │   │   │   └── SearchBar.tsx              # Search input
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Screen.tsx                 # Screen wrapper
│   │   │   │   ├── Container.tsx              # Container
│   │   │   │   ├── Header.tsx                 # Screen header
│   │   │   │   └── SafeArea.tsx               # Safe area wrapper
│   │   │   │
│   │   │   └── feedback/
│   │   │       ├── EmptyState.tsx             # Empty list state
│   │   │       ├── ErrorState.tsx             # Error display
│   │   │       └── LoadingState.tsx           # Loading skeleton
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts                 # Debounce hook
│   │   │   ├── useTheme.ts                    # Theme hook
│   │   │   ├── useKeyboard.ts                 # Keyboard events
│   │   │   ├── useNetworkStatus.ts            # Network detection
│   │   │   └── useOrientation.ts              # Device orientation
│   │   │
│   │   ├── utils/
│   │   │   ├── api/
│   │   │   │   ├── apiClient.ts               # Base API client
│   │   │   │   ├── apiConfig.ts               # API configuration
│   │   │   │   └── apiErrors.ts               # Error handling
│   │   │   ├── storage/
│   │   │   │   ├── asyncStorage.ts            # AsyncStorage wrapper
│   │   │   │   └── secureStorage.ts           # Secure storage
│   │   │   ├── helpers/
│   │   │   │   ├── dateFormatter.ts           # Date utilities
│   │   │   │   ├── validation.ts              # Form validation
│   │   │   │   └── logger.ts                  # Logging utility
│   │   │   └── constants/
│   │   │       ├── colors.ts                  # Color palette
│   │   │       ├── typography.ts              # Font styles
│   │   │       └── spacing.ts                 # Spacing values
│   │   │
│   │   ├── types/
│   │   │   ├── navigation.types.ts            # Navigation types
│   │   │   ├── api.types.ts                   # API types
│   │   │   └── common.types.ts                # Common types
│   │   │
│   │   └── lib/
│   │       ├── supabase/
│   │       │   ├── client.ts                  # Supabase client
│   │       │   └── config.ts                  # Supabase config
│   │       └── analytics/
│   │           └── analytics.ts               # Analytics service
│   │
│   └── assets/                                 # Static Assets
│       ├── images/
│       │   ├── icons/                         # App icons
│       │   ├── illustrations/                 # Illustrations
│       │   └── logos/                         # Logo assets
│       ├── sounds/
│       │   ├── correct.mp3                    # Success sound
│       │   └── incorrect.mp3                  # Error sound
│       └── fonts/
│           └── [custom-fonts]                 # Custom fonts
│
├── ios/                                        # iOS native code
├── android/                                    # Android native code
│
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── app.json
└── README.md
```

---

## 2️⃣ REQUIRED LIBRARIES & DEPENDENCIES

### **Core Framework & Navigation**
```json
{
  "dependencies": {
    // React Native Core
    "react": "^19.1.0",
    "react-native": "^0.76.0",

    // Navigation (Bottom tabs + Stack)
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "@react-navigation/stack": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "react-native-screens": "^4.4.0",
    "react-native-safe-area-context": "^4.18.0",

    // Gesture Handler (for swipe, drag)
    "react-native-gesture-handler": "^2.22.0",
    "react-native-reanimated": "^3.17.0"
  }
}
```

### **State Management & Data Fetching**
```json
{
  "dependencies": {
    // State management (choose one)
    "@tanstack/react-query": "^5.90.5",         // For server state (recommended)
    "zustand": "^5.0.0",                         // For local state (alternative to Redux)
    // OR
    "@reduxjs/toolkit": "^2.0.0",                // If prefer Redux
    "react-redux": "^9.0.0",

    // Persistence
    "@react-native-async-storage/async-storage": "^2.1.0",
    "react-native-mmkv": "^3.0.0"                // Faster alternative to AsyncStorage
  }
}
```

### **Authentication & Backend (Supabase)**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.77.0",          // Supabase client
    "react-native-url-polyfill": "^2.0.0",       // URL polyfill for Supabase

    // OAuth (Google Sign-In)
    "@react-native-google-signin/google-signin": "^14.0.0",

    // Secure storage for tokens
    "react-native-keychain": "^8.2.0"
  }
}
```

### **AI & Chat Features**
```json
{
  "dependencies": {
    // Vercel AI SDK (for chat streaming)
    "ai": "^5.0.89",
    "@ai-sdk/react-native": "^1.0.0",            // React Native adapter

    // WebSocket for real-time
    "react-native-websocket": "^1.0.0",

    // Markdown rendering (for AI responses)
    "react-native-markdown-display": "^7.0.0"
  }
}
```

### **Flashcard Animations & Gestures**
```json
{
  "dependencies": {
    // Card flip animation
    "react-native-reanimated": "^3.17.0",
    "react-native-gesture-handler": "^2.22.0",

    // Swipeable cards (Tinder-style)
    "react-native-deck-swiper": "^2.0.0",
    // OR build custom with
    "react-native-pan-responder": "built-in"
  }
}
```

### **Audio & Media**
```json
{
  "dependencies": {
    // Audio playback (for pronunciation)
    "react-native-sound": "^0.11.2",
    // OR
    "expo-av": "~14.0.0",                        // If using Expo

    // Audio recording (for pronunciation practice)
    "react-native-audio-recorder-player": "^3.6.0"
  }
}
```

### **Charts & Visualization (Statistics)**
```json
{
  "dependencies": {
    // Mobile-friendly charts (simpler than Recharts)
    "react-native-chart-kit": "^6.12.0",         // Simple charts
    "react-native-svg": "^15.9.0",               // Required for charts

    // OR more advanced
    "victory-native": "^37.0.0"                  // More customizable
  }
}
```

### **UI Components & Styling**
```json
{
  "dependencies": {
    // UI Library (optional, can build from scratch)
    "react-native-paper": "^5.15.0",             // Material Design
    // OR
    "@rneui/themed": "^5.0.0",                   // React Native Elements
    // OR
    "tamagui": "^1.0.0",                         // Modern UI kit with performance

    // Icons
    "react-native-vector-icons": "^10.3.0",
    // OR
    "@expo/vector-icons": "^14.0.0",             // If using Expo

    // Toast/Snackbar notifications
    "react-native-toast-message": "^3.0.0",

    // Bottom sheets
    "@gorhom/bottom-sheet": "^5.0.0",

    // Loading indicators
    "react-native-skeleton-placeholder": "^6.0.0"
  }
}
```

### **Form & Validation**
```json
{
  "dependencies": {
    "react-hook-form": "^7.55.0",                // Form state management
    "zod": "^3.23.0",                            // Schema validation
    "@hookform/resolvers": "^3.9.0"              // Zod + React Hook Form
  }
}
```

### **Utilities**
```json
{
  "dependencies": {
    // Date utilities (reuse from web)
    "date-fns": "^4.1.0",
    "dayjs": "^1.11.19",

    // Class utilities
    "clsx": "^2.1.1",

    // Lodash utilities
    "lodash": "^4.17.21"
  }
}
```

### **Development Tools**
```json
{
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-native": "^0.76.0",
    "typescript": "^5.0.0",

    // Testing
    "@testing-library/react-native": "^12.0.0",
    "jest": "^29.0.0",

    // Linting
    "@react-native/eslint-config": "^0.76.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

### **Feature Mapping: Web → Mobile Libraries**

| Feature | Web Library | Mobile Equivalent | Notes |
|---------|-------------|-------------------|-------|
| **Routing** | Next.js App Router | React Navigation | Stack + Bottom Tabs |
| **UI Components** | Radix UI | React Native Paper / RNE | Native components |
| **Animations** | Framer Motion | Reanimated + Gesture Handler | More performant |
| **Charts** | Recharts | React Native Chart Kit | Simpler API |
| **State** | TanStack Query + Context | Same + Zustand | Same patterns |
| **Auth** | Supabase (web) | Supabase (RN) | Same SDK |
| **AI Chat** | Vercel AI SDK | AI SDK (RN adapter) | Streaming support |
| **Storage** | localStorage | AsyncStorage / MMKV | Key-value store |
| **Audio** | Web Audio API | React Native Sound | Native audio |
| **Markdown** | ProseMirror | Markdown Display | Simpler (no editing) |
| **Toasts** | Sonner | Toast Message | Native toasts |
| **Icons** | Lucide React | Vector Icons | Similar API |

---

## 3️⃣ DEVELOPMENT PHASES - Priority-Based Implementation

### **🎯 PHASE 1: FLASHCARDS FEATURE** (Priority: HIGHEST)
**Estimated Time:** 3-4 weeks
**Goal:** Core flashcard functionality with browse, review, and save features

#### **1.1 Setup & Foundation** (Week 1)
- [ ] **1.1.1** Initialize React Native project with TypeScript
  ```bash
  npx react-native@latest init MobileVioVietnamese --template react-native-template-typescript
  ```
- [ ] **1.1.2** Setup folder structure (features-based)
- [ ] **1.1.3** Install core dependencies
  - React Navigation (bottom tabs + stack)
  - Supabase client
  - TanStack Query
  - Reanimated + Gesture Handler
- [ ] **1.1.4** Configure Supabase client for React Native
- [ ] **1.1.5** Setup environment variables (.env)
- [ ] **1.1.6** Create bottom tab navigator skeleton (4 tabs)
- [ ] **1.1.7** Setup TypeScript paths (similar to web)

#### **1.2 Flashcard Core Components** (Week 1-2)
- [ ] **1.2.1** Create reusable UI components
  - Button, Card, Badge, Input, Spinner
  - Screen wrapper, Header, SafeArea
- [ ] **1.2.2** Implement FlashcardCard component
  - Front/back layout with Vietnamese/English
  - Audio playback button
  - Save/unsave button
  - Image display support
- [ ] **1.2.3** Add card flip animation (Reanimated)
  ```typescript
  // Use interpolate for 3D flip effect
  const flipAnimation = useSharedValue(0);
  const rotate = interpolate(flipAnimation.value, [0, 1], [0, 180]);
  ```
- [ ] **1.2.4** Implement swipe gestures (left/right for next/prev)
  - Use PanGestureHandler
  - Snap animation after swipe
  - Optional: Swipe up to save, down to skip

#### **1.3 Flashcard API & Data Layer** (Week 2)
- [ ] **1.3.1** Port API client from web (`flashcardApi.ts`)
  - Reuse exact same endpoints
  - Adapt fetch for React Native
- [ ] **1.3.2** Setup TanStack Query with flashcard queries
  - `useRandomFlashcards`
  - `useFlashcardsByTopic`
  - `useSavedFlashcards`
  - `useFlashcardSearch`
- [ ] **1.3.3** Implement AsyncStorage cache layer
  - Cache daily flashcard set
  - Cache saved flashcard IDs
- [ ] **1.3.4** Reuse TypeScript types from web (`flashcard.types.ts`)

#### **1.4 Browse & Filter Features** (Week 2-3)
- [ ] **1.4.1** FlashcardBrowseScreen
  - Topic grid (Food, Travel, Business, etc.)
  - Word type filter (Noun, Verb, Adjective)
  - Complexity filter (Simple/Complex)
- [ ] **1.4.2** Search functionality
  - SearchBar with debounce
  - Real-time results list
  - Recent searches (stored in AsyncStorage)
- [ ] **1.4.3** Topic detail screen
  - List flashcards by topic
  - Filter within topic
  - Start review session button

#### **1.5 Review Session** (Week 3)
- [ ] **1.5.1** Review session configuration
  - Select topic/complexity/word type
  - Choose number of cards (10/25/50)
  - Start session
- [ ] **1.5.2** Review session UI (FlashcardReviewScreen)
  - Swipeable card deck
  - Progress indicator (5/25)
  - Flip card gesture
  - Audio autoplay option
  - Exit confirmation
- [ ] **1.5.3** Session state management
  - Track current index
  - Save session progress (resume later)
  - Record review stats
- [ ] **1.5.4** Review completion screen
  - Summary stats
  - Option to restart
  - Return to browse

#### **1.6 Saved Flashcards** (Week 3)
- [ ] **1.6.1** Save/unsave functionality
  - Heart icon toggle
  - Sync with Supabase
  - Optimistic updates
- [ ] **1.6.2** SavedFlashcardsScreen
  - List of saved cards (SectionList)
  - Group by topic/date
  - Swipe to delete
- [ ] **1.6.3** Add notes to saved cards (optional)
  - Modal with text input
  - Store in Supabase

#### **1.7 Audio Integration** (Week 4)
- [ ] **1.7.1** Setup audio library (react-native-sound or expo-av)
- [ ] **1.7.2** Implement TTS playback
  - Play Vietnamese pronunciation
  - Play/pause/stop controls
  - Audio caching
- [ ] **1.7.3** Audio settings
  - Volume control
  - Autoplay toggle
  - Voice selection (if supported)

#### **1.8 Statistics (Simplified)** (Week 4)
- [ ] **1.8.1** Stats summary cards
  - Cards reviewed today
  - Total cards learned
  - Current streak
  - Time spent
- [ ] **1.8.2** Simple charts (react-native-chart-kit)
  - Weekly review count (BarChart)
  - Study time (LineChart)
  - **SKIP:** Complex accuracy tracking (too much for Phase 1)
- [ ] **1.8.3** Fetch stats from backend
  - Daily aggregation
  - Weekly/monthly views

#### **✅ Phase 1 Deliverables:**
- ✅ Fully functional flashcard browsing by topic/type/complexity
- ✅ Animated card flip & swipe gestures
- ✅ Audio pronunciation playback
- ✅ Review sessions with progress tracking
- ✅ Save/unsave cards with persistence
- ✅ Search functionality
- ✅ Basic statistics with simple charts
- ❌ **SKIPPED:** Advanced statistics (detailed accuracy, weak areas)

---

### **🎓 PHASE 2: LEARN FEATURE** (Priority: HIGH)
**Estimated Time:** 4-5 weeks
**Goal:** Structured learning with lessons and exercises

#### **2.1 Learn Foundation & Navigation** (Week 5)
- [ ] **2.1.1** Setup Learn feature structure
  - Screens, components, hooks folders
- [ ] **2.1.2** Create Learn stack navigator
  - Home → Topic Detail → Lesson → Exercise
- [ ] **2.1.3** Reuse types from web
  - `Zone`, `Topic`, `Chapter`, `Lesson`, `Exercise`

#### **2.2 Browse Topics & Zones** (Week 5-6)
- [ ] **2.2.1** LearnHomeScreen
  - Horizontal scroll for zones (Beginner → Expert)
  - Topic cards with progress indicators
  - "Continue learning" quick access
- [ ] **2.2.2** TopicDetailScreen
  - Chapter list with lock/unlock icons
  - Lesson cards with completion status
  - Coin balance display
  - Unlock chapter modal

#### **2.3 Lesson Content Display** (Week 6)
- [ ] **2.3.1** LessonScreen
  - Scrollable lesson content
  - Text, images, audio support
  - Code examples (if any)
  - Progress bar at top
- [ ] **2.3.2** Lesson navigation
  - Previous/Next lesson buttons
  - "Start exercise" button at end
  - Mark as complete

#### **2.4 Exercise System - Foundation** (Week 6-7)
- [ ] **2.4.1** ExerciseContext setup (reuse from web)
  - Exercise state management
  - Question navigation
  - Answer submission
  - Grading logic
- [ ] **2.4.2** ExerciseScreen layout
  - Question display area
  - Answer input area
  - Submit/Next buttons
  - Progress indicator (Question 3/10)
  - Timer (optional)
- [ ] **2.4.3** Exercise result screen
  - Score display
  - Correct/incorrect breakdown
  - Review answers button
  - Continue to next lesson

#### **2.5 Exercise Types Implementation** (Week 7-9)
**Implement in priority order:**

##### **Priority 1: Simple Exercises** (Week 7)
- [ ] **2.5.1** Multiple Choice (MultipleChoice.tsx)
  - Question text
  - 4 answer buttons
  - Highlight correct/incorrect
  - Explanation on submit
- [ ] **2.5.2** Choose Words (ChooseWords.tsx)
  - Fill-in-the-blank with word bank
  - Drag words or tap to select
  - Support multiple blanks

##### **Priority 2: Medium Exercises** (Week 8)
- [ ] **2.5.3** Word Matching (WordMatching.tsx)
  - Two columns: Vietnamese ↔ English
  - Drag-and-drop or tap-to-match
  - Visual connection lines
  - Can use `react-native-draggable-flatlist`
- [ ] **2.5.4** Error Correction (ErrorCorrection.tsx)
  - Sentence with underlined errors
  - Tap to highlight error
  - Input correction
  - Show correct answer

##### **Priority 3: Advanced Exercises** (Week 8-9)
- [ ] **2.5.5** Dialogue Completion (DialogueCompletion.tsx)
  - Conversation with blanks
  - Fill in missing phrases
  - Context hints
- [ ] **2.5.6** Grammar Structure (GrammarStructure.tsx)
  - Grammar-focused MCQ
  - Sentence transformation
  - Rule explanations

##### **Priority 4: Complex (Optional/Phase 4)**
- [ ] **2.5.7** Synonym Matching (if time allows)
- [ ] **2.5.8** Role-play exercises
  - **SKIP or SIMPLIFY:** Too complex for Phase 2
  - Alternative: Simple dialogue selection (MCQ-style)

#### **2.6 Progress & Gamification** (Week 9)
- [ ] **2.6.1** UserProgressContext (reuse from web)
  - Coins, XP, level, streak
  - Completed lessons tracking
  - Unlocked chapters
- [ ] **2.6.2** Coin system
  - Earn coins on lesson completion
  - Spend coins to unlock chapters
  - Coin balance display
- [ ] **2.6.3** XP & Level system
  - Earn XP from exercises
  - Level up notifications
  - Progress bar
- [ ] **2.6.4** Streak tracking
  - Daily streak counter
  - Streak calendar view
  - Push notification reminder (Phase 4)

#### **2.7 Exercise Persistence** (Week 9)
- [ ] **2.7.1** Save exercise progress
  - Store in AsyncStorage
  - Resume on app restart
  - Sync with backend (optional)
- [ ] **2.7.2** Exercise history
  - Past attempts
  - Scores over time
  - Weak topics identification

#### **✅ Phase 2 Deliverables:**
- ✅ Browse zones/topics/chapters/lessons
- ✅ Complete lesson content display
- ✅ 6 exercise types implemented:
  - Multiple Choice
  - Word Matching
  - Choose Words
  - Error Correction
  - Dialogue Completion
  - Grammar Structure
- ✅ Progress tracking (XP, coins, levels, streaks)
- ✅ Chapter unlock system
- ✅ Exercise persistence & resume
- ❌ **SKIPPED:** Role-play exercises (too complex)
- ❌ **SKIPPED:** Advanced synonym matching (if time limited)

---

### **🤖 PHASE 3: AI CHATBOT** (Priority: MEDIUM)
**Estimated Time:** 3-4 weeks
**Goal:** Interactive AI tutor for Vietnamese learning

#### **3.1 Chat Foundation** (Week 10)
- [ ] **3.1.1** Setup AI feature structure
- [ ] **3.1.2** Install AI SDK dependencies
  ```bash
  npm install ai @ai-sdk/react-native
  ```
- [ ] **3.1.3** Create chat API routes
  - POST `/api/chat` - Send message
  - GET `/api/chat/[id]` - Fetch history
  - POST `/api/chat/stream` - Streaming endpoint
- [ ] **3.1.4** Configure AI models
  - OpenAI (default)
  - Google (alternative)
  - Model selection UI

#### **3.2 Chat UI Components** (Week 10-11)
- [ ] **3.2.1** ChatScreen layout
  - MessageList (FlatList with inverted)
  - ChatInput (TextInput + Send button)
  - Header with model selector
- [ ] **3.2.2** MessageBubble component
  - User messages (right, blue)
  - AI messages (left, gray)
  - Timestamp
  - Loading indicator
- [ ] **3.2.3** Streaming message display
  - Typewriter effect (append text)
  - StreamingMessage component with "..."
- [ ] **3.2.4** Suggested prompts
  - Quick action chips
  - "Explain grammar", "Translate", "Practice conversation"

#### **3.3 Chat Functionality** (Week 11)
- [ ] **3.3.1** useChat hook (Vercel AI SDK)
  ```typescript
  const { messages, input, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    onFinish: (message) => { /* Save to Supabase */ }
  });
  ```
- [ ] **3.3.2** Message submission
  - Send on button press
  - Send on Enter key (keyboard)
  - Clear input after send
  - Disable during loading
- [ ] **3.3.3** Chat persistence
  - Save messages to Supabase
  - Load history on screen mount
  - Multiple chat sessions

#### **3.4 AI Model Integration** (Week 11-12)
- [ ] **3.4.1** Model selection screen
  - Friendly Tutor (fast, simple)
  - Insightful Tutor (deep, reasoning)
  - Model descriptions
- [ ] **3.4.2** Backend API implementation
  - OpenAI integration (GPT-4o)
  - Google integration (Gemini)
  - Streaming responses
  - Error handling

#### **3.5 Basic AI Features** (Week 12)
- [ ] **3.5.1** System prompts
  - Vietnamese tutor persona
  - Friendly & encouraging tone
  - Grammar correction mode
- [ ] **3.5.2** Context management
  - Recent messages in context
  - Token limit handling
  - Context reset option
- [ ] **3.5.3** Message voting (optional)
  - Thumbs up/down
  - Feedback submission

#### **3.6 Simplified Features (No Document Editing)** (Week 12-13)
- [ ] **3.6.1** Text formatting (Markdown display)
  - Use `react-native-markdown-display`
  - Bold, italic, code blocks
  - Lists, quotes
  - **SKIP:** Rich text editing (no ProseMirror)
- [ ] **3.6.2** Basic tools (optional, if time)
  - Vietnamese RAG (search learning content)
  - Simple conversation practice
  - **SKIP:** Advanced tools (web search, database queries)

#### **3.7 Chat Management** (Week 13)
- [ ] **3.7.1** ChatHomeScreen
  - List of past chats
  - Create new chat button
  - Delete chat swipe action
- [ ] **3.7.2** Chat settings
  - Clear history
  - Export chat (text file)

#### **✅ Phase 3 Deliverables:**
- ✅ AI chat interface with streaming responses
- ✅ Multiple AI models (OpenAI, Google)
- ✅ Chat history persistence
- ✅ Markdown message rendering
- ✅ Model selection UI
- ✅ Suggested prompts for quick interactions
- ⚠️ **SIMPLIFIED:** Basic tool calling (RAG only)
- ❌ **SKIPPED:** Document editing (ProseMirror too complex)
- ❌ **SKIPPED:** Advanced tools (web search, database queries)

---

### **👤 PHASE 4: USER MANAGEMENT & POLISH** (Priority: ESSENTIAL)
**Estimated Time:** 2-3 weeks
**Goal:** Authentication, profile, settings, and app polish

#### **4.1 Authentication** (Week 14)
- [ ] **4.1.1** Setup Supabase Auth for React Native
  - Configure deep linking for OAuth
  - Setup Google Sign-In
- [ ] **4.1.2** LoginScreen
  - Email/password form
  - Google Sign-In button
  - "Forgot password" link
  - Form validation
- [ ] **4.1.3** SignUpScreen
  - Registration form
  - Email/password
  - Name field
  - Terms & conditions
- [ ] **4.1.4** ForgotPasswordScreen
  - Email input
  - Send reset email
  - Confirmation message
- [ ] **4.1.5** OAuth flow
  - Google Sign-In integration
  - Redirect handling
  - Token storage (react-native-keychain)

#### **4.2 Auth State Management** (Week 14)
- [ ] **4.2.1** AuthContext/AuthProvider
  - User state
  - Login/logout functions
  - Session persistence
- [ ] **4.2.2** Auth navigation guard
  - Redirect to login if not authenticated
  - Redirect to home if already logged in
- [ ] **4.2.3** Session management
  - Auto-refresh tokens
  - Handle expired sessions
  - Logout on 401 errors

#### **4.3 User Profile** (Week 15)
- [ ] **4.3.1** ProfileScreen
  - Avatar display
  - Name, email
  - Stats cards (coins, XP, streak)
  - Subscription type
- [ ] **4.3.2** EditProfileScreen
  - Edit name
  - Change avatar (image picker)
  - Update password
- [ ] **4.3.3** Profile API integration
  - Fetch user profile
  - Update profile
  - Upload avatar to Supabase Storage

#### **4.4 Settings** (Week 15)
- [ ] **4.4.1** SettingsScreen
  - Account settings
  - App preferences
  - About app
  - Logout button
- [ ] **4.4.2** App preferences
  - Animation speed (slow/normal/fast)
  - Sound effects (on/off)
  - Volume control
  - Haptic feedback
  - Theme (light/dark/auto)
- [ ] **4.4.3** Settings persistence
  - Store in AsyncStorage/MMKV
  - useSettings hook

#### **4.5 App Polish & UX** (Week 15-16)
- [ ] **4.5.1** Splash screen
  - Logo animation
  - Loading spinner
- [ ] **4.5.2** Onboarding flow (optional)
  - Welcome screens (3-4 slides)
  - Feature highlights
  - Skip button
- [ ] **4.5.3** Empty states
  - No flashcards
  - No saved cards
  - No chat history
- [ ] **4.5.4** Error handling
  - Network errors
  - API errors
  - Retry mechanisms
  - Offline mode message
- [ ] **4.5.5** Loading states
  - Skeleton loaders
  - Shimmer effects
  - Pull-to-refresh

#### **4.6 Notifications (Optional)** (Week 16)
- [ ] **4.6.1** Push notifications setup
  - Firebase Cloud Messaging (FCM)
  - iOS push certificates
- [ ] **4.6.2** Notification types
  - Daily reminder to study
  - Streak about to break
  - New lesson unlocked
- [ ] **4.6.3** Notification settings
  - Enable/disable
  - Notification time
  - Sound/vibration

#### **4.7 Performance & Optimization** (Week 16)
- [ ] **4.7.1** Performance audit
  - Reduce unnecessary re-renders
  - Memoize expensive computations
  - Optimize FlatList rendering
- [ ] **4.7.2** Image optimization
  - Use FastImage
  - Image caching
  - Lazy loading
- [ ] **4.7.3** Code splitting
  - Lazy load feature modules
  - Reduce bundle size
- [ ] **4.7.4** Analytics integration (optional)
  - Firebase Analytics
  - Track user actions
  - Crash reporting (Sentry)

#### **✅ Phase 4 Deliverables:**
- ✅ Complete authentication (email/password + Google OAuth)
- ✅ User profile management
- ✅ App settings & preferences
- ✅ Splash screen & onboarding
- ✅ Empty states & error handling
- ✅ Performance optimizations
- ⚠️ **OPTIONAL:** Push notifications (if time allows)
- ⚠️ **OPTIONAL:** Analytics integration

---

## 📊 SUMMARY & TIMELINE

### **Total Estimated Time: 14-16 weeks (3.5-4 months)**

| Phase | Feature | Duration | Priority | Complexity |
|-------|---------|----------|----------|------------|
| 1 | **Flashcards** | 3-4 weeks | HIGHEST | Medium |
| 2 | **Learn** | 4-5 weeks | HIGH | High |
| 3 | **AI Chatbot** | 3-4 weeks | MEDIUM | Medium-High |
| 4 | **User Management** | 2-3 weeks | ESSENTIAL | Low-Medium |
| **TOTAL** | | **14-16 weeks** | | |

### **Features Successfully Implemented:**
✅ Flashcard browse, review, save (with audio, animations)
✅ Structured learning with 6 exercise types
✅ AI chatbot with streaming responses
✅ User authentication & profile management
✅ Progress tracking (XP, coins, streaks)
✅ Basic statistics with mobile-friendly charts

### **Features Simplified:**
⚠️ **Flashcard Statistics** - Simpler charts (react-native-chart-kit instead of Recharts)
⚠️ **AI Features** - Basic tools only, no advanced RAG/web search in Phase 1
⚠️ **Exercise Types** - 6 types instead of 8 (skipped Role-play)

### **Features Skipped/Phase 5:**
❌ **AI Document Editing** - ProseMirror too complex for mobile (use simple text input)
❌ **Role-play Exercises** - Too complex, requires real-time voice interaction
❌ **Advanced AI Tools** - Web search (Tavily), database queries, complex tool calling
❌ **Complex Statistics** - Detailed accuracy tracking, weak areas analysis

---

## 🎯 RECOMMENDED APPROACH

1. **Start with Phase 1 (Flashcards)** - This is the most valuable feature for vocabulary learning and will give you a complete vertical slice of the app (API, UI, navigation, state management).

2. **Build reusable components early** - Invest time in creating a solid UI component library (Button, Card, Input, etc.) that you can reuse across all features.

3. **Reuse web logic** - Copy TypeScript types, API clients, utility functions, and business logic (like exercise grading) directly from the web codebase.

4. **Mobile-first design** - Focus on touch-friendly interfaces, gestures, and native mobile patterns (bottom sheets, swipe actions, etc.).

5. **Test on devices** - Test frequently on real iOS/Android devices, not just simulators, especially for gestures and audio.

6. **Iterate based on feedback** - After Phase 1, get user feedback before continuing to Phase 2. Adjust priorities if needed.

---

## 🚀 NEXT STEPS

1. **Review this plan** - Make sure you agree with priorities and feature scope
2. **Setup development environment** - Install React Native, iOS/Android SDKs
3. **Create project** - Initialize React Native project with TypeScript
4. **Start Phase 1** - Begin with Flashcards feature
5. **Daily commits** - Commit progress daily to track development

---

**Plan Version:** 1.0
**Created:** 2025-11-20
**Author:** Claude (Sonnet 4.5)
