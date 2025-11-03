"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb"
import { STATIC_TOPICS, STATIC_WORD_TYPES, STATIC_OTHERS } from "@/features/flashcards/components/data/static-data"

// Map routes to breadcrumb labels
const routeLabels: Record<string, string> = {
  '/flashcards': 'Flashcards',
  '/flashcards/review': 'Review',
  '/flashcards/create': 'Create',
  '/flashcards/saved': 'Saved',
  '/flashcards/statistics': 'Statistics',
  '/learn': 'Learn',
  '/shop': 'Shop',
  '/ai/chat': 'AI Chatbot',
  '/ai/voice': 'AI Voice Chat',
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()

  // Get topic title from static data by ID
  const getTopicTitle = (topicId: string): string | null => {
    // Check topics
    const topic = STATIC_TOPICS.find(t => t.id === topicId)
    if (topic) return topic.title
    
    // Check word types
    const wordType = STATIC_WORD_TYPES.find(wt => wt.id === topicId)
    if (wordType) return wordType.title
    
    // Check special categories
    const special = STATIC_OTHERS.find(o => o.id === topicId)
    if (special) return special.title
    
    return null
  }

  // Build breadcrumb items from pathname
  const getBreadcrumbItems = () => {
    const segments = pathname.split('/').filter(Boolean)
    const items: Array<{ label: string; href: string; isLast: boolean; isClickable: boolean }> = []

    // Check if we're on a topic page and get the topic ID
    const isTopicPage = pathname.startsWith('/flashcards/topic/')
    const topicId = isTopicPage ? segments[segments.length - 1] : null
    const topicTitle = topicId ? getTopicTitle(topicId) : null

    // Build path segments
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1
      const isTopicSegment = index === segments.length - 2 && isTopicPage // The "topic" segment before the ID
      
      // Check if we have a label for this exact path
      let label = routeLabels[currentPath]
      
      // If no exact match, check parent path labels or format the segment
      if (!label) {
        // Special handling for dynamic routes like /flashcards/topic/[id]
        if (isLast && isTopicPage) {
          // Last segment: use the actual topic title, or format the segment if not found
          label = topicTitle || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
        } else if (isTopicSegment) {
          // Middle segment: "Topic" (will be non-clickable)
          label = 'Topic'
        } else if (currentPath.startsWith('/flashcards/topic/')) {
          label = 'Topic'
        } else if (currentPath.startsWith('/flashcards/')) {
          // For other flashcards routes, capitalize the segment
          label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
        } else {
          // Default: capitalize and format segment
          label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
        }
      }
      
      items.push({
        label,
        href: currentPath,
        isLast,
        isClickable: !isTopicSegment, // Make the middle "Topic" segment non-clickable
      })
    })

    return items
  }

  const breadcrumbItems = getBreadcrumbItems()

  // If no breadcrumb items, return null or default
  if (breadcrumbItems.length === 0) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem className={index === 0 && breadcrumbItems.length > 1 ? "hidden md:block" : ""}>
              {item.isLast || !item.isClickable ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

