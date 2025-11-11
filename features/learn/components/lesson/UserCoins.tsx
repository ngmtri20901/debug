"use client"
import { useUserProfile } from "@/shared/hooks/use-user-profile"
import { Coins } from "lucide-react"
import { useEffect, useState } from "react"

const UserCoins = () => {
  const { profile, loading } = useUserProfile()
  const [mounted, setMounted] = useState(false)

  // Ensure consistent rendering between server and client
  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR and initial client render, show consistent content
  // Only show loading state after component has mounted on client
  const isLoading = mounted && loading
  const displayValue = isLoading ? '--' : (profile?.coins ?? 0)

  return (
    <div className={`flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 ${isLoading ? 'animate-pulse' : ''}`}>
      <Coins className="h-5 w-5 text-amber-500" />
      <span className="font-semibold text-amber-700">{displayValue}</span>
    </div>
  )
}

export default UserCoins
