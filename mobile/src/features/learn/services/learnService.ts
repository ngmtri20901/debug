/**
 * Learn API service layer for zones, topics, and lessons
 * Uses Supabase for data fetching
 */

import { supabase } from '@/lib/supabase/client'
import type {
  Zone,
  Topic,
  Lesson,
  Material,
  ZoneRow,
  TopicRow,
  LessonRow,
  MaterialRow,
  ZoneWithTopicsResponse,
  TopicWithLessonsResponse,
  LessonWithMaterialsResponse,
} from '../types'

/**
 * Get all zones with their topics
 */
export async function getAllZones(): Promise<Zone[]> {
  try {
    const { data, error } = await supabase
      .from('zones')
      .select(
        `
        id,
        name,
        level,
        description,
        topics:topics(
          topic_id,
          title,
          slug,
          zone_id,
          description,
          image_url,
          sort_order
        )
      `
      )
      .order('level', { ascending: true })

    if (error) {
      console.error('[getAllZones] Supabase error:', error)
      throw error
    }

    if (!data) return []

    // Transform database rows to Zone objects
    return data.map((zone: any) => ({
      id: zone.name.toLowerCase().replace(/\s+/g, '-') as any, // e.g., "beginner"
      title: zone.name,
      description: zone.description || '',
      level: zone.level,
      topics: (zone.topics || []).map((topic: any) => transformTopic(topic)),
    }))
  } catch (error) {
    console.error('[getAllZones] Error:', error)
    return []
  }
}

/**
 * Get single zone by ID with topics
 */
export async function getZoneById(zoneId: number | string): Promise<Zone | null> {
  try {
    const { data, error } = await supabase
      .from('zones')
      .select(
        `
        id,
        name,
        level,
        description,
        topics:topics(
          topic_id,
          title,
          slug,
          zone_id,
          description,
          image_url,
          sort_order
        )
      `
      )
      .eq(typeof zoneId === 'number' ? 'id' : 'name', zoneId)
      .single()

    if (error || !data) {
      console.error('[getZoneById] Supabase error:', error)
      return null
    }

    return {
      id: data.name.toLowerCase().replace(/\s+/g, '-') as any,
      title: data.name,
      description: data.description || '',
      level: data.level,
      topics: (data.topics || []).map((topic: any) => transformTopic(topic)),
    }
  } catch (error) {
    console.error('[getZoneById] Error:', error)
    return null
  }
}

/**
 * Get topics by zone ID
 */
export async function getTopicsByZone(zoneId: number): Promise<Topic[]> {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('topic_id, title, slug, zone_id, description, image_url, sort_order')
      .eq('zone_id', zoneId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[getTopicsByZone] Supabase error:', error)
      throw error
    }

    if (!data) return []

    return data.map((topic: any) => transformTopic(topic))
  } catch (error) {
    console.error('[getTopicsByZone] Error:', error)
    return []
  }
}

/**
 * Get topic by slug with lessons
 */
export async function getTopicBySlug(
  topicSlug: string
): Promise<{ topic: Topic; lessons: Lesson[]; zoneLevel: number } | null> {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select(
        `
        topic_id,
        title,
        slug,
        zone_id,
        description,
        image_url,
        sort_order,
        zones!inner(level),
        lessons:lessons(
          id,
          title,
          slug,
          topic_id,
          content,
          sort_order,
          status,
          description,
          estimated_duration
        )
      `
      )
      .eq('slug', topicSlug)
      .eq('lessons.status', 'published')
      .single()

    if (error || !data) {
      console.error('[getTopicBySlug] Supabase error:', error)
      return null
    }

    const topic = transformTopic(data)
    const lessons = (data.lessons || [])
      .map((lesson: any) => transformLesson(lesson))
      .sort((a: any, b: any) => a.order - b.order)
    const zoneLevel = (data.zones as any)?.level || 1

    return { topic, lessons, zoneLevel }
  } catch (error) {
    console.error('[getTopicBySlug] Error:', error)
    return null
  }
}

/**
 * Get lessons by topic slug
 */
export async function getLessonsByTopicSlug(topicSlug: string): Promise<Lesson[]> {
  try {
    // First get topic ID from slug
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select('topic_id')
      .eq('slug', topicSlug)
      .single()

    if (topicError || !topicData) {
      console.error('[getLessonsByTopicSlug] Topic not found:', topicError)
      return []
    }

    // Get lessons for this topic
    const { data, error } = await supabase
      .from('lessons')
      .select('id, title, slug, topic_id, content, sort_order, status, description, estimated_duration')
      .eq('topic_id', topicData.topic_id)
      .eq('status', 'published')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[getLessonsByTopicSlug] Supabase error:', error)
      throw error
    }

    if (!data) return []

    return data.map((lesson: any) => transformLesson(lesson))
  } catch (error) {
    console.error('[getLessonsByTopicSlug] Error:', error)
    return []
  }
}

/**
 * Get lesson by slugs (topic + lesson) with materials
 */
export async function getLessonBySlugs(
  topicSlug: string,
  lessonSlug: string
): Promise<{
  lesson: Lesson
  materials: Material[]
  topic: { title: string; slug: string }
  zoneLevel: number
} | null> {
  try {
    // First get topic
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select('topic_id, title, slug, zone_id, zones!inner(level)')
      .eq('slug', topicSlug)
      .single()

    if (topicError || !topicData) {
      console.error('[getLessonBySlugs] Topic not found:', topicError)
      return null
    }

    // Get lesson
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select(
        `
        id,
        title,
        slug,
        topic_id,
        content,
        sort_order,
        status,
        description,
        estimated_duration,
        materials:materials(
          id,
          material_type,
          content,
          sort_order
        )
      `
      )
      .eq('topic_id', topicData.topic_id)
      .eq('slug', lessonSlug)
      .eq('status', 'published')
      .single()

    if (lessonError || !lessonData) {
      console.error('[getLessonBySlugs] Lesson not found:', lessonError)
      return null
    }

    const lesson = transformLesson(lessonData)
    const materials = (lessonData.materials || [])
      .map((material: any) => transformMaterial(material))
      .sort((a: any, b: any) => a.order_index - b.order_index)
    const topic = {
      title: topicData.title,
      slug: topicData.slug,
    }
    const zoneLevel = (topicData.zones as any)?.level || 1

    return { lesson, materials, topic, zoneLevel }
  } catch (error) {
    console.error('[getLessonBySlugs] Error:', error)
    return null
  }
}

/**
 * Get lesson materials
 */
export async function getLessonMaterials(lessonId: number): Promise<Material[]> {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('id, lesson_id, material_type, content, sort_order')
      .eq('lesson_id', lessonId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[getLessonMaterials] Supabase error:', error)
      throw error
    }

    if (!data) return []

    return data.map((material: any) => transformMaterial(material))
  } catch (error) {
    console.error('[getLessonMaterials] Error:', error)
    return []
  }
}

// Helper transform functions
function transformTopic(topicRow: any): Topic {
  return {
    id: topicRow.topic_id?.toString() || topicRow.id?.toString(),
    title: topicRow.title,
    slug: topicRow.slug,
    zone: 'beginner' as any, // Will be populated from zone data
    description: topicRow.description || undefined,
    image: topicRow.image_url || undefined,
    chapters: [], // Not used in current structure
    lessonCount: 0, // Can be calculated separately
    zone_id: topicRow.zone_id,
  }
}

function transformLesson(lessonRow: any): Lesson {
  return {
    id: lessonRow.id?.toString(),
    title: lessonRow.title,
    slug: lessonRow.slug || undefined,
    order: lessonRow.sort_order || 0,
    content: lessonRow.content || undefined,
    topic_id: lessonRow.topic_id?.toString(),
    status: lessonRow.status || 'published',
    description: lessonRow.description || undefined,
    estimated_duration: lessonRow.estimated_duration || undefined,
  }
}

function transformMaterial(materialRow: any): Material {
  // Parse content if it's a string
  let parsedContent = materialRow.content
  if (typeof parsedContent === 'string') {
    try {
      parsedContent = JSON.parse(parsedContent)
    } catch {
      // Keep as string if parsing fails
    }
  }

  return {
    id: materialRow.id?.toString(),
    side: 'main', // Default, can be determined from data
    type: materialRow.material_type,
    title: parsedContent?.title || null,
    explanation: parsedContent?.explanation || null,
    data: parsedContent || {},
    media_url: parsedContent?.media_url || null,
    order_index: materialRow.sort_order || 0,
  }
}
