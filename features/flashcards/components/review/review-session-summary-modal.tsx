"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/shared/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Progress } from "@/shared/components/ui/progress"
import { 
  Trophy, 
  Target, 
  Clock, 
  Coins, 
  TrendingUp, 
  RefreshCw,
  BarChart3,
  Lock,
  Crown
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface SessionSummaryData {
  totalCards: number
  correctAnswers: number
  accuracyRate: number
  coinsEarned: number
  timeSpent: number // in seconds
}

interface User {
  subscription_type: "FREE" | "PLUS" | "UNLIMITED"
}

interface ReviewSessionSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  sessionData: SessionSummaryData
}

const FREE_DAILY_SESSION_LIMIT = 3

export function ReviewSessionSummaryModal({ 
  isOpen, 
  onClose, 
  sessionData 
}: ReviewSessionSummaryModalProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [todaysSessions, setTodaysSessions] = useState(0)
  const [streakIncreased, setStreakIncreased] = useState(false)
  const [newStreak, setNewStreak] = useState(0)

  useEffect(() => {
    if (isOpen) {
      fetchUserData()
      fetchTodaysSessions()
      checkStreakUpdate()
    }
  }, [isOpen])

  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("subscription_type, streak_days")
        .eq("id", authUser.id)
        .single()

      if (userProfile) {
        setUser(userProfile)
        setNewStreak(userProfile.streak_days)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchTodaysSessions = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const today = new Date().toISOString().split('T')[0]
      
      const { count } = await supabase
        .from("review_sessions")
        .select("*", { count: 'exact' })
        .eq("user_id", authUser.id)
        .eq("status", "completed")
        .gte("started_at", `${today}T00:00:00.000Z`)
        .lt("started_at", `${today}T23:59:59.999Z`)

      setTodaysSessions(count || 0)
    } catch (error) {
      console.error("Error fetching today's sessions:", error)
    }
  }

  const checkStreakUpdate = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Check if this is the user's first session today
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const { count: todaysCompletedSessions } = await supabase
        .from("review_sessions")
        .select("*", { count: 'exact' })
        .eq("user_id", authUser.id)
        .eq("status", "completed")
        .gte("started_at", `${today}T00:00:00.000Z`)
        .lt("started_at", `${today}T23:59:59.999Z`)

      // If this is the first completed session today, update streak
      if (todaysCompletedSessions === 1) {
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("streak_days, last_login")
          .eq("id", authUser.id)
          .single()

        if (userProfile) {
          let newStreakDays = userProfile.streak_days || 0
          const lastLoginDate = userProfile.last_login ? 
            new Date(userProfile.last_login).toISOString().split('T')[0] : null

          if (lastLoginDate === yesterdayStr) {
            // Consecutive day - increment streak
            newStreakDays += 1
            setStreakIncreased(true)
          } else if (lastLoginDate !== today) {
            // Streak broken or first time - reset to 1
            newStreakDays = 1
            setStreakIncreased(lastLoginDate !== null)
          }

          // Update user streak and last login
          await supabase
            .from("user_profiles")
            .update({
              streak_days: newStreakDays,
              last_login: new Date().toISOString()
            })
            .eq("id", authUser.id)

          setNewStreak(newStreakDays)
        }
      }
    } catch (error) {
      console.error("Error checking streak update:", error)
    }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 80) return "text-green-600"
    if (accuracy >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getAccuracyBadgeVariant = (accuracy: number) => {
    if (accuracy >= 80) return "default"
    if (accuracy >= 60) return "secondary"
    return "destructive"
  }

  const handleNewSession = () => {
    onClose()
    router.push("/flashcards/review")
  }

  const handleViewStatistics = () => {
    onClose()
    router.push("/flashcards/statistics")
  }

  const handleClose = () => {
    onClose()
    router.push("/flashcards/review")
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Session Complete!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sessionData.totalCards}
                </div>
                <p className="text-sm text-muted-foreground">Cards Reviewed</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sessionData.correctAnswers}
                </div>
                <p className="text-sm text-muted-foreground">Correct Answers</p>
              </CardContent>
            </Card>
          </div>

          {/* Accuracy Rate */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Accuracy Rate</span>
                </div>
                <Badge variant={getAccuracyBadgeVariant(sessionData.accuracyRate)}>
                  {sessionData.accuracyRate.toFixed(0)}%
                </Badge>
              </div>
              <Progress value={sessionData.accuracyRate} className="h-2" />
            </CardContent>
          </Card>

          {/* Time and Coins */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Time Spent</span>
                </div>
                <div className="text-lg font-bold">
                  {formatTime(sessionData.timeSpent)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Coins Earned</span>
                </div>
                <div className="text-lg font-bold text-yellow-600">
                  {sessionData.coinsEarned}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Streak Update */}
          {streakIncreased && (
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800 dark:text-orange-200">
                    Streak Updated!
                  </span>
                </div>
                <p className="text-orange-700 dark:text-orange-300">
                  Your learning streak is now {newStreak} days!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Session Limit Warning for Free Users */}
          {user?.subscription_type === "FREE" && todaysSessions >= FREE_DAILY_SESSION_LIMIT && (
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-800 dark:text-amber-200">
                    Daily Limit Reached
                  </span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  You've completed {todaysSessions}/{FREE_DAILY_SESSION_LIMIT} free review sessions today. 
                  Upgrade to Plus for unlimited review!
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href="/plans">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Plus
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleNewSession} 
              className="w-full"
              disabled={user?.subscription_type === "FREE" && todaysSessions >= FREE_DAILY_SESSION_LIMIT}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start New Review Session
            </Button>
            
            <Button 
              onClick={handleViewStatistics} 
              variant="outline" 
              className="w-full"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Detailed Statistics
            </Button>
          </div>

          {/* Motivational Message */}
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {sessionData.accuracyRate >= 80 
                ? "🎉 Excellent work! You're mastering Vietnamese vocabulary!"
                : sessionData.accuracyRate >= 60
                ? "👍 Good progress! Keep practicing to improve further!"
                : "💪 Every review makes you stronger! Keep going!"
              }
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 