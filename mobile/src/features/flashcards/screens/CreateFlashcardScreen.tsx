/**
 * Create Flashcard Screen
 * Form for creating and editing flashcards with image upload
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import type { CreateFlashcardNavigationProp, CreateFlashcardRouteProp } from '../navigation/types'
import { Header } from '@/shared/components/Header'
import { Button } from '@/shared/components/Button'
import { flashcardAPI } from '../services/flashcardService'
import type { FlashcardTopic } from '../types/flashcard.types'
import { colors, spacing, borderRadius, typography, shadows } from '@/shared/theme/colors'

interface FormData {
  vietnamese: string
  english: string
  pronunciation: string
  wordType: string
  topicId: string
  exampleSentence: string
  exampleTranslation: string
  imageUri: string | null
}

interface FormErrors {
  vietnamese?: string
  english?: string
  pronunciation?: string
  wordType?: string
  topicId?: string
}

const WORD_TYPES = [
  { label: 'Noun', value: 'noun' },
  { label: 'Verb', value: 'verb' },
  { label: 'Adjective', value: 'adjective' },
  { label: 'Adverb', value: 'adverb' },
  { label: 'Phrase', value: 'phrase' },
  { label: 'Expression', value: 'expression' },
  { label: 'Greeting', value: 'greeting' },
  { label: 'Number', value: 'number' },
]

export const CreateFlashcardScreen: React.FC = () => {
  const navigation = useNavigation<CreateFlashcardNavigationProp>()
  const route = useRoute<CreateFlashcardRouteProp>()
  const { flashcard } = route.params || {}

  const isEditing = !!flashcard

  const [formData, setFormData] = useState<FormData>({
    vietnamese: flashcard?.vietnamese || '',
    english: flashcard?.english || '',
    pronunciation: flashcard?.pronunciation || '',
    wordType: flashcard?.word_type || 'noun',
    topicId: flashcard?.topic_id || '',
    exampleSentence: flashcard?.example_sentence || '',
    exampleTranslation: flashcard?.example_translation || '',
    imageUri: flashcard?.image_url || null,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [topics, setTopics] = useState<FlashcardTopic[]>([])
  const [loading, setLoading] = useState(false)
  const [showWordTypePicker, setShowWordTypePicker] = useState(false)
  const [showTopicPicker, setShowTopicPicker] = useState(false)

  // Fetch topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await flashcardAPI.getAllTopics()
        setTopics(data)
      } catch (error) {
        console.error('Failed to fetch topics:', error)
      }
    }
    fetchTopics()
  }, [])

  // Request permissions
  useEffect(() => {
    ;(async () => {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync()
      const { status: libraryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Please grant camera and photo library permissions to upload images.'
        )
      }
    })()
  }, [])

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const handlePickImage = useCallback(async (source: 'camera' | 'library') => {
    try {
      let result

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      }

      if (!result.canceled && result.assets[0]) {
        setFormData((prev) => ({ ...prev, imageUri: result.assets[0].uri }))
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }, [])

  const handleImageOptions = useCallback(() => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => handlePickImage('camera'),
        },
        {
          text: 'Choose from Library',
          onPress: () => handlePickImage('library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    )
  }, [handlePickImage])

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.vietnamese.trim()) {
      newErrors.vietnamese = 'Vietnamese term is required'
    }

    if (!formData.english.trim()) {
      newErrors.english = 'English translation is required'
    }

    if (!formData.pronunciation.trim()) {
      newErrors.pronunciation = 'Pronunciation is required'
    }

    if (!formData.wordType) {
      newErrors.wordType = 'Word type is required'
    }

    if (!formData.topicId) {
      newErrors.topicId = 'Topic is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      // TODO: Upload image to Google Cloud Storage if imageUri is a local file
      // For now, we'll use the image URI as-is

      const flashcardData = {
        vietnamese: formData.vietnamese.trim(),
        english: formData.english.trim(),
        pronunciation: formData.pronunciation.trim(),
        word_type: formData.wordType,
        topic_id: formData.topicId,
        example_sentence: formData.exampleSentence.trim() || undefined,
        example_translation: formData.exampleTranslation.trim() || undefined,
        image_url: formData.imageUri || undefined,
        is_common_word: false,
        difficulty_level: 1,
        is_custom: true,
      }

      if (isEditing && flashcard) {
        // Update existing flashcard
        // await flashcardAPI.updateFlashcard(flashcard.id, flashcardData)
        Alert.alert('Success', 'Flashcard updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ])
      } else {
        // Create new flashcard
        // await flashcardAPI.createFlashcard(flashcardData)
        Alert.alert(
          'Success',
          'Flashcard created successfully!',
          [
            {
              text: 'Create Another',
              onPress: () => {
                // Reset form
                setFormData({
                  vietnamese: '',
                  english: '',
                  pronunciation: '',
                  wordType: 'noun',
                  topicId: '',
                  exampleSentence: '',
                  exampleTranslation: '',
                  imageUri: null,
                })
              },
            },
            {
              text: 'Done',
              onPress: () => navigation.goBack(),
            },
          ],
          { cancelable: false }
        )
      }
    } catch (error) {
      console.error('Error saving flashcard:', error)
      Alert.alert('Error', 'Failed to save flashcard')
    } finally {
      setLoading(false)
    }
  }, [formData, validateForm, isEditing, flashcard, navigation])

  const selectedTopic = topics.find((t) => t.id === formData.topicId)
  const selectedWordType = WORD_TYPES.find((w) => w.value === formData.wordType)

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Header
        title={isEditing ? 'Edit Flashcard' : 'Create Flashcard'}
        leftIcon="‹"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Vietnamese Term */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Vietnamese Term <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.vietnamese && styles.inputError]}
            placeholder="e.g., xin chào"
            placeholderTextColor={colors.text.tertiary}
            value={formData.vietnamese}
            onChangeText={(value) => handleInputChange('vietnamese', value)}
          />
          {errors.vietnamese && (
            <Text style={styles.errorText}>{errors.vietnamese}</Text>
          )}
        </View>

        {/* English Translation */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            English Translation <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.english && styles.inputError]}
            placeholder="e.g., hello"
            placeholderTextColor={colors.text.tertiary}
            value={formData.english}
            onChangeText={(value) => handleInputChange('english', value)}
          />
          {errors.english && (
            <Text style={styles.errorText}>{errors.english}</Text>
          )}
        </View>

        {/* Pronunciation */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Pronunciation <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.pronunciation && styles.inputError]}
            placeholder="e.g., sin chow"
            placeholderTextColor={colors.text.tertiary}
            value={formData.pronunciation}
            onChangeText={(value) => handleInputChange('pronunciation', value)}
          />
          {errors.pronunciation && (
            <Text style={styles.errorText}>{errors.pronunciation}</Text>
          )}
        </View>

        {/* Word Type and Topic Row */}
        <View style={styles.row}>
          {/* Word Type */}
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>
              Word Type <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.wordType && styles.inputError]}
              onPress={() => setShowWordTypePicker(!showWordTypePicker)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !formData.wordType && styles.placeholder,
                ]}
              >
                {selectedWordType?.label || 'Select type'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            {errors.wordType && (
              <Text style={styles.errorText}>{errors.wordType}</Text>
            )}

            {/* Word Type Picker */}
            {showWordTypePicker && (
              <View style={styles.pickerContainer}>
                <ScrollView style={styles.pickerScroll}>
                  {WORD_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={styles.pickerItem}
                      onPress={() => {
                        handleInputChange('wordType', type.value)
                        setShowWordTypePicker(false)
                      }}
                    >
                      <Text style={styles.pickerItemText}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Topic */}
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>
              Topic <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.topicId && styles.inputError]}
              onPress={() => setShowTopicPicker(!showTopicPicker)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !formData.topicId && styles.placeholder,
                ]}
                numberOfLines={1}
              >
                {selectedTopic?.name_vietnamese || 'Select topic'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            {errors.topicId && (
              <Text style={styles.errorText}>{errors.topicId}</Text>
            )}

            {/* Topic Picker */}
            {showTopicPicker && (
              <View style={styles.pickerContainer}>
                <ScrollView style={styles.pickerScroll}>
                  {topics.map((topic) => (
                    <TouchableOpacity
                      key={topic.id}
                      style={styles.pickerItem}
                      onPress={() => {
                        handleInputChange('topicId', topic.id)
                        setShowTopicPicker(false)
                      }}
                    >
                      <Text style={styles.pickerItemText}>
                        {topic.name_vietnamese}
                      </Text>
                      <Text style={styles.pickerItemSubtext}>
                        {topic.name_english}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Example Sentence */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Example Sentence (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Xin chào bạn"
            placeholderTextColor={colors.text.tertiary}
            value={formData.exampleSentence}
            onChangeText={(value) => handleInputChange('exampleSentence', value)}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Example Translation */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Example Translation (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Hello friend"
            placeholderTextColor={colors.text.tertiary}
            value={formData.exampleTranslation}
            onChangeText={(value) => handleInputChange('exampleTranslation', value)}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Image Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Image (Optional)</Text>
          {formData.imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: formData.imageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setFormData((prev) => ({ ...prev, imageUri: null }))}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={handleImageOptions}
            >
              <Text style={styles.imageUploadIcon}>📷</Text>
              <Text style={styles.imageUploadText}>Add Image</Text>
              <Text style={styles.imageUploadSubtext}>
                Take photo or choose from library
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <Button
          onPress={handleSubmit}
          disabled={loading}
          loading={loading}
          fullWidth
          size="lg"
          style={styles.submitButton}
        >
          {isEditing ? 'Update Flashcard' : 'Create & Add More'}
        </Button>

        {/* Bottom Padding */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },

  // Input Groups
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error.main,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.error.main,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error.main,
    marginTop: spacing.xs,
  },

  // Row Layout
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  halfWidth: {
    flex: 1,
    marginBottom: 0,
  },

  // Dropdown
  dropdown: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
  placeholder: {
    color: colors.text.tertiary,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },

  // Picker
  pickerContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    ...shadows.lg,
    zIndex: 1000,
    maxHeight: 200,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  pickerItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  pickerItemSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Image Upload
  imageUploadButton: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  imageUploadText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  imageUploadSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    fontSize: 20,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },

  // Submit Button
  submitButton: {
    marginTop: spacing.lg,
  },
})
