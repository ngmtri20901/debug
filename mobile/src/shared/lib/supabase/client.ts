/**
 * Supabase client for React Native
 * Uses AsyncStorage for session persistence
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import 'react-native-url-polyfill/auto' // Required polyfill for Supabase

// @ts-ignore - env types defined in env.d.ts
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'

/**
 * Create Supabase client instance
 *
 * Uses AsyncStorage for session persistence to maintain auth state
 * across app restarts
 */
export const supabase = createSupabaseClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Not needed for mobile
    },
  }
)

/**
 * Create a new Supabase client instance (for testing or isolated operations)
 */
export function createClient() {
  return createSupabaseClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  )
}

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
