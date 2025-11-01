/**
 * Audio utilities for flashcard pronunciation
 */

import { DisplaySettings } from "@/shared/types/settings"

export interface AudioOptions {
  volume?: number
  loop?: boolean
  preload?: boolean
}

export class AudioManager {
  private static instance: AudioManager
  private audioCache = new Map<string, HTMLAudioElement>()
  private settings: DisplaySettings | null = null

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  updateSettings(settings: DisplaySettings) {
    this.settings = settings
  }

  private getSoundEffectsVolume(): number {
    if (!this.settings) return 0
    // Sound effects are affected by mute setting
    return this.settings.muteSounds ? 0 : this.settings.soundVolume / 100
  }

  private getPronunciationVolume(): number {
    if (!this.settings) return 0.75
    // Pronunciation always uses the actual volume setting, not affected by mute
    return this.settings.soundVolume / 100
  }

  async loadAudio(src: string, options: AudioOptions = {}): Promise<HTMLAudioElement> {
    if (this.audioCache.has(src)) {
      return this.audioCache.get(src)!
    }

    const audio = new Audio(src)
    audio.volume = options.volume ?? 0.75
    audio.loop = options.loop ?? false
    audio.preload = options.preload ? 'auto' : 'metadata'

    try {
      await new Promise((resolve, reject) => {
        audio.oncanplaythrough = resolve
        audio.onerror = reject
        audio.load()
      })
      
      this.audioCache.set(src, audio)
      return audio
    } catch (error) {
      console.error(`Failed to load audio: ${src}`, error)
      throw error
    }
  }

  // Play sound effects (flip, correct, incorrect, etc.) - affected by mute
  async playSoundEffect(src: string, options: AudioOptions = {}): Promise<void> {
    const volume = this.getSoundEffectsVolume()
    if (volume === 0) {
      // Sound effects are muted, don't play
      return
    }

    try {
      const audio = await this.loadAudio(src, options)
      audio.volume = options.volume ?? volume
      audio.currentTime = 0
      await audio.play()
    } catch (error) {
      console.error(`Failed to play sound effect: ${src}`, error)
    }
  }

  // Play Vietnamese pronunciation - always available for manual playback
  async playPronunciation(src: string, options: AudioOptions = {}): Promise<void> {
    const volume = this.getPronunciationVolume()
    
    try {
      const audio = await this.loadAudio(src, options)
      audio.volume = options.volume ?? volume
      audio.currentTime = 0
      await audio.play()
    } catch (error) {
      console.error(`Failed to play pronunciation: ${src}`, error)
    }
  }

  stopAllSounds(): void {
    this.audioCache.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
  }

  updateVolume(): void {
    // Update volume for all cached audio
    this.audioCache.forEach((audio, src) => {
      // Determine if this is a pronunciation or sound effect
      // You might want to implement a better way to categorize audio files
      if (src.includes('/tts/') || src.includes('/pronunciation/')) {
        // Pronunciation audio
        audio.volume = this.getPronunciationVolume()
      } else {
        // Sound effect audio
        audio.volume = this.getSoundEffectsVolume()
      }
    })
  }

  clearCache(): void {
    this.stopAllSounds()
    this.audioCache.clear()
  }
}

// Convenience functions for sound effects (affected by mute setting)
export const audioManager = AudioManager.getInstance()

export const playCorrectSound = () => audioManager.playSoundEffect('/sounds/correct.mp3')
export const playIncorrectSound = () => audioManager.playSoundEffect('/sounds/incorrect.wav')
export const playFlipSound = () => audioManager.playSoundEffect('/sounds/flip.mp3')
export const playNewCardSound = () => audioManager.playSoundEffect('/sounds/new.mp3')

// Vietnamese pronunciation audio (always available for manual playback)
export const playVietnamesePronunciation = (word: string) => {
  // This would integrate with a Vietnamese TTS service
  console.log(`Playing pronunciation for: ${word}`)
  // Example: audioManager.playPronunciation(`/api/tts/vietnamese/${encodeURIComponent(word)}`)
} 