'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { queryKeys } from '@/shared/hooks/query-keys'
import type { User } from '@supabase/supabase-js'

/**
 * User profile data structure from Supabase
 */
export interface UserProfile {
  id: string
  name?: string
  email?: string
  coins: number
  created_at: string
  updated_at: string
  username?: string
  avatar_url?: string
  subscription_type?: 'FREE' | 'PLUS' | 'UNLIMITED'
  total_study_time?: number
  streak_count?: number
  last_active?: string
}

/**
 * Combined user data including auth and profile
 */
export interface UserData {
  user: User | null
  profile: UserProfile | null
  isAuthenticated: boolean
  authProvider: string
  isGoogleUser: boolean
}

/**
 * Utility function to detect authentication provider
 */
export const getAuthProvider = (user: User | null): string => {
  if (!user) return 'unknown'
  return user.app_metadata?.provider || 'email'
}

/**
 * Utility function to check if user is a Google user
 */
export const isGoogleUser = (user: User | null): boolean => {
  if (!user) return false
  return getAuthProvider(user) === 'google'
}

/**
 * Hook to manage user authentication with TanStack Query
 * Replaces the traditional useAuth hook with global state management
 */
export function useUserProfile() {
  const queryClient = useQueryClient()
  const channelRef = useRef<any>(null)

  // Query for user authentication status with user-specific key to avoid cache conflicts
  const authQuery = useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async (): Promise<UserData> => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          return { 
            user: null, 
            profile: null, 
            isAuthenticated: false,
            authProvider: 'unknown',
            isGoogleUser: false
          }
        }

        if (!session?.user) {
          return { 
            user: null, 
            profile: null, 
            isAuthenticated: false,
            authProvider: 'unknown',
            isGoogleUser: false
          }
        }

        const authProvider = getAuthProvider(session.user)
        const isGoogle = isGoogleUser(session.user)

        // Fetch user profile data
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching user profile:', profileError)
          // Still return user auth data even if profile fetch fails
          return { 
            user: session.user, 
            profile: null, 
            isAuthenticated: true,
            authProvider,
            isGoogleUser: isGoogle
          }
        }

        return {
          user: session.user,
          profile,
          isAuthenticated: true,
          authProvider,
          isGoogleUser: isGoogle
        }
      } catch (error) {
        console.error('Error in user profile query:', error)
        return { 
          user: null, 
          profile: null, 
          isAuthenticated: false,
          authProvider: 'unknown',
          isGoogleUser: false
        }
      }
    },
    staleTime: 30 * 1000, // 30 seconds - shorter for auth data
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error instanceof Error && error.message.includes('not authenticated')) return false
      return failureCount < 3
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Only enable when component is mounted and not during SSR
    enabled: typeof window !== 'undefined',
  })

  // Set up real-time subscription for auth changes
  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.id)

        // Invalidate and refetch user data on auth changes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          await queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() })

          // Also invalidate related user data
          await queryClient.invalidateQueries({ queryKey: queryKeys.user.coins() })
          await queryClient.invalidateQueries({ queryKey: queryKeys.user.progress() })
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [queryClient])

  // Set up real-time subscription for profile changes with proper cleanup
  useEffect(() => {
    if (!authQuery.data?.user?.id) return

    let mounted = true

    // Clean up existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Create new channel with unique name to prevent conflicts
    const channelName = `user_profile_${authQuery.data.user.id}_${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${authQuery.data.user.id}`,
        },
        (payload) => {
          if (!mounted) return

          console.log('User profile changed:', payload)

          // Update the query cache with new data
          queryClient.setQueryData(queryKeys.user.profile(), (oldData: UserData | undefined) => {
            if (!oldData) return oldData

            return {
              ...oldData,
              profile: payload.new as UserProfile
            }
          })

          // Also invalidate related queries that depend on profile data
          queryClient.invalidateQueries({ queryKey: queryKeys.user.coins() })
          queryClient.invalidateQueries({ queryKey: queryKeys.user.progress() })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [authQuery.data?.user?.id, queryClient])

  return {
    user: authQuery.data?.user || null,
    profile: authQuery.data?.profile || null,
    isAuthenticated: authQuery.data?.isAuthenticated || false,
    authProvider: authQuery.data?.authProvider || 'unknown',
    isGoogleUser: authQuery.data?.isGoogleUser || false,
    loading: authQuery.isLoading,
    error: authQuery.error,
    refetch: authQuery.refetch,
  }
}

/**
 * Hook to check if user is authenticated (shorthand)
 */
export function useAuth() {
  const { user, loading, isAuthenticated } = useUserProfile()
  return { user, loading, isAuthenticated }
} 