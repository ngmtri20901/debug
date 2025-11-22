/**
 * User profile types
 */

export interface UserProfile {
  id: string
  email: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  native_language: string
  learning_level: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
  updated_at: string
}

export interface UpdateProfileData {
  display_name?: string
  bio?: string
  native_language?: string
  learning_level?: 'beginner' | 'intermediate' | 'advanced'
}

export interface UploadAvatarResponse {
  avatar_url: string
}
