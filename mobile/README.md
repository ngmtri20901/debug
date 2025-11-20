# Vio Vietnamese - Mobile App (React Native)

React Native mobile application for learning Vietnamese language.

## Setup

### Prerequisites

- Node.js >= 18
- React Native development environment setup
  - For iOS: Xcode, CocoaPods
  - For Android: Android Studio, JDK 17

### Installation

```bash
# Install dependencies
npm install

# iOS only: Install CocoaPods
cd ios && pod install && cd ..
```

### Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update values in `.env`:
   ```
   API_URL=http://your-backend-url:8000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   GOOGLE_WEB_CLIENT_ID=your-google-client-id
   ```

### Running the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Project Structure

```
mobile/
├── src/
│   ├── app/                    # App entry & navigation
│   ├── features/               # Feature modules
│   │   ├── flashcards/        # Flashcards feature
│   │   │   ├── types/         # TypeScript types
│   │   │   ├── services/      # API services
│   │   │   ├── hooks/         # React hooks
│   │   │   ├── utils/         # Utilities
│   │   │   └── components/    # UI components
│   │   ├── learn/             # Learning feature
│   │   ├── ai/                # AI chatbot
│   │   └── profile/           # User profile
│   └── shared/                # Shared resources
│       ├── components/        # Reusable UI components
│       ├── hooks/             # Shared hooks
│       └── utils/             # Utilities
├── package.json
└── tsconfig.json
```

## Development Progress

### ✅ Stage 1: Foundation & Core Types (Days 1-2) - COMPLETE
- [x] Folder structure setup
- [x] TypeScript types (flashcard.types.ts, session.types.ts)
- [x] API client adapted for React Native
- [x] Data transformers
- [x] Environment configuration

### ✅ Stage 2: API Service Layer (Days 2-3) - COMPLETE
- [x] flashcardService.ts (25+ API methods)
- [x] sessions.ts (session validation & generation)
- [x] statisticsService.ts (stats tracking)
- [x] Supabase client for React Native
- [x] Unit tests for services

### ✅ Stage 3: Data Utilities & Caching (Day 3) - COMPLETE
- [x] daily-cache.ts (AsyncStorage adaptation)
- [x] storage.ts (generic AsyncStorage wrapper)
- [x] audioService.ts (audio playback service)
- [x] Unit tests for utilities

### ✅ Stage 4: React Hooks Layer (Days 5-6) - COMPLETE
- [x] useRandomFlashcards (with caching)
- [x] useSavedFlashcards (with Supabase)
- [x] useFlashcardReview (review session state)
- [x] useCardFlip (flip animation - NEW)
- [x] useCardSwipe (swipe gestures - NEW)
- [x] Comprehensive test suite (54 tests)

### 🔄 Stage 5: Browse & Display Features (Days 7-10) - NEXT
UI implementation starts here:
- Daily Practice Screen (with flip/swipe animations)
- Browse Topics Screen
- Topic Flashcards Screen
- Saved Flashcards Screen

### ⏳ Upcoming Stages

6. **Stage 6**: Review Session Feature (Days 11-14)
7. **Stage 7**: Statistics Feature (Days 15-16)

## Key Files

### Stage 1: Foundation
- `src/features/flashcards/types/flashcard.types.ts` - Flashcard data structures
- `src/features/flashcards/types/session.types.ts` - Review session types
- `src/features/flashcards/utils/apiClient.ts` - API client (adapted for RN)
- `src/features/flashcards/utils/transformers.ts` - Data transformers

### Stage 2: API Services
- `src/features/flashcards/services/flashcardService.ts` - 25+ API methods
- `src/features/flashcards/services/sessions.ts` - Session validation
- `src/features/flashcards/services/statisticsService.ts` - Stats tracking
- `src/shared/lib/supabase/client.ts` - Supabase mobile client

### Stage 3: Utilities
- `src/features/flashcards/utils/daily-cache.ts` - Daily flashcard caching
- `src/shared/utils/storage.ts` - Generic AsyncStorage wrapper
- `src/features/flashcards/services/audioService.ts` - Audio playback

### Stage 4: React Hooks
- `src/features/flashcards/hooks/useRandomFlashcards.ts` - Random flashcards with cache
- `src/features/flashcards/hooks/useSavedFlashcards.ts` - Save/bookmark management
- `src/features/flashcards/hooks/useFlashcardReview.ts` - Review session logic
- `src/features/flashcards/hooks/useCardFlip.ts` - Flip animation (NEW)
- `src/features/flashcards/hooks/useCardSwipe.ts` - Swipe gestures (NEW)

## Notes

- **Reuse Rate**: ~63% of logic reused from web app
- **New Code**: ~37% mobile-specific (UI, native features)
- **Architecture**: Features-based (same as web)
- **State Management**: TanStack Query + Zustand
- **Navigation**: React Navigation (Bottom Tabs + Stack)
