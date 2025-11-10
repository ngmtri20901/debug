// app/(dashboard)/learn/[topicSlug]/[lessonSlug]/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Award, BookOpen, Play, Lightbulb, Check  } from "lucide-react";
import {
  DialoguePlayer,
  StorybookPopup,
  GrammarCarousel,
  ExampleSentences,
  KeyVocabulary
} from "@/features/learn/components/lesson";
import { notFound } from "next/navigation"; 



export const revalidate = 1; // ISR 60 days

// NOTE: Removed 'reading' and added 'storybook'
type Material = {
  id: string;
  side: "main" | "sidebar";
  type:
    | "video"
    | "image"
    | "dialogue"
    | "storybook"
    | "vocabulary"
    | "grammar"
    | "examples"
    | "notes";
  title: string | null;
  explanation: string | null | any; // Can be string or object
  data: any;
  media_url: string | null;
  order_index: number;
};

const BUCKET = "lesson-materials";

// Fisher-Yates shuffle to randomize example sentences (server-side so order varies per render)
function shuffleExamples<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== helper =====
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function highlightText(text: string, words?: string[]) {
  if (!text || !words || words.length === 0) return text;
  const tokens = words.filter(Boolean);
  if (tokens.length === 0) return text;
  const pattern = tokens.map(escapeRegex).join("|");
  const re = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-yellow-200/70 rounded px-0.5">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function isBlockedByGemini(url?: string | null) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host === "gemini.google.com" || host === "g.co" || host.endsWith(".google.com");
  } catch {
    return false;
  }
}

// Helper to safely render explanation (can be string or object)
function renderExplanation(explanation: any) {
  if (!explanation) return null;
  
  if (typeof explanation === 'string') {
    return explanation;
  }
  
  if (typeof explanation === 'object') {
    // Handle structured explanation object
    const parts = [];
    if (explanation.summary) parts.push(explanation.summary);
    if (explanation.grammar_focus) parts.push(`Grammar Focus: ${explanation.grammar_focus}`);
    return parts.join('\n\n');
  }
  
  return null;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ topicSlug: string; lessonSlug: string }>;
}) {
  const { topicSlug, lessonSlug } = await params;
  const supabase = await createClient();

  // Topic
  const { data: topic } = await (supabase as any)
    .from("topics")
    .select("topic_id, english_title, slug")
    .eq("slug", topicSlug)
    .single();
  if (!topic) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-4">Topic not found</h1>
          <Link href="/learn"><Button>Back to Learn</Button></Link>
        </div>
      </div>
    );
  }

  // Lesson
  const { data: lesson } = await (supabase as any)
    .from("lessons")
    .select("id, lesson_name, slug, status, duration_minutes, coins_reward")
    .eq("topic_id", topic.topic_id)
    .eq("slug", lessonSlug)
    .eq("status", "published")
    .single();
  if (!lesson) {
    notFound();
  }

  // Materials
  const { data: materials } = await (supabase as any)
    .from("lesson_materials")
    .select("id, side, type, title, explanation, data, media_url, order_index")
    .eq("lesson_id", lesson.id)
    .order("side", { ascending: true })
    .order("order_index", { ascending: true });

  const list = (materials ?? []) as Material[];
  const mains = list
    .filter((m) => m.side === "main")
    .sort((a, b) => a.order_index - b.order_index);
  const sidebars = list
    .filter((m) => m.side === "sidebar")
    .sort((a, b) => a.order_index - b.order_index);

  const publicUrl = (path?: string | null) => {
    if (!path) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl ?? null;
  };

  const resolveMediaUrl = (m?: Material | null) => {
    if (!m?.media_url) return null;
    if (/^https?:\/\//i.test(m.media_url)) return m.media_url; // external
    return publicUrl(m.media_url); // storage path -> public URL
  };

  // Chọn main ưu tiên: storybook > dialogue > image > video
  const mainBlock =
    mains.find((m) => m.type === "storybook") ??
    mains.find((m) => m.type === "dialogue") ??
    mains.find((m) => m.type === "image") ??
    mains.find((m) => m.type === "video") ??
    null;

  // Chuẩn bị media + highlight
  let mainMediaUrl: string | null = resolveMediaUrl(mainBlock);
  let dialogueLines: any[] = [];
  const highlightWords: string[] =
    (Array.isArray(mainBlock?.data?.hightlight_words)
      ? (mainBlock!.data.hightlight_words as string[])
      : undefined) ??
    (Array.isArray(mainBlock?.data?.highlight_words)
      ? (mainBlock!.data.highlight_words as string[])
      : undefined) ??
    [];

  if (mainBlock?.type === "dialogue" && Array.isArray(mainBlock.data?.lines)) {
    dialogueLines = mainBlock.data.lines.map((ln: any) => ({
      ...ln,
      audioUrl: ln.audio ? publicUrl(ln.audio) : null,
      _hl: Array.isArray(ln.highlight_words) ? ln.highlight_words : highlightWords,
    }));
  }


  // Chuẩn bị sidebar
  const sidebarPrepared = sidebars.map((m) => {
    if (m.type === "grammar" && m.media_url) {
      return { ...m, mediaResolved: publicUrl(m.media_url) };
    }
    if (m.type === "examples" && Array.isArray(m.data?.pairs)) {
      return {
        ...m,
        pairsResolved: m.data.pairs.map((p: any) => ({
          ...p,
          audioUrl: p.audio ? publicUrl(p.audio) : null,
        })),
      };
    }
    return m;
  });

  // Xác định có bị chặn nhúng (Gemini) hay không
  const storyIsBlocked = mainBlock?.type === "storybook" && isBlockedByGemini(mainMediaUrl ?? undefined);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/learn/${topic.slug}`}>
            <Button variant="ghost">← Back to {topic.english_title ?? "Topic"}</Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-[#067BC2]">{lesson.lesson_name}</h1>
          <div />
        </div>
      </header>

      {/* Layout */}
      <main className="container mx-auto px-4 py-8 max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* LEFT: MAIN (2 cols) */}
        <section className="md:col-span-2 space-y-6">
          {/* Main Content Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{mainBlock?.title ?? "Lesson Content"}</span>
                <span className="text-sm font-normal text-gray-500">
                  {mainBlock?.type?.toUpperCase()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!mainBlock && <p className="text-gray-600">No main content yet.</p>}

              {/* STORYBOOK */}
              {mainBlock?.type === "storybook" && mainMediaUrl && (
                <div className="space-y-3">
                  {storyIsBlocked ? (
                    <div className="rounded-lg border p-4 bg-card space-y-3">
                      <p className="text-sm text-gray-700">
                      This storybook is hosted on a site that doesn’t allow direct embedding. Please open it in a new window to view the full experience.
                      </p>
                      <StorybookPopup url={mainMediaUrl} />
                      <p className="text-xs text-gray-500"> Alternatively, you can open it in a new tab.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg overflow-hidden border">
                      <iframe
                        src={mainMediaUrl}
                        className="w-full h-[75vh]"
                        allow="clipboard-read; clipboard-write"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        title={mainBlock.title ?? "Storybook"}
                      />
                    </div>
                  )}

                  <p className="text-sm text-gray-600">
                    You can{" "}
                    <a
                      href={mainMediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#067BC2] underline"
                    >
                      open it in a new tab
                    </a>
                    .
                  </p>

                        {(mainBlock.explanation?.summary || mainBlock.explanation?.grammar_focus || mainBlock.explanation?.notes) && (
                          <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4">
                            {/* Phần Header với Icon */}
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-200">
                                <Lightbulb className="h-5 w-5 text-sky-700" />
                              </div>
                              <h4 className="text-lg font-bold text-sky-800">Explanation</h4>
                            </div>

                            {/* Phần nội dung được chia tách */}
                            <div className="mt-3 space-y-4 text-sm">
                              {/* Hiển thị phần Summary */}
                              {mainBlock.explanation.summary && (
                                <div>
                                  <p className="mt-1 text-slate-700">{mainBlock.explanation.summary}</p>
                                </div>
                              )}

                              {/* Hiển thị phần Grammar Focus (dưới dạng danh sách) */}
                              {Array.isArray(mainBlock.explanation.grammar_focus) && mainBlock.explanation.grammar_focus.length > 0 && (
                                <div>
                                  <h5 className="font-semibold text-slate-800">Grammar Focus</h5>
                                  <ul className="mt-2 space-y-2">
                                    {mainBlock.explanation.grammar_focus.map((point: string, index: number) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <Check className="h-4 w-4 mt-1 shrink-0 text-violet-500" />
                                        <span className="text-slate-700">{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Hiển thị phần Cultural Notes */}
                              {Array.isArray(mainBlock.explanation.notes) && mainBlock.explanation.notes.length > 0 && (
                                <div>
                                  <h5 className="font-semibold text-slate-800">Notes</h5>
                                  <ul className="mt-2 space-y-2">
                                    {mainBlock.explanation.notes.map((note: string, index: number) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <Check className="h-4 w-4 mt-1 shrink-0 text-amber-500" />
                                        <span className="text-slate-700">{note}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                </div>
              )}

              {/* DIALOGUE (sprite) */}
              {mainBlock?.type === "dialogue" && (
                <div className="space-y-4">
                  {(() => {
                    const spritePath = (mainBlock.data?.sprite?.src as string | undefined) ?? undefined;
                    const spriteUrl = spritePath ? publicUrl(spritePath) : mainMediaUrl;

                    const linesRaw = Array.isArray(mainBlock.data?.lines) ? mainBlock.data.lines : [];
                    const lines = linesRaw.map((ln: any) => ({
                      speaker: ln.speaker,
                      vi: ln.vi,
                      en: ln.en,
                      start: Number(ln.start ?? 0),
                      end: Number(ln.end ?? 0),
                      highlight_words: Array.isArray(ln.highlight_words) ? ln.highlight_words : undefined,
                      audioUrl: ln.audio ? publicUrl(ln.audio) : null,
                    }));
                    const hl = Array.isArray(mainBlock.data?.highlight_words) ? mainBlock.data.highlight_words : [];

                    return (
                      <>
                        {mainBlock.data?.scene && (
                          <h3 className="text-lg font-semibold">{mainBlock.data.scene}</h3>
                        )}

                        {/* Use client DialoguePlayer for all dialogue rendering. DialoguePlayer supports sprite playback and per-line audio. */}
                        <DialoguePlayer title={undefined} spriteUrl={spriteUrl || undefined} lines={lines} defaultHighlight={hl} />

                        {/* Kiểm tra xem mainBlock.explanation có dữ liệu hay không */}
                        {(mainBlock.explanation?.summary || mainBlock.explanation?.grammar_focus || mainBlock.explanation?.notes) && (
                          <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4">
                            {/* Phần Header với Icon */}
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-200">
                                <Lightbulb className="h-5 w-5 text-sky-700" />
                              </div>
                              <h4 className="text-lg font-bold text-sky-800">Explanation</h4>
                            </div>

                            {/* Phần nội dung được chia tách */}
                            <div className="mt-3 space-y-4 text-sm">
                              {/* Hiển thị phần Summary */}
                              {mainBlock.explanation.summary && (
                                <div>
                                  <p className="mt-1 text-slate-700">{mainBlock.explanation.summary}</p>
                                </div>
                              )}

                              {/* Hiển thị phần Grammar Focus (dưới dạng danh sách) */}
                              {Array.isArray(mainBlock.explanation.grammar_focus) && mainBlock.explanation.grammar_focus.length > 0 && (
                                <div>
                                  <h5 className="font-semibold text-slate-800">Grammar Focus</h5>
                                  <ul className="mt-2 space-y-2">
                                    {mainBlock.explanation.grammar_focus.map((point: string, index: number) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <Check className="h-4 w-4 mt-1 shrink-0 text-violet-500" />
                                        <span className="text-slate-700">{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Hiển thị phần Cultural Notes */}
                              {Array.isArray(mainBlock.explanation.notes) && mainBlock.explanation.notes.length > 0 && (
                                <div>
                                  <h5 className="font-semibold text-slate-800">Cultural Notes</h5>
                                  <ul className="mt-2 space-y-2">
                                    {mainBlock.explanation.notes.map((note: string, index: number) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <Check className="h-4 w-4 mt-1 shrink-0 text-amber-500" />
                                        <span className="text-slate-700">{note}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* IMAGE */}
              {mainBlock?.type === "image" && mainMediaUrl && (
                <div className="space-y-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mainMediaUrl}
                    alt={mainBlock.title ?? "Image"}
                    className="w-full h-auto rounded border"
                  />
                  {(() => {
                    const explanationText = renderExplanation(mainBlock.explanation);
                    return explanationText && (
                      <div className="rounded-lg bg-blue-50 p-4">
                        <h4 className="font-semibold mb-2">Explanation</h4>
                        <p className="text-gray-700 whitespace-pre-line">{explanationText}</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* VIDEO */}
              {mainBlock?.type === "video" && mainMediaUrl && (
                <div className="space-y-4">
                  <video className="w-full rounded-lg border" controls preload="metadata" src={mainMediaUrl} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Practice Exercise Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-[#067BC2]" />
                Practice Exercise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Complete this exercise to test your knowledge and practice what you've learned.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>Estimated time: ~{lesson.duration_minutes ?? 15} minutes</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span>Reward: {lesson.coins_reward ?? 50} coins</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span>Questions: 10–15 questions</span>
                  </div>
                </div>

                <Link href={`/learn/${topic.slug}/${lesson.slug}/exercise`} className="inline-block w-full">
                  <Button className="w-full bg-[#067BC2] hover:bg-[#055a9f] mt-6">Start Exercise</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: SIDEBAR (1 col) */}
        <aside className="space-y-6">
          {/* Grammar */}
          {(() => {
            const grammarMaterials = sidebarPrepared.filter((m) => m.type === "grammar");
            const allGrammarPoints = grammarMaterials.flatMap((m: any) => m.data?.points ?? []);
            
            return allGrammarPoints.length > 0 ? (
              <GrammarCarousel grammarPoints={allGrammarPoints} />
            ) : null;
          })()}



          {/* Vocabulary */}
          {(() => {
            const vocabularyMaterials = sidebarPrepared.filter((m) => m.type === "vocabulary");
            const allVocabulary = vocabularyMaterials.flatMap((m: any) => m.data?.items ?? []);
            
            return allVocabulary.length > 0 ? (
              <KeyVocabulary vocabulary={allVocabulary} />
            ) : null;
          })()}

          {/* Examples */}
          {(() => {
            const exampleMaterials = sidebarPrepared.filter((m) => m.type === "examples");
            const collected = exampleMaterials.flatMap((m: any) =>
              (m.pairsResolved ?? m.data?.pairs ?? []).map((p: any) => ({
                vi: p.vi,
                en: p.en,
                audioUrl: p.audioUrl,
                audioPath: p.audio_path,
              }))
            );
            const allExamples = shuffleExamples(collected);
            
            return allExamples.length > 0 ? (
              <ExampleSentences examples={allExamples} />
            ) : null;
          })()}
        </aside>
      </main>
    </div>
  );
}
