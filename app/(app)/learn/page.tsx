export const revalidate = 2592000 // ISR: 30 days (30 * 24 * 60 * 60)

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { UserProgressProvider } from "@/contexts/UserProgressContext"
import UserCoins from "@/components/exercises/UserCoins"
import ZoneSection from "@/components/exercises/ZoneSection"
import { Button } from "@/components/ui/button"
import type { Zone, Topic } from "@/types/exercises"

// Map numeric zone_id from DB to app Zone ids
const zoneIdToKey: Record<number, Zone["id"]> = {
  1: "beginner",
  2: "elementary",
  3: "intermediate",
  4: "upper-intermediate",
  5: "advanced",
  6: "expert",
}

// Base zones skeleton with existing UI text
const baseZones: Zone[] = [
  {
    id: "beginner",
    title: "Beginner Zone",
    description:
      "Get comfortable with the Vietnamese alphabet and sounds, learn essential everyday words, and confidently introduce yourself and greet people.",
    topics: [],
  },
  {
    id: "elementary",
    title: "Elementary Zone",
    description:
      "Grow your vocabulary and grammar skills so you can chat about daily life and describe things simply in Vietnamese.",
    topics: [],
  },
  {
    id: "intermediate",
    title: "Intermediate Zone",
    description:
      "Build more complex conversation skills for work, travel, and social situations.",
    topics: [],
  },
  {
    id: "upper-intermediate",
    title: "Upper Intermediate Zone",
    description:
      "Master Vietnamese with nuanced expressions and cultural understanding.",
    topics: [],
  },
  {
    id: "advanced",
    title: "Advanced Zone",
    description:
      "Master advanced Vietnamese with nuanced expressions and cultural understanding.",
    topics: [],
  },
  {
    id: "expert",
    title: "Expert Zone",
    description:
      "Master advanced Vietnamese with nuanced expressions and cultural understanding.",
    topics: [],
  },
]

// DB row shape for topics
interface DbTopicRow {
  english_title: string | null
  topic_description: string | null
  is_review: boolean | null
  sort_order: number | null
  slug: string | null
  zone_id: number | null
  lessons?: Array<{
    id: number
    status: string
  }>
}

export default async function ExercisesPage() {
  const supabase = await createClient()

  const result = await (supabase as any)
    .from("topics")
    .select(`
      english_title, 
      topic_description, 
      is_review, 
      sort_order, 
      slug, 
      zone_id,
      lessons!inner(
        id,
        status
      )
    `)
    .eq("status", "published")
    .eq("lessons.status", "published")

  let rows: DbTopicRow[] = []
  if ("data" in (result as any)) {
    const { data, error } = result as { data: DbTopicRow[] | null; error: any }
    if (error) {
      console.error(error)
    }
    rows = Array.isArray(data) ? data : []
  } else {
    // Dummy client path: no data returned
    rows = []
  }

  // Sort locally to avoid using .order() on the client stub
  rows.sort((a, b) => {
    const za = a.zone_id ?? 0
    const zb = b.zone_id ?? 0
    if (za !== zb) return za - zb
    const sa = a.sort_order ?? 0
    const sb = b.sort_order ?? 0
    return sa - sb
  })

  // Clone base zones to avoid mutation
  const zones: Zone[] = baseZones.map((z) => ({ ...z, topics: [] }))

  for (const r of rows) {
    const zoneKey = r.zone_id ? zoneIdToKey[r.zone_id] ?? "beginner" : "beginner"

    const mappedTopic: Topic = {
      id: r.slug ?? r.english_title ?? Math.random().toString(36).slice(2),
      title: r.english_title ?? "Untitled Topic",
      slug: r.slug ?? undefined,
      zone: zoneKey,
      description: r.topic_description ?? undefined,
      image: (r.is_review || (r.slug && (r.slug.includes('review') || r.slug.includes('practice')))) 
        ? '/images/topic/review.webp' 
        : r.slug ? `/images/topic/${r.slug}.webp` : undefined,
      chapters: [],
      lessonCount: r.lessons?.length ?? 0,
    }

    const targetZone = zones.find((z) => z.id === zoneKey)
    if (targetZone) {
      targetZone.topics.push(mappedTopic)
    }
  }

  return (
    <UserProgressProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft size={16} />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[#067BC2]">Vietnamese Exercises</h1>
            <UserCoins />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Page Introduction */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Master Vietnamese Step by Step
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Progress through different learning zones, from beginner basics to advanced mastery. 
              Each topic contains carefully structured lessons to build your Vietnamese skills.
            </p>
          </div>

          {/* Zones */}
          {zones.map((zone) => (
            <ZoneSection key={zone.id} zone={zone} />
          ))}
        </main>
      </div>
    </UserProgressProvider>
  )
}
