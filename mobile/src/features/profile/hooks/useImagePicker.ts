/**
 * Image picker hook - For selecting and uploading profile avatars
 */

import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'

export interface ImagePickerResult {
  uri: string | null
  cancelled: boolean
}

export function useImagePicker() {
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Request camera permissions
   */
  const requestCameraPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.',
        [{ text: 'OK' }]
      )
      return false
    }
    return true
  }

  /**
   * Request media library permissions
   */
  const requestMediaLibraryPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Media library permission is required to select photos.',
        [{ text: 'OK' }]
      )
      return false
    }
    return true
  }

  /**
   * Pick image from library
   */
  const pickImage = async (): Promise<string | null> => {
    try {
      setIsLoading(true)

      // Request permissions
      const hasPermission = await requestMediaLibraryPermissions()
      if (!hasPermission) return null

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (result.canceled) {
        return null
      }

      return result.assets[0].uri
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Take photo with camera
   */
  const takePhoto = async (): Promise<string | null> => {
    try {
      setIsLoading(true)

      // Request permissions
      const hasPermission = await requestCameraPermissions()
      if (!hasPermission) return null

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (result.canceled) {
        return null
      }

      return result.assets[0].uri
    } catch (error) {
      console.error('Error taking photo:', error)
      Alert.alert('Error', 'Failed to take photo. Please try again.')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Show options to pick from library or take photo
   */
  const showImageOptions = (): Promise<string | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Choose Photo',
        'Select a photo for your profile',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const uri = await takePhoto()
              resolve(uri)
            },
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              const uri = await pickImage()
              resolve(uri)
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true }
      )
    })
  }

  return {
    pickImage,
    takePhoto,
    showImageOptions,
    isLoading,
  }
}
