/**
 * Zone definitions and constants for Learn module
 */

export type ZoneId =
  | 'beginner'
  | 'elementary'
  | 'intermediate'
  | 'upper-intermediate'
  | 'advanced'
  | 'expert'

export interface ZoneDefinition {
  id: ZoneId
  level: number
  title: string
  description: string
  color: string
  icon: string
  minAccuracy: number // Minimum accuracy to pass exercises in this zone
}

/**
 * Zone definitions with metadata
 */
export const ZONES: Record<ZoneId, ZoneDefinition> = {
  beginner: {
    id: 'beginner',
    level: 1,
    title: 'Beginner',
    description: 'Start your Vietnamese learning journey with basic vocabulary and grammar',
    color: '#10B981', // Green
    icon: '🌱',
    minAccuracy: 65,
  },
  elementary: {
    id: 'elementary',
    level: 2,
    title: 'Elementary',
    description: 'Build on basics with everyday conversations and common phrases',
    color: '#3B82F6', // Blue
    icon: '📘',
    minAccuracy: 70,
  },
  intermediate: {
    id: 'intermediate',
    level: 3,
    title: 'Intermediate',
    description: 'Advance your skills with complex sentences and practical scenarios',
    color: '#F59E0B', // Orange
    icon: '📙',
    minAccuracy: 75,
  },
  'upper-intermediate': {
    id: 'upper-intermediate',
    level: 4,
    title: 'Upper Intermediate',
    description: 'Master nuanced expressions and cultural contexts',
    color: '#EF4444', // Red
    icon: '📕',
    minAccuracy: 80,
  },
  advanced: {
    id: 'advanced',
    level: 5,
    title: 'Advanced',
    description: 'Achieve fluency with sophisticated vocabulary and complex grammar',
    color: '#8B5CF6', // Purple
    icon: '📗',
    minAccuracy: 85,
  },
  expert: {
    id: 'expert',
    level: 6,
    title: 'Expert',
    description: 'Perfect your Vietnamese with native-level content and idioms',
    color: '#EC4899', // Pink
    icon: '🎓',
    minAccuracy: 90,
  },
}

/**
 * Get zone by level number
 */
export function getZoneByLevel(level: number): ZoneDefinition | undefined {
  return Object.values(ZONES).find((zone) => zone.level === level)
}

/**
 * Get zone by ID
 */
export function getZoneById(id: ZoneId): ZoneDefinition {
  return ZONES[id]
}

/**
 * Get all zones sorted by level
 */
export function getAllZones(): ZoneDefinition[] {
  return Object.values(ZONES).sort((a, b) => a.level - b.level)
}

/**
 * Get minimum accuracy required for a zone
 */
export function getZoneMinAccuracy(zoneId: ZoneId): number {
  return ZONES[zoneId].minAccuracy
}

/**
 * Get zone color
 */
export function getZoneColor(zoneId: ZoneId): string {
  return ZONES[zoneId].color
}

/**
 * Get zone icon
 */
export function getZoneIcon(zoneId: ZoneId): string {
  return ZONES[zoneId].icon
}
