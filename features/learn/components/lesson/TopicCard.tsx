"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import type { Topic } from "@/features/learn/types"
import { useUserProgress } from "@/features/learn/contexts"

interface TopicCardProps {
  topic: Topic
}

const TopicCard = ({ topic }: TopicCardProps) => {
  const router = useRouter()
  const { userProgress } = useUserProgress()
  
  // Calculate progress for this topic
  const allLessons = topic.chapters.flatMap(chapter => chapter.lessons)
  const completedLessons = allLessons.filter(lesson => 
    userProgress.completedLessons.includes(lesson.id)
  ).length
  const progressPercentage = allLessons.length > 0 ? (completedLessons / allLessons.length) * 100 : 0

  const handleClick = () => {
    router.push(`/learn/${topic.slug}`)
  }

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 bg-white border-0 shadow-md overflow-hidden rounded-xl"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Image container with aspect ratio */}
        <div className="relative aspect-square bg-gradient-to-br from-orange-100 to-orange-200 overflow-hidden rounded-t-xl">
          {topic.image ? (
            <Image
              src={topic.image}
              alt={topic.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            // Fallback gradient background with icon
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 bg-orange-400 rounded-lg"></div>
              </div>
            </div>
          )}
          
          {/* Progress indicator */}
          {progressPercentage > 0 && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5">
              <span className="text-xs font-bold text-green-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-gray-900 mb-2 group-hover:text-[#067BC2] transition-colors text-lg">
            {topic.title}
          </h3>
          
          {topic.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
              {topic.description}
            </p>
          )}
          
          {/* Lesson count */}
          <div className="text-xs text-gray-500 font-medium">
            {topic.lessonCount ?? 0} lesson{(topic.lessonCount ?? 0) !== 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TopicCard 