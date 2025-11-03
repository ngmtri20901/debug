import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'
import CreateFlashcardForm from '@/features/flashcards/components/create/CreateFlashcardForm'

export default async function CreateFlashcardPage() {
  const supabase = await createClient()

  // Get the current user on the server
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }

  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="flex gap-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    }>
      <CreateFlashcardForm userId={user.id} />
    </Suspense>
  )
}