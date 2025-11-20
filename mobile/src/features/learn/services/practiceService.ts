/**
 * Practice API service layer for exercises and submissions
 * Uses Supabase for data fetching and updates
 */

import { supabase, getCurrentUser } from '@/lib/supabase/client'
import type {
  Exercise,
  Question,
  BaseQuestion,
  MultipleChoiceQuestion,
  WordMatchingQuestion,
  SynonymMatchingQuestion,
  ChooseWordsQuestion,
  ErrorCorrectionQuestion,
  DialogueCompletionQuestion,
  RolePlayQuestion,
  GrammarStructureQuestion,
  Choice,
  WordPair,
  SynonymPair,
  MCQType,
  ChooseWordsType,
  SubmitExerciseParams,
  SubmitExerciseResponse,
  PracticeResultRow,
} from '../types'

/**
 * Get lesson and zone IDs from slugs
 */
async function getLessonIdsBySlugs(
  topicSlug: string,
  lessonSlug: string
): Promise<{ topic_id: number; lesson_id: number; zone_id: number; zone_level: number } | null> {
  try {
    // First get the topic with zone information
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select(
        `
        topic_id,
        zone_id,
        zones!inner (level)
      `
      )
      .eq('slug', topicSlug)
      .single()

    if (topicError || !topicData) {
      console.error('[getLessonIdsBySlugs] Topic not found:', topicError)
      return null
    }

    // Then get the lesson
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('id, slug, status')
      .eq('topic_id', topicData.topic_id)
      .eq('slug', lessonSlug)
      .eq('status', 'published')
      .maybeSingle()

    if (lessonError || !lessonData) {
      console.error('[getLessonIdsBySlugs] Lesson not found:', lessonError)
      return null
    }

    return {
      topic_id: topicData.topic_id,
      lesson_id: lessonData.id,
      zone_id: topicData.zone_id,
      zone_level: (topicData.zones as any).level,
    }
  } catch (error) {
    console.error('[getLessonIdsBySlugs] Error:', error)
    return null
  }
}

/**
 * Get active practice set for a lesson
 */
async function getActivePracticeSet(lesson_id: number): Promise<Partial<Exercise> | null> {
  try {
    const { data, error } = await supabase
      .from('practice_sets')
      .select('id, title, description, coin_reward, xp_reward, reward_coins, status, is_active, sequence_order')
      .eq('lesson_id', lesson_id)
      .eq('is_active', true)
      .eq('status', 'ACTIVE')
      .order('sequence_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      console.error('[getActivePracticeSet] No active practice set found:', error)
      return null
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      coinReward: data.coin_reward ?? data.reward_coins ?? 0,
      xpReward: data.xp_reward ?? 0,
    }
  } catch (error) {
    console.error('[getActivePracticeSet] Error:', error)
    return null
  }
}

/**
 * Get questions for a practice set
 */
async function getQuestionsForSet(
  practice_set_id: string,
  topicSlug?: string,
  lessonSlug?: string
): Promise<Question[]> {
  try {
    const { data: rows, error } = await supabase
      .from('practice_set_questions')
      .select(
        `
        sort_order,
        questions (
          id,
          question_type,
          question_subtype,
          question_data,
          correct_choice_id,
          metadata,
          image_url,
          audio_url
        )
      `
      )
      .eq('practice_set_id', practice_set_id)
      .order('sort_order', { ascending: true })

    if (error || !rows) {
      console.error('[getQuestionsForSet] Error:', error)
      return []
    }

    const questions: Question[] = rows
      .map((row: any): Question | null => {
        const q = row.questions
        if (!q) return null

        const base: BaseQuestion = {
          id: q.id.toString(),
          type: q.question_type as Question['type'],
        }

        // Parse question_data
        let parsedData: any = {}
        if (q.question_data) {
          try {
            parsedData = typeof q.question_data === 'string' ? JSON.parse(q.question_data) : q.question_data
          } catch {
            parsedData = {}
          }
        }

        // Parse metadata
        let extraData: any = {}
        if (q.metadata) {
          try {
            extraData = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata
          } catch {
            extraData = {}
          }
        }

        // Handle audio_url
        let audioUrl: string | undefined
        if (q.audio_url) {
          try {
            const audioData = typeof q.audio_url === 'string' ? JSON.parse(q.audio_url) : q.audio_url
            audioUrl = audioData?.url
          } catch {}
        }

        // Handle image_url
        let imageUrl: string | undefined
        let imageArray: Array<{ alt?: string; src?: string; role?: string }> = []
        if (q.image_url) {
          try {
            const raw = typeof q.image_url === 'string' ? JSON.parse(q.image_url) : q.image_url
            if (Array.isArray(raw)) {
              imageArray = raw
            } else if (raw && typeof raw === 'object') {
              if (raw.url) {
                imageUrl = raw.url as string
              } else if (raw.src && topicSlug && lessonSlug) {
                const path = `${topicSlug}/${lessonSlug}/images/${raw.src}`
                const { data } = supabase.storage.from('exercises').getPublicUrl(path)
                imageUrl = data.publicUrl || undefined
              }
            } else if (typeof raw === 'string') {
              imageUrl = raw
            }
          } catch {}
        }

        let question: Question | null = null

        switch (q.question_type) {
          case 'multiple-choice': {
            let mcqType: MCQType
            switch (q.question_subtype) {
              case 'mcq_text_only':
                mcqType = 'text-only'
                break
              case 'mcq_image_question':
                mcqType = 'image-question'
                break
              case 'mcq_image_choices':
                mcqType = 'image-choices'
                break
              case 'mcq_grammar_structure':
                mcqType = 'grammar-structure'
                break
              case 'mcq_word_translation':
                mcqType = 'word-translation'
                break
              default:
                mcqType = 'text-only'
            }

            let choices: Choice[] = []
            let correctChoiceId = q.correct_choice_id?.toString() || ''

            // Helper to resolve image URLs from storage
            const resolvePublicUrl = (src?: string): string | undefined => {
              if (!src) return undefined
              if (/^https?:\/\//i.test(src)) return src
              if (topicSlug && lessonSlug) {
                const path = `${topicSlug}/${lessonSlug}/images/${src}`
                const { data } = supabase.storage.from('exercises').getPublicUrl(path)
                return data.publicUrl || undefined
              }
              return undefined
            }

            // Build choices
            if (q.question_subtype === 'mcq_image_choices' && imageArray.length > 0) {
              choices = imageArray.map((img, index) => ({
                id: String(index + 1),
                text: img.alt || `Option ${index + 1}`,
                imageUrl: resolvePublicUrl(img.src),
              }))

              if (!correctChoiceId) {
                const mainIndex = imageArray.findIndex((it) => (it.role || '').toLowerCase() === 'main')
                correctChoiceId = String((mainIndex >= 0 ? mainIndex : 0) + 1)
              }
            } else if (q.question_subtype !== 'mcq_image_choices') {
              choices = parsedData.choices?.map((c: any) => ({
                id: c.id,
                text: c.text,
                imageUrl: c.imageUrl,
              })) || []
            }

            const mcq: MultipleChoiceQuestion = {
              ...base,
              type: 'multiple-choice',
              questionType: mcqType,
              choices,
              correctChoiceId,
              hint: extraData?.hint,
            }

            if (mcqType === 'text-only') {
              mcq.passage = parsedData.context || parsedData.passage
              mcq.questionText = parsedData.questionText
            } else if (mcqType === 'image-question') {
              mcq.questionText = parsedData.questionText
              if (!imageUrl && imageArray.length > 0) {
                const mainImg = imageArray.find((it) => (it.role || '').toLowerCase() === 'main') || imageArray[0]
                mcq.questionImage = resolvePublicUrl(mainImg?.src)
              } else {
                mcq.questionImage = imageUrl || parsedData.imageUrl
              }
            } else if (mcqType === 'image-choices') {
              mcq.targetWord = parsedData.targetWord
            } else if (mcqType === 'grammar-structure' || mcqType === 'word-translation') {
              mcq.questionText = parsedData.questionText
              mcq.targetWord = parsedData.targetWord
            }

            question = mcq
            break
          }

          case 'choose-words': {
            const questionData = parsedData.data || parsedData
            const uiData = parsedData.ui || extraData?.ui || {}

            const cw: ChooseWordsQuestion = {
              ...base,
              type: 'choose-words',
              question_data: {
                spec_version: 1,
                subtype: q.question_subtype as ChooseWordsType,
                data: questionData,
                ui: uiData,
              },
              audioUrl,
            }
            question = cw
            break
          }

          case 'error-correction': {
            const ec: ErrorCorrectionQuestion = {
              ...base,
              type: 'error-correction',
              question: parsedData.question || parsedData.instruction || 'Correct the sentence',
              faultySentence: parsedData.faultySentence || parsedData.faulty,
              target: parsedData.target || parsedData.correct,
              hint: parsedData.hint || extraData?.hint,
            }
            question = ec
            break
          }

          case 'synonyms-matching': {
            const pairs: SynonymPair[] =
              parsedData.pairs?.map((p: any, i: number) => ({
                id: i + 1,
                word1: p.left || p.word1,
                word2: p.right || p.word2,
                meaning: p.meaning,
              })) || []
            const sm: SynonymMatchingQuestion = {
              ...base,
              type: 'synonyms-matching',
              pairs,
            }
            question = sm
            break
          }

          case 'word-matching': {
            const pairs: WordPair[] =
              parsedData.pairs?.map((p: any, i: number) => ({
                id: i + 1,
                english: p.left || p.word1,
                vietnamese: p.right || p.word2,
              })) || []
            const wm: WordMatchingQuestion = {
              ...base,
              type: 'word-matching',
              pairs,
            }
            question = wm
            break
          }

          case 'dialogue-completion': {
            const context =
              parsedData.dialogue?.map((line: any) => ({
                who: line.who as 'A' | 'B',
                text: line.text,
              })) ||
              parsedData.context ||
              []

            const dc: DialogueCompletionQuestion = {
              ...base,
              type: 'dialogue-completion',
              context,
              choices:
                parsedData.choices?.map((c: any) => ({
                  id: c.id,
                  text: c.text,
                })) || [],
              correctChoiceId: q.correct_choice_id?.toString() || '',
              explanation: parsedData.explanation,
            }
            question = dc
            break
          }

          case 'role-play': {
            const rp: RolePlayQuestion = {
              ...base,
              type: 'role-play',
              title: parsedData.context || '',
              steps:
                parsedData.steps?.map((s: any) => ({
                  bot: s.bot || s.prompt,
                  choices: s.choices?.map((o: any) => ({ text: o.text })) || s.options?.map((o: any) => ({ text: o.text })) || [],
                  expected: s.expected || s.correctIndex || 0,
                  tips: s.tips || s.hint,
                })) || [],
            }
            question = rp
            break
          }

          case 'grammar-structure': {
            const gs: GrammarStructureQuestion = {
              ...base,
              type: 'grammar-structure',
              question: parsedData.question || parsedData.questionText || '',
              choices:
                parsedData.choices?.map((c: any) => ({
                  id: c.id,
                  text: c.text,
                })) || [],
              correctChoiceId: q.correct_choice_id?.toString() || '',
              hint: parsedData.hint || extraData?.hint,
            }
            question = gs
            break
          }
        }

        return question
      })
      .filter((q: Question | null): q is Question => q !== null)

    return questions
  } catch (error) {
    console.error('[getQuestionsForSet] Error:', error)
    return []
  }
}

/**
 * Get exercise by slugs (topic + lesson)
 */
export async function getExerciseBySlugs(
  topicSlug: string,
  lessonSlug: string
): Promise<Exercise | null> {
  try {
    const ids = await getLessonIdsBySlugs(topicSlug, lessonSlug)

    if (!ids) {
      console.warn('[getExerciseBySlugs] Could not resolve IDs for slugs:', { topicSlug, lessonSlug })
      return null
    }

    const setData = await getActivePracticeSet(ids.lesson_id)

    if (!setData || !('id' in setData)) {
      console.warn('[getExerciseBySlugs] No active practice set found for lesson:', ids.lesson_id)
      return null
    }

    const questions = await getQuestionsForSet(setData.id!.toString(), topicSlug, lessonSlug)

    return {
      ...setData,
      id: setData.id!.toString(),
      topicId: topicSlug,
      chapterId: '',
      lessonId: lessonSlug,
      zoneId: ids.zone_id,
      zoneLevel: ids.zone_level,
      questions,
    } as Exercise
  } catch (error) {
    console.error('[getExerciseBySlugs] Error:', error)
    return null
  }
}

/**
 * Submit exercise attempt and track progress
 * Awards coins and XP only on first pass
 */
export async function submitExerciseAttempt(
  params: SubmitExerciseParams
): Promise<SubmitExerciseResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, result: null, error: 'User not authenticated' }
    }

    // Get practice set details including reward information
    const { data: practiceSet, error: practiceSetError } = await supabase
      .from('practice_sets')
      .select('lesson_id, coin_reward, xp_reward, pass_threshold')
      .eq('id', params.practiceSetId)
      .single()

    if (practiceSetError || !practiceSet?.lesson_id) {
      return { success: false, result: null, error: 'Practice set not found' }
    }

    // Check for existing pass to determine if this is first pass
    const { data: existingResults } = await supabase
      .from('practice_results')
      .select('score_percent')
      .eq('user_id', user.id)
      .eq('practice_set_id', params.practiceSetId)
      .gte('score_percent', practiceSet.pass_threshold || 80)

    const isFirstPass = !existingResults || existingResults.length === 0
    const shouldReward = isFirstPass && params.scorePercent >= (practiceSet.pass_threshold || 80)

    // Insert practice result
    const { data: result, error } = await supabase
      .from('practice_results')
      .insert({
        user_id: user.id,
        practice_set_id: params.practiceSetId,
        practice_date: new Date().toISOString().split('T')[0],
        score_percent: params.scorePercent,
        total_correct: params.totalCorrect,
        total_incorrect: params.totalIncorrect,
        total_skipped: params.totalSkipped,
        time_spent_seconds: params.timeSpentSeconds,
        weak_question_types: params.weakQuestionTypes || {},
        coins_earned: shouldReward ? practiceSet.coin_reward || 0 : 0,
        xp_earned: shouldReward ? practiceSet.xp_reward || 0 : 0,
        is_first_pass: isFirstPass,
        status: 'completed',
      })
      .select()
      .single()

    if (error) {
      console.error('[submitExerciseAttempt] Error:', error)
      return { success: false, result: null, error: error.message }
    }

    // Award coins and XP to user profile if first pass
    if (shouldReward) {
      const { error: rewardError } = await supabase.rpc('award_user_rewards', {
        p_user_id: user.id,
        p_coins: practiceSet.coin_reward || 0,
        p_xp: practiceSet.xp_reward || 0,
      })

      if (rewardError) {
        console.error('[submitExerciseAttempt] Reward error:', rewardError)
        // Don't fail the whole operation if reward fails
      }
    }

    return {
      success: true,
      result: result as PracticeResultRow,
      coinsEarned: shouldReward ? practiceSet.coin_reward || 0 : 0,
      xpEarned: shouldReward ? practiceSet.xp_reward || 0 : 0,
      isFirstPass,
    }
  } catch (err) {
    console.error('[submitExerciseAttempt] Exception:', err)
    return {
      success: false,
      result: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Check if user can access exercise (must have active session)
 */
export async function canAccessExercise(
  practiceSetId: string,
  userId: string
): Promise<boolean> {
  try {
    // Check for active in_progress session
    const { data: activeSession, error } = await supabase
      .from('practice_results')
      .select('id, status')
      .eq('practice_set_id', practiceSetId)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .maybeSingle()

    if (error) {
      console.error('[canAccessExercise] Error:', error)
      return false
    }

    return !!activeSession
  } catch (error) {
    console.error('[canAccessExercise] Error:', error)
    return false
  }
}

/**
 * Create exercise session (mark as in_progress)
 */
export async function createExerciseSession(practiceSetId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user) return false

    const { error } = await supabase.from('practice_results').insert({
      user_id: user.id,
      practice_set_id: practiceSetId,
      practice_date: new Date().toISOString().split('T')[0],
      score_percent: 0,
      total_correct: 0,
      total_incorrect: 0,
      total_skipped: 0,
      status: 'in_progress',
    })

    if (error) {
      console.error('[createExerciseSession] Error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[createExerciseSession] Error:', error)
    return false
  }
}
