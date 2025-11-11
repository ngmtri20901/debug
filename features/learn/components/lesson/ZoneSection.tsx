"use client"

import type { Zone } from "@/features/learn/types/exercises"
import TopicCard from "./TopicCard"

interface ZoneSectionProps {
  zone: Zone
}

const ZoneSection = ({ zone }: ZoneSectionProps) => {
  return (
    <section className="mb-12">
      {/* Zone Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {zone.title}
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed max-w-4xl">
          {zone.description}
        </p>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {zone.topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
          />
        ))}
      </div>
    </section>
  )
}

export default ZoneSection 