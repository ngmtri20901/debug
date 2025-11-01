// Core settings interfaces matching current localStorage structure
export interface UserSettings {
  display: DisplaySettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface DisplaySettings {
  flashcardAnimationSpeed: "slow" | "normal" | "fast";
  muteSounds: boolean;
  soundVolume: number; // 0-100
  reviewTimeSeconds: number; // 2-8
  language: string;
  timezone: string;
  dateFormat: string;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
}

export interface NotificationSettings {
  email: {
    dailyReminders: boolean;
    weeklyProgress: boolean;
    achievements: boolean;
    questUpdates: boolean;
    marketingEmails: boolean;
  };
  push: {
    studyReminders: boolean;
    streakReminders: boolean;
    achievements: boolean;
    questUpdates: boolean;
    flashcardReviews: boolean;
  };
  inApp: {
    sounds: boolean;
    popups: boolean;
    achievements: boolean;
    levelUps: boolean;
  };
  studyReminders: {
    enabled: boolean;
    dailyGoal: boolean;
    weeklyGoal: boolean;
    streakMaintenance: boolean;
  };
}

export interface PrivacySettings {
  dataCollection: boolean;
  analyticsTracking: boolean;
  crashReporting: boolean;
  marketingCommunications: boolean;
  sessionTimeout: "15" | "30" | "60" | "never";
  passwordChangeNotifications: boolean;
}

// Database response type
export interface UserSettingsRow {
  id: string;
  user_id: string;
  settings: UserSettings;
  settings_version: number;
  created_at: string;
  updated_at: string;
} 