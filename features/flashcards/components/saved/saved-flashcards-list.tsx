"use client"

import React, { useState, useEffect, memo } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { 
  Star, 
  Calendar,
  Clock,
  Volume2,
  BookmarkX,
  Trash2
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { audioManager } from "@/shared/utils/audio"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface SavedFlashcard {
  id: string
  flashcard_id: string
  flashcard_type: 'APP' | 'CUSTOM'
  topic?: string
  saved_at: string
  is_favorite: boolean
  review_count: number
  last_reviewed?: string
  tags: string[]
  notes?: string
  // App flashcard data
  vietnamese?: string
  english?: string[]
  image_url?: string
  word_type?: string
  audio_url?: string
  pronunciation?: string
  // Custom flashcard data
  vietnamese_text?: string
  english_text?: string
}

interface SavedFlashcardsListProps {
  flashcards: SavedFlashcard[]
  viewMode: 'grid' | 'list'
  onUnsave: (flashcardId: string, flashcardText: string, actionType: 'unsave' | 'delete') => void
  onToggleFavorite: (flashcardId: string) => void
}

function SavedFlashcardsListComponent({
  flashcards,
  viewMode,
  onUnsave,
  onToggleFavorite
}: SavedFlashcardsListProps) {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())

  // Utility function to clear all audio cache (useful for debugging)
  const clearAllAudioCache = () => {
    try {
      const keys = Object.keys(localStorage);
      const audioKeys = keys.filter(key => key.startsWith('audio:custom:'));
      audioKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.warn('Could not remove cache key:', key, err);
        }
      });
      console.log(`🧹 Cleared ${audioKeys.length} audio cache entries`);
    } catch (err) {
      console.warn('Error clearing audio cache:', err);
    }
  };

  // Clear audio cache on component mount if there were previous issues
  useEffect(() => {
      // Only clear cache in development or if user explicitly requests it
    if (process.env.NODE_ENV === 'development') {
      // Check if we had recent errors and clear cache
      const hasRecentErrors = sessionStorage.getItem('audio-cache-errors') === 'true';
      if (hasRecentErrors) {
        console.log('🔧 Clearing audio cache due to recent errors...');
        clearAllAudioCache();
        sessionStorage.removeItem('audio-cache-errors');
      }
    }
  }, []);

  const handlePlayAudio = async (flashcard: SavedFlashcard) => {
    const vietnamese = flashcard.vietnamese || flashcard.vietnamese_text || ''
    
    if (!vietnamese) {
      toast.error('No text available for audio playback')
      return
    }

    setPlayingAudio(flashcard.id)
    try {
      if (flashcard.flashcard_type === 'APP') {
        if (!flashcard.flashcard_id) {
          throw new Error('Missing flashcard ID for APP flashcard')
        }
        if (flashcard.audio_url) {
          await audioManager.playPronunciation(flashcard.audio_url)
        } else {
          // No audio available - would need TTS integration
          toast.info('No audio available for this flashcard')
        }
      } else { // CUSTOM flashcard
        await playCustomFlashcardAudio(flashcard.id, vietnamese)
      }
    } catch (error) {
      console.error('💥 Audio playback failed:', error);
      
      // Track audio errors for potential cache clearing
      if (flashcard.flashcard_type === 'CUSTOM' && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('audio-cache-errors', 'true');
        } catch (sessionErr) {
          console.warn('Could not set error flag in sessionStorage:', sessionErr);
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Failed to play audio: ${errorMessage}`);
    } finally {
      setPlayingAudio(null)
    }
  }

  // Separate function for custom flashcard audio handling with improved session management
  const playCustomFlashcardAudio = async (flashcardId: string, vietnamese: string) => {
    const audioKey = `audio:custom:${flashcardId}`;
    let audioData: { base64: string; expiry: number } | null = null;
    let shouldRegenerate = false;

    // Check localStorage for cached audio data with better error handling
    try {
      const cachedAudioItem = localStorage.getItem(audioKey);
      if (cachedAudioItem) {
        const cached = JSON.parse(cachedAudioItem);
        // Validate the cached data more thoroughly
        if (cached.expiry && cached.base64 && 
            cached.expiry > Date.now() && 
            typeof cached.base64 === 'string' && 
            cached.base64.length > 0) {
          audioData = cached;
          console.log('✅ Using cached audio from localStorage for custom flashcard:', flashcardId);
        } else {
          // Invalid or expired cache
          localStorage.removeItem(audioKey);
          console.log('🗑️ Invalid/expired audio cache removed for custom flashcard:', flashcardId);
          shouldRegenerate = true;
        }
      } else {
        shouldRegenerate = true;
      }
    } catch (err) {
      console.warn('⚠️ Error reading from localStorage:', err);
      // Clean up potentially corrupted cache
      try {
        localStorage.removeItem(audioKey);
      } catch (cleanupErr) {
        console.warn('⚠️ Could not clean up localStorage:', cleanupErr);
      }
      shouldRegenerate = true;
    }

    // Generate new audio if needed
    if (shouldRegenerate || !audioData) {
      console.log('🔊 Generating new audio via API route for custom flashcard:', flashcardId);
      console.log('📝 Vietnamese text to convert:', vietnamese);
      
      console.log('🌐 Making request to TTS API route...');
      
      const response = await fetch('/api/flashcards/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: vietnamese })
      });
      
      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ TTS API error:', errorData);
        throw new Error(`Failed to synthesize audio. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 TTS API response received');
      if (!data.audioContent) {
        console.error('❌ No audioContent in response:', data);
        throw new Error("No audio content in API response");
      }

      // Store base64 audio data instead of blob URL
      const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days TTL
      audioData = {
        base64: data.audioContent,
        expiry: expiry
      };

      // Cache the audio data in localStorage
      try {
        localStorage.setItem(audioKey, JSON.stringify(audioData));
        console.log('💾 Audio data cached in localStorage for custom flashcard:', flashcardId);
      } catch (storageErr) {
        console.warn('⚠️ Failed to cache audio in localStorage:', storageErr);
        // Continue without caching - audio will still play
      }
    }

    // Convert base64 to blob and play audio with retry logic
    if (audioData?.base64) {
      let playAttempt = 0;
      const maxAttempts = 2;

      while (playAttempt < maxAttempts) {
        let audioUrl: string | null = null;
        try {
          console.log(`🎵 Attempting to play audio (attempt ${playAttempt + 1}/${maxAttempts}) for custom flashcard:`, flashcardId);
          
          // Validate base64 data before conversion
          if (!audioData.base64 || typeof audioData.base64 !== 'string') {
            throw new Error('Invalid base64 audio data');
          }

          // Convert base64 to blob with better error handling
          let byteCharacters: string;
          try {
            byteCharacters = atob(audioData.base64);
          } catch (base64Error) {
            throw new Error(`Failed to decode base64 audio data: ${base64Error}`);
          }

          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'audio/mpeg' });
          console.log('💾 Blob created, size:', blob.size, 'bytes, type:', blob.type);

          // Validate blob before creating URL
          if (blob.size === 0) {
            throw new Error('Created blob is empty');
          }

          audioUrl = URL.createObjectURL(blob);
          console.log('🔗 Audio URL created:', audioUrl.substring(0, 50) + '...');
          
          const audio = new Audio(audioUrl);
          
          // Promise-based audio loading and playing with improved error handling
          await new Promise<void>((resolve, reject) => {
            let hasResolved = false;
            let timeoutId: NodeJS.Timeout | null = null;
            
            const cleanup = () => {
              if (!hasResolved) {
                hasResolved = true;
                if (timeoutId) {
                  clearTimeout(timeoutId);
                }
                if (audioUrl) {
                  URL.revokeObjectURL(audioUrl);
                }
              }
            };

            const resolveOnce = () => {
              if (!hasResolved) {
                cleanup();
                resolve();
              }
            };

            const rejectOnce = (error: Error) => {
              if (!hasResolved) {
                cleanup();
                reject(error);
              }
            };

            audio.addEventListener('loadstart', () => console.log('🔄 Audio loading started'));
            audio.addEventListener('canplay', () => console.log('✅ Audio can start playing'));
            
            audio.addEventListener('error', (e) => {
              console.error('❌ Audio element error event:', e);
              console.error('❌ Audio error details:', {
                error: audio.error,
                networkState: audio.networkState,
                readyState: audio.readyState,
                src: audio.src.substring(0, 50) + '...'
              });
              rejectOnce(new Error(`Audio loading failed: ${audio.error?.message || 'Media element error'}`));
            });

            audio.addEventListener('ended', () => {
              console.log('🏁 Audio playback completed successfully');
              resolveOnce();
            });

            // Set timeout to avoid hanging
            timeoutId = setTimeout(() => {
              console.log('⏰ Audio playback timeout - assuming success');
              resolveOnce();
            }, 15000); // 15 second timeout

            // Start playing
            audio.play()
              .then(() => {
                console.log('🎵 Successfully started playing audio for custom flashcard:', vietnamese);
                // Audio is playing, wait for 'ended' event or timeout
              })
              .catch((playError) => {
                console.error('❌ Audio play() method failed:', playError);
                rejectOnce(new Error(`Audio play failed: ${playError.message || 'Play method error'}`));
              });
          });

          // If we get here, audio played successfully
          console.log('✅ Audio playback completed successfully');
          return; // Exit function successfully

        } catch (playErr) {
          console.error(`❌ Audio playback error (attempt ${playAttempt + 1}):`, playErr);
          
          // Clean up any blob URL created in this attempt
          if (audioUrl) {
            try {
              URL.revokeObjectURL(audioUrl);
            } catch (cleanupErr) {
              console.warn('⚠️ Could not revoke blob URL:', cleanupErr);
            }
            audioUrl = null;
          }
          
          playAttempt++;
          
          if (playAttempt >= maxAttempts) {
            // If this was a cached audio and it failed, try regenerating once
            if (!shouldRegenerate && audioData) {
              console.log('🔄 Cached audio failed, attempting to regenerate...');
              try {
                localStorage.removeItem(audioKey);
              } catch (cacheErr) {
                console.warn('⚠️ Could not remove cache:', cacheErr);
              }
              
              // Recursive call to regenerate and retry
              return await playCustomFlashcardAudio(flashcardId, vietnamese);
            }
            
            // Final failure
            throw new Error(`Audio playback failed after ${maxAttempts} attempts: ${playErr instanceof Error ? playErr.message : 'Unknown error'}`);
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    } else {
      throw new Error("Could not generate or retrieve audio data");
    }
  }

  const handleUnsaveCard = (flashcard: SavedFlashcard) => {
    const flashcardText = flashcard.vietnamese || flashcard.vietnamese_text || 'Unknown'
    const actionType = flashcard.flashcard_type === 'CUSTOM' ? 'delete' : 'unsave'
    onUnsave(flashcard.id, flashcardText, actionType)
  }

  const handleFlipCard = (flashcardId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(flashcardId)) {
        newSet.delete(flashcardId)
      } else {
        newSet.add(flashcardId)
      }
      return newSet
    })
  }

  // Helper function to get word types as array
  const getWordTypes = (wordType: string | string[] | null | undefined): string[] => {
    // Handle different data types
    if (!wordType) return []

    // If it's already an array, return it
    if (Array.isArray(wordType)) {
      return wordType.filter(type => typeof type === 'string' && type.trim())
    }

    // If it's a string, try to split it
    if (typeof wordType === 'string') {
      const trimmed = wordType.trim()
      if (!trimmed) return []

      // Try to split by capital letters first (e.g., "VERBADJ" -> ["VERB", "ADJ"])
      const matches = trimmed.match(/[A-Z][a-z]*/g)
      if (matches && matches.length > 1) {
        return matches
      }

      // If no capital letter splits found, try other common separators
      if (trimmed.includes(',')) {
        return trimmed.split(',').map(type => type.trim()).filter(type => type)
      }
      if (trimmed.includes(';')) {
        return trimmed.split(';').map(type => type.trim()).filter(type => type)
      }
      if (trimmed.includes('/')) {
        return trimmed.split('/').map(type => type.trim()).filter(type => type)
      }
      if (trimmed.includes(' ')) {
        return trimmed.split(' ').map(type => type.trim()).filter(type => type)
      }

      // If no separators found, return as single item
      return [trimmed]
    }

    // If it's a number, convert to string
    if (typeof wordType === 'number') {
      return [wordType.toString()]
    }

    // For any other type, try to convert to string
    try {
      const str = String(wordType).trim()
      return str ? [str] : []
    } catch {
      return []
    }
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {flashcards.map((flashcard) => {
          const vietnamese = flashcard.vietnamese || flashcard.vietnamese_text || ''
          const english = flashcard.english?.join(', ') || flashcard.english_text || ''
          // Use the processed image_url from the parent component
          const imageUrl = flashcard.image_url || '/placeholder.svg'
          const isCustom = flashcard.flashcard_type === 'CUSTOM'
          const isFlipped = flippedCards.has(flashcard.id)
          
          return (
            <div 
              key={flashcard.id} 
              style={{ perspective: '1000px', minHeight: '450px' }}
            >
              <motion.div
                style={{ 
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  width: '100%',
                  height: '100%',
                  minHeight: '450px'
                }}
                transition={{ duration: 0.6 }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
              >
                {/* Front side - Vietnamese */}
                <motion.div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden'
                  }}
                >
                  <Card
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                    style={{ width: '100%', height: '100%' }}
                    onClick={() => handleFlipCard(flashcard.id)}
                  >
                <CardContent className="p-4 h-full flex flex-col">
                  {/* Header with actions */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge 
                      variant={flashcard.flashcard_type === 'APP' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {flashcard.flashcard_type === 'APP' ? 'App' : 'My Card'}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleFavorite(flashcard.id)
                        }}
                        className="p-1 h-auto opacity-60 hover:opacity-100"
                      >
                        {flashcard.is_favorite ? (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <Star className="h-3 w-3" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUnsaveCard(flashcard)
                        }}
                        className="p-1 h-auto opacity-60 hover:opacity-100 hover:text-red-600"
                        title={isCustom ? "Delete flashcard" : "Unsave flashcard"}
                      >
                        {isCustom ? (
                          <Trash2 className="h-3 w-3" />
                        ) : (
                          <BookmarkX className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100">
                    <Image
                      src={imageUrl}
                      alt={vietnamese}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {vietnamese}
                        </h3>
                        {/* IPA for APP flashcards */}
                        {flashcard.flashcard_type === 'APP' && flashcard.pronunciation && (
                          <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">/{flashcard.pronunciation}/</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlayAudio(flashcard)
                        }}
                        disabled={playingAudio === flashcard.id}
                        className={`p-1 h-auto opacity-60 hover:opacity-100 ${
                          playingAudio === flashcard.id ? 'animate-pulse text-blue-500' : ''
                        }`}
                        title={'Play pronunciation'}
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {flashcard.topic && (
                      <Badge variant="outline" className="text-xs">
                        {flashcard.topic}
                      </Badge>
                    )}

                    {(() => {
                      const wordTypes = getWordTypes(flashcard.word_type)
                      if (wordTypes.length === 0) return null
                      if (wordTypes.length === 1) {
                        return (
                          <Badge variant="outline" className="text-xs">
                            {wordTypes[0]}
                          </Badge>
                        )
                      }
                      return (
                        <div className="flex flex-wrap gap-1">
                          {wordTypes.map((type: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {flashcard.review_count} reviews
                    </div>
                    <div className="flex items-center gap-1" suppressHydrationWarning>
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(flashcard.saved_at), { addSuffix: true })}
                    </div>
                  </div>
                </CardContent>
                  </Card>
                </motion.div>

                {/* Back side - English */}
                <motion.div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <Card
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                    style={{ width: '100%', height: '100%' }}
                    onClick={() => handleFlipCard(flashcard.id)}
                  >
                <CardContent className="p-4 h-full flex flex-col">
                  {/* Header with actions */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge 
                      variant={flashcard.flashcard_type === 'APP' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {flashcard.flashcard_type === 'APP' ? 'App' : 'My Card'}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleFavorite(flashcard.id)
                        }}
                        className="p-1 h-auto opacity-60 hover:opacity-100"
                      >
                        {flashcard.is_favorite ? (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <Star className="h-3 w-3" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUnsaveCard(flashcard)
                        }}
                        className="p-1 h-auto opacity-60 hover:opacity-100 hover:text-red-600"
                        title={isCustom ? "Delete flashcard" : "Unsave flashcard"}
                      >
                        {isCustom ? (
                          <Trash2 className="h-3 w-3" />
                        ) : (
                          <BookmarkX className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Content - Only English translation */}
                  <div className="space-y-2 flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900 mb-4">
                        {english}
                      </p>
                      
                      {flashcard.topic && (
                        <Badge variant="outline" className="text-xs mb-2">
                          {flashcard.topic}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {flashcard.review_count} reviews
                    </div>
                    <div className="flex items-center gap-1" suppressHydrationWarning>
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(flashcard.saved_at), { addSuffix: true })}
                    </div>
                  </div>
                </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>
          )
        })}
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-3">
      {flashcards.map((flashcard) => {
        const vietnamese = flashcard.vietnamese || flashcard.vietnamese_text || ''
        const english = flashcard.english?.join(', ') || flashcard.english_text || ''
        // Use the processed image_url from the parent component
        const imageUrl = flashcard.image_url || '/placeholder.svg'
        const isCustom = flashcard.flashcard_type === 'CUSTOM'
        const isFlipped = flippedCards.has(flashcard.id)
        
        return (
          <div 
            key={flashcard.id} 
            style={{ perspective: '1000px', minHeight: '150px' }}
          >
            <motion.div
              style={{ 
                position: 'relative',
                transformStyle: 'preserve-3d',
                width: '100%',
                height: '100%',
                minHeight: '150px'
              }}
              transition={{ duration: 0.6 }}
              animate={{ rotateX: isFlipped ? 180 : 0 }}
            >
              {/* Front side - Vietnamese */}
              <motion.div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                <Card
                  className="group hover:shadow-md transition-all duration-200 cursor-pointer"
                  style={{ width: '100%', height: '100%' }}
                  onClick={() => handleFlipCard(flashcard.id)}
                >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={imageUrl}
                      alt={vietnamese}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 truncate">
                              {vietnamese}
                            </h3>
                            {flashcard.flashcard_type === 'APP' && flashcard.pronunciation && (
                              <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">/{flashcard.pronunciation}/</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlayAudio(flashcard)
                            }}
                            disabled={playingAudio === flashcard.id}
                            className={`p-1 h-auto opacity-60 hover:opacity-100 ${
                              playingAudio === flashcard.id ? 'animate-pulse text-blue-500' : ''
                            }`}
                            title={'Play pronunciation'}
                          >
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant={flashcard.flashcard_type === 'APP' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {flashcard.flashcard_type === 'APP' ? 'App Card' : 'My Card'}
                          </Badge>
                          
                          {flashcard.topic && (
                            <Badge variant="outline" className="text-xs">
                              {flashcard.topic}
                            </Badge>
                          )}

                          {(() => {
                            const wordTypes = getWordTypes(flashcard.word_type)
                            if (wordTypes.length === 0) return null
                            if (wordTypes.length === 1) {
                              return (
                                <Badge variant="outline" className="text-xs">
                                  {wordTypes[0]}
                                </Badge>
                              )
                            }
                            return (
                              <div className="flex flex-wrap gap-1">
                                {wordTypes.map((type: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm text-gray-500 mr-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {flashcard.review_count} reviews
                          </div>
                          <div className="flex items-center gap-1 mt-1" suppressHydrationWarning>
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(flashcard.saved_at), { addSuffix: true })}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleFavorite(flashcard.id)
                          }}
                          className="p-2"
                        >
                          {flashcard.is_favorite ? (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUnsaveCard(flashcard)
                          }}
                          className="px-3"
                        >
                          {isCustom ? (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </>
                          ) : (
                            <>
                              <BookmarkX className="h-4 w-4 mr-1" />
                              Unsave
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
                </Card>
              </motion.div>

              {/* Back side - English */}
              <motion.div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateX(180deg)'
                }}
              >
                <Card
                  className="group hover:shadow-md transition-all duration-200 cursor-pointer"
                  style={{ width: '100%', height: '100%' }}
                  onClick={() => handleFlipCard(flashcard.id)}
                >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Content - Only English translation */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-center py-8">
                          <p className="text-xl font-semibold text-gray-900 mb-4">
                            {english}
                          </p>
                          
                          {flashcard.topic && (
                            <Badge variant="outline" className="text-xs">
                              {flashcard.topic}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm text-gray-500 mr-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {flashcard.review_count} reviews
                          </div>
                          <div className="flex items-center gap-1 mt-1" suppressHydrationWarning>
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(flashcard.saved_at), { addSuffix: true })}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleFavorite(flashcard.id)
                          }}
                          className="p-2"
                        >
                          {flashcard.is_favorite ? (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUnsaveCard(flashcard)
                          }}
                          className="px-3"
                        >
                          {isCustom ? (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </>
                          ) : (
                            <>
                              <BookmarkX className="h-4 w-4 mr-1" />
                              Unsave
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

export const SavedFlashcardsList = memo(SavedFlashcardsListComponent)