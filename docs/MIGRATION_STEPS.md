# Migration Steps - Old to New Architecture

This document provides step-by-step instructions for migrating the project to the new feature-based architecture.

**⚠️ IMPORTANT**: Before starting, ensure you have committed all current changes and created a new branch for the migration.

---

## Pre-Migration Checklist

- [ ] All current changes are committed
- [ ] Create migration branch: `git checkout -b feature/architecture-migration`
- [ ] Backup current `.env.local` file
- [ ] Document any custom configurations
- [ ] Ensure all dependencies are installed: `npm install`
- [ ] Verify current app works: `npm run dev`

---

## Phase 1: Create New Directory Structure

### Step 1.1: Create Feature Module Directories

```bash
# Create features directory structure
mkdir -p features/auth/components
mkdir -p features/auth/hooks
mkdir -p features/auth/services
mkdir -p features/auth/types

mkdir -p features/flashcards/components/core
mkdir -p features/flashcards/components/data
mkdir -p features/flashcards/hooks
mkdir -p features/flashcards/services
mkdir -p features/flashcards/stores
mkdir -p features/flashcards/types
mkdir -p features/flashcards/algorithms

mkdir -p features/learn/components/exercises
mkdir -p features/learn/hooks
mkdir -p features/learn/services
mkdir -p features/learn/stores
mkdir -p features/learn/types
mkdir -p features/learn/utils

mkdir -p features/ai/components/chat
mkdir -p features/ai/components/voice
mkdir -p features/ai/hooks
mkdir -p features/ai/services
mkdir -p features/ai/stores
mkdir -p features/ai/types

mkdir -p features/user/components
mkdir -p features/user/hooks
mkdir -p features/user/services
mkdir -p features/user/types
```

### Step 1.2: Create Shared Directory Structure

```bash
# Create shared directory structure
mkdir -p shared/components/ui
mkdir -p shared/components/layout
mkdir -p shared/components/feedback
mkdir -p shared/components/forms

mkdir -p shared/hooks

mkdir -p shared/lib/supabase
mkdir -p shared/lib/api
mkdir -p shared/lib/query
mkdir -p shared/lib/validators

mkdir -p shared/types

mkdir -p shared/utils
```

### Step 1.3: Create Config and Other Directories

```bash
# Create config directory
mkdir -p config

# Create styles directory (if not exists)
mkdir -p styles/themes

# Docs directory should already exist from previous step
```

### Step 1.4: Create New App Router Structure

```bash
# Create route groups
mkdir -p "app/(auth)/login"
mkdir -p "app/(auth)/register"
mkdir -p "app/(auth)/forgot-password"
mkdir -p "app/(auth)/update-password"

mkdir -p "app/(public)"

mkdir -p "app/(app)/dashboard"
mkdir -p "app/(app)/flashcards/create"
mkdir -p "app/(app)/flashcards/review"
mkdir -p "app/(app)/flashcards/saved"
mkdir -p "app/(app)/flashcards/statistics"

mkdir -p "app/(app)/learn"

mkdir -p "app/(app)/ai/chat"
mkdir -p "app/(app)/ai/voice"

mkdir -p "app/(app)/settings/account"
mkdir -p "app/(app)/settings/preferences"

mkdir -p app/api/flashcards
mkdir -p app/api/learn
mkdir -p app/api/ai
```

---

## Phase 2: Move Shared Infrastructure First

### Step 2.1: Move Supabase to Shared

```bash
# Move Supabase files
mv lib/supabase/client.ts shared/lib/supabase/client.ts
mv lib/supabase/server.ts shared/lib/supabase/server.ts
mv lib/supabase/middleware.ts shared/lib/supabase/middleware.ts
```

**Update imports in these files**:
- `middleware.ts` (root) - Update Supabase import
- Any pages using Supabase

**Find and replace**:
- `@/lib/supabase` → `@/shared/lib/supabase`

### Step 2.2: Move Utilities to Shared

```bash
# Move utils
mv lib/utils.ts shared/utils/cn.ts

# Create new utilities
# (You'll create formatters.ts, validators.ts, constants.ts later as needed)

# Move audio utils if it exists
mv lib/utils/audio.ts shared/utils/audio.ts
```

**Update utils.ts → cn.ts**:
The file exports a `cn` function, so just rename and move it.

**Find and replace**:
- `@/lib/utils` → `@/shared/utils/cn`

### Step 2.3: Move Shared Hooks

```bash
# Move hooks
mv hooks/use-mobile.ts shared/hooks/use-mobile.ts
mv hooks/use-loading.ts shared/hooks/use-loading.ts
```

**Find and replace**:
- `@/hooks/use-mobile` → `@/shared/hooks/use-mobile`
- `@/hooks/use-loading` → `@/shared/hooks/use-loading`

### Step 2.4: Move UI Components to Shared

```bash
# Move all shadcn UI components
mv components/ui/button.tsx shared/components/ui/button.tsx
mv components/ui/card.tsx shared/components/ui/card.tsx
mv components/ui/input.tsx shared/components/ui/input.tsx
mv components/ui/label.tsx shared/components/ui/label.tsx
mv components/ui/avatar.tsx shared/components/ui/avatar.tsx
mv components/ui/tabs.tsx shared/components/ui/tabs.tsx
mv components/ui/alert.tsx shared/components/ui/alert.tsx
mv components/ui/breadcrumb.tsx shared/components/ui/breadcrumb.tsx
mv components/ui/dropdown-menu.tsx shared/components/ui/dropdown-menu.tsx
mv components/ui/separator.tsx shared/components/ui/separator.tsx
mv components/ui/sidebar.tsx shared/components/ui/sidebar.tsx
mv components/ui/sheet.tsx shared/components/ui/sheet.tsx
mv components/ui/skeleton.tsx shared/components/ui/skeleton.tsx
mv components/ui/tooltip.tsx shared/components/ui/tooltip.tsx
mv components/ui/collapsible.tsx shared/components/ui/collapsible.tsx
mv components/ui/aspect-ratio.tsx shared/components/ui/aspect-ratio.tsx
mv components/ui/LoadingState.tsx shared/components/ui/LoadingState.tsx
mv components/ui/PageWithLoading.tsx shared/components/ui/PageWithLoading.tsx
```

**Find and replace globally**:
- `@/components/ui/` → `@/shared/components/ui/`

### Step 2.5: Move Layout Components to Shared

```bash
# Move dashboard/layout components
mv components/dashboard/app-sidebar.tsx shared/components/layout/app-sidebar.tsx
mv components/dashboard/nav-main.tsx shared/components/layout/nav-main.tsx
mv components/dashboard/nav-user.tsx shared/components/layout/nav-user.tsx
```

**Update imports in these files** (they likely import from `@/components/ui`):
- Update to `@/shared/components/ui/...`

**Find and replace**:
- `@/components/dashboard/app-sidebar` → `@/shared/components/layout/app-sidebar`
- Similar for nav-main and nav-user

### Step 2.6: Update components.json for shadcn

Update `components.json` to point to new location:

```json
{
  "aliases": {
    "components": "@/shared/components",
    "ui": "@/shared/components/ui",
    "utils": "@/shared/utils",
    "lib": "@/shared/lib"
  }
}
```

---

## Phase 3: Migrate Auth Module

### Step 3.1: Move Auth Components

```bash
# Move auth components
mv components/auth/login-form.tsx features/auth/components/login-form.tsx
mv components/auth/sign-up-form.tsx features/auth/components/sign-up-form.tsx
mv components/auth/forgot-password-form.tsx features/auth/components/forgot-password-form.tsx
mv components/auth/update-password-form.tsx features/auth/components/update-password-form.tsx
mv components/auth/google-login-button.tsx features/auth/components/google-login-button.tsx
mv components/auth/logout-button.tsx features/auth/components/logout-button.tsx
```

### Step 3.2: Update Imports in Auth Components

Open each auth component file and update:
- `@/components/ui/...` → `@/shared/components/ui/...`
- `@/lib/supabase/...` → `@/shared/lib/supabase/...`

### Step 3.3: Create Auth Types

Create `features/auth/types/index.ts`:

```typescript
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  name?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface AuthError {
  message: string
  code?: string
}
```

### Step 3.4: Create Auth Service

Create `features/auth/services/authService.ts`:

```typescript
import { createClient } from '@/shared/lib/supabase/client'
import type { LoginCredentials, SignUpCredentials } from '../types'

export class AuthService {
  private supabase = createClient()

  async login(credentials: LoginCredentials) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) throw error
    return data
  }

  async signUp(credentials: SignUpCredentials) {
    const { data, error } = await this.supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          name: credentials.name,
        },
      },
    })

    if (error) throw error
    return data
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  }

  async getSession() {
    const { data, error } = await this.supabase.auth.getSession()
    if (error) throw error
    return data.session
  }

  async getUser() {
    const { data, error } = await this.supabase.auth.getUser()
    if (error) throw error
    return data.user
  }
}

export const authService = new AuthService()
```

### Step 3.5: Reorganize Auth Routes

Move auth pages to new route group structure:

```bash
# Copy first (don't move yet, to preserve functionality)
cp app/auth/login/page.tsx "app/(auth)/login/page.tsx"
cp app/auth/sign-up/page.tsx "app/(auth)/register/page.tsx"
cp app/auth/forgot-password/page.tsx "app/(auth)/forgot-password/page.tsx"
cp app/auth/update-password/page.tsx "app/(auth)/update-password/page.tsx"
```

Create `app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
```

### Step 3.6: Update Auth Page Imports

Update imports in all auth pages:
- `@/components/auth/...` → `@/features/auth/components/...`
- `@/components/ui/...` → `@/shared/components/ui/...`

---

## Phase 4: Migrate Flashcards Module

### Step 4.1: Move Flashcard Components

```bash
# Move core components
mv components/flashcard/core/flashcard.tsx features/flashcards/components/core/flashcard.tsx
mv components/flashcard/core/flashcard-component.tsx features/flashcards/components/core/flashcard-component.tsx
mv components/flashcard/core/flashcard-deck.tsx features/flashcards/components/core/flashcard-deck.tsx
mv components/flashcard/core/flashcard-front.tsx features/flashcards/components/core/flashcard-front.tsx
mv components/flashcard/core/flashcard-back.tsx features/flashcards/components/core/flashcard-back.tsx
mv components/flashcard/core/flashcard-skeleton.tsx features/flashcards/components/core/flashcard-skeleton.tsx

# Move data components
mv components/flashcard/data/index.ts features/flashcards/components/data/index.ts
mv components/flashcard/data/static-data.ts features/flashcards/components/data/static-data.ts
```

### Step 4.2: Move Flashcard Service

```bash
# Move API service
mv lib/api/flashcards.ts features/flashcards/services/flashcardService.ts
```

### Step 4.3: Create Flashcard Types

Create `features/flashcards/types/index.ts`:

Extract types from the flashcard service and components:

```typescript
export interface FlashcardData {
  word_id: number
  word: string
  phonetic: string
  word_type: string
  meaning: string
  example: string
  topic: string
  complexity_level: number
}

export interface FlashcardTopic {
  name: string
  count: number
}

export interface WordType {
  type: string
  count: number
}

export interface FlashcardFilters {
  topic?: string
  wordType?: string
  complexity?: 'all' | 'simple' | 'complex'
  search?: string
}

export interface FlashcardState {
  currentIndex: number
  isFlipped: boolean
  savedCards: Set<number>
}
```

### Step 4.4: Update Flashcard Component Imports

Update all flashcard component files:
- `@/components/ui/...` → `@/shared/components/ui/...`
- Update internal imports to use relative paths or new feature paths

### Step 4.5: Move Flashcards Page

```bash
# Move to new app structure
cp app/dashboard/flashcards/page.tsx "app/(app)/flashcards/page.tsx"
```

Update imports in the page:
- `@/components/flashcard/...` → `@/features/flashcards/components/...`
- `@/lib/api/flashcards` → `@/features/flashcards/services/flashcardService`
- `@/hooks/use-loading` → `@/shared/hooks/use-loading`

### Step 4.6: Create Flashcard Hooks

Create `features/flashcards/hooks/useFlashcards.ts`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import type { FlashcardData, FlashcardFilters } from '../types'
import { flashcardService } from '../services/flashcardService'

export function useFlashcards() {
  const [cards, setCards] = useState<FlashcardData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCards = useCallback(async (filters: FlashcardFilters) => {
    setIsLoading(true)
    setError(null)

    try {
      let result: FlashcardData[] = []

      if (filters.search) {
        result = await flashcardService.searchFlashcards(filters.search)
      } else if (filters.topic) {
        result = await flashcardService.getFlashcardsByTopic(filters.topic)
      } else if (filters.wordType) {
        result = await flashcardService.getFlashcardsByType(filters.wordType)
      } else {
        result = await flashcardService.getRandomFlashcards(20)
      }

      setCards(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch flashcards'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    cards,
    isLoading,
    error,
    fetchCards,
  }
}
```

Create `features/flashcards/hooks/useSavedFlashcards.ts`:

```typescript
'use client'

import { useState, useCallback } from 'react'

export function useSavedFlashcards() {
  const [savedCards, setSavedCards] = useState<Set<number>>(new Set())

  const toggleSave = useCallback((wordId: number) => {
    setSavedCards(prev => {
      const next = new Set(prev)
      if (next.has(wordId)) {
        next.delete(wordId)
      } else {
        next.add(wordId)
      }
      return next
    })
  }, [])

  const isSaved = useCallback((wordId: number) => {
    return savedCards.has(wordId)
  }, [savedCards])

  return {
    savedCards,
    toggleSave,
    isSaved,
  }
}
```

---

## Phase 5: Update tsconfig.json Path Aliases

Update `tsconfig.json` to add new path mappings:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/app/*": ["./app/*"],
      "@/features/*": ["./features/*"],
      "@/shared/*": ["./shared/*"],
      "@/config/*": ["./config/*"]
    }
  }
}
```

---

## Phase 6: Create Configuration Files

### Step 6.1: Create Site Config

Create `config/site.config.ts`:

```typescript
export const siteConfig = {
  name: 'Debug Middleware',
  description: 'Language learning platform with flashcards, lessons, and AI',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og-image.png',
  links: {
    github: 'https://github.com/yourusername/debug-middleware',
  },
}

export type SiteConfig = typeof siteConfig
```

### Step 6.2: Create Navigation Config

Create `config/nav.config.ts`:

```typescript
import { BookOpen, Brain, MessageSquare, LayoutDashboard, Settings } from 'lucide-react'

export const navConfig = {
  mainNav: [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Learn',
      href: '/learn',
      icon: BookOpen,
    },
    {
      title: 'Flashcards',
      href: '/flashcards',
      icon: Brain,
    },
    {
      title: 'AI Chat',
      href: '/ai/chat',
      icon: MessageSquare,
    },
  ],
  sidebarNav: [
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      items: [
        {
          title: 'Account',
          href: '/settings/account',
        },
        {
          title: 'Preferences',
          href: '/settings/preferences',
        },
      ],
    },
  ],
}

export type NavConfig = typeof navConfig
```

### Step 6.3: Create Environment Config

Create `config/env.config.ts`:

```typescript
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
})

export type Env = z.infer<typeof envSchema>
```

### Step 6.4: Create .env.example

Create `.env.example`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# FastAPI Backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Application URL (for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Phase 7: Reorganize App Routes

### Step 7.1: Create Protected App Layout

Create `app/(app)/layout.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createServerClient } from '@/shared/lib/supabase/server'
import { SidebarProvider } from '@/shared/components/ui/sidebar'
import { AppSidebar } from '@/shared/components/layout/app-sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
```

### Step 7.2: Move Dashboard

```bash
# Move dashboard page to new structure
cp app/dashboard/page.tsx "app/(app)/dashboard/page.tsx"
```

### Step 7.3: Create Public Layout

Create `app/(public)/layout.tsx`:

```typescript
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* Add public header/footer here */}
      {children}
    </div>
  )
}
```

### Step 7.4: Move Landing Page

```bash
# Move landing page to public route group
cp app/page.tsx "app/(public)/page.tsx"
```

---

## Phase 8: Testing After Migration

### Step 8.1: Fix TypeScript Errors

```bash
# Check for TypeScript errors
npx tsc --noEmit
```

Fix any import errors or type mismatches.

### Step 8.2: Test Development Build

```bash
# Start development server
npm run dev
```

Test all routes:
- [ ] Landing page loads
- [ ] Login works
- [ ] Sign up works
- [ ] Dashboard loads
- [ ] Flashcards page works
- [ ] Search functionality works
- [ ] Save/bookmark works
- [ ] Navigation works

### Step 8.3: Test Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

Verify everything works in production mode.

---

## Phase 9: Cleanup

### Step 9.1: Remove Old Directories

```bash
# After verifying everything works, remove old directories
rm -rf components/auth
rm -rf components/dashboard
rm -rf components/flashcard
rm -rf components/ui
rm -rf hooks
rm -rf lib/api
rm -rf lib/utils
rm -rf app/auth
rm -rf app/dashboard
```

### Step 9.2: Update .gitignore

Ensure `.gitignore` includes:

```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

### Step 9.3: Update README.md

Update the README to reflect the new structure and include:
- New directory structure
- Setup instructions
- Development guidelines
- Contribution guidelines

---

## Phase 10: Final Verification

### Checklist

- [ ] All pages load without errors
- [ ] Authentication flow works completely
- [ ] Flashcards functionality is intact
- [ ] All searches and filters work
- [ ] Mobile responsive design works
- [ ] Build completes successfully (both dev and prod)
- [ ] No TypeScript errors
- [ ] No ESLint warnings (after re-enabling)
- [ ] All environment variables are documented
- [ ] Documentation is up to date
- [ ] Git history is clean (squash migration commits if needed)

---

## Rollback Plan

If something goes wrong during migration:

1. **Immediate Rollback**:
   ```bash
   git reset --hard HEAD
   git clean -fd
   ```

2. **Partial Rollback** (if some changes are committed):
   ```bash
   git revert <commit-hash>
   ```

3. **Switch Back to Main**:
   ```bash
   git checkout main
   ```

4. **Keep Migration Branch for Later**:
   The migration branch will still exist, so you can return to it later.

---

## Post-Migration Tasks

### Immediate
- [ ] Update all team members about new structure
- [ ] Update CI/CD pipelines if needed
- [ ] Update deployment documentation
- [ ] Create migration announcement/changelog

### Short-term (Next Sprint)
- [ ] Re-enable TypeScript strict checks
- [ ] Re-enable ESLint in build
- [ ] Add missing tests
- [ ] Setup React Query
- [ ] Setup state management (Zustand/Jotai)
- [ ] Implement remaining flashcard routes

### Long-term (Next Month)
- [ ] Implement Learn module
- [ ] Implement AI module
- [ ] Implement Settings module
- [ ] Add comprehensive testing
- [ ] Performance optimization
- [ ] Accessibility audit

---

## Tips and Best Practices

1. **Work in Small Batches**: Don't move everything at once
2. **Test Frequently**: After each major move, test the app
3. **Use Git**: Commit after each successful phase
4. **Keep Notes**: Document any issues you encounter
5. **Ask for Help**: Don't hesitate to reach out if stuck
6. **Keep Old Code**: Don't delete until you're 100% sure migration worked

---

**Last Updated**: 2025-10-31
**Maintained by**: Development Team
