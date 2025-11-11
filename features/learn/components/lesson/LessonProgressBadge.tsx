'use client'

import { Badge } from '@/shared/components/ui/badge'
import { CheckCircle2, Clock, Lock, Circle } from 'lucide-react'

interface LessonProgressBadgeProps {
  status: 'not_started' | 'in_progress' | 'passed'
  bestScore?: number
  passThreshold?: number
  className?: string
}

/**
 * LessonProgressBadge Component
 * Displays visual indicator of lesson completion status
 * 
 * @param status - Current lesson status
 * @param bestScore - User's best score percentage
 * @param passThreshold - Minimum score required to pass (default: 80)
 * @param className - Optional additional CSS classes
 */
export function LessonProgressBadge({ 
  status, 
  bestScore = 0, 
  passThreshold = 80,
  className = ''
}: LessonProgressBadgeProps) {
  if (status === 'passed') {
    return (
      <Badge 
        className={`bg-green-500 hover:bg-green-600 text-white flex items-center gap-1 text-xs px-2 py-1 w-fit ${className}`}
      >
        <CheckCircle2 size={12} />
        <span>{Math.round(bestScore)}%</span>
      </Badge>
    )
  }

  if (status === 'in_progress') {
    return (
      <Badge 
        variant="secondary" 
        className={`bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center gap-1 text-xs px-2 py-1 w-fit ${className}`}
      >
        <Clock size={12} />
        <span>{Math.round(bestScore)}%</span>
      </Badge>
    )
  }

  return (
    <Badge 
      variant="outline" 
      className={`bg-gray-50 text-gray-600 flex items-center gap-1 text-xs px-2 py-1 w-fit ${className}`}
    >
      <Circle size={12} />
      <span>Start</span>
    </Badge>
  )
}
