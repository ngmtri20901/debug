"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"
import { getFlashcardsByCategoryWithPagination } from "@/features/flashcards/services/flashcardService"
import { FlashcardDeck } from "@/features/flashcards/components/core/flashcard-deck"
import { FlashcardComponent } from "@/features/flashcards/components/core/flashcard-component"
import type { FlashcardData } from "@/lib/api/flashcards"
import { useSavedFlashcards } from "@/features/flashcards/hooks/useSavedFlashcards"
import PageWithLoading from "@/shared/components/ui/PageWithLoading"
import { useLoading } from "@/shared/hooks/use-loading"

export default function FlashcardTopicPage() {
  const { isLoading, withLoading } = useLoading()
  
  const params = useParams()
  const searchParams = useSearchParams()
  const topicId = params.topicID as string
  const complexity = searchParams.get('complexity') // Get complexity from URL query params
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([])
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  
  // Infinite scroll state
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Saved flashcards hook
  const { isFlashcardSaved, toggleSave } = useSavedFlashcards()

  useEffect(() => {
    async function loadFlashcards() {
      if (!topicId) {
        console.warn("No topicId provided in route params")
        setError("Invalid topic ID")
        return
      }
      
      await withLoading(async () => {
        try {
          setError(null)
          // Load initial batch with pagination
          const result = await getFlashcardsByCategoryWithPagination(topicId, complexity || undefined, 0, 20)
          setFlashcards(result.flashcards)
          setTitle(result.title)
          setTotal(result.total)
          setHasMore(result.hasMore)
          
          if (result.flashcards.length === 0 && result.total === 0) {
            console.warn(`No flashcards found for topic: ${topicId} with complexity: ${complexity || 'all'}`)
          }
        } catch (err) {
          console.error("Failed to load flashcards:", err)
          setError(err instanceof Error ? err.message : "Failed to load flashcards. Please try again.")
        }
      })
    }

    loadFlashcards()
  }, [topicId, complexity, withLoading])

  // Load more flashcards for infinite scroll
  const loadMoreFlashcards = useCallback(async () => {
    if (!topicId || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const result = await getFlashcardsByCategoryWithPagination(
        topicId, 
        complexity || undefined, 
        flashcards.length, 
        20
      )
      
      setFlashcards(prev => [...prev, ...result.flashcards])
      setHasMore(result.hasMore)
    } catch (err) {
      console.error("Failed to load more flashcards:", err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [topicId, complexity, flashcards.length, isLoadingMore, hasMore])

  // Reset flip state when changing cards
  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  const onSave = (id: string) => {
    toggleSave(id, title) // Pass topic title as context
  }

  const onCardSelect = (indexOrId: string | number) => {
    if (typeof indexOrId === 'number') {
      setCurrentIndex(indexOrId)
    } else {
      // Handle string ID case - find index of card with matching ID
      const cardIndex = flashcards.findIndex(card => card.id === indexOrId)
      if (cardIndex !== -1) {
        setCurrentIndex(cardIndex)
      }
    }
  }

  const nextCard = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % flashcards.length)
  }, [flashcards.length])

  const prevCard = useCallback(() => {
    setCurrentIndex(prev => prev === 0 ? flashcards.length - 1 : prev - 1)
  }, [flashcards.length])

  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev)
  }, [])

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for our handled keys
      if (['Space', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault()
      }

      switch (event.code) {
        case 'Space':
          flipCard()
          break
        case 'ArrowLeft':
          prevCard()
          break
        case 'ArrowRight':
          nextCard()
          break
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [flipCard, prevCard, nextCard])

  // Handle swipe from FlashcardComponent
  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      nextCard()
    } else {
      prevCard()
    }
  }

  if (error) {
    return (
      <PageWithLoading isLoading={isLoading}>
        <div className="container mx-auto py-10 px-4 text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </PageWithLoading>
    )
  }

  if (flashcards.length === 0) {
    return (
      <PageWithLoading isLoading={isLoading}>
        <div className="container mx-auto py-10 px-4 text-center">
          <h1 className="text-3xl font-bold mb-6">{title || "Topic"} Flashcards</h1>
          <p className="text-gray-600 mb-8">No flashcards found for this topic.</p>
        </div>
      </PageWithLoading>
    )
  }

  const currentCard = flashcards[currentIndex]

  return (
    <PageWithLoading isLoading={isLoading}>
      <div className="container mx-auto py-10 px-4" tabIndex={0}>
      <h1 className="text-3xl font-bold mb-6 text-center">{title} Flashcards</h1>
      
      {/* Instructions */}
      <div className="text-center text-gray-600 mb-10">
        <p className="mb-2">{total} flashcards available</p>
        <div className="text-sm space-y-1">
          <p>💡 <strong>Tap</strong> to flip • <strong>Swipe left/right</strong> to navigate</p>
          <p>⌨️ <strong>Spacebar</strong>: flip • <strong>← →</strong>: navigate</p>
        </div>
      </div>

      {/* Main Flashcard Display */}
      {currentCard && (
        <div className="mb-16 relative z-10">
          <div className="max-w-2xl mx-auto mb-8">
            <FlashcardComponent
              data={currentCard}
              saved={isFlashcardSaved(currentCard.id)}
              onSave={onSave}
              onSwipe={handleSwipe}
              onFlip={flipCard}
              isFlipped={isFlipped}
            />
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={prevCard}
              className="flex items-center gap-2"
              title="Previous card (← key)"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </Button>
            
            <Button
              variant="default"
              onClick={flipCard}
              className="px-6 flex items-center gap-2"
              title="Flip card (Spacebar)"
            >
              <RotateCcw className="h-4 w-4" />
              {isFlipped ? "Show Front" : "Show Back"}
            </Button>
            
            <Button
              variant="outline"
              onClick={nextCard}
              className="flex items-center gap-2"
              title="Next card (→ key)"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Card counter */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-600">
              Card {currentIndex + 1} of {flashcards.length}
            </p>
          </div>
        </div>
      )}

      {/* Flashcard Deck Navigation */}
      <div className="relative z-0">
        <FlashcardDeck 
          cards={flashcards} 
          currentIndex={currentIndex}
          savedCards={new Set(flashcards.filter(card => isFlashcardSaved(card.id)).map(card => card.id))}
          onCardSelect={onCardSelect}
          onSave={onSave}
          hasMore={hasMore}
          isLoading={isLoadingMore}
          onLoadMore={loadMoreFlashcards}
          total={total}
        />
      </div>
      </div>
    </PageWithLoading>
  )
} 