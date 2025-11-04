import { Suspense } from 'react'
import ReviewClient from '@/features/flashcards/components/review/ReviewClient'

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse mx-auto"></div>
        </div>

        {/* Review Card Skeleton */}
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse"></div>

        {/* Buttons Skeleton */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>

        {/* Separator */}
        <div className="h-px bg-gray-200 dark:bg-gray-700 mb-8"></div>

        {/* Session Config Skeleton */}
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse"></div>

        {/* Start Button Skeleton */}
        <div className="text-center mb-8">
          <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse mx-auto"></div>
        </div>
      </div>
    }>
      <ReviewClient />
    </Suspense>
  )
}
