/**
 * Learn module constants exports
 */

// Zone constants
export type { ZoneId, ZoneDefinition } from './zones'
export {
  ZONES,
  getZoneByLevel,
  getZoneById,
  getAllZones,
  getZoneMinAccuracy,
  getZoneColor,
  getZoneIcon,
} from './zones'

// Exercise type constants
export type { ExerciseTypeMetadata } from './exerciseTypes'
export {
  EXERCISE_TYPES,
  getExerciseTypeMetadata,
  getExerciseTypeLabel,
  getExerciseTypeIcon,
  getExerciseTypeColor,
  getAllExerciseTypes,
  getExerciseTypesByDifficulty,
  calculateEstimatedTime,
  formatEstimatedTime,
} from './exerciseTypes'
