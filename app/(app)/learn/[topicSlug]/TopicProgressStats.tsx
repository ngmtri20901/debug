"use client"

import { BookOpen, CheckCircle2 } from "lucide-react"
import { Progress } from "@/shared/components/ui/progress"
import { useTopicProgressStats } from "@/features/learn/hooks"

interface TopicProgressStatsProps {
  topicId: number
  totalLessons: number
  initialProgress?: any[]
}

export default function TopicProgressStats({ topicId, totalLessons, initialProgress }: TopicProgressStatsProps) {
  const { completedLessons, isLoading } = useTopicProgressStats(topicId, initialProgress)

  // Calculate correct percentage based on total lessons in topic
  const displayCompleted = completedLessons > 0 ? completedLessons : 0
  const displayTotal = totalLessons
  const displayPercentage = totalLessons > 0 ? Math.round((displayCompleted / totalLessons) * 100) : 0

  console.log('[TopicProgressStats] Debug:', {
    topicId,
    completedLessons,
    totalLessons,
    displayPercentage
  })

  return (
    <div className="mt-4 space-y-3 bg-black/30 backdrop-blur-sm p-3 rounded-lg border border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-gray-200">
        <span className="flex items-center gap-2 text-sm whitespace-nowrap">
          <BookOpen size={16} />
          <span>{displayTotal} lessons</span>
        </span>
        <span className="flex items-center gap-2 text-sm whitespace-nowrap">
          <CheckCircle2 size={16} />
          <span>{displayCompleted} completed</span>
        </span>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm font-medium text-gray-100">
          <span>Your Progress</span>
          <span>{displayPercentage}%</span>
        </div>
        {/* Compact progress bar */}
        <Progress 
          value={displayPercentage} 
          className="h-1.5 bg-white/20 [&>div]:bg-teal-400" 
        />
      </div>
    </div>
  )
}
