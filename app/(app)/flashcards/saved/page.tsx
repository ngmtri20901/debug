import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { loadSavedFlashcardsData } from '@/features/flashcards/data/saved-flashcards-loader'
import SavedFlashcardsContainer from '@/features/flashcards/components/saved/SavedFlashcardsContainer'

export default async function SavedFlashcardsPage() {
  // Fetch data on the server
  const data = await loadSavedFlashcardsData()

  // Redirect to login if not authenticated
  if (!data) {
    redirect('/auth/login')
  }

  return (
    <Suspense fallback={
      <div className="container mx-auto p-6 space-y-6">
        {/* Breadcrumb Navigation Skeleton */}
        <div className="flex items-center space-x-2 text-sm mb-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
        </div>

        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-blue-200 dark:bg-blue-800 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Dashboard Summary Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

        {/* Tabs Skeleton */}
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>

        {/* Flashcards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    }>
      <SavedFlashcardsContainer initialData={data} />
    </Suspense>
  )
} 