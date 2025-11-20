/**
 * Audio playback service for flashcard pronunciation
 * Handles TTS audio playback with caching
 */

import Sound from 'react-native-sound'
import { flashcardAPI } from './flashcardService'

// Enable playback in silent mode (iOS)
Sound.setCategory('Playback')

/**
 * Audio playback service singleton
 */
class AudioService {
  private currentSound: Sound | null = null
  private audioCache = new Map<string, Sound>()
  private isPlaying = false

  constructor() {
    // Initialize sound library
    Sound.setCategory('Playback', true)
  }

  /**
   * Play Vietnamese pronunciation for a flashcard
   *
   * @param flashcardId - Flashcard ID
   * @param vietnamese - Vietnamese text (fallback for TTS)
   */
  async playPronunciation(flashcardId: string, vietnamese: string): Promise<void> {
    try {
      // Stop current audio if playing
      this.stop()

      // Check cache first
      if (this.audioCache.has(flashcardId)) {
        const sound = this.audioCache.get(flashcardId)!
        this.playSound(sound)
        return
      }

      // Fetch audio URL from backend
      const { audio_url } = await flashcardAPI.getFlashcardAudio(flashcardId)

      if (!audio_url) {
        console.log('No audio URL found, falling back to TTS')
        await this.playTTS(vietnamese)
        return
      }

      // Load and play audio
      this.loadAndPlay(audio_url, flashcardId)
    } catch (error) {
      console.error('Failed to play pronunciation:', error)
      // Fallback to TTS on error
      await this.playTTS(vietnamese)
    }
  }

  /**
   * Play text-to-speech audio
   *
   * @param text - Vietnamese text to speak
   * @param language - Language code (default: 'vi')
   */
  async playTTS(text: string, language: string = 'vi'): Promise<void> {
    try {
      this.stop()

      // Call TTS API endpoint
      const response = await fetch('/api/flashcards/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, language }),
      })

      if (!response.ok) {
        throw new Error('TTS API request failed')
      }

      const { audio_url } = await response.json()

      if (audio_url) {
        this.loadAndPlay(audio_url)
      }
    } catch (error) {
      console.error('Failed to play TTS:', error)
      throw error
    }
  }

  /**
   * Load audio from URL and play
   *
   * @param url - Audio file URL
   * @param cacheKey - Optional key to cache the sound
   */
  private loadAndPlay(url: string, cacheKey?: string): void {
    const sound = new Sound(url, '', (error) => {
      if (error) {
        console.error('Failed to load sound:', error)
        return
      }

      // Cache the sound if key provided
      if (cacheKey) {
        this.audioCache.set(cacheKey, sound)
      }

      this.playSound(sound)
    })

    this.currentSound = sound
  }

  /**
   * Play a loaded sound
   *
   * @param sound - Sound instance to play
   */
  private playSound(sound: Sound): void {
    this.isPlaying = true

    sound.play((success) => {
      this.isPlaying = false

      if (!success) {
        console.error('Sound playback failed')
        sound.reset()
      }
    })
  }

  /**
   * Stop current audio playback
   */
  stop(): void {
    if (this.currentSound && this.isPlaying) {
      this.currentSound.stop(() => {
        this.isPlaying = false
      })
    }
  }

  /**
   * Pause current audio playback
   */
  pause(): void {
    if (this.currentSound && this.isPlaying) {
      this.currentSound.pause()
      this.isPlaying = false
    }
  }

  /**
   * Resume paused audio
   */
  resume(): void {
    if (this.currentSound && !this.isPlaying) {
      this.currentSound.play()
      this.isPlaying = true
    }
  }

  /**
   * Set volume
   *
   * @param volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    if (this.currentSound) {
      this.currentSound.setVolume(Math.max(0, Math.min(1, volume)))
    }
  }

  /**
   * Get current playback status
   */
  getIsPlaying(): boolean {
    return this.isPlaying
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    // Release all cached sounds
    this.audioCache.forEach((sound) => {
      sound.release()
    })
    this.audioCache.clear()
  }

  /**
   * Release resources
   * Call this when unmounting or app closing
   */
  release(): void {
    this.stop()
    this.clearCache()

    if (this.currentSound) {
      this.currentSound.release()
      this.currentSound = null
    }
  }

  /**
   * Get cache size (number of cached audio files)
   */
  getCacheSize(): number {
    return this.audioCache.size
  }

  /**
   * Remove specific audio from cache
   *
   * @param flashcardId - Flashcard ID to remove from cache
   */
  removeCached(flashcardId: string): void {
    const sound = this.audioCache.get(flashcardId)
    if (sound) {
      sound.release()
      this.audioCache.delete(flashcardId)
    }
  }
}

// Export singleton instance
export const audioService = new AudioService()

/**
 * Hook-friendly wrapper for playing pronunciation
 * Can be used in React components
 */
export function playFlashcardAudio(flashcardId: string, vietnamese: string): Promise<void> {
  return audioService.playPronunciation(flashcardId, vietnamese)
}

/**
 * Stop any currently playing audio
 */
export function stopAudio(): void {
  audioService.stop()
}

/**
 * Release audio resources
 * Call on app unmount or cleanup
 */
export function releaseAudioResources(): void {
  audioService.release()
}
