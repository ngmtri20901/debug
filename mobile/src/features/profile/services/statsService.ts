/**
 * Stats service - API functions for user statistics
 */

import { supabase } from '@/lib/supabase/client'
import type { UserStats, StreakInfo } from '../types'

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    // Fetch from user_stats table
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If no stats exist, return default values
      if (error.code === 'PGRST116') {
        return {
          user_id: userId,
          total_lessons_completed: 0,
          total_exercises_completed: 0,
          current_streak_days: 0,
          longest_streak_days: 0,
          total_coins: 0,
          total_xp: 0,
          level: 1,
          last_activity_date: null,
        }
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching user stats:', error)
    throw error
  }
}

/**
 * Get streak information
 */
export async function getStreakInfo(userId: string): Promise<StreakInfo> {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('current_streak_days, longest_streak_days, last_activity_date')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          current_streak: 0,
          longest_streak: 0,
          last_activity: null,
          is_active_today: false,
        }
      }
      throw error
    }

    // Check if user was active today
    const today = new Date().toISOString().split('T')[0]
    const lastActivity = data.last_activity_date
      ? new Date(data.last_activity_date).toISOString().split('T')[0]
      : null
    const is_active_today = today === lastActivity

    return {
      current_streak: data.current_streak_days,
      longest_streak: data.longest_streak_days,
      last_activity: data.last_activity_date,
      is_active_today,
    }
  } catch (error) {
    console.error('Error fetching streak info:', error)
    throw error
  }
}
