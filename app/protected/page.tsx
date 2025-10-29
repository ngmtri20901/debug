import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }

  // Fetch user profile data from user_profiles table
  let userProfile: { name?: string; email?: string } | null = null
  let profileError: Error | null = null
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('name, email')
      .eq('id', user.id)
      .single()
    
    userProfile = data
    profileError = error
  } catch (err) {
    console.error('Error fetching user profile:', err)
    profileError = err as Error
  }

  // Use profile data if available, otherwise fall back to auth user data
  const displayName = userProfile?.name || user.email?.split('@')[0] || 'User'
  const displayEmail = userProfile?.email || user.email || 'No email'

  return (
    <div className="flex h-svh w-full items-center justify-center gap-2">
      <div className="text-center">
        <p className="mb-2">
          Hello <span className="font-semibold">{displayName}</span>
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Email: {displayEmail}
        </p>
        {profileError && (
          <p className="text-xs text-red-500 mb-2">
            Note: Profile data could not be loaded
          </p>
        )}
        <LogoutButton />
      </div>
    </div>
  )
}
