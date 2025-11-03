"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { FlashcardComponent } from "@/features/flashcards/components/core/flashcard-component"
import { FlashcardDeck } from "@/features/flashcards/components/core/flashcard-deck"
import { Loader2, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import PageWithLoading from "@/shared/components/ui/PageWithLoading"
import { useLoading } from "@/shared/hooks/use-loading"

// Import new API service (only for search and today's flashcards)
import { 
  flashcardAPI, 
  type FlashcardTopic,
  type WordType
} from "@/features/flashcards/services/flashcardService"
import { type FlashcardData } from "@/features/flashcards/services/flashcardService"
import { useSavedFlashcards } from "@/features/flashcards/hooks/useSavedFlashcards"
import { useRandomFlashcards } from "@/features/flashcards/hooks/useRandomFlashcards"
import {
  STATIC_TOPICS,
  STATIC_WORD_TYPES,
  STATIC_OTHERS,
  convertToTopicFormat,
  convertToWordTypeFormat,
  calculateTotalComplexityCounts
} from "@/features/flashcards/components/data"


export default function FlashcardsPage() {
  // Loading hook
  const { isLoading: baseLoading, withLoading } = useLoading()
  
  // State management
  const [allTopics, setAllTopics] = useState<FlashcardTopic[]>([])
  const [allWordTypes, setAllWordTypes] = useState<WordType[]>([])
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<FlashcardData[]>([])
  const [todays, setTodays] = useState<FlashcardData[]>([])
  const [tab, setTab] = useState("all")
  const [complexityCounts, setComplexityCounts] = useState<{all: number, simple: number, complex: number}>({all: 0, simple: 0, complex: 0})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  
  // Search-specific states
  const [searchCurrentIndex, setSearchCurrentIndex] = useState(0)
  const [searchIsFlipped, setSearchIsFlipped] = useState(false)
  
  // Individual loading states for specific operations
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Saved flashcards hook
  const { isFlashcardSaved, toggleSave, loading: savedCardsLoading } = useSavedFlashcards()

  const {
    data: randomFlashcards,
    isLoading: isRandomLoading,
    isFetching: isFetchingRandom,
    refetch: refetchRandomFlashcards,
    error: randomFlashcardsError,
  } = useRandomFlashcards({ count: 25 })

  const isPageLoading = baseLoading || isRandomLoading
  const isRandomBusy = isRandomLoading || isFetchingRandom
  const isRefreshBusy = isPageLoading || isRandomBusy

  // Load initial data - now using static data for instant loading
  useEffect(() => {
    const loadInitialData = async () => {
      await withLoading(async () => {
        try {
          setError(null)
          
          // Use static data for topics and word types (instant loading)
          const topics = STATIC_TOPICS.map(topic => convertToTopicFormat(topic, "all"))
          const wordTypes = STATIC_WORD_TYPES.map(wordType => convertToWordTypeFormat(wordType, "all"))
          
          // Calculate complexity counts from static data using helper function
          const totalCounts = calculateTotalComplexityCounts()
          
          setAllTopics(topics)
          setAllWordTypes(wordTypes)
          setComplexityCounts(totalCounts)
          
        } catch (err) {
          console.error("Failed to load initial data:", err)
          setError("Failed to load some content. Please refresh the page.")
        }
      })
    }

    loadInitialData()
  }, [withLoading])

  useEffect(() => {
    if (randomFlashcards) {
      setTodays(randomFlashcards)
    }
  }, [randomFlashcards])

  useEffect(() => {
    if (randomFlashcardsError) {
      console.error("Failed to load today's flashcards:", randomFlashcardsError)
      if (!randomFlashcards) {
        setTodays([])
      }
    }
  }, [randomFlashcards, randomFlashcardsError])

  // Handle search with debouncing
  useEffect(() => {
    const handleSearch = async () => {
      if (!search.trim()) {
        setSearchResults([])
        return
      }

      try {
        setSearchLoading(true)
        const results = await flashcardAPI.searchFlashcards(search, 50)
        setSearchResults(results)
      } catch (err) {
        console.error("Search failed:", err)
        // Clear search results if API search fails
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }

    const timeoutId = setTimeout(handleSearch, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [search])

  // Refresh today's flashcards
  const refreshTodaysCards = async () => {
    await withLoading(async () => {
      try {
        const result = await refetchRandomFlashcards({ throwOnError: true })
        const randomCards = result.data ?? []
        setTodays(randomCards)
        setCurrentIndex(0) // Reset to first card
        setIsFlipped(false) // Reset flip state
      } catch (err) {
        console.error("Failed to refresh today's cards:", err)
        // Clear today's cards if API fails
        setTodays([])
        setCurrentIndex(0)
        setIsFlipped(false)
      }
    })
  }

  // Reset flip state when changing cards
  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  // Reset search flip state and index when changing search
  useEffect(() => {
    setSearchIsFlipped(false)
    setSearchCurrentIndex(0)
  }, [searchResults])

  // Update data when tab changes - now using static data for instant switching
  useEffect(() => {
    // Use static data for instant filtering
    const topics = STATIC_TOPICS.map(topic => convertToTopicFormat(topic, tab))
    const wordTypes = STATIC_WORD_TYPES.map(wordType => convertToWordTypeFormat(wordType, tab))
    
    setAllTopics(topics)
    setAllWordTypes(wordTypes)
  }, [tab])

  const onSave = (id: string) => {
    // Get topic from current flashcard if available
    const currentCard = search ? searchResults[searchCurrentIndex] : todays[currentIndex]
    const topic = currentCard?.id === id ? undefined : undefined // We don't have topic info in current data structure
    toggleSave(id, topic)
  }

  const onCardSelect = (indexOrId: string | number) => {
    if (typeof indexOrId === 'number') {
      setCurrentIndex(indexOrId)
    } else {
      // Handle string ID case - find index of card with matching ID
      const cardIndex = todays.findIndex(card => card.id === indexOrId)
      if (cardIndex !== -1) {
        setCurrentIndex(cardIndex)
      }
    }
  }

  // Search card selection
  const onSearchCardSelect = (indexOrId: string | number) => {
    if (typeof indexOrId === 'number') {
      setSearchCurrentIndex(indexOrId)
    } else {
      // Handle string ID case - find index of card with matching ID
      const cardIndex = searchResults.findIndex(card => card.id === indexOrId)
      if (cardIndex !== -1) {
        setSearchCurrentIndex(cardIndex)
      }
    }
  }

  const nextCard = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % todays.length)
  }, [todays.length])

  const prevCard = useCallback(() => {
    setCurrentIndex(prev => prev === 0 ? todays.length - 1 : prev - 1)
  }, [todays.length])

  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev)
  }, [])

  // Search navigation functions
  const nextSearchCard = useCallback(() => {
    setSearchCurrentIndex(prev => (prev + 1) % searchResults.length)
  }, [searchResults.length])

  const prevSearchCard = useCallback(() => {
    setSearchCurrentIndex(prev => prev === 0 ? searchResults.length - 1 : prev - 1)
  }, [searchResults.length])

  const flipSearchCard = useCallback(() => {
    setSearchIsFlipped(prev => !prev)
  }, [])

  // Handle swipe from FlashcardComponent
  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      nextCard()
    } else {
      prevCard()
    }
  }

  // Handle swipe for search results
  const handleSearchSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      nextSearchCard()
    } else {
      prevSearchCard()
    }
  }

  // Keyboard event handler for today's flashcards
  useEffect(() => {
    if (!search && todays.length > 0) {
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
    }
  }, [flipCard, prevCard, nextCard, search, todays.length])

  // Keyboard event handler for search results
  useEffect(() => {
    if (search && searchResults.length > 0) {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Prevent default behavior for our handled keys
        if (['Space', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
          event.preventDefault()
        }

        switch (event.code) {
          case 'Space':
            flipSearchCard()
            break
          case 'ArrowLeft':
            prevSearchCard()
            break
          case 'ArrowRight':
            nextSearchCard()
            break
        }
      }

      // Add event listener
      window.addEventListener('keydown', handleKeyDown)

      // Cleanup
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [flipSearchCard, prevSearchCard, nextSearchCard, search, searchResults.length])

  // Group by word type - now using static data
  const byType = useMemo(() => {
    return allWordTypes.map((wordType) => ({
      id: wordType.id,
      title: wordType.title,
      description: wordType.description,
      count: wordType.count,
      imageUrl: wordType.imageUrl, // Now using imageUrl from static data
    }))
  }, [allWordTypes])

  // Others group with static counts
  const othersData = useMemo(() => {
    return STATIC_OTHERS.map(other => ({
      id: other.id,
      title: other.title,
      description: other.description,
      count: other.counts[tab as keyof typeof other.counts],
      imageUrl: other.imageUrl,
    }))
  }, [tab])

  // Show error state
  if (error) {
    return (
      <PageWithLoading isLoading={isPageLoading}>
        <div className="container mx-auto py-10 px-4">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </PageWithLoading>
    )
  }

  return (
    <PageWithLoading isLoading={isPageLoading}>
      <div className="container mx-auto py-10 px-6 sm:px-12 max-w-full overflow-x-hidden">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Vietnamese Flashcards</h1>
        </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto mb-8 px-6 sm:px-12">
        <div className="relative">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search "xin chào" or "hello"'
            className="h-12 text-lg shadow"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>
      </div>

      {/* Search Results */}
      {search && (
        <div className="mb-16 px-6 sm:px-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Search Results</h2>
            {searchResults.length > 0 && (
              <p className="text-sm text-gray-600">
                Found {searchResults.length} flashcard{searchResults.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {searchResults.length === 0 && !searchLoading ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg mb-2">No results found.</p>
              <p className="text-sm">Try different keywords or check your spelling.</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              {/* Main Search Flashcard Display */}
              {searchResults[searchCurrentIndex] && (
                <div className="mb-12 relative z-10">
                  <div className="max-w-2xl mx-auto mb-8">
                    <FlashcardComponent
                      data={searchResults[searchCurrentIndex]}
                      saved={isFlashcardSaved(searchResults[searchCurrentIndex].id)}
                      onSave={onSave}
                      onSwipe={handleSearchSwipe}
                      onFlip={flipSearchCard}
                      isFlipped={searchIsFlipped}
                    />
                  </div>
                  
                  {/* Navigation Controls */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Button
                      variant="outline"
                      onClick={prevSearchCard}
                      className="flex items-center gap-2"
                      title="Previous card (← key)"
                    >
                      <ArrowLeft className="h-4 w-4" /> Previous
                    </Button>
                    
                    <Button
                      variant="default"
                      onClick={flipSearchCard}
                      className="px-6 flex items-center gap-2"
                      title="Flip card (Spacebar)"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {searchIsFlipped ? "Show Front" : "Show Back"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={nextSearchCard}
                      className="flex items-center gap-2"
                      title="Next card (→ key)"
                    >
                      Next <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Card counter */}
                  <div className="text-center mb-8">
                    <p className="text-sm text-gray-600">
                      Card {searchCurrentIndex + 1} of {searchResults.length}
                    </p>
                  </div>
                </div>
              )}

              {/* Search Results Deck Navigation - Row of smaller cards */}
              <div className="relative z-0">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Search Results</h3>
                  <p className="text-sm text-gray-600">
                    Browse through {searchResults.length} matching flashcard{searchResults.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <FlashcardDeck
                  cards={searchResults}
                  savedCards={new Set(searchResults.filter(card => isFlashcardSaved(card.id)).map(card => card.id))}
                  displayMode="row"
                  onCardSelect={onSearchCardSelect}
                  onSave={onSave}
                  itemsPerRow={5}
                  currentIndex={searchCurrentIndex}
                />
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Today's Flashcards */}
      {!search && todays.length > 0 && (
        <div className="mb-16 px-6 sm:px-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Today&apos;s Flashcards</h2>
          </div>

          {/* Main Flashcard Display */}
          {todays[currentIndex] && (
            <div className="mb-12 relative z-10">
              <div className="max-w-2xl mx-auto mb-8">
                <FlashcardComponent
                  data={todays[currentIndex]}
                  saved={isFlashcardSaved(todays[currentIndex].id)}
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
                  Card {currentIndex + 1} of {todays.length}
                </p>
              </div>
            </div>
          )}

          {/* Today's Flashcards Deck Navigation - Row layout */}
          <div className="relative z-0">
            
            <FlashcardDeck
              cards={todays}
              savedCards={new Set(todays.filter(card => isFlashcardSaved(card.id)).map(card => card.id))}
              displayMode="row"
              onCardSelect={onCardSelect}
              onSave={onSave}
              itemsPerRow={5}
              currentIndex={currentIndex}
            />
          </div>
        </div>
      )}

      {/* Browse Flashcard Sets */}
      <div className="mb-6 px-6 sm:px-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Browse Flashcard Sets</h2>
          <Tabs value={tab} onValueChange={setTab} className="mr-0 sm:mr-12">
            <TabsList>
              <TabsTrigger value="all">
                All 
              </TabsTrigger>
              <TabsTrigger value="simple">
                Simple 
              </TabsTrigger>
              <TabsTrigger value="complex">
                Complex 
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* By Topic */}
      <div className="mb-10 px-6 sm:px-12">
        <h3 className="text-lg font-semibold mb-4">By Topic</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allTopics.length === 0 ? (
            <div className="text-center text-gray-500 py-8 w-full col-span-full">No topics available.</div>
          ) : (
            allTopics.map((topic) => (
              <Link key={topic.id} href={`/flashcards/topic/${topic.id}${tab !== "all" ? `?complexity=${tab}` : ""}`} className="block">
                <article className="cta-card group">
                  <div className="cta-card__image">
                    <img
                      src={topic.imageUrl}
                      alt={topic.title}
                      className="cta-card__img"
                    />
                  </div>
                  <div className="cta-card__content">
                    <h4 className="cta-card__title group-hover:text-blue-600 transition-colors duration-200">{topic.title}</h4>
                    <p className="cta-card__description">{topic.description}</p>
                    <div className="cta-card__footer">
                      <span className="cta-card__count">{topic.count} flashcards</span>
                      <span className="cta-card__button">
                        Start Learning
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* By Word Type */}
      <div className="mb-10 overflow-hidden px-6 sm:px-12">
        <h3 className="text-lg font-semibold mb-4">By Word Type</h3>
        <div className="relative group overflow-hidden w-full">
          {byType.length === 0 ? (
            <div className="text-center text-gray-500 py-8 w-full">No word type groups available.</div>
          ) : (
            <>
              <div 
                className="flex gap-6 overflow-x-auto scrollbar-hide py-2 px-2 word-type-scroll-container" 
                style={{scrollBehavior: 'smooth'}}
              >
                {byType.map((set) => (
                  <Link key={set.id} href={`/flashcards/topic/${set.id}${tab !== "all" ? `?complexity=${tab}` : ""}`} className="flex-shrink-0">
                    <article className="cta-card-horizontal group">
                      <div className="cta-card-horizontal__image">
                        <img
                          src={set.imageUrl}
                          alt={set.title}
                          className="cta-card-horizontal__img"
                        />
                      </div>
                      <div className="cta-card-horizontal__content">
                        <h4 className="cta-card-horizontal__title group-hover:text-blue-600 transition-colors duration-200">{set.title}</h4>
                        <p className="cta-card-horizontal__description">{set.description}</p>
                        <div className="cta-card-horizontal__footer">
                          <span className="cta-card-horizontal__count">{set.count} flashcards</span>
                          <span className="cta-card-horizontal__button">
                            Start Learning
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
              
              {/* Navigation buttons - only visible on hover */}
              <button 
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault();
                  const container = e.currentTarget.parentElement?.querySelector('.word-type-scroll-container') as HTMLElement;
                  if (container) {
                    container.scrollBy({ left: -300, behavior: 'smooth' });
                  }
                }}
                aria-label="Scroll left"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault();
                  const container = e.currentTarget.parentElement?.querySelector('.word-type-scroll-container') as HTMLElement;
                  if (container) {
                    container.scrollBy({ left: 300, behavior: 'smooth' });
                  }
                }}
                aria-label="Scroll right"
              >
                <ArrowRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Others */}
      <div className="mb-10 overflow-hidden px-6 sm:px-12">
        <h3 className="text-lg font-semibold mb-4">Others</h3>
        <div className="relative group overflow-hidden w-full">
          {othersData.length === 0 ? (
            <div className="text-center text-gray-500 py-8 w-full">No other groups available.</div>
          ) : (
            <>
              <div 
                className="flex gap-6 overflow-x-auto scrollbar-hide py-2 px-2 others-scroll-container" 
                style={{scrollBehavior: 'smooth'}}
              >
                {othersData.map((set) => (
                  <Link key={set.id} href={`/flashcards/topic/${set.id}${tab !== "all" ? `?complexity=${tab}` : ""}`} className="flex-shrink-0">
                    <article className="cta-card-horizontal group">
                      <div className="cta-card-horizontal__image">
                        <img
                          src={set.imageUrl}
                          alt={set.title}
                          className="cta-card-horizontal__img"
                        />
                      </div>
                      <div className="cta-card-horizontal__content">
                        <h4 className="cta-card-horizontal__title group-hover:text-blue-600 transition-colors duration-200">{set.title}</h4>
                        <p className="cta-card-horizontal__description">{set.description}</p>
                        <div className="cta-card-horizontal__footer">
                          <span className="cta-card-horizontal__count">{set.count} flashcards</span>
                          <span className="cta-card-horizontal__button">
                            Start Learning
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
              
              {/* Navigation buttons - only visible on hover */}
              <button 
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault();
                  const container = e.currentTarget.parentElement?.querySelector('.others-scroll-container') as HTMLElement;
                  if (container) {
                    container.scrollBy({ left: -300, behavior: 'smooth' });
                  }
                }}
                aria-label="Scroll left"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault();
                  const container = e.currentTarget.parentElement?.querySelector('.others-scroll-container') as HTMLElement;
                  if (container) {
                    container.scrollBy({ left: 300, behavior: 'smooth' });
                  }
                }}
                aria-label="Scroll right"
              >
                <ArrowRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </>
          )}
        </div>
      </div>

      </div>
    </PageWithLoading>
  )
}
