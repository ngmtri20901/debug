import type { UserLessonProgress } from '@/features/learn/api'

export type SubscriptionTier = 'FREE' | 'PLUS' | 'UNLIMITED'

export interface LessonUnlockStatus {
  isLocked: boolean
  reason?: 'tier_restriction' | 'previous_incomplete' | 'zone_locked' | 'login_required' | 'loading'
  requiredAction?: string
  completedTopicsInPrevZone?: number
  totalTopicsInPrevZone?: number
}

/**
 * Check if a lesson should be unlocked based on tier and progress
 * 
 * Rules:
 * - UNLIMITED: All lessons unlocked
 * - PLUS: All zones accessible, sequential unlock within topics
 * - FREE: Progressive zone unlock
 *   - Beginner (level 1) always accessible
 *   - Complete ALL topics in zone N to unlock first lesson of each topic in zone N+1
 *   - Sequential unlock within topics
 */
export function checkLessonUnlock(params: {
  userTier: SubscriptionTier | null
  isAuthenticated: boolean
  zoneLevel: number // 1 = Beginner, 2 = Elementary, etc.
  lessonSortOrder: number
  previousLessonProgress: UserLessonProgress | null
  completedTopicsInPreviousZone?: number // For FREE tier zone unlock check
  totalTopicsInPreviousZone?: number
}): LessonUnlockStatus {
  const { 
    userTier, 
    isAuthenticated, 
    zoneLevel, 
    lessonSortOrder, 
    previousLessonProgress,
    completedTopicsInPreviousZone = 0,
    totalTopicsInPreviousZone = 0
  } = params

  // Not authenticated - all locked
  if (!isAuthenticated) {
    return {
      isLocked: true,
      reason: 'login_required',
      requiredAction: 'Please log in to access lessons',
    }
  }

  // UNLIMITED tier - all unlocked
  if (userTier === 'UNLIMITED') {
    return { isLocked: false }
  }

  // FREE tier - progressive zone unlocking based on completion
  if (userTier === 'FREE') {
    // Beginner zone (level 1) is always accessible
    if (zoneLevel === 1) {
      // First lesson in topic always unlocked
      if (lessonSortOrder === 1) {
        return { isLocked: false }
      }

      // Check if previous lesson in topic passed
      if (!previousLessonProgress || previousLessonProgress.status !== 'passed') {
        return {
          isLocked: true,
          reason: 'previous_incomplete',
          requiredAction: 'Complete the previous lesson in this topic first',
        }
      }

      return { isLocked: false }
    }

    // For zones beyond beginner (level > 1), check if ALL topics in previous zone are completed
    const allTopicsInPrevZoneCompleted = 
      totalTopicsInPreviousZone > 0 && 
      completedTopicsInPreviousZone >= totalTopicsInPreviousZone

    if (!allTopicsInPrevZoneCompleted) {
      const zoneName = getZoneName(zoneLevel - 1)
      return {
        isLocked: true,
        reason: 'zone_locked',
        requiredAction: `Complete all topics in ${zoneName} zone to unlock this zone (${completedTopicsInPreviousZone}/${totalTopicsInPreviousZone} topics completed)`,
        completedTopicsInPrevZone: completedTopicsInPreviousZone,
        totalTopicsInPrevZone: totalTopicsInPreviousZone,
      }
    }

    // Zone is unlocked for FREE tier, now check lesson unlock within topic
    // First lesson in each topic is unlocked when zone is unlocked
    if (lessonSortOrder === 1) {
      return { isLocked: false }
    }

    // Check if previous lesson in topic passed
    if (!previousLessonProgress || previousLessonProgress.status !== 'passed') {
      return {
        isLocked: true,
        reason: 'previous_incomplete',
        requiredAction: 'Complete the previous lesson in this topic first',
      }
    }

    return { isLocked: false }
  }

  // PLUS tier - all zones, sequential within topics
  if (userTier === 'PLUS') {
    // First lesson always unlocked
    if (lessonSortOrder === 1) {
      return { isLocked: false }
    }

    // Check if previous lesson passed
    if (!previousLessonProgress || previousLessonProgress.status !== 'passed') {
      return {
        isLocked: true,
        reason: 'previous_incomplete',
        requiredAction: 'Complete the previous lesson first',
      }
    }

    return { isLocked: false }
  }

  // Default: locked
  return {
    isLocked: true,
    reason: 'tier_restriction',
    requiredAction: 'Upgrade to access this lesson',
  }
}

/**
 * Get all unlocked lesson IDs in a topic
 * Returns a Set of unlocked lesson IDs
 */
export function getUnlockedLessonsInTopic(params: {
  userTier: SubscriptionTier
  zoneLevel: number
  lessonsInTopic: Array<{ id: number; sort_order: number }>
  progressRecords: UserLessonProgress[]
  completedTopicsInPreviousZone?: number
  totalTopicsInPreviousZone?: number
}): Set<number> {
  const { 
    userTier, 
    zoneLevel, 
    lessonsInTopic, 
    progressRecords,
    completedTopicsInPreviousZone = 0,
    totalTopicsInPreviousZone = 0
  } = params
  const unlockedSet = new Set<number>()

  // UNLIMITED: all unlocked
  if (userTier === 'UNLIMITED') {
    return new Set(lessonsInTopic.map(l => l.id))
  }

  // FREE: check progressive zone unlock
  if (userTier === 'FREE') {
    // Beginner zone (level 1) always accessible
    if (zoneLevel > 1) {
      // Check if ALL topics in previous zone are completed
      const allTopicsInPrevZoneCompleted = 
        totalTopicsInPreviousZone > 0 && 
        completedTopicsInPreviousZone >= totalTopicsInPreviousZone

      if (!allTopicsInPrevZoneCompleted) {
        return unlockedSet // None unlocked - zone is locked
      }
    }
  }

  // Sort lessons by sort_order
  const sortedLessons = [...lessonsInTopic].sort((a, b) => a.sort_order - b.sort_order)

  // Sequential unlocking logic
  for (let i = 0; i < sortedLessons.length; i++) {
    const lesson = sortedLessons[i]

    // First lesson always unlocked (if zone allowed)
    if (i === 0) {
      unlockedSet.add(lesson.id)
      continue
    }

    // Check if previous lesson passed
    const prevLesson = sortedLessons[i - 1]
    const prevProgress = progressRecords.find(p => p.lesson_id === prevLesson.id)

    if (prevProgress && prevProgress.status === 'passed') {
      unlockedSet.add(lesson.id)
    } else {
      // Sequential logic: stop unlocking once we hit a locked lesson
      break
    }
  }

  return unlockedSet
}

/**
 * Check if a zone is unlocked for a user based on tier and progress
 */
export function isZoneUnlocked(params: {
  userTier: SubscriptionTier
  zoneLevel: number
  completedTopicsInPreviousZone: number
  totalTopicsInPreviousZone: number
}): boolean {
  const { userTier, zoneLevel, completedTopicsInPreviousZone, totalTopicsInPreviousZone } = params

  // UNLIMITED tier: all zones unlocked
  if (userTier === 'UNLIMITED') {
    return true
  }

  // PLUS tier: all zones unlocked
  if (userTier === 'PLUS') {
    return true
  }

  // FREE tier: progressive zone unlock
  // Beginner zone (level 1) always unlocked
  if (zoneLevel === 1) {
    return true
  }

  // For other zones, check if ALL topics in previous zone are completed
  return totalTopicsInPreviousZone > 0 && 
         completedTopicsInPreviousZone >= totalTopicsInPreviousZone
}

/**
 * Get zone name by level for display purposes
 */
function getZoneName(level: number): string {
  const zoneNames: Record<number, string> = {
    1: 'Beginner',
    2: 'Elementary',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert',
  }
  return zoneNames[level] || `Zone ${level}`
}

/**
 * Calculate overall progress percentage for a zone
 */
export function calculateZoneProgressPercent(params: {
  completedTopics: number
  totalTopics: number
}): number {
  const { completedTopics, totalTopics } = params
  if (totalTopics === 0) return 0
  return Math.round((completedTopics / totalTopics) * 100)
}

/**
 * Get next unlockable zone level for FREE tier users
 */
export function getNextUnlockableZone(params: {
  currentZoneLevel: number
  completedTopicsInCurrentZone: number
  totalTopicsInCurrentZone: number
}): { nextZoneLevel: number; isReadyToUnlock: boolean } {
  const { currentZoneLevel, completedTopicsInCurrentZone, totalTopicsInCurrentZone } = params
  
  const isReadyToUnlock = 
    totalTopicsInCurrentZone > 0 && 
    completedTopicsInCurrentZone >= totalTopicsInCurrentZone

  return {
    nextZoneLevel: currentZoneLevel + 1,
    isReadyToUnlock,
  }
}
