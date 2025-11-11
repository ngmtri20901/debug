// app/learn/[topicSlug]/page.tsx
import { createClient } from "@/shared/lib/supabase/server";
import Image from "next/image";
import LessonsList from "./LessonsList";
import TopicProgressStats from "./TopicProgressStats";
import { notFound } from "next/navigation";

export const revalidate = 2592000; // ISR: 30 days (30 * 24 * 60 * 60) 

type TopicRow = {
  topic_id: number;
  english_title: string | null;
  topic_description: string | null;
  slug: string;
  zone_id: number | null;
};

type LessonRow = {
  id: number;
  slug: string;
  lesson_name: string;
  duration_minutes: number | null;
  coins_reward: number | null;
  sort_order: number | null;
  status: string | null;
};

type ZoneRow = {
  zone_id: number;
  level: number | null;
};

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}) {
  const { topicSlug } = await params;
  const supabase = await createClient();

  // Get current user for progress data
  const { data: { user } } = await supabase.auth.getUser();

  // 1) Lấy topic theo slug
  const { data: topic, error: topicErr } = await (supabase as any)
    .from("topics")
    .select("topic_id, english_title, topic_description, slug, zone_id")
    .eq("slug", topicSlug)
    .single();

  if (topicErr || !topic) {
    notFound();
  }

  // 1.5) Get zone information including level
  const { data: zone } = await (supabase as any)
    .from("zones")
    .select("zone_id, level")
    .eq("zone_id", topic.zone_id)
    .single();

  const zoneLevel = (zone as ZoneRow)?.level ?? 1

  // 2) Lấy lessons của topic (now including id)
  const { data: lessons, error: lessonsErr } = await (supabase as any)
    .from("lessons")
    .select("id, slug, lesson_name, duration_minutes, coins_reward, sort_order, status")
    .eq("topic_id", topic.topic_id)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (lessonsErr) {
    console.error(lessonsErr);
  }

  const list = (lessons ?? []) as LessonRow[];
  const totalLessons = list.length;

  // 3) Fetch user progress for this topic server-side
  let initialProgress: any[] = [];
  if (user?.id) {
    const { data: progressData } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic_id', topic.topic_id);

    initialProgress = progressData ?? [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* --- Redesigned Topic Card --- */}
        {/* Sử dụng 'group' để tạo hiệu ứng hover cho các element con */}
        <div className="group relative w-full h-[450px] md:h-[400px] mb-12 overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl z-0">
          
          {/* 1. Background Image - Full Bleed */}
          {/* Hình ảnh sẽ là nền chính, có hiệu ứng zoom nhẹ khi hover */}
          <Image
            src={`/images/topic/${topic.slug}.webp`}
            alt={topic.english_title ?? "Topic"}
            fill
            className="object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-105 filter blur-sm"
          />

          {/* Pink Overlay */}
          <div className="absolute inset-0 bg-pink-700/30"></div>

          {/* 2. Gradient Overlay */}
          {/* Lớp phủ gradient từ đen mờ đến trong suốt để làm nổi bật văn bản */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

          {/* 3. Content Wrapper */}
          {/* Nội dung được đẩy xuống dưới cùng của card, nơi có lớp phủ đậm nhất */}
          <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-8 text-white">
            <div className="max-w-3xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 drop-shadow-lg">
                {topic.english_title ?? "Topic"}
              </h2>
              <p className="text-lg text-gray-200 mb-6 max-w-2xl drop-shadow-md">
                {topic.topic_description ?? ""}
              </p>

              {/* 4. Progress Section - Real-time updates */}
              <TopicProgressStats
                topicId={topic.topic_id}
                totalLessons={totalLessons}
                initialProgress={initialProgress}
              />
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Lessons</h3>

            <LessonsList
              lessons={list}
              topicId={topic.topic_id}
              topicSlug={topicSlug}
              zoneId={topic.zone_id}
              zoneLevel={zoneLevel}
              initialProgress={initialProgress}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
