import { Suspense } from 'react'
import SessionClient from '@/features/flashcards/components/review/SessionClient'

export default function ReviewSessionPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse mx-auto"></div>
        </div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse"></div>
      </div>
    }>
      <SessionClient />
    </Suspense>
  )
}

