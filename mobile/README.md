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

## Stage 1: Foundation (Current)

✅ Completed:
- [x] Folder structure setup
- [x] TypeScript types (flashcard.types.ts, session.types.ts)
- [x] API client adapted for React Native
- [x] Data transformers
- [x] Environment configuration

🔄 Next:
- [ ] Test API connectivity
- [ ] Setup Supabase client for mobile
- [ ] Implement AsyncStorage utilities

## Development Stages

1. **Stage 1**: Foundation & Core Types (Days 1-2) ✅ Current
2. **Stage 2**: API Service Layer (Days 2-3)
3. **Stage 3**: Data Utilities & Caching (Day 3)
4. **Stage 4**: React Hooks Layer (Days 4-6)
5. **Stage 5**: Browse & Display Features (Days 7-10)
6. **Stage 6**: Review Session Feature (Days 11-14)
7. **Stage 7**: Statistics Feature (Days 15-16)

## Key Files (Stage 1)

### Types (Reused from Web)
- `src/features/flashcards/types/flashcard.types.ts` - Flashcard data structures
- `src/features/flashcards/types/session.types.ts` - Review session types

### Utilities
- `src/features/flashcards/utils/apiClient.ts` - API client (adapted for RN)
- `src/features/flashcards/utils/transformers.ts` - Data transformers (reused)

### Configuration
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `.env.example` - Environment variables template
- `src/env.d.ts` - Environment type definitions

## Notes

- **Reuse Rate**: ~63% of logic reused from web app
- **New Code**: ~37% mobile-specific (UI, native features)
- **Architecture**: Features-based (same as web)
- **State Management**: TanStack Query + Zustand
- **Navigation**: React Navigation (Bottom Tabs + Stack)
