"use client"

import Link from "next/link"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Clock, Award, CheckCircle2, Lock } from "lucide-react"
import { useUserProfile } from "@/shared/hooks/use-user-profile"
import { useTopicProgress, useZoneCompletion } from "@/features/learn/hooks"
import { LessonProgressBadge, LessonUnlockTooltip } from "@/features/learn/components/lesson"
import { checkLessonUnlock } from "@/features/learn/utils/lesson-unlock-logic"
import type { SubscriptionTier } from "@/features/learn/utils/lesson-unlock-logic"

type LessonRow = {
  id: number
  slug: string
  lesson_name: string
  duration_minutes: number | null
  coins_reward: number | null
  sort_order: number | null
  status: string | null
}

interface LessonsListProps {
  lessons: LessonRow[]
  topicId: number
  topicSlug: string
  zoneId: number
  zoneLevel: number
  initialProgress?: any[]
}

export default function LessonsList({
  lessons,
  topicId,
  topicSlug,
  zoneId,
  zoneLevel,
  initialProgress
}: LessonsListProps) {
  const { profile, user } = useUserProfile()
  const { topicProgress } = useTopicProgress(topicId, initialProgress)
  
  // Get zone completion stats for previous zone (for FREE tier unlock check)
  const { completed: prevZoneCompleted, total: prevZoneTotal } = useZoneCompletion(zoneId - 1)

  // Get user tier
  const tier = (profile?.subscription_type ?? 'FREE') as SubscriptionTier

  // Lessons are already sorted by sort_order ascending from server
  return (
    <div className="grid gap-4">
      {lessons.map((lesson, index) => {
        // Get progress for this lesson
        const progress = topicProgress.find(p => p.lesson_id === lesson.id)
        
        // Find previous lesson by sort_order
        const previousLesson = index > 0 ? lessons[index - 1] : null
        const previousProgress = previousLesson 
          ? topicProgress.find(p => p.lesson_id === previousLesson.id)
          : null

        // Check unlock status using the utility function (not hook, since we're in a map)
        const unlockStatus = checkLessonUnlock({
          userTier: tier,
          isAuthenticated: !!user,
          zoneLevel,
          lessonSortOrder: lesson.sort_order ?? (index + 1),
          previousLessonProgress: previousProgress ?? null,
          completedTopicsInPreviousZone: prevZoneCompleted,
          totalTopicsInPreviousZone: prevZoneTotal,
        })

        const isLocked = unlockStatus.isLocked

        return (
          <LessonUnlockTooltip key={lesson.slug} unlockStatus={unlockStatus}>
            <Card
              className={`transition-all duration-300 hover:shadow-lg ${
                isLocked ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.02]"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Status Icon */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                        progress?.status === 'passed'
                          ? "bg-green-500 border-green-500 text-white"
                          : isLocked
                          ? "bg-gray-200 border-gray-300 text-gray-500"
                          : "bg-blue-50 border-[#067BC2] text-[#067BC2]"
                      }`}
                    >
                      {progress?.status === 'passed' ? (
                        <CheckCircle2 size={24} />
                      ) : isLocked ? (
                        <Lock size={20} />
                      ) : (
                        <span className="font-bold">{lesson.sort_order ?? (index + 1)}</span>
                      )}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">
                        {lesson.lesson_name}
                      </h4>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          ~{lesson.duration_minutes ?? 15} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Award size={14} />
                          {lesson.coins_reward ?? 50} coins
                        </span>
                      </div>

                      {/* Progress Badge */}
                      {progress && (
                        <div className="mt-2 inline-block">
                          <LessonProgressBadge
                            status={progress.status}
                            bestScore={progress.best_score_percent}
                            passThreshold={progress.pass_threshold}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div>
                    {isLocked ? (
                      <Button disabled variant="secondary" className="px-6">
                        <Lock size={16} className="mr-2" />
                        Locked
                      </Button>
                    ) : (
                      <Button 
                        asChild
                        className="px-6 bg-[#067BC2] hover:bg-[#055a9f]"
                      >
                        <Link href={`/learn/${topicSlug}/${lesson.slug}`}>
                          {progress?.status === 'passed' ? 'Review' : 'Start Lesson'}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </LessonUnlockTooltip>
        )
      })}
    </div>
  )
}
