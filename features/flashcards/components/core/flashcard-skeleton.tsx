import { Skeleton } from "@/shared/components/ui/skeleton"
import { Card, CardContent } from "@/shared/components/ui/card"

interface FlashcardSkeletonProps {
  count?: number
  displayMode?: "grid" | "row"
}

export function FlashcardSkeleton({ count = 3, displayMode = "grid" }: FlashcardSkeletonProps) {
  if (displayMode === "row") {
    return (
      <div className="flex gap-4 pb-4">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="flex-shrink-0"
            style={{ width: '260px' }}
          >
            <Card className="p-4 h-full bg-white">
              <CardContent className="p-0">
                {/* Image skeleton */}
                <Skeleton className="w-full h-32 mb-3 rounded-lg" />
                
                {/* Title skeleton */}
                <Skeleton className="h-4 w-3/4 mb-1" />
                
                {/* Subtitle skeleton */}
                <Skeleton className="h-3 w-1/2 mb-2" />
                
                {/* Badge skeleton */}
                <Skeleton className="h-5 w-16 rounded-full" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    )
  }

  // Grid layout skeleton
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="p-3 bg-white">
          <CardContent className="p-0">
            {/* Header with badge and action */}
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>

            {/* Image and content */}
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-8 h-8 rounded border" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function FlashcardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="p-4 bg-white">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              {/* Image skeleton */}
              <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />

              {/* Content skeleton */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                    
                    <Skeleton className="h-4 w-48 mb-2" />

                    <div className="flex items-center gap-2 flex-wrap">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                  </div>

                  {/* Actions skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm mr-2">
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>

                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 