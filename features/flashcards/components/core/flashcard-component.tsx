"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion"
import { FlashcardFront } from "./flashcard-front"
import { FlashcardBack } from "./flashcard-back"
import type { FlashcardData } from "@/features/flashcards/services/flashcardService"
import { useDisplaySettings } from "@/features/settings/hooks/use-display-settings"
import { audioManager, playFlipSound } from "@/shared/utils/audio"

interface FlashcardComponentProps {
  data: FlashcardData
  saved: boolean
  onSave: (id: string) => void
  onSwipe?: (direction: 'left' | 'right') => void
  onFlip?: () => void
  isFlipped?: boolean
  animationDuration?: number // Animation duration in milliseconds
}

interface CardProps {
  data: FlashcardData
  saved: boolean
  onSave: (id: string) => void
  onFlip?: () => void
  isFlipped?: boolean
  frontCard: boolean
  index?: number
  setIndex?: (index: number) => void
  drag?: boolean | "x" | "y"
  animationDuration?: number
}

function Card({ 
  data, 
  saved, 
  onSave, 
  onFlip, 
  isFlipped, 
  frontCard, 
  index, 
  setIndex, 
  drag,
  animationDuration = 500 
}: CardProps) {
  const [exitX, setExitX] = useState(0)

  const x = useMotionValue(0)
  const scale = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5])
  const rotate = useTransform(x, [-150, 0, 150], [-45, 0, 45], {
    clamp: false
  })

  // Convert milliseconds to seconds for CSS transitions
  const transitionDuration = animationDuration / 1000

  const variantsFrontCard = {
    animate: { scale: 1, y: 0, opacity: 1 },
    exit: (custom: number) => ({
      x: custom,
      opacity: 0,
      scale: 0.5,
      transition: { duration: 0.2 }
    })
  }

  const variantsBackCard = {
    initial: { scale: 0, y: 105, opacity: 0 },
    animate: { scale: 0.75, y: 30, opacity: 0.5 }
  }

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -100) {
      setExitX(-250)
      if (setIndex && typeof index === "number") {
        setIndex(index + 1)
      }
    }
    if (info.offset.x > 100) {
      setExitX(250)
      if (setIndex && typeof index === "number") {
        setIndex(index - 1)
      }
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Only flip if not dragging and if the click target is not a button
    const target = e.target as HTMLElement
    if (target.closest('button')) {
      // Don't flip if clicking on a button
      return
    }
    
    if (Math.abs(x.get()) < 5 && onFlip) {
      e.preventDefault()
      // Play flip sound when manually flipping card
      playFlipSound()
      onFlip()
    }
  }

  return (
    <motion.div
      style={{
        width: "100%",
        height: 400,
        position: "absolute",
        top: 0,
        x,
        rotate,
        cursor: "grab",
        pointerEvents: 'auto'
      }}
      whileTap={{ cursor: "grabbing" }}
      drag={drag}
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      onDragEnd={handleDragEnd}
      variants={frontCard ? variantsFrontCard : variantsBackCard}
      initial="initial"
      animate="animate"
      exit="exit"
      custom={exitX}
      transition={
        frontCard
          ? { type: "spring", stiffness: 300, damping: 20 }
          : { scale: { duration: 0.2 }, opacity: { duration: 0.4 } }
      }
      onClick={handleCardClick}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          scale,
          perspective: "1000px"
        }}
      >
        <div
          className={`relative w-full h-full transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: `transform ${transitionDuration}s ease-in-out`,
          }}
        >
          {/* Front side */}
          <div
            className={`w-full h-full backface-hidden ${
              isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transition: `opacity ${transitionDuration}s ease-in-out`,
            }}
          >
            <FlashcardFront data={data} saved={saved} onSave={onSave} />
          </div>

          {/* Back side */}
          <div
            className={`absolute inset-0 w-full h-full backface-hidden ${
              isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              transition: `opacity ${transitionDuration}s ease-in-out`,
            }}
          >
            <FlashcardBack data={data} saved={saved} onSave={onSave} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function FlashcardComponent({ 
  data, 
  saved, 
  onSave, 
  onSwipe, 
  onFlip,
  isFlipped = false,
  animationDuration = 500
}: FlashcardComponentProps) {
  const [cardIndex, setCardIndex] = useState(0)
  const { settings } = useDisplaySettings()

  // Update audio manager with current settings
  useEffect(() => {
    if (settings) {
      audioManager.updateSettings(settings)
    }
  }, [settings])

  const handleIndexChange = (newIndex: number) => {
    const currentIndex = cardIndex
    if (newIndex > currentIndex && onSwipe) {
      onSwipe('left') // Swiped left = next card
    } else if (newIndex < currentIndex && onSwipe) {
      onSwipe('right') // Swiped right = previous card
    }
    setCardIndex(newIndex)
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <motion.div 
        style={{ 
          width: "100%", 
          height: 400, 
          position: "relative",
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          pointerEvents: 'auto'
        }}
      >
        <AnimatePresence initial={false}>
          {/* Background card */}
          <Card
            key={cardIndex + 1}
            data={data}
            saved={saved}
            onSave={onSave}
            onFlip={onFlip}
            isFlipped={isFlipped}
            frontCard={false}
            animationDuration={animationDuration}
          />
          {/* Front card */}
          <Card
            key={cardIndex}
            data={data}
            saved={saved}
            onSave={onSave}
            onFlip={onFlip}
            isFlipped={isFlipped}
            frontCard={true}
            index={cardIndex}
            setIndex={handleIndexChange}
            drag="x"
            animationDuration={animationDuration}
          />
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
