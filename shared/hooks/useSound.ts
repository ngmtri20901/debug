"use client"

import { useCallback } from "react"

// Simple sound utility hook for playing audio files
export function useSound() {
  const playSound = useCallback((soundName: string) => {
    try {
      // Create audio instance
      const audio = new Audio(`/sounds/${soundName}`)

      // Set volume to reasonable level
      audio.volume = 0.6

      // Play the sound
      audio.play().catch((error) => {
        // Silently handle errors (e.g., user hasn't interacted with page yet)
        console.debug('Sound play failed:', error)
      })
    } catch (error) {
      console.debug('Sound utility error:', error)
    }
  }, [])

  return { playSound }
}