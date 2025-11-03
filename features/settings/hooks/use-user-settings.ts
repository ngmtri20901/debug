import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/shared/lib/supabase/client'
import { 
  UserSettings, 
  UserSettingsRow, 
  DisplaySettings, 
  NotificationSettings, 
  PrivacySettings,
} from '@/shared/types/settings'

// Default user settings
export const DEFAULT_USER_SETTINGS: UserSettings = {
  display: {
    flashcardAnimationSpeed: "normal",
    muteSounds: false,
    soundVolume: 75,
    reviewTimeSeconds: 4,
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    keyboardNavigation: true,
    focusIndicators: true,
  },
  notifications: {
    email: {
      dailyReminders: false,
      weeklyProgress: false,
      achievements: false,
      questUpdates: false,
      marketingEmails: false,
    },
    push: {
      studyReminders: false,
      streakReminders: false,
      achievements: false,
      questUpdates: false,
      flashcardReviews: false,
    },
    inApp: {
      sounds: true,
      popups: true,
      achievements: true,
      levelUps: true,
    },
    studyReminders: {
      enabled: false,
      dailyGoal: false,
      weeklyGoal: false,
      streakMaintenance: false,
    },
  },
  privacy: {
    dataCollection: true,
    analyticsTracking: true,
    crashReporting: true,
    marketingCommunications: false,
    sessionTimeout: "30",
    passwordChangeNotifications: true,
  },
}

// Validation functions
export function validateUserSettings(settings: any): UserSettings {
  // Basic validation - in production, use Zod or similar
  try {
    return {
      display: settings.display || DEFAULT_USER_SETTINGS.display,
      notifications: settings.notifications || DEFAULT_USER_SETTINGS.notifications,
      privacy: settings.privacy || DEFAULT_USER_SETTINGS.privacy,
    }
  } catch {
    return DEFAULT_USER_SETTINGS
  }
}

export function safeParseUserSettings(settings: any): { success: boolean; data?: UserSettings; error?: Error } {
  try {
    const parsed = typeof settings === 'string' ? JSON.parse(settings) : settings
    const validated = validateUserSettings(parsed)
    return { success: true, data: validated }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error('Failed to parse settings') }
  }
}

// Query keys
export const userSettingsKeys = {
  all: ['user-settings'] as const,
  detail: (userId: string) => [...userSettingsKeys.all, 'detail', userId] as const,
  category: (userId: string, category: string) => [...userSettingsKeys.all, category, userId] as const,
}

// Get current user ID helper
const getCurrentUserId = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('User not authenticated')
  }
  return user.id
}

// API functions
const fetchUserSettings = async (): Promise<UserSettings> => {
  const userId = await getCurrentUserId()
  
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found, return defaults
      return DEFAULT_USER_SETTINGS
    }
    throw new Error(`Failed to fetch user settings: ${error.message}`)
  }

  // Validate and parse settings from database
  const parseResult = safeParseUserSettings(data.settings)
  if (!parseResult.success) {
    console.warn('Invalid settings from database, using defaults:', parseResult.error)
    return DEFAULT_USER_SETTINGS
  }

  return parseResult.data
}

const saveUserSettings = async (settings: UserSettings): Promise<void> => {
  const userId = await getCurrentUserId()
  
  // Validate settings before saving
  const validatedSettings = validateUserSettings(settings)
  
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      settings: validatedSettings,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    })

  if (error) {
    throw new Error(`Failed to save user settings: ${error.message}`)
  }
}

// Helper function to deeply compare settings objects
const areSettingsEqual = (settings1: UserSettings, settings2: UserSettings): boolean => {
  return JSON.stringify(settings1) === JSON.stringify(settings2)
}

// Main hook for user settings with draft mode
export const useUserSettings = () => {
  const queryClient = useQueryClient()
  
  // Draft state for unsaved changes
  const [draftSettings, setDraftSettings] = useState<UserSettings | null>(null)

  const query = useQuery({
    queryKey: userSettingsKeys.all,
    queryFn: fetchUserSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error.message.includes('not authenticated')) {
        return false
      }
      return failureCount < 3
    },
  })

  // Initialize draft settings when data loads
  const savedSettings = query.data ?? DEFAULT_USER_SETTINGS
  const currentSettings = draftSettings ?? savedSettings

  // Calculate if there are unsaved changes
  const hasUnsavedChanges = draftSettings !== null && !areSettingsEqual(draftSettings, savedSettings)

  // Reset draft when saved settings change (e.g., after successful save or external update)
  useEffect(() => {
    if (query.data && draftSettings) {
      // If the saved settings have changed and we have draft settings,
      // check if they're now equal to reset draft state
      if (areSettingsEqual(draftSettings, query.data)) {
        setDraftSettings(null)
      }
    }
  }, [query.data, draftSettings])

  const saveMutation = useMutation({
    mutationFn: saveUserSettings,
    onMutate: async (newSettings) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userSettingsKeys.all })

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<UserSettings>(userSettingsKeys.all)

      // Optimistically update
      queryClient.setQueryData<UserSettings>(userSettingsKeys.all, newSettings)

      return { previousSettings }
    },
    onError: (error, _newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData<UserSettings>(userSettingsKeys.all, context.previousSettings)
      }
      toast.error('Failed to save settings')
      console.error('Settings save error:', error)
    },
    onSuccess: () => {
      // Clear draft state after successful save
      setDraftSettings(null)
      toast.success('Settings saved successfully')
    },
    onSettled: () => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: userSettingsKeys.all })
    },
  })

  // Update draft setting (local only, no save to database)
  const updateDraftSetting = useCallback((category: keyof UserSettings, key: string, value: any) => {
    const baseSettings = draftSettings ?? savedSettings
    const newSettings = {
      ...baseSettings,
      [category]: {
        ...baseSettings[category],
        [key]: value,
      },
    }
    setDraftSettings(newSettings)
  }, [draftSettings, savedSettings])

  // Update draft category (local only, no save to database)
  const updateDraftCategory = useCallback((category: keyof UserSettings, categorySettings: DisplaySettings | NotificationSettings | PrivacySettings) => {
    const baseSettings = draftSettings ?? savedSettings
    const newSettings = {
      ...baseSettings,
      [category]: categorySettings,
    }
    setDraftSettings(newSettings)
  }, [draftSettings, savedSettings])

  // Save current draft settings to database
  const saveSettings = useCallback((settings?: UserSettings) => {
    const settingsToSave = settings ?? currentSettings
    return new Promise<void>((resolve, reject) => {
      saveMutation.mutate(settingsToSave, {
        onSuccess: () => {
          resolve()
        },
        onError: (error) => {
          reject(error)
        }
      })
    })
  }, [currentSettings, saveMutation])

  // Discard changes and reset to saved settings
  const discardChanges = useCallback(() => {
    setDraftSettings(null)
  }, [])

  // Reset to default settings (draft only)
  const resetToDefaults = useCallback(() => {
    setDraftSettings(DEFAULT_USER_SETTINGS)
  }, [])

  return {
    // Query data
    settings: currentSettings,
    savedSettings,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,

    // Draft state
    hasUnsavedChanges,
    draftSettings,

    // Mutations
    saveSettings,
    updateDraftSetting,
    updateDraftCategory,
    discardChanges,
    resetToDefaults,

    // Mutation states
    isSaving: saveMutation.isPending,
  }
}

// Specialized hooks for individual categories
export const useDisplaySettingsBase = () => {
  const { 
    settings, 
    savedSettings,
    updateDraftCategory, 
    updateDraftSetting, 
    saveSettings, 
    discardChanges,
    resetToDefaults,
    hasUnsavedChanges,
    isSaving 
  } = useUserSettings()

  return {
    settings: settings.display,
    savedSettings: savedSettings.display,
    updateDisplaySettings: (newSettings: DisplaySettings) => 
      updateDraftCategory('display', newSettings),
    updateDisplaySetting: (key: keyof DisplaySettings, value: any) =>
      updateDraftSetting('display', key, value),
    saveSettings: () => saveSettings(),
    discardChanges,
    resetToDefaults,
    hasUnsavedChanges,
    isSaving,
  }
}

export const useNotificationSettings = () => {
  const { 
    settings, 
    savedSettings,
    updateDraftCategory, 
    updateDraftSetting, 
    saveSettings, 
    discardChanges,
    resetToDefaults,
    hasUnsavedChanges,
    isSaving 
  } = useUserSettings()

  return {
    settings: settings.notifications,
    savedSettings: savedSettings.notifications,
    updateNotificationSettings: (newSettings: NotificationSettings) => 
      updateDraftCategory('notifications', newSettings),
    updateNotificationSetting: (key: keyof NotificationSettings, value: any) =>
      updateDraftSetting('notifications', key, value),
    saveSettings: () => saveSettings(),
    discardChanges,
    resetToDefaults,
    hasUnsavedChanges,
    isSaving,
  }
}

export const usePrivacySettings = () => {
  const { 
    settings, 
    savedSettings,
    updateDraftCategory, 
    updateDraftSetting, 
    saveSettings, 
    discardChanges,
    resetToDefaults,
    hasUnsavedChanges,
    isSaving 
  } = useUserSettings()

  return {
    settings: settings.privacy,
    savedSettings: savedSettings.privacy,
    updatePrivacySettings: (newSettings: PrivacySettings) => 
      updateDraftCategory('privacy', newSettings),
    updatePrivacySetting: (key: keyof PrivacySettings, value: any) =>
      updateDraftSetting('privacy', key, value),
    saveSettings: () => saveSettings(),
    discardChanges,
    resetToDefaults,
    hasUnsavedChanges,
    isSaving,
  }
}

