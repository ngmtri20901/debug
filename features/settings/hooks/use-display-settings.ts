"use client"

import { useDisplaySettingsBase } from '@/features/settings/hooks/use-user-settings'
import { DisplaySettings } from '@/shared/types/settings'

export type FlashcardAnimationSpeed = "slow" | "normal" | "fast"

// Animation duration mappings (keep existing)
export const ANIMATION_DURATIONS = {
  slow: 750,   
  normal: 500, 
  fast: 250,   
} as const

// Constraints (keep existing)
export const REVIEW_TIME_CONSTRAINTS = {
  min: 2,
  max: 8,
  default: 4,
} as const

export const SOUND_VOLUME_CONSTRAINTS = {
  min: 0,
  max: 100,
  default: 75,
  step: 5,
} as const

/**
 * Enhanced display settings hook with utility functions
 * Wraps the base useDisplaySettings hook with flashcard-specific utilities
 */
export const useDisplaySettings = () => {
  const { 
    settings: displaySettings, 
    savedSettings,
    updateDisplaySetting,
    updateDisplaySettings,
    saveSettings,
    discardChanges,
    resetToDefaults,
    hasUnsavedChanges,
    isSaving 
  } = useDisplaySettingsBase()

  // Update individual setting - now only updates draft state
  const updateSetting = <K extends keyof DisplaySettings>(
    key: K,
    value: DisplaySettings[K]
  ) => {
    updateDisplaySetting(key, value)
  }

  // Update multiple settings at once - now only updates draft state
  const updateMultipleSettings = (updates: Partial<DisplaySettings>) => {
    const newSettings = { ...displaySettings, ...updates }
    updateDisplaySettings(newSettings)
  }

  // Reset to defaults - now only updates draft state
  const resetSettings = () => {
    resetToDefaults()
  }

  // Explicit save function for the Save button
  const saveCurrentSettings = () => {
    saveSettings()
  }

  // Discard unsaved changes
  const discardSettings = () => {
    discardChanges()
  }

  // Utility functions (keep existing logic)
  const getAnimationDuration = () => {
    return ANIMATION_DURATIONS[displaySettings.flashcardAnimationSpeed]
  }

  const getReviewTimeSeconds = () => {
    const { min, max } = REVIEW_TIME_CONSTRAINTS
    return Math.max(min, Math.min(max, displaySettings.reviewTimeSeconds))
  }

  const updateReviewTime = (seconds: number) => {
    const { min, max } = REVIEW_TIME_CONSTRAINTS
    const validatedSeconds = Math.max(min, Math.min(max, seconds))
    updateSetting('reviewTimeSeconds', validatedSeconds)
  }

  const getSoundVolume = () => {
    const { min, max } = SOUND_VOLUME_CONSTRAINTS
    return Math.max(min, Math.min(max, displaySettings.soundVolume))
  }

  const updateSoundVolume = (volume: number) => {
    const { min, max } = SOUND_VOLUME_CONSTRAINTS
    const validatedVolume = Math.max(min, Math.min(max, volume))
    updateSetting('soundVolume', validatedVolume)
  }

  const areSoundEffectsDisabled = () => {
    return displaySettings.muteSounds || displaySettings.soundVolume === 0
  }

  const getEffectiveVolume = () => {
    return displaySettings.muteSounds ? 0 : getSoundVolume()
  }

  const getPronunciationVolume = () => {
    return getSoundVolume()
  }

  const toggleMute = () => {
    updateSetting('muteSounds', !displaySettings.muteSounds)
  }

  return {
    settings: displaySettings,
    savedSettings,
    updateSetting,
    updateMultipleSettings,
    resetSettings,
    saveSettings: saveCurrentSettings,
    discardSettings,
    hasUnsavedChanges,
    isLoaded: true, // Since we're using React Query, we can consider it loaded when not loading
    isSaving,
    getAnimationDuration,
    getReviewTimeSeconds,
    updateReviewTime,
    getSoundVolume,
    updateSoundVolume,
    areSoundEffectsDisabled,
    getEffectiveVolume,
    getPronunciationVolume,
    toggleMute,
  }
}

