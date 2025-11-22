/**
 * Profile service - API functions for user profile management
 */

import { supabase } from '@/lib/supabase/client'
import type { UserProfile, UpdateProfileData, UploadAvatarResponse } from '../types'

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: UpdateProfileData
): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating profile:', error)
    throw error
  }
}

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar(
  userId: string,
  imageUri: string
): Promise<UploadAvatarResponse> {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri)
    const blob = await response.blob()

    // Generate unique filename
    const fileExt = imageUri.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: true,
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath)

    const avatar_url = urlData.publicUrl

    // Update profile with new avatar URL
    await supabase
      .from('profiles')
      .update({ avatar_url, updated_at: new Date().toISOString() })
      .eq('id', userId)

    return { avatar_url }
  } catch (error) {
    console.error('Error uploading avatar:', error)
    throw error
  }
}

/**
 * Delete avatar image
 */
export async function deleteAvatar(userId: string): Promise<void> {
  try {
    // Get current avatar URL to extract file path
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (profile?.avatar_url) {
      // Extract file path from URL
      const url = new URL(profile.avatar_url)
      const pathParts = url.pathname.split('/')
      const filePath = pathParts.slice(-2).join('/') // Get 'avatars/filename'

      // Delete from storage
      await supabase.storage.from('user-avatars').remove([filePath])
    }

    // Remove avatar URL from profile
    await supabase
      .from('profiles')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', userId)
  } catch (error) {
    console.error('Error deleting avatar:', error)
    throw error
  }
}
