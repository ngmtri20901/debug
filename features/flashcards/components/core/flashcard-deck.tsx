"use client"

import { Card } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { useState, useRef, useEffect, useCallback } from "react"
import { FlashcardSkeleton } from "./flashcard-skeleton"
import type { FlashcardData } from "@/features/flashcards/services/flashcardService"

interface FlashcardDeckProps {
  cards: FlashcardData[]
  currentIndex?: number // Có thể không cần thiết cho chế độ row, hoặc dùng để highlight card hiện tại nếu có
  savedCards: Set<string>
  onCardSelect: (indexOrId: string | number) => void // Có thể truyền ID hoặc index
  onSave: (id: string) => void
  displayMode?: "grid" | "row" // Prop mới để xác định chế độ hiển thị
  title?: string // Tùy chọn tiêu đề cho section (legacy, now handled externally)
  subtitle?: string // Tùy chọn phụ đề (legacy, now handled externally)
  itemsPerRow?: number // Số item mỗi hàng cho chế độ row
  // New props for infinite scroll
  hasMore?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
  total?: number
}

export function FlashcardDeck({
  cards,
  currentIndex,
  savedCards,
  onCardSelect,
  onSave,
  displayMode = "grid", // Mặc định là grid
  title, // Legacy prop, now handled externally
  subtitle, // Legacy prop, now handled externally  
  itemsPerRow = 5, // Mặc định 5 items mỗi hàng cho chế độ row
  // New props for infinite scroll
  hasMore = false,
  isLoading = false,
  onLoadMore,
  total,
}: FlashcardDeckProps) {
  
  // State for horizontal scrolling
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 })
  const [momentum, setMomentum] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Infinite scroll logic
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !onLoadMore || isLoading || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    if (scrollHeight - scrollTop <= clientHeight * 1.5) { // Trigger when 1.5 screen heights from bottom
      onLoadMore()
    }
  }, [onLoadMore, isLoading, hasMore])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || displayMode !== "grid") return

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [handleScroll, displayMode])

  // Handle mouse drag for horizontal scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (displayMode === "row" && scrollContainerRef.current) {
      setIsDragging(true)
      setDragStart({
        x: e.pageX,
        scrollLeft: scrollContainerRef.current.scrollLeft
      })
      setMomentum(0)
      // Add global mouse move and up listeners
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }
  }

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!isDragging || displayMode !== "row" || !scrollContainerRef.current) return
    e.preventDefault()
    
    const x = e.pageX
    const walk = (x - dragStart.x) * 1.5 // Slightly reduced scroll speed for better control
    scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - walk
    setMomentum(walk)
  }

  const handleGlobalMouseUp = () => {
    if (isDragging && displayMode === "row" && scrollContainerRef.current) {
      setIsDragging(false)
      
      // Add momentum scrolling with improved physics
      if (Math.abs(momentum) > 3) {
        let currentMomentum = momentum
        const momentumInterval = setInterval(() => {
          if (scrollContainerRef.current && Math.abs(currentMomentum) > 0.5) {
            scrollContainerRef.current.scrollLeft -= currentMomentum * 0.9
            currentMomentum *= 0.9
          } else {
            clearInterval(momentumInterval)
          }
        }, 16)
      }
      
      // Remove global listeners
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }

  // Handle mouse move (for internal use)
  const handleMouseMove = (e: React.MouseEvent) => {
    // This is handled by global listener now
  }

  const handleMouseUp = () => {
    // This is handled by global listener now
  }

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (displayMode === "row" && scrollContainerRef.current) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].pageX,
        scrollLeft: scrollContainerRef.current.scrollLeft
      })
      setMomentum(0)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || displayMode !== "row" || !scrollContainerRef.current) return
    
    const x = e.touches[0].pageX
    const walk = (x - dragStart.x) * 1.5
    scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - walk
    setMomentum(walk)
  }

  const handleTouchEnd = () => {
    if (isDragging && displayMode === "row" && scrollContainerRef.current) {
      setIsDragging(false)
      
      // Add momentum scrolling for touch
      if (Math.abs(momentum) > 3) {
        let currentMomentum = momentum
        const momentumInterval = setInterval(() => {
          if (scrollContainerRef.current && Math.abs(currentMomentum) > 0.5) {
            scrollContainerRef.current.scrollLeft -= currentMomentum * 0.9
            currentMomentum *= 0.9
          } else {
            clearInterval(momentumInterval)
          }
        }, 16)
      }
    }
  }

  // Handle card click
  const handleCardClick = (card: FlashcardData) => {
    if (isDragging) return // Prevent selection during drag
    
    const cardIndex = cards.findIndex(c => c.id === card.id)
    if (cardIndex !== -1) {
      onCardSelect(cardIndex)
    }
  }

  // Scroll navigation buttons
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  // Auto-scroll to keep current card visible
  useEffect(() => {
    if (displayMode === "row" && currentIndex !== undefined && scrollContainerRef.current) {
      const cardWidth = 280 // Approximate card width + gap
      const containerWidth = scrollContainerRef.current.clientWidth
      const targetScrollLeft = (cardWidth * currentIndex) - (containerWidth / 2) + (cardWidth / 2)
      
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth'
      })
    }
  }, [currentIndex, displayMode])

  // Cleanup global listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [])

  // --- RENDER CHO CHẾ ĐỘ GRID (HIỆN TẠI) ---
  if (displayMode === "grid") {
    return (
      <div className="w-full max-w-4xl mx-auto mt-12 pt-8 border-t border-gray-200">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          {total && (
            <p className="text-sm text-gray-500">
              Showing {cards.length} of {total} flashcards
            </p>
          )}
        </div>

        <div 
          ref={scrollContainerRef}
          className="max-h-80 overflow-y-auto bg-gray-50 p-4 rounded-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => (
              <Card
                key={card.id}
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                  currentIndex !== undefined && index === currentIndex % cards.length
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-white bg-white"
                }`}
                onClick={() => onCardSelect(index)} // Giả sử onCardSelect nhận index cho grid
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {Array.isArray(card.type) ? card.type.join(", ") : card.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSave(card.id)
                    }}
                    className="p-1 h-auto"
                    aria-label={savedCards.has(card.id) ? "Bỏ lưu thẻ" : "Lưu thẻ"}
                  >
                    {savedCards.has(card.id) ? (
                      <BookmarkCheck className="h-3 w-3 text-blue-600" />
                    ) : (
                      <Bookmark className="h-3 w-3 text-gray-400" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={card.image_url || `https://placehold.co/40x40/E2E8F0/4A5568?text=${encodeURIComponent(card.vietnamese[0])}`}
                    alt={card.vietnamese}
                    className="w-8 h-8 object-cover rounded border"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = `https://placehold.co/40x40/E2E8F0/4A5568?text=${encodeURIComponent(card.vietnamese[0])}`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{card.vietnamese}</p>
                    <p className="text-xs text-gray-600 truncate">{card.common_meaning}</p>
                  </div>
                </div>
              </Card>
            ))}

            {/* Show loading skeleton when loading more data */}
            {isLoading && (
              <FlashcardSkeleton count={8} displayMode="grid" />
            )}
          </div>

          {/* Load more button (fallback for when infinite scroll doesn't work) */}
          {!isLoading && hasMore && onLoadMore && (
            <div className="flex justify-center mt-6">
              <Button 
                onClick={onLoadMore}
                variant="outline"
                className="px-6"
              >
                Load More Flashcards
              </Button>
            </div>
          )}

          {/* End of data message */}
          {!hasMore && cards.length > 0 && (
            <div className="text-center mt-6 text-gray-500 text-sm">
              You've reached the end of the flashcards
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- RENDER CHO CHẾ ĐỘ ROW (TODAY'S FLASHCARDS) - HORIZONTAL SCROLLING ---
  if (displayMode === "row") {
    return (
      <>
        {/* Global CSS for scrollbar hiding */}
        <style jsx global>{`
          .flashcard-scroll-container {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .flashcard-scroll-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div ref={containerRef} className="w-full mx-auto relative group select-none">
          {/* Navigation Container */}
          <div className="relative">
            {/* Left Navigation Button - Carousel style */}
            <Button
              variant="outline"
              size="icon"
              onClick={scrollLeft}
              className="absolute -left-12 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8 rounded-full"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Right Navigation Button - Carousel style */}
            <Button
              variant="outline"
              size="icon"
              onClick={scrollRight}
              className="absolute -right-12 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8 rounded-full"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Horizontal Scrolling Container */}
            <div
              ref={scrollContainerRef}
              className="flashcard-scroll-container overflow-x-auto px-4 py-2"
              style={{ 
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Cards Container - Horizontal Layout */}
              <div className="flex gap-4 pb-4">
                {cards.map((card, index) => {
                  const isActive = currentIndex !== undefined && index === currentIndex
                  
                  return (
                    <div
                      key={card.id}
                      className={`flex-shrink-0 transition-all duration-300 ${
                        isActive ? 'scale-105' : 'hover:scale-[1.02]'
                      }`}
                      style={{ width: '260px' }}
                    >
                      <Card
                        className={`p-4 cursor-pointer transition-all duration-300 hover:shadow-xl rounded-xl flex flex-col justify-between bg-white h-full ${
                          isActive 
                            ? 'ring-4 ring-blue-500 ring-offset-2 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50' 
                            : 'hover:shadow-lg border-2 border-transparent hover:border-blue-200 hover:bg-blue-50/30'
                        }`}
                        onClick={() => handleCardClick(card)}
                      >
                        <div>
                          <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden border-2 border-gray-100">
                            <img
                              src={card.image_url || `https://placehold.co/300x200/E2E8F0/4A5568?text=${encodeURIComponent(card.vietnamese)}`}
                              alt={card.vietnamese}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = `https://placehold.co/300x200/E2E8F0/4A5568?text=${encodeURIComponent(card.vietnamese)}`;
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSave(card.id);
                              }}
                              className="absolute top-2 right-2 p-1.5 h-auto bg-white/80 hover:bg-white rounded-full backdrop-blur-sm shadow-sm"
                              aria-label={savedCards.has(card.id) ? "Bỏ lưu thẻ" : "Lưu thẻ"}
                            >
                              {savedCards.has(card.id) ? (
                                <BookmarkCheck className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Bookmark className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                          </div>

                          <h4 className={`font-semibold text-sm mb-1 truncate transition-colors ${
                            isActive ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {card.vietnamese}
                          </h4>
                          <p className={`text-xs mb-2 truncate transition-colors ${
                            isActive ? 'text-blue-700' : 'text-gray-600'
                          }`}>
                            {card.common_meaning}
                          </p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs self-start transition-all duration-300 ${
                            isActive 
                              ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {Array.isArray(card.type) ? card.type.join(", ") : card.type}
                        </Badge>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Scroll Progress Indicator */}
            <div className="flex justify-center mt-4">
              <div className="h-1.5 w-32 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(100, (currentIndex !== undefined ? (currentIndex + 1) / cards.length : 0) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null; // Trường hợp không có displayMode hợp lệ
}
