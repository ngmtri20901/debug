# MOBILE USER PROFILE & APP SETTINGS - Implementation Plan

**Module:** User Profile & Settings
**Platform:** React Native Mobile
**Estimated Timeline:** 10-12 days
**Estimated Code:** ~6,000 lines
**Code Reuse Rate:** ~45-50% (from web + common patterns)

---

## Executive Summary

The User Profile & Settings module provides complete user account management, app configuration, and preferences for the Vietnamese learning mobile app. This includes profile editing, subscription management, app settings, notifications, privacy controls, and help/support.

**Estimated Timeline:** 10-12 days
**Estimated Code:** ~6,000 lines
**Code Reuse Rate:** ~45-50%

---

## Module Overview

### **Architecture**
```
Profile & Settings
├── User Profile (view, edit, avatar)
├── Account Settings (email, password, security)
├── Subscription Management (tier, billing, upgrade)
├── App Preferences (language, theme, notifications)
├── Progress & Stats (learning analytics)
├── Privacy & Security (data, account deletion)
└── Help & Support (FAQ, contact, feedback)
```

### **Key Features**
1. **User Profile:** View/edit profile, avatar upload, personal info
2. **Account Settings:** Email, password, security, account deletion
3. **Subscription:** View tier, upgrade/downgrade, billing history
4. **App Preferences:** Theme, language, notifications, sounds
5. **Learning Stats:** Progress overview, streaks, achievements
6. **Privacy:** Data export, privacy settings, account deletion
7. **Help & Support:** FAQ, contact support, feedback, about

---

## Stage-by-Stage Breakdown

---

## **Stage 1: Foundation & Core Types (Days 1-2)**

**Goal:** Set up data structures, types, and API client for Profile & Settings

### **Tasks:**

#### 1.1 Types Setup
**Files to Create:**
```
mobile/src/features/profile/
├── types/
│   ├── user.ts              # User profile types
│   ├── settings.ts          # App settings types
│   ├── subscription.ts      # Subscription/billing types
│   ├── stats.ts             # Learning statistics types
│   └── index.ts             # Exports
└── navigation/
    └── types.ts             # Navigation param list
```

**Core Types:**
```typescript
// user.ts
interface UserProfile {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  native_language: string
  learning_level: 'beginner' | 'intermediate' | 'advanced'
  subscription_tier: SubscriptionTier
  created_at: string
  updated_at: string
}

// settings.ts
interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'en' | 'vi'
  notifications: NotificationSettings
  audio: AudioSettings
  privacy: PrivacySettings
  accessibility: AccessibilitySettings
}

interface NotificationSettings {
  enabled: boolean
  daily_reminder: boolean
  reminder_time: string
  streak_reminders: boolean
  achievement_notifications: boolean
  lesson_updates: boolean
}

// subscription.ts
interface Subscription {
  id: string
  user_id: string
  tier: 'FREE' | 'PLUS' | 'UNLIMITED'
  status: 'active' | 'canceled' | 'expired'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
}

// stats.ts
interface UserStats {
  total_lessons_completed: number
  total_exercises_completed: number
  total_flashcards_reviewed: number
  current_streak_days: number
  longest_streak_days: number
  total_study_time_minutes: number
  coins_earned: number
  xp_earned: number
  level: number
}
```

#### 1.2 Navigation Types
```typescript
type ProfileStackParamList = {
  ProfileHome: undefined
  EditProfile: undefined
  AccountSettings: undefined
  SubscriptionManagement: undefined
  AppSettings: undefined
  NotificationSettings: undefined
  PrivacySettings: undefined
  LearningStats: undefined
  HelpSupport: undefined
  About: undefined
  ChangePassword: undefined
  ChangeEmail: undefined
  DeleteAccount: undefined
}
```

#### 1.3 Constants
**Files:**
```
mobile/src/features/profile/constants/
├── subscriptionTiers.ts   # Tier definitions
├── settingsOptions.ts     # Settings configurations
└── themes.ts              # Theme definitions
```

**Estimated Lines:** ~600 lines
**Reuse Rate:** 85%

---

## **Stage 2: API Service Layer (Days 3-4)**

**Goal:** Implement all API methods for profile, settings, and subscriptions

### **Tasks:**

#### 2.1 Profile Service
**API Methods:**
```typescript
export const profileAPI = {
  // Profile
  async getUserProfile(userId: string): Promise<UserProfile>
  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile>
  async uploadAvatar(userId: string, imageUri: string): Promise<string>
  async deleteAvatar(userId: string): Promise<void>

  // Stats
  async getUserStats(userId: string): Promise<UserStats>
  async getStreakInfo(userId: string): Promise<StreakInfo>
  async getAchievements(userId: string): Promise<Achievement[]>
}
```

#### 2.2 Settings Service
**API Methods:**
```typescript
export const settingsAPI = {
  // Settings CRUD
  async getSettings(userId: string): Promise<AppSettings>
  async updateSettings(userId: string, settings: Partial<AppSettings>): Promise<AppSettings>

  // Notifications
  async registerPushToken(userId: string, token: string): Promise<void>
  async unregisterPushToken(userId: string): Promise<void>

  // Privacy
  async exportUserData(userId: string): Promise<Blob>
  async requestAccountDeletion(userId: string): Promise<void>
}
```

#### 2.3 Subscription Service
**API Methods:**
```typescript
export const subscriptionAPI = {
  // Subscription info
  async getSubscription(userId: string): Promise<Subscription | null>
  async getBillingHistory(userId: string): Promise<BillingTransaction[]>

  // Subscription management
  async upgradeTier(userId: string, newTier: SubscriptionTier): Promise<Subscription>
  async cancelSubscription(userId: string): Promise<void>
  async resumeSubscription(userId: string): Promise<void>

  // Payment
  async createCheckoutSession(userId: string, tier: SubscriptionTier): Promise<{ sessionUrl: string }>
}
```

#### 2.4 Account Service
**API Methods:**
```typescript
export const accountAPI = {
  // Account security
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>
  async changeEmail(userId: string, newEmail: string): Promise<void>
  async verifyEmail(userId: string, token: string): Promise<void>

  // Two-factor auth
  async enableTwoFactor(userId: string): Promise<{ secret: string; qrCode: string }>
  async disableTwoFactor(userId: string, code: string): Promise<void>
}
```

**Files to Create:**
```
mobile/src/features/profile/services/
├── profileService.ts      # Profile CRUD
├── settingsService.ts     # Settings management
├── subscriptionService.ts # Subscription & billing
└── accountService.ts      # Account security
```

**Estimated Lines:** ~1,200 lines
**Reuse Rate:** 70%

---

## **Stage 3: State Management & Hooks (Days 5-6)**

**Goal:** Create React hooks and state management

### **Tasks:**

#### 3.1 React Query Hooks

**Profile Hooks:**
```typescript
// useProfile.ts
export function useUserProfile(): UseQueryResult<UserProfile, Error>
export function useUpdateProfile(): UseMutationResult<UserProfile, Error, Partial<UserProfile>>
export function useUploadAvatar(): UseMutationResult<string, Error, string>
export function useUserStats(): UseQueryResult<UserStats, Error>
```

**Settings Hooks:**
```typescript
// useSettings.ts
export function useAppSettings(): UseQueryResult<AppSettings, Error>
export function useUpdateSettings(): UseMutationResult<AppSettings, Error, Partial<AppSettings>>
export function useNotificationSettings(): UseQueryResult<NotificationSettings, Error>
```

**Subscription Hooks:**
```typescript
// useSubscription.ts
export function useSubscription(): UseQueryResult<Subscription | null, Error>
export function useBillingHistory(): UseQueryResult<BillingTransaction[], Error>
export function useUpgradeTier(): UseMutationResult<Subscription, Error, SubscriptionTier>
export function useCancelSubscription(): UseMutationResult<void, Error, void>
```

#### 3.2 Local Storage for Settings
```typescript
// settingsStore.ts (Zustand)
interface SettingsStore {
  settings: AppSettings
  loadSettings: () => Promise<void>
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
  resetSettings: () => Promise<void>
}
```

#### 3.3 Image Picker Hook
```typescript
// useImagePicker.ts
export function useImagePicker() {
  const pickImage = async (): Promise<string | null>
  const takePhoto = async (): Promise<string | null>
  const cropImage = async (uri: string): Promise<string>
}
```

**Files to Create:**
```
mobile/src/features/profile/hooks/
├── useProfile.ts          # Profile hooks
├── useSettings.ts         # Settings hooks
├── useSubscription.ts     # Subscription hooks
├── useImagePicker.ts      # Image picker
└── useNotifications.ts    # Push notifications
```

**Estimated Lines:** ~800 lines
**Reuse Rate:** 50%

---

## **Stage 4: Core UI Components (Days 7-8)**

**Goal:** Build reusable UI components

### **Tasks:**

#### 4.1 Profile Components
```typescript
<ProfileHeader />          // Avatar, name, stats summary
<ProfileAvatar />          // Avatar with edit button
<StatsCard />              // Individual stat display
<StreakIndicator />        // Streak flame with count
<AchievementBadge />       // Achievement display
<SubscriptionBadge />      // Tier badge (FREE/PLUS/UNLIMITED)
```

#### 4.2 Settings Components
```typescript
<SettingsSection />        // Section header
<SettingRow />             // Individual setting row
<SettingToggle />          // Switch toggle
<SettingSelect />          // Dropdown/picker
<SettingSlider />          // Slider for values
<DangerZone />             // Dangerous actions (delete account)
```

#### 4.3 Subscription Components
```typescript
<TierCard />               // Subscription tier card
<TierComparison />         // Feature comparison table
<BillingHistoryItem />     // Transaction row
<UpgradePrompt />          // Upgrade CTA
```

**Files to Create:**
```
mobile/src/features/profile/components/
├── profile/
│   ├── ProfileHeader.tsx
│   ├── ProfileAvatar.tsx
│   ├── StatsCard.tsx
│   ├── StreakIndicator.tsx
│   └── AchievementBadge.tsx
├── settings/
│   ├── SettingsSection.tsx
│   ├── SettingRow.tsx
│   ├── SettingToggle.tsx
│   ├── SettingSelect.tsx
│   └── DangerZone.tsx
├── subscription/
│   ├── TierCard.tsx
│   ├── TierComparison.tsx
│   ├── BillingHistoryItem.tsx
│   └── UpgradePrompt.tsx
└── index.ts
```

**Estimated Lines:** ~1,400 lines
**Reuse Rate:** 35%

---

## **Stage 5: Main Screens (Days 9-10)**

**Goal:** Implement all profile and settings screens

### **Tasks:**

#### 5.1 Profile Screens

**ProfileHomeScreen.tsx** (~350 lines)
- Profile header with avatar
- Stats overview (lessons, streak, coins, XP)
- Quick actions (edit profile, settings, upgrade)
- Recent achievements
- Learning progress summary

**EditProfileScreen.tsx** (~300 lines)
- Avatar upload/change
- Editable fields (name, bio, native language)
- Save/cancel buttons
- Image picker integration
- Form validation

**LearningStatsScreen.tsx** (~400 lines)
- Detailed statistics
- Charts (study time, progress over time)
- Achievements list
- Streak calendar
- Level progress

#### 5.2 Account Screens

**AccountSettingsScreen.tsx** (~250 lines)
- Email (with change option)
- Password (change button)
- Two-factor authentication
- Linked accounts
- Account deletion

**ChangePasswordScreen.tsx** (~200 lines)
- Current password input
- New password input
- Confirm password input
- Password strength indicator
- Validation

**ChangeEmailScreen.tsx** (~200 lines)
- New email input
- Password confirmation
- Verification flow

#### 5.3 Subscription Screens

**SubscriptionManagementScreen.tsx** (~400 lines)
- Current tier display
- Features breakdown
- Billing info
- Next billing date
- Cancel/upgrade buttons
- Billing history

**UpgradeScreen.tsx** (~350 lines)
- Tier cards (FREE, PLUS, UNLIMITED)
- Feature comparison table
- Pricing
- Payment flow integration
- Success/error handling

#### 5.4 Settings Screens

**AppSettingsScreen.tsx** (~300 lines)
- Theme selection (light/dark/auto)
- Language preference
- Sound effects toggle
- Haptic feedback toggle
- Auto-play audio

**NotificationSettingsScreen.tsx** (~250 lines)
- Enable/disable notifications
- Daily reminder toggle + time picker
- Streak reminders
- Achievement notifications
- Lesson updates

**PrivacySettingsScreen.tsx** (~250 lines)
- Data collection toggles
- Analytics opt-out
- Export data button
- Delete account button
- Privacy policy link

#### 5.5 Support Screens

**HelpSupportScreen.tsx** (~300 lines)
- FAQ accordion
- Contact support button
- Report a bug
- Feature request
- Community links

**AboutScreen.tsx** (~150 lines)
- App version
- Build number
- Terms of service
- Privacy policy
- Licenses
- Credits

**Files to Create:**
```
mobile/src/features/profile/screens/
├── ProfileHomeScreen.tsx
├── EditProfileScreen.tsx
├── LearningStatsScreen.tsx
├── AccountSettingsScreen.tsx
├── ChangePasswordScreen.tsx
├── ChangeEmailScreen.tsx
├── SubscriptionManagementScreen.tsx
├── UpgradeScreen.tsx
├── AppSettingsScreen.tsx
├── NotificationSettingsScreen.tsx
├── PrivacySettingsScreen.tsx
├── HelpSupportScreen.tsx
├── AboutScreen.tsx
└── index.ts
```

**Stage 5 Total:**
- **Estimated Lines:** ~3,100 lines
- **Reuse Rate:** 30%

---

## **Stage 6: Polish & Integrations (Days 11-12)**

**Goal:** Add polish, integrations, and documentation

### **Tasks:**

#### 6.1 Image Upload Integration
- Integrate with image picker
- Image cropping/resizing
- Upload to storage (Supabase Storage)
- Progress indicators

#### 6.2 Push Notifications Setup
- Firebase/Expo Notifications integration
- Token registration
- Notification scheduling
- Deep linking from notifications

#### 6.3 Payment Integration
- Stripe/RevenueCat integration
- Checkout flow
- Subscription updates
- Receipt validation

#### 6.4 Theme Support
- Light theme
- Dark theme
- Auto (system)
- Theme persistence
- Smooth transitions

#### 6.5 Analytics Integration
- Track settings changes
- Track subscription events
- Track profile updates
- Privacy-respecting analytics

#### 6.6 Error Handling
- Form validation
- Network error handling
- Graceful degradation
- Error boundaries

#### 6.7 Documentation
- Developer guide
- API reference
- Component documentation
- Integration guides

**Files to Create:**
```
mobile/src/features/profile/
├── utils/
│   ├── imageUtils.ts          # Image processing
│   ├── validation.ts          # Form validation
│   ├── analytics.ts           # Analytics helpers
│   └── notifications.ts       # Push notification helpers
├── contexts/
│   └── ThemeContext.tsx       # Theme provider
└── config/
    └── constants.ts           # Feature flags, limits
```

**Estimated Lines:** ~900 lines

---

## Dependencies Required

### **New Dependencies:**
```json
{
  "expo-image-picker": "~14.5.0",         // Image picker
  "expo-image-manipulator": "~11.5.0",    // Image cropping/resizing
  "expo-notifications": "~0.23.0",        // Push notifications
  "react-native-mmkv": "^2.10.0",         // Fast storage for settings
  "@react-native-picker/picker": "^2.6.0", // Dropdown picker
  "react-native-charts-wrapper": "^0.5.11", // Charts for stats
  "react-native-calendar-strip": "^2.2.6"  // Streak calendar
}
```

### **Already Available:**
- React Navigation (navigation)
- React Query (server state)
- Zustand (client state)
- Supabase (backend)
- AsyncStorage (persistence)

---

## Summary

| Stage | Description | Days | Lines | Reuse % |
|-------|-------------|------|-------|---------|
| 1 | Foundation & Types | 1-2 | 600 | 85% |
| 2 | API Service Layer | 3-4 | 1,200 | 70% |
| 3 | State Management & Hooks | 5-6 | 800 | 50% |
| 4 | Core UI Components | 7-8 | 1,400 | 35% |
| 5 | Main Screens | 9-10 | 3,100 | 30% |
| 6 | Polish & Integrations | 11-12 | 900 | 40% |

**Total Estimated:**
- **Timeline:** 10-12 days
- **Lines of Code:** ~8,000 lines
- **Overall Reuse Rate:** ~45-50%

---

## Key Differences from Learn Module

1. **Image Handling:** Avatar upload/cropping (not in Learn)
2. **Payment Integration:** Subscription management (complex)
3. **Push Notifications:** Native notification handling
4. **Theme Support:** App-wide theming system
5. **Security:** Password changes, 2FA, account deletion
6. **Privacy:** GDPR compliance (data export, deletion)

---

## Navigation Structure

```
Profile Tab
├── ProfileHome (main screen)
│   ├── Edit Profile
│   ├── Learning Stats
│   │   └── Achievements
│   ├── Account Settings
│   │   ├── Change Password
│   │   ├── Change Email
│   │   └── Delete Account
│   ├── Subscription Management
│   │   ├── Upgrade Screen
│   │   └── Billing History
│   ├── App Settings
│   │   ├── Notification Settings
│   │   └── Privacy Settings
│   └── Help & Support
│       └── About
```

---

## Screen Mockup Hierarchy

### ProfileHomeScreen
```
┌─────────────────────────┐
│ [Avatar] Name           │
│ @username               │
│ FREE tier 🏷️           │
├─────────────────────────┤
│ Stats Grid              │
│ [📚 50] [🔥 7] [🪙 150] │
├─────────────────────────┤
│ Quick Actions           │
│ > Edit Profile          │
│ > Learning Stats        │
│ > Account Settings      │
│ > Subscription          │
│ > App Settings          │
│ > Help & Support        │
└─────────────────────────┘
```

### AppSettingsScreen
```
┌─────────────────────────┐
│ Appearance              │
│ > Theme: Auto ⟩         │
│ > Language: English ⟩   │
├─────────────────────────┤
│ Sound & Haptics         │
│ Sound Effects     [ON]  │
│ Haptic Feedback   [ON]  │
├─────────────────────────┤
│ Notifications           │
│ > Configure ⟩           │
├─────────────────────────┤
│ Privacy                 │
│ > Privacy Settings ⟩    │
└─────────────────────────┘
```

---

## Risk Assessment

### **High Complexity:**
- **Payment Integration:** Stripe/RevenueCat setup
- **Image Upload:** Native image picker, cropping, upload
- **Push Notifications:** Platform-specific setup
- **Theme System:** App-wide state management

### **Mitigation:**
- Use proven libraries (expo-image-picker, expo-notifications)
- Leverage Supabase Storage for images
- Use RevenueCat for cross-platform subscriptions
- Simple theme context with AsyncStorage persistence

### **Medium Complexity:**
- **Form Validation:** Password strength, email validation
- **Charts:** Learning stats visualization
- **Calendar:** Streak display

### **Low Complexity:**
- **Settings CRUD:** Standard API operations
- **Profile Display:** Read-only data display
- **Navigation:** React Navigation patterns

---

## Success Criteria

✅ User can view and edit profile
✅ Avatar upload and display working
✅ All settings saved and persisted
✅ Subscription management functional
✅ Theme switching works
✅ Push notifications configured
✅ Account security features working
✅ Privacy features (export, delete) functional
✅ Stats and achievements display correctly
✅ Help and support accessible

---

## Recommended Approach

### **Phase 1 (MVP): Stages 1-5** (10 days)
Get core features working:
- View/edit profile
- Basic settings
- Account management
- Stats display
- Help/support

### **Phase 2 (Enhanced): Stage 6** (2 days)
Add polish and integrations:
- Image upload
- Push notifications
- Payment integration
- Theme support
- Analytics

---

## Mobile-Specific Considerations

### **Platform Differences:**
1. **Image Picker:** Use expo-image-picker (iOS/Android permissions)
2. **Push Notifications:** Platform-specific tokens and setup
3. **Storage:** MMKV for settings (faster than AsyncStorage)
4. **Navigation:** Native feel (modals for forms, stack for flows)
5. **Gestures:** Pull-to-refresh, swipe actions

### **Performance:**
1. **Image Optimization:** Compress before upload
2. **Settings Caching:** Local-first with sync
3. **Lazy Loading:** Stats charts on demand
4. **Memoization:** Profile data rarely changes

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Set up payment provider** (Stripe/RevenueCat account)
3. **Configure push notifications** (Firebase/Expo)
4. **Design UI mockups** for key screens
5. **Start Stage 1** when approved

---

**Ready to start building? Let me know if you want to:**
- Adjust timeline/priorities
- See detailed UI mockups
- Start with Stage 1 implementation
- Focus on specific features first
