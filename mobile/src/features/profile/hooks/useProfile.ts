/**
 * Profile hooks - React Query hooks for profile management
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { UserProfile, UpdateProfileData, UploadAvatarResponse } from '../types'
import { getUserProfile, updateProfile, uploadAvatar, deleteAvatar } from '../services/profileService'
import { getUserStats, getStreakInfo } from '../services/statsService'
import type { UserStats, StreakInfo } from '../types'

/**
 * Get current user ID from Supabase auth
 */
async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  return user.id
}

/**
 * Hook to fetch user profile
 */
export function useUserProfile(): UseQueryResult<UserProfile | null, Error> {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const userId = await getCurrentUserId()
      return getUserProfile(userId)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile(): UseMutationResult<UserProfile, Error, UpdateProfileData> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: UpdateProfileData) => {
      const userId = await getCurrentUserId()
      return updateProfile(userId, updates)
    },
    onSuccess: (data) => {
      // Update cached profile data
      queryClient.setQueryData(['profile'], data)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

/**
 * Hook to upload avatar
 */
export function useUploadAvatar(): UseMutationResult<UploadAvatarResponse, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (imageUri: string) => {
      const userId = await getCurrentUserId()
      return uploadAvatar(userId, imageUri)
    },
    onSuccess: () => {
      // Refresh profile data to get new avatar URL
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

/**
 * Hook to delete avatar
 */
export function useDeleteAvatar(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const userId = await getCurrentUserId()
      return deleteAvatar(userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

/**
 * Hook to fetch user stats
 */
export function useUserStats(): UseQueryResult<UserStats, Error> {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const userId = await getCurrentUserId()
      return getUserStats(userId)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to fetch streak info
 */
export function useStreakInfo(): UseQueryResult<StreakInfo, Error> {
  return useQuery({
    queryKey: ['streakInfo'],
    queryFn: async () => {
      const userId = await getCurrentUserId()
      return getStreakInfo(userId)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
