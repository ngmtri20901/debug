import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { ExerciseContainerShell } from "@/features/learn/components/exercises"
import type { Exercise } from "@/features/learn/types"
import { getExerciseBySlugs, canAccessExercise } from '@/features/learn/api/practice'

export const revalidate = 1

export default async function ExercisePage(
  props: { params: Promise<{ topicSlug: string; lessonSlug: string }> }
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle potential errors here
          }
        },
      },
    }
  )
  const { data: { session } } = await supabase.auth.getSession()

  const { topicSlug, lessonSlug } = await props.params
  const exercise: Exercise | null = await getExerciseBySlugs(topicSlug, lessonSlug)

  if (!exercise) {
    // Debug fallback instead of 404
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Exercise Debug Mode</h1>
        <p className="text-sm text-muted-foreground">Không tìm thấy dữ liệu exercise nhưng tạm thời không chuyển sang 404 để debug.</p>
        <div className="rounded bg-muted p-4 text-sm whitespace-pre-wrap">
          {`Slugs:\n  topicSlug: ${topicSlug}\n  lessonSlug: ${lessonSlug}`}
        </div>
        <p className="text-sm font-medium">Gợi ý kiểm tra:</p>
        <ul className="list-disc pl-6 text-sm space-y-1">
          <li>Lesson status phải = published</li>
          <li>practice_sets có lesson_id đúng, is_active = true, status = ACTIVE</li>
          <li>Có ít nhất 1 record trong practice_set_questions</li>
        </ul>
        <p className="text-xs text-muted-foreground">Xem console server để thấy log từ getLessonIdsBySlugs / getActivePracticeSet / getQuestionsForSet.</p>
      </div>
    )
  }

  // Check if user can access this exercise page
  // Allows access if: first time (no sessions) OR has in-progress session
  // Blocks access if: only has completed sessions (prevents back button to finished exercise)
  if (session?.user?.id) {
    const canAccess = await canAccessExercise(exercise.id, session.user.id)
    if (!canAccess) {
      console.log('[ExercisePage] Access denied - exercise already completed, redirecting to lesson page')
      redirect(`/learn/${topicSlug}/${lessonSlug}`)
    }
  } else {
    // No user session, redirect to lesson page
    redirect(`/learn/${topicSlug}/${lessonSlug}`)
  }

  return <ExerciseContainerShell exercise={exercise} topicSlug={topicSlug} lessonSlug={lessonSlug} />
}
