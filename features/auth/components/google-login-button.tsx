'use client'

import { cn } from '@/shared/utils/cn'
import { createClient } from '@/shared/lib/supabase/client'
import { Button } from '@/shared/components/ui/button'
import { useState } from 'react'

export function GoogleLoginButton({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSocialLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/oauth?next=/dashboard`,
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="button" className="w-full" onClick={handleSocialLogin} disabled={isLoading}>
        {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
      </Button>
    </div>
  )
}
