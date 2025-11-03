'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'

interface FlashcardPreviewProps {
  vietnamese: string
  english: string
  pronunciation?: string
  wordType?: string
  topic?: string
  imagePreview?: string
  isFlipped?: boolean
  onFlip?: () => void
}

export function FlashcardPreviewClient({
  vietnamese,
  english,
  pronunciation,
  wordType,
  topic,
  imagePreview,
  isFlipped = false,
  onFlip
}: FlashcardPreviewProps) {
  return (
    <div className="relative" style={{ perspective: '1000px' }}>
      <motion.div
        style={{ 
          width: '100%', 
          height: '320px',
          position: 'relative',
          transformStyle: 'preserve-3d'
        }}
        transition={{ duration: 0.6 }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
      >
        {/* Front Side - Vietnamese */}
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
            className="h-full cursor-pointer transition-all duration-300 hover:shadow-lg"
            onClick={onFlip}
          >
            <CardContent className="h-full flex flex-col justify-center items-center p-8 text-center">
              <div className="space-y-4 w-full">
                {imagePreview && (
                  <div className="w-20 h-20 mx-auto mb-4 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Flashcard visual"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="text-3xl font-bold text-foreground">
                  {vietnamese || "Vietnamese text will appear here"}
                </div>
                {pronunciation && (
                  <div className="text-lg text-muted-foreground font-mono">{pronunciation}</div>
                )}
                <div className="flex justify-center gap-2 flex-wrap">
                  {wordType && (
                    <Badge variant="secondary" className="capitalize">
                      {wordType}
                    </Badge>
                  )}
                  {topic && (
                    <Badge variant="outline" className="capitalize">
                      {topic.replace("-", " ")}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back Side */}
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
            className="h-full cursor-pointer transition-all duration-300 hover:shadow-lg"
            onClick={onFlip}
          >
            <CardContent className="h-full flex flex-col justify-center items-center p-8 text-center">
              <div className="space-y-4 w-full">
                <div className="text-3xl font-bold text-foreground">
                  {english || "Your translation will appear here"}
                </div>
                {vietnamese && (
                  <div className="text-lg text-muted-foreground">{vietnamese}</div>
                )}
                <div className="flex justify-center gap-2 flex-wrap">
                  {wordType && (
                    <Badge variant="secondary" className="capitalize">
                      {wordType}
                    </Badge>
                  )}
                  {topic && (
                    <Badge variant="outline" className="capitalize">
                      {topic.replace("-", " ")}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Flip Indicator */}
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {isFlipped ? "Back" : "Front"} • Click to flip
      </div>
    </div>
  )
}
