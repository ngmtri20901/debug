# Application Architecture

This document describes the architecture and folder structure of the debug-middleware application - a Next.js 15 based language learning platform with flashcards, interactive lessons, and AI-powered features.

## Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Module Overview](#module-overview)
- [Architecture Patterns](#architecture-patterns)
- [Data Flow](#data-flow)

## Overview

The application is built using Next.js 15 with the App Router, featuring a modular architecture organized by features. It implements a clear separation between business logic, presentation, and routing concerns.

### Core Principles
- **Feature-based organization**: Each major feature (Learn, Flashcards, AI) has its own module
- **Shared infrastructure**: Common components, hooks, and utilities are shared across features
- **Type safety**: Full TypeScript coverage with strict mode enabled
- **Server-first**: Leveraging React Server Components by default
- **Progressive enhancement**: Client components only when needed for interactivity

## Technology Stack

- **Framework**: Next.js 15.5.4 with Turbopack
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 with PostCSS
- **Component Library**: shadcn/ui (New York style)
- **Database/Auth**: Supabase with SSR support
- **Backend API**: FastAPI (for flashcard data)
- **State Management**: Zustand/Jotai (planned)
- **Data Fetching**: React Query (planned)
- **Icons**: Lucide React
- **Type System**: TypeScript 5

## Directory Structure

```
├── app/                        # Next.js 15 App Router
│   ├── (auth)/                # Auth routes group
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   │
│   ├── (public)/              # Public routes (landing, about)
│   │   ├── page.tsx
│   │   ├── about/
│   │   ├── pricing/
│   │   └── layout.tsx
│   │
│   ├── (app)/                 # Protected app routes
│   │   ├── layout.tsx         # Main app layout with sidebar
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   │
│   │   ├── learn/             # LEARN MODULE
│   │   │   ├── page.tsx
│   │   │   ├── [topicSlug]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [lessonId]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── exercise/
│   │   │   │           └── page.tsx
│   │   │   └── loading.tsx
│   │   │
│   │   ├── flashcards/        # FLASHCARD MODULE
│   │   │   ├── page.tsx
│   │   │   ├── create/
│   │   │   ├── review/
│   │   │   ├── saved/
│   │   │   ├── statistics/
│   │   │   └── loading.tsx
│   │   │
│   │   ├── ai/                # AI MODULE
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [chatId]/
│   │   │   └── voice/
│   │   │       └── page.tsx
│   │   │
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── account/
│   │       ├── preferences/
│   │       └── layout.tsx
│   │
│   ├── api/                   # API routes
│   │   ├── learn/
│   │   │   ├── topics/
│   │   │   ├── lessons/
│   │   │   └── exercises/
│   │   ├── flashcards/
│   │   ├── ai/
│   │   │   ├── chat/
│   │   │   └── voice/
│   │   └── auth/
│   │
│   ├── error.tsx              # Global error boundary
│   ├── loading.tsx
│   ├── not-found.tsx
│   └── layout.tsx             # Root layout
│
├── features/                  # Feature modules (business logic)
│   ├── learn/
│   │   ├── components/        # Learn-specific components
│   │   │   ├── TopicCard/
│   │   │   ├── LessonsList/
│   │   │   ├── ProgressTracker/
│   │   │   └── exercises/
│   │   │       ├── MCQExercise/
│   │   │       ├── WordMatchingExercise/
│   │   │       ├── DialogueExercise/
│   │   │       ├── WritingExercise/
│   │   │       └── ChooseWordsExercise/
│   │   ├── hooks/
│   │   │   ├── useLesson.ts
│   │   │   ├── useExercise.ts
│   │   │   └── useProgress.ts
│   │   ├── services/          # API calls & business logic
│   │   │   ├── lessonService.ts
│   │   │   ├── exerciseService.ts
│   │   │   └── progressService.ts
│   │   ├── stores/            # State management (Zustand/Jotai)
│   │   │   └── learnStore.ts
│   │   ├── types/
│   │   │   ├── lesson.types.ts
│   │   │   └── exercise.types.ts
│   │   └── utils/
│   │       └── scoreCalculator.ts
│   │
│   ├── flashcards/
│   │   ├── components/
│   │   │   ├── FlashcardViewer/
│   │   │   ├── FlashcardCreator/
│   │   │   ├── ReviewSession/
│   │   │   └── StatisticsChart/
│   │   ├── hooks/
│   │   │   ├── useFlashcards.ts
│   │   │   └── useSpacedRepetition.ts
│   │   ├── services/
│   │   │   ├── flashcardService.ts
│   │   │   └── spacedRepetitionService.ts
│   │   ├── stores/
│   │   │   └── flashcardStore.ts
│   │   ├── types/
│   │   │   └── flashcard.types.ts
│   │   └── algorithms/        # Spaced repetition logic
│   │       └── sm2Algorithm.ts
│   │
│   ├── ai/
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatInterface/
│   │   │   │   ├── MessageList/
│   │   │   │   └── ChatInput/
│   │   │   └── voice/
│   │   │       ├── VoiceRecorder/
│   │   │       ├── AudioVisualizer/
│   │   │       └── VoiceControls/
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   └── useVoiceChat.ts
│   │   ├── services/
│   │   │   ├── chatService.ts
│   │   │   └── voiceService.ts
│   │   ├── stores/
│   │   │   └── aiStore.ts
│   │   └── types/
│   │       ├── chat.types.ts
│   │       └── voice.types.ts
│   │
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   └── user/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
│
├── shared/                    # Shared code across features
│   ├── components/            # Shared UI components
│   │   ├── ui/               # shadcn/ui components
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Sidebar/
│   │   │   ├── Header/
│   │   │   └── Footer/
│   │   ├── feedback/
│   │   │   ├── Toast/
│   │   │   ├── LoadingSpinner/
│   │   │   └── ErrorBoundary/
│   │   └── forms/
│   │       ├── FormField/
│   │       └── FormError/
│   │
│   ├── hooks/                 # Shared hooks
│   │   ├── useAuth.ts
│   │   ├── useSupabase.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── lib/                   # Core libraries & configs
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── api/
│   │   │   ├── axios.config.ts
│   │   │   └── endpoints.ts
│   │   ├── query/            # React Query configs
│   │   │   └── queryClient.ts
│   │   └── validators/       # Zod schemas
│   │       └── common.schemas.ts
│   │
│   ├── types/                # Shared types
│   │   ├── database.types.ts
│   │   ├── common.types.ts
│   │   └── api.types.ts
│   │
│   └── utils/                # Utility functions
│       ├── cn.ts            # classnames helper
│       ├── formatters.ts
│       ├── validators.ts
│       └── constants.ts
│
├── config/                   # Configuration files
│   ├── site.config.ts       # Site metadata
│   ├── nav.config.ts        # Navigation configs
│   └── env.config.ts        # Environment variables validation
│
├── styles/
│   ├── globals.css
│   └── themes/
│       ├── light.css
│       └── dark.css
│
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── .env.local
├── .env.example
├── .gitignore
├── middleware.ts            # Auth & routing middleware
├── next.config.mjs
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Module Overview

### 1. Learn Module
**Purpose**: Interactive language lessons with various exercise types

**Features**:
- Topic-based lesson organization
- Multiple exercise types (MCQ, word matching, dialogue, writing)
- Progress tracking
- Score calculation

**Key Components**:
- `TopicCard`: Displays lesson topics
- `LessonsList`: Shows available lessons
- `ProgressTracker`: Visualizes learning progress
- Exercise components for each type

**Routes**:
- `/learn` - Browse topics
- `/learn/[topicSlug]` - View lessons in a topic
- `/learn/[topicSlug]/[lessonId]` - Take a lesson
- `/learn/[topicSlug]/[lessonId]/exercise` - Practice exercises

### 2. Flashcards Module
**Purpose**: Spaced repetition system for vocabulary learning

**Features**:
- Create custom flashcards
- Spaced repetition algorithm (SM-2)
- Review sessions
- Statistics and progress tracking
- Search and filter by topic/complexity
- Save/bookmark cards

**Key Components**:
- `FlashcardViewer`: Card display with flip animation
- `FlashcardCreator`: Form for creating cards
- `ReviewSession`: Spaced repetition practice
- `StatisticsChart`: Progress visualization

**Routes**:
- `/flashcards` - Main flashcard interface (IMPLEMENTED)
- `/flashcards/create` - Create new cards
- `/flashcards/review` - Review session
- `/flashcards/saved` - Saved cards
- `/flashcards/statistics` - Progress stats

### 3. AI Module
**Purpose**: AI-powered conversation practice

**Features**:
- Text-based chat
- Voice conversation
- Context-aware responses
- Conversation history

**Key Components**:
- `ChatInterface`: Main chat UI
- `MessageList`: Conversation display
- `VoiceRecorder`: Audio capture
- `AudioVisualizer`: Real-time audio visualization

**Routes**:
- `/ai/chat` - Text chat
- `/ai/chat/[chatId]` - Specific conversation
- `/ai/voice` - Voice chat

### 4. Auth Module
**Purpose**: User authentication and authorization

**Features**:
- Email/password authentication
- OAuth providers (Google)
- Password reset
- Email verification
- Session management

**Current Routes** (IMPLEMENTED):
- `/auth/login`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/update-password`
- `/auth/confirm` (callback)
- `/auth/oauth` (callback)

### 5. User/Settings Module
**Purpose**: User profile and preferences

**Features**:
- Account settings
- Display preferences
- Notification settings
- Privacy controls

**Routes**:
- `/settings` - Settings overview
- `/settings/account` - Account details
- `/settings/preferences` - User preferences

## Architecture Patterns

### 1. Feature-Based Organization
Each feature module is self-contained with:
- **Components**: UI specific to the feature
- **Hooks**: Reusable logic for the feature
- **Services**: API calls and business logic
- **Stores**: State management
- **Types**: TypeScript interfaces
- **Utils**: Feature-specific utilities

### 2. Layered Architecture

```
┌─────────────────────────────────────┐
│         App Router (Routes)         │  ← Routing & Pages
├─────────────────────────────────────┤
│      Feature Modules (Business)     │  ← Business Logic
├─────────────────────────────────────┤
│     Shared Components & Hooks       │  ← Reusable UI
├─────────────────────────────────────┤
│   Lib (Services, Configs, Utils)   │  ← Infrastructure
├─────────────────────────────────────┤
│   External Services (Supabase, API) │  ← Third-party
└─────────────────────────────────────┘
```

### 3. Component Patterns

**Server Components** (default):
- Used for data fetching
- Static rendering where possible
- No client-side interactivity

**Client Components** ("use client"):
- Interactive UI elements
- State management
- Browser APIs
- Event handlers

**Compound Components**:
- Complex UI broken into sub-components
- Shared context for internal state
- Example: FlashcardViewer with Front/Back/Actions

### 4. State Management Strategy

**Local State** (useState):
- Component-specific UI state
- Form inputs
- Toggle states

**Shared State** (Zustand/Jotai):
- Cross-component feature state
- User preferences
- App-level settings

**Server State** (React Query):
- API data caching
- Background refetching
- Optimistic updates

**URL State** (searchParams):
- Filters
- Pagination
- Search queries

## Data Flow

### 1. Authentication Flow
```
User → Login Form → Supabase Auth → Session Cookie → Middleware → Protected Routes
                          ↓
                    Email/OAuth Provider
```

### 2. Data Fetching Flow
```
Page (Server Component) → Service Layer → API/Supabase → Database
         ↓
   Initial Props
         ↓
Client Component → React Query → Service Layer → API
```

### 3. Flashcard Learning Flow (Current Implementation)
```
User → Flashcards Page
         ↓
   Static Data (instant UI)
         ↓
   Search/Filter Input (debounced)
         ↓
   flashcardService API call
         ↓
   FastAPI Backend
         ↓
   Display Results + Random Daily Cards
```

## Current Implementation Status

### ✅ Implemented
- Next.js 15 setup with App Router
- Supabase authentication (email + Google OAuth)
- Flashcards main page with search, browse, and save features
- Dashboard with sidebar navigation
- shadcn/ui component library
- Tailwind CSS styling
- FastAPI integration for flashcard data
- Loading states with retry mechanism
- Responsive design with mobile support

### 🚧 In Progress (Migration)
- Reorganizing to feature-based structure
- Moving components to appropriate feature modules
- Creating shared component library
- Setting up state management

### 📋 Planned
- Learn module implementation
- AI chat and voice features
- React Query integration
- Comprehensive settings page
- User progress tracking
- Statistics and analytics

## Best Practices

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `use-kebab-case.ts`
- Utils: `kebab-case.ts`
- Types: `kebab-case.types.ts`
- Services: `kebab-case.service.ts`

### Import Organization
```typescript
// 1. React/Next imports
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query'

// 3. Features
import { useFlashcards } from '@/features/flashcards/hooks'

// 4. Shared
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

// 5. Local
import { FlashcardCard } from './flashcard-card'
```

### Type Safety
- Always define explicit types for props
- Use TypeScript strict mode
- Create shared type definitions
- Avoid `any` type
- Use Zod for runtime validation

### Performance
- Use Server Components by default
- Implement proper loading states
- Lazy load heavy components
- Optimize images with next/image
- Use React.memo for expensive renders

## Environment Variables

### Required
```bash
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anonymous key
NEXT_PUBLIC_API_URL=              # FastAPI backend URL
```

### Optional
```bash
NODE_ENV=                         # development | production
NEXT_PUBLIC_APP_URL=              # Application URL
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

## API Documentation

See [API.md](./API.md) for API endpoints and integration details.

---

**Last Updated**: 2025-10-31
**Version**: 1.0.0
**Maintained by**: Development Team
