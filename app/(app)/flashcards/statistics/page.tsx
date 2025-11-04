import { Suspense } from 'react'
import StatisticsClient from '@/features/flashcards/components/statistics/StatisticsClient'

export default function StatisticsPage() {
    return (
    <Suspense fallback={
        <div className="container mx-auto py-10 px-4">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
              </div>

        {/* Motivational Message Skeleton */}
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse"></div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Goals & Recommendations Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>

        {/* Export Section Skeleton */}
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    }>
      <StatisticsClient />
    </Suspense>
  )
} 