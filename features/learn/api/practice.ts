import { createClient } from '@/lib/supabase/server'
import type {
  Exercise,
  Question,
  MultipleChoiceQuestion,
  WordMatchingQuestion,
  SynonymMatchingQuestion,
  ChooseWordsQuestion,
  ErrorCorrectionQuestion,
  DialogueCompletionQuestion,
  RolePlayQuestion,
  BaseQuestion,
  Choice,
  WordPair,
  SynonymPair,
  ChooseWordsType,
  MCQType
} from '@/features/learn/types'

async function getLessonIdsBySlugs(
  topicSlug: string,
  lessonSlug: string
): Promise<{ topic_id: number; lesson_id: number; zone_id: number; zone_level: number } | null> {
  const supabase = await createClient()

  // First get the topic with zone information
  const { data: topicData, error: topicError } = await supabase
    .from('topics')
    .select(`
      topic_id,
      zone_id,
      zones!inner (
        level
      )
    `)
    .eq('slug', topicSlug)
    .single()

  if (topicError || !topicData) {
    console.error('[getLessonIdsBySlugs] Supabase error fetching topic', { error: topicError, topicSlug })
    return null
  }

  // Then get the lesson
  // Chain with loose typing to avoid query builder union type friction
  const lessonQuery = (supabase
    .from('lessons')
    .select('id, slug, status') as any)
    .eq('topic_id', topicData.topic_id)
    .eq('slug', lessonSlug)
    .eq('status', 'published')
    .maybeSingle()

  const { data: lessonData, error: lessonError } = await lessonQuery

  if (lessonError || !lessonData) {
    console.error('[getLessonIdsBySlugs] Supabase error fetching lesson', { error: lessonError, lessonSlug, topic_id: topicData.topic_id })
    return null
  }

  console.log('[getLessonIdsBySlugs] Successfully found lesson', { 
    topic_id: topicData.topic_id, 
    lesson_id: lessonData.id,
    zone_id: topicData.zone_id,
    zone_level: (topicData.zones as any).level
  })
  return { 
    topic_id: topicData.topic_id, 
    lesson_id: lessonData.id,
    zone_id: topicData.zone_id,
    zone_level: (topicData.zones as any).level
  }
}

async function getActivePracticeSet(
  lesson_id: number
): Promise<Partial<Exercise> | null> {
  const supabase = await createClient()

  console.log('[getActivePracticeSet] Searching for practice set with lesson_id:', lesson_id)

  // Chain with loose typing to avoid query builder union type friction
  const practiceSetQuery = (supabase
    .from('practice_sets')
    .select('id, title, description, coin_reward, xp_reward, reward_coins, status, is_active, sequence_order') as any)
    .eq('lesson_id', lesson_id)
    .eq('is_active', true)
    .eq('status', 'ACTIVE')
    .order('sequence_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  const { data, error } = await practiceSetQuery

  if (error) {
    console.error('[getActivePracticeSet] Supabase error', { error, lesson_id })
    return null
  }
  if (!data) {
    console.warn('[getActivePracticeSet] No active practice set found', { lesson_id })
    // Log all practice sets for this lesson to debug
    // @ts-ignore - TypeScript issue with Supabase query builder
    const debugQuery = supabase
      .from('practice_sets')
      .select('id, title, status, is_active, sequence_order')
      .eq('lesson_id', lesson_id)

    const { data: allSetsData } = (await debugQuery) as any
    console.warn('[getActivePracticeSet] All practice sets for lesson:', allSetsData)
    return null
  }

  console.log('[getActivePracticeSet] Found practice set:', { id: data.id, title: data.title })
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    coinReward: data.coin_reward ?? data.reward_coins ?? 0,
    xpReward: data.xp_reward ?? 0,
  }
}

async function getQuestionsForSet(
  practice_set_id: string,
  topicSlug?: string,
  lessonSlug?: string,
): Promise<Question[]> {
  const supabase = await createClient()

  // @ts-ignore - TypeScript issue with Supabase query builder
  const questionsQuery = (supabase
    .from('practice_set_questions')
    .select(`
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
    `) as any)
    .eq('practice_set_id', practice_set_id)
    .order('sort_order', { ascending: true })

  const { data: rows, error } = await questionsQuery

  if (error || !rows) {
    return []
  }

  const questions: Question[] = rows
    .map((row: { sort_order: number; questions: any }): Question | null => {
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

      // Parse metadata (previously extra_data)
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

      // Handle image_url - can be a single object, a URL string, or an array of { alt, src, role }
      let imageUrl: string | undefined
      let imageArray: Array<{ alt?: string; src?: string; role?: string }> = []
      if (q.image_url) {
        console.log('[practice.ts] Processing image_url for question:', q.id, 'raw value:', q.image_url)
        try {
          const raw = typeof q.image_url === 'string' ? JSON.parse(q.image_url) : q.image_url
          console.log('[practice.ts] Parsed image_url:', raw)
          if (Array.isArray(raw)) {
            imageArray = raw
            console.log('[practice.ts] Set imageArray:', imageArray)
          } else if (raw && typeof raw === 'object') {
            // Legacy single object { url } or { src }
            if (raw.url) {
              imageUrl = raw.url as string
            } else if (raw.src && topicSlug && lessonSlug) {
              const path = `${topicSlug}/${lessonSlug}/images/${raw.src}`
              const { data } = supabase.storage.from('exercises').getPublicUrl(path)
              imageUrl = (data.publicUrl as string) || undefined
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
          
          // Default path resolver for images from storage when we have slugs
          const resolvePublicUrl = (src?: string): string | undefined => {
            if (!src) return undefined
            if (/^https?:\/\//i.test(src)) return src
            if (topicSlug && lessonSlug) {
              const path = `${topicSlug}/${lessonSlug}/images/${src}`
              const { data } = supabase.storage.from('exercises').getPublicUrl(path)
              console.log('[practice.ts] Resolving image path:', path, 'to URL:', data.publicUrl)
              return (data.publicUrl as string) || undefined
            }
            return undefined
          }

          // Handle image-choices: build choices from imageArray
          if (q.question_subtype === 'mcq_image_choices' && imageArray.length > 0) {
            console.log('[practice.ts] Processing mcq_image_choices with imageArray:', imageArray)
            choices = imageArray.map((img, index) => ({
              id: String(index + 1),
              text: img.alt || `Option ${index + 1}`,
              imageUrl: resolvePublicUrl(img.src),
            }))
            console.log('[practice.ts] Built choices for mcq_image_choices:', choices)
            
            // If correct_choice_id not provided, infer from role === 'main'
            if (!correctChoiceId || correctChoiceId === '') {
              const mainIndex = imageArray.findIndex((it) => (it.role || '').toLowerCase() === 'main')
              correctChoiceId = String((mainIndex >= 0 ? mainIndex : 0) + 1)
              console.log('[practice.ts] Inferred correctChoiceId from role=main:', correctChoiceId)
            }
          } else if (q.question_subtype !== 'mcq_image_choices') {
            // For non image-choices, keep existing parsed choices
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
          // Parse the nested question_data structure
          const questionData = parsedData.data || parsedData
          const uiData = parsedData.ui || extraData?.ui || {}
          
          const cw: ChooseWordsQuestion = {
            ...base as BaseQuestion,
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
            ...base as BaseQuestion,
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
          const pairs: SynonymPair[] = parsedData.pairs?.map((p: any, i: number) => ({
            id: i + 1,
            word1: p.left || p.word1,
            word2: p.right || p.word2,
            meaning: p.meaning,
          })) || []
          const sm: SynonymMatchingQuestion = {
            ...base as BaseQuestion,
            type: 'synonyms-matching',
            pairs,
          }
          question = sm
          break
        }

        case 'word-matching': {
          const pairs: WordPair[] = parsedData.pairs?.map((p: any, i: number) => ({
            id: i + 1,
            english: p.left || p.word1,
            vietnamese: p.right || p.word2,
          })) || []
          const wm: WordMatchingQuestion = {
            ...base as BaseQuestion,
            type: 'word-matching',
            pairs,
          }
          question = wm
          break
        }

        case 'dialogue-completion': {
          // Map dialogue data to context format expected by DialogueCompletion component
          const context = parsedData.dialogue?.map((line: any) => ({
            who: line.who as "A" | "B",
            text: line.text
          })) || parsedData.context || []
          
          const dc: DialogueCompletionQuestion = {
            ...base as BaseQuestion,
            type: 'dialogue-completion',
            context,
            choices: parsedData.choices?.map((c: any) => ({
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
            ...base as BaseQuestion,
            type: 'role-play',
            title: parsedData.context || '', // Use context instead of title
            steps: parsedData.steps?.map((s: any) => ({
              bot: s.bot || s.prompt,
              choices: s.choices?.map((o: any) => ({ text: o.text })) || s.options?.map((o: any) => ({ text: o.text })) || [],
              expected: s.expected || s.correctIndex || 0,
              tips: s.tips || s.hint,
            })) || [],
          }
          question = rp
          break
        }
      }

      return question
    })
    .filter((q: Question | null): q is Question => q !== null)

  // Sort by sort_order if needed, but query already orders
  return questions
}

export async function getExerciseBySlugs(
  topicSlug: string,
  lessonSlug: string
): Promise<Exercise | null> {
  console.log('Fetching exercise for topicSlug:', topicSlug, 'lessonSlug:', lessonSlug)
  
  const ids = await getLessonIdsBySlugs(topicSlug, lessonSlug)
  console.log('Lesson IDs result:', ids)
  
  if (!ids) {
    console.warn('[getExerciseBySlugs] Could not resolve IDs for provided slugs', { topicSlug, lessonSlug })
    return null
  }

  const setData = await getActivePracticeSet(ids.lesson_id)
  console.log('Practice set result:', setData)
  
  if (!setData || !('id' in setData)) {
    console.warn('[getExerciseBySlugs] No active practice set data', { ids })
    return null
  }

  const questions = await getQuestionsForSet(setData.id!.toString(), topicSlug, lessonSlug)
  console.log('Questions length:', questions.length)
  
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
}