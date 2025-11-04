'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Label } from '@/shared/components/ui/label'
import { ImagePlus, Volume2, RotateCcw, Plus, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { FlashcardPreviewClient } from './FlashcardPreviewClient'
import { createFlashcard, uploadFlashcardImage } from '@/features/flashcards/actions/create'

interface FlashcardData {
  vietnamese: string
  english: string
  pronunciation: string
  wordType: string
  topic: string
  imageFile: File | null
}

export default function CreateFlashcardForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const [flashcardData, setFlashcardData] = useState<FlashcardData>({
    vietnamese: '',
    english: '',
    pronunciation: '',
    wordType: '',
    topic: '',
    imageFile: null
  })

  const [isFlipped, setIsFlipped] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')

  const wordTypes = ["Noun", "Verb", "Adjective", "Adverb", "Pronoun", "Preposition", "Conjunction", "Interjection"]

  const topics = [
    "Food & Drink",
    "Family",
    "Travel",
    "Work",
    "Education",
    "Health",
    "Sports",
    "Technology",
    "Nature",
    "Culture",
  ]

  const truncateFilename = (filename: string, maxLength: number = 20): string => {
    if (filename.length <= maxLength) return filename
    const extension = filename.split('.').pop() || ''
    const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'))
    const truncatedName = nameWithoutExt.slice(0, 3) + '...'
    return `${truncatedName}${extension ? '.' + extension : ''}`
  }

  const updateFlashcard = (field: keyof FlashcardData, value: string) => {
    setFlashcardData(prev => ({ ...prev, [field]: value }))
  }

  const MAX_IMAGE_SIZE = 3 * 1024 * 1024 // 3MB in bytes

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (3MB limit)
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`Image size exceeds 3MB limit. Please choose a smaller image. (Current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
        // Reset file input
        event.target.value = ''
        return
      }

      setFlashcardData(prev => ({ ...prev, imageFile: file }))
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setFlashcardData(prev => ({ ...prev, imageFile: null }))
    setImagePreview('')
    // Reset file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const resetForm = () => {
    setFlashcardData({
      vietnamese: '',
      english: '',
      pronunciation: '',
      wordType: '',
      topic: '',
      imageFile: null
    })
    setImagePreview('')
    setIsFlipped(false)
  }

  const handleCreateFlashcard = async () => {
    if (!flashcardData.vietnamese.trim() || !flashcardData.english.trim()) {
      toast.error('Please enter both Vietnamese text and English translation')
      return
    }

    setIsCreating(true)
    console.log('🚀 Starting flashcard creation with server action...')
    console.log('📝 Form data:', flashcardData)

    try {
      // Step 1: Upload image if provided (using server action)
      let imageUrl: string | null = null
      if (flashcardData.imageFile) {
        console.log('🖼️ Uploading image with server action...')
        const uploadResult = await uploadFlashcardImage(flashcardData.imageFile, userId)
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image')
        }
        
        imageUrl = uploadResult.url || null
        console.log('✅ Image uploaded successfully:', imageUrl)
      }

      // Step 2: Create flashcard using server action
      console.log('💾 Creating flashcard with server action...')
      const result = await createFlashcard({
        vietnamese_text: flashcardData.vietnamese.trim(),
        english_text: flashcardData.english.trim(),
        ipa_pronunciation: flashcardData.pronunciation.trim() || null,
        image_url: imageUrl,
        topic: flashcardData.topic.trim() || null,
        notes: null
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to create flashcard')
      }

      console.log('✅ Flashcard created successfully:', result.data)

      // Step 3: Success feedback with action link
      toast.success('Flashcard created successfully!', {
        duration: 4000,
        action: {
          label: 'View saved →',
          onClick: () => {
            router.push('/flashcards/saved')
            // Force refresh to re-fetch data for pages not using React Query
            router.refresh()
          }
        }
      })

      // Step 4: Reset form for next flashcard
      resetForm()
    } catch (error) {
      console.error('❌ Error creating flashcard:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create flashcard'
      toast.error(errorMessage)
      
      // Log additional debug info
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Flashcard</h1>
            <p className="text-sm text-muted-foreground">Build your Vietnamese vocabulary cards</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form - Left Side */}
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span>Flashcard Details</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill in the information below to create your flashcard
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Main Content Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Vietnamese Text */}
                    <div className="space-y-2">
                      <Label htmlFor="vietnamese" className="text-sm font-semibold text-foreground">
                        Vietnamese Text *
                      </Label>
                      <Textarea
                        id="vietnamese"
                        placeholder="Enter Vietnamese word or phrase..."
                        value={flashcardData.vietnamese}
                        onChange={(e) => updateFlashcard("vietnamese", e.target.value)}
                        className="min-h-[70px] resize-none border-2 focus:border-primary/50 transition-colors"
                      />
                    </div>

                    {/* TranslationTranslation Text */}
                    <div className="space-y-2">
                      <Label htmlFor="english" className="text-sm font-semibold text-foreground">
                        Translation *
                      </Label>
                      <Textarea
                        id="english"
                        placeholder="Enter translation..."
                        value={flashcardData.english}
                        onChange={(e) => updateFlashcard("english", e.target.value)}
                        className="min-h-[70px] resize-none border-2 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Additional Details</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Word Type */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Word Type</Label>
                      <Select value={flashcardData.wordType} onValueChange={(value) => updateFlashcard("wordType", value)}>
                        <SelectTrigger className="border-2 focus:border-primary/50 transition-colors">
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {wordTypes.map((type) => (
                            <SelectItem key={type} value={type.toLowerCase()}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Topic */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Topic</Label>
                      <Select value={flashcardData.topic} onValueChange={(value) => updateFlashcard("topic", value)}>
                        <SelectTrigger className="border-2 focus:border-primary/50 transition-colors">
                          <SelectValue placeholder="Select topic..." />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map((topic) => (
                            <SelectItem key={topic} value={topic.toLowerCase().replace(/\s+/g, "-")}>
                              {topic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <ImagePlus className="w-4 h-4 text-muted-foreground" />
                        Add Image
                        <span className="text-xs text-muted-foreground font-normal">(Max 3MB)</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            id="image-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-2 focus:border-primary/50 transition-colors h-10 text-sm bg-transparent pointer-events-none"
                            asChild
                          >
                            <label htmlFor="image-upload" className="cursor-pointer flex items-center justify-center gap-2 pointer-events-auto">
                              <ImagePlus className="w-4 h-4" />
                              {flashcardData.imageFile ? truncateFilename(flashcardData.imageFile.name) : "Choose file"}
                            </label>
                          </Button>
                        </div>
                        {flashcardData.imageFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleRemoveImage}
                            className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label
                      htmlFor="pronunciation"
                      className="text-sm font-medium text-foreground flex items-center gap-2"
                    >
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                      Pronunciation (IPA)
                    </Label>
                    <Input
                      id="pronunciation"
                      placeholder="e.g., /ˈvjɛt.nɑm/"
                      value={flashcardData.pronunciation}
                      onChange={(e) => updateFlashcard("pronunciation", e.target.value)}
                      className="border-2 focus:border-primary/50 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-5">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      disabled={isCreating}
                      className="flex-1 h-11 font-medium"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>

                    <Button
                      onClick={handleCreateFlashcard}
                      disabled={isCreating || !flashcardData.vietnamese || !flashcardData.english}
                      className="flex-1 h-11 font-medium"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isCreating ? 'Creating...' : 'Create & Add More'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Preview - Right Side */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Live Preview</h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="flex items-center gap-2 transition-transform duration-300"
                  >
                  <RefreshCw
                    className={`w-4 h-4 transition-transform duration-500 ${
                      isFlipped ? "[transform:rotateY(180deg)]" : ""
                    }`}
                  />  Flip
                  </Button>
              </div>

              {/* Flashcard Preview */}
              <div className="relative">
                <FlashcardPreviewClient
                  vietnamese={flashcardData.vietnamese}
                  english={flashcardData.english}
                  pronunciation={flashcardData.pronunciation}
                  wordType={flashcardData.wordType}
                  topic={flashcardData.topic}
                  imagePreview={imagePreview}
                  isFlipped={isFlipped}
                  onFlip={() => setIsFlipped(!isFlipped)}
                />
              </div>

              {/* Preview Info */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Card Information</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Vietnamese: {flashcardData.vietnamese || "Not set"}</div>
                    <div>Translation: {flashcardData.english || "Not set"}</div>
                    <div>Pronunciation: {flashcardData.pronunciation || "Not set"}</div>
                    <div>Type: {flashcardData.wordType || "Not set"}</div>
                    <div>Topic: {flashcardData.topic ? flashcardData.topic.replace("-", " ") : "Not set"}</div>
                    <div>Image: {flashcardData.imageFile ? truncateFilename(flashcardData.imageFile.name) : "Not set"}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    </div>
  )
}
