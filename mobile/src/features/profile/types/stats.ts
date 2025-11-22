/**
 * User statistics types
 */

export interface UserStats {
  user_id: string
  total_lessons_completed: number
  total_exercises_completed: number
  current_streak_days: number
  longest_streak_days: number
  total_coins: number
  total_xp: number
  level: number
  last_activity_date: string | null
}

export interface StreakInfo {
  current_streak: number
  longest_streak: number
  last_activity: string | null
  is_active_today: boolean
}
