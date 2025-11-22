/**
 * Edit Profile Screen - Edit user profile information and avatar
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ProfileAvatar } from '../components/ProfileAvatar'
import { useUserProfile, useUpdateProfile, useUploadAvatar } from '../hooks/useProfile'
import { useImagePicker } from '../hooks/useImagePicker'

export function EditProfileScreen() {
  const navigation = useNavigation()

  const { data: profile } = useUserProfile()
  const updateProfileMutation = useUpdateProfile()
  const uploadAvatarMutation = useUploadAvatar()
  const { showImageOptions, isLoading: imagePickerLoading } = useImagePicker()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [nativeLanguage, setNativeLanguage] = useState('')
  const [learningLevel, setLearningLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setBio(profile.bio || '')
      setNativeLanguage(profile.native_language || '')
      setLearningLevel(profile.learning_level || 'beginner')
    }
  }, [profile])

  const handleAvatarEdit = async () => {
    const imageUri = await showImageOptions()
    if (imageUri) {
      try {
        await uploadAvatarMutation.mutateAsync(imageUri)
        Alert.alert('Success', 'Avatar updated successfully!')
      } catch (error) {
        Alert.alert('Error', 'Failed to upload avatar. Please try again.')
      }
    }
  }

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        display_name: displayName.trim(),
        bio: bio.trim(),
        native_language: nativeLanguage.trim(),
        learning_level: learningLevel,
      })
      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.')
    }
  }

  const handleCancel = () => {
    navigation.goBack()
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    )
  }

  const isSaving = updateProfileMutation.isPending
  const isUploadingAvatar = uploadAvatarMutation.isPending || imagePickerLoading

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <ProfileAvatar
            avatarUrl={profile.avatar_url}
            displayName={displayName || profile.username || 'User'}
            size={120}
            editable={true}
            onEdit={handleAvatarEdit}
            isUploading={isUploadingAvatar}
          />
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Native Language</Text>
            <TextInput
              style={styles.input}
              value={nativeLanguage}
              onChangeText={setNativeLanguage}
              placeholder="e.g., English"
              maxLength={30}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Learning Level</Text>
            <View style={styles.levelButtons}>
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelButton,
                    learningLevel === level && styles.levelButtonActive,
                  ]}
                  onPress={() => setLearningLevel(level)}
                >
                  <Text
                    style={[
                      styles.levelButtonText,
                      learningLevel === level && styles.levelButtonTextActive,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  avatarSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  formSection: {
    padding: 16,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  levelButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  levelButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  levelButtonTextActive: {
    color: '#FFFFFF',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#6366F1',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
})
