import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }

  // Redirect authenticated users to /learn
  redirect('/learn')
}
