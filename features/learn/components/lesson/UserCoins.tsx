"use client"
import { useUserCoins } from "@/lib/react-query/hooks"
import { Coins } from "lucide-react"

const UserCoins = () => {
  const { coins, loading } = useUserCoins()

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 animate-pulse">
        <Coins className="h-5 w-5 text-amber-500" />
        <span className="font-semibold text-amber-700">--</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
      <Coins className="h-5 w-5 text-amber-500" />
      <span className="font-semibold text-amber-700">{coins}</span>
    </div>
  )
}

export default UserCoins
