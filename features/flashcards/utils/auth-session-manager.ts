/**
 * Auth Session Manager for Vietnamese Learning App
 * Handles auth session refresh intelligently to avoid disrupting review sessions
 */

import { createClient } from '@/shared/lib/supabase/client'

export class AuthSessionManager {
  private static instance: AuthSessionManager
  private isReviewSession = false
  private refreshTimeout: NodeJS.Timeout | null = null

  private constructor() {
    this.setupVisibilityListener()
  }

  public static getInstance(): AuthSessionManager {
    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager()
    }
    return AuthSessionManager.instance
  }

  /**
   * Set whether we're currently in a review session
   */
  public setReviewSession(isReview: boolean) {
    this.isReviewSession = isReview
    console.log('🔄 AuthSessionManager: Review session status:', isReview)
  }

  /**
   * Setup visibility change listener to handle session refresh
   */
  private setupVisibilityListener() {
    if (typeof window === 'undefined') return

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleTabFocus()
      } else {
        this.handleTabBlur()
      }
    })
  }

  /**
   * Handle when tab becomes visible
   */
  private async handleTabFocus() {
    if (this.isReviewSession) {
      console.log('🚫 AuthSessionManager: Skipping session refresh during review session')
      return
    }

    // Clear any existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
    }

    // Delay session refresh to avoid disrupting user interactions
    this.refreshTimeout = setTimeout(async () => {
      await this.refreshSession()
    }, 2000) // 2 second delay
  }

  /**
   * Handle when tab becomes hidden
   */
  private handleTabBlur() {
    // Clear any pending refresh
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
  }

  /**
   * Refresh the auth session
   */
  private async refreshSession() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Auth session refresh error:', error)
      } else {
        console.log('✅ Auth session refreshed successfully')
      }
    } catch (error) {
      console.error('❌ Auth session refresh failed:', error)
    }
  }

  /**
   * Force refresh session (for non-review contexts)
   */
  public async forceRefresh() {
    if (this.isReviewSession) {
      console.log('🚫 AuthSessionManager: Cannot force refresh during review session')
      return
    }
    
    await this.refreshSession()
  }
}

// Export singleton instance
export const authSessionManager = AuthSessionManager.getInstance()

