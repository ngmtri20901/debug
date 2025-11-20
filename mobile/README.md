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

### ✅ Stage 5: Browse & Display Features (Days 7-10) - COMPLETE
- [x] Dashboard Screen (Hero, Quick Actions, Topics)
- [x] Review Mode Screen (flip/swipe animations)
- [x] Topic Detail Screen (browse cards with pagination)
- [x] Saved Cards Screen (search/filter/manage)
- [x] FlashCard component (3D flip animation)
- [x] Shared UI components (Card, Button, Header)
- [x] Complete theme system (colors, shadows, spacing)

### ✅ Stage 6: Final Screens (Days 11-14) - COMPLETE
- [x] Create Flashcard Screen (form with validation and image upload)
- [x] Statistics Dashboard Screen (charts and metrics)
- [x] Integration with expo-image-picker
- [x] Integration with react-native-chart-kit

### 🎉 Flashcards Module Complete!

All 6 main screens implemented:
1. Dashboard - Main hub with daily practice
2. Review Mode - Learning screen with animations
3. Topic Detail - Browse flashcards by topic
4. Saved Cards - Manage bookmarked cards
5. Create Flashcard - Add/edit custom cards
6. Statistics - Track progress with charts

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

### Stage 5: UI Components & Screens
- `src/features/flashcards/screens/DashboardScreen.tsx` - Main hub with hero section
- `src/features/flashcards/screens/ReviewModeScreen.tsx` - Learning screen with animations
- `src/features/flashcards/screens/TopicDetailScreen.tsx` - Browse topic flashcards
- `src/features/flashcards/screens/SavedCardsScreen.tsx` - Manage saved cards
- `src/features/flashcards/components/FlashCard.tsx` - 3D flip card component
- `src/features/flashcards/components/TopicCard.tsx` - Topic display card
- `src/shared/components/Card.tsx`, `Button.tsx`, `Header.tsx` - Shared UI
- `src/shared/theme/colors.ts` - Complete theme system

### Stage 6: Final Screens
- `src/features/flashcards/screens/CreateFlashcardScreen.tsx` - Form with image upload
- `src/features/flashcards/screens/StatisticsScreen.tsx` - Charts and metrics dashboard

## Notes

- **Reuse Rate**: ~63% of logic reused from web app
- **New Code**: ~37% mobile-specific (UI, native features)
- **Architecture**: Features-based (same as web)
- **State Management**: TanStack Query + Zustand
- **Navigation**: React Navigation (Bottom Tabs + Stack)
