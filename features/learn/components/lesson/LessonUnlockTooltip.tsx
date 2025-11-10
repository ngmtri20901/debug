'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Lock, CheckCircle2, Crown } from 'lucide-react'
import type { LessonUnlockStatus } from '@/lib/lesson-unlock-logic'

interface LessonUnlockTooltipProps {
  unlockStatus: LessonUnlockStatus
  children: React.ReactNode
}

/**
 * LessonUnlockTooltip Component
 * Shows detailed information about why a lesson is locked or unlocked
 * 
 * @param unlockStatus - Unlock status object with reason and required action
 * @param children - Wrapped content (usually a lesson card or button)
 */
export function LessonUnlockTooltip({ 
  unlockStatus, 
  children 
}: LessonUnlockTooltipProps) {
  // If lesson is unlocked, don't show tooltip
  if (!unlockStatus.isLocked) {
    return <>{children}</>
  }

  const getTooltipContent = () => {
    switch (unlockStatus.reason) {
      case 'login_required':
        return (
          <div className="flex items-start gap-2">
            <Lock size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Login Required</p>
              <p className="text-xs text-gray-300 mt-1">
                Please log in to access lessons
              </p>
            </div>
          </div>
        )
      
      case 'zone_locked':
        return (
          <div className="flex items-start gap-2">
            <Lock size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Zone Locked</p>
              <p className="text-xs text-gray-300 mt-1">
                {unlockStatus.requiredAction}
              </p>
              {unlockStatus.completedTopicsInPrevZone !== undefined && 
               unlockStatus.totalTopicsInPrevZone !== undefined && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400">Progress:</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(unlockStatus.completedTopicsInPrevZone / unlockStatus.totalTopicsInPrevZone) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {unlockStatus.completedTopicsInPrevZone} / {unlockStatus.totalTopicsInPrevZone} topics completed
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'previous_incomplete':
        return (
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Previous Lesson Required</p>
              <p className="text-xs text-gray-300 mt-1">
                {unlockStatus.requiredAction}
              </p>
            </div>
          </div>
        )
      
      case 'tier_restriction':
        return (
          <div className="flex items-start gap-2">
            <Crown size={16} className="mt-0.5 flex-shrink-0 text-yellow-400" />
            <div>
              <p className="font-semibold">Upgrade Required</p>
              <p className="text-xs text-gray-300 mt-1">
                {unlockStatus.requiredAction || 'Upgrade your subscription to access this lesson'}
              </p>
            </div>
          </div>
        )
      
      case 'loading':
        return (
          <div className="flex items-start gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mt-0.5" />
            <div>
              <p className="font-semibold">Loading...</p>
              <p className="text-xs text-gray-300 mt-1">
                Checking unlock status
              </p>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="flex items-start gap-2">
            <Lock size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Locked</p>
              <p className="text-xs text-gray-300 mt-1">
                This lesson is currently unavailable
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          className="bg-gray-900 text-white border-gray-700 max-w-xs"
        >
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
