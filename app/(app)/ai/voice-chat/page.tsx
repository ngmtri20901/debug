import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { createClient } from "@/shared/lib/supabase/server";
import {
  getAllTopics,
  getConversationsByUser,
} from "@/features/ai/voice/actions/voice.action";
import {
  DIFFICULTY_LABELS,
  CONVERSATION_TYPE_LABELS,
} from "@/shared/constants/vietnamese-voice";

async function VoiceChatHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get all topics and user's conversations in parallel
  const [topics, userConversations] = await Promise.all([
    getAllTopics(),
    user ? getConversationsByUser({ userId: user.id, limit: 10 }) : Promise.resolve([]),
  ]);

  // Group topics by difficulty
  const topicsByDifficulty = {
    beginner: topics.filter((t) => t.difficulty_level === "beginner"),
    intermediate: topics.filter((t) => t.difficulty_level === "intermediate"),
    advanced: topics.filter((t) => t.difficulty_level === "advanced"),
  };

  const hasPastConversations = userConversations && userConversations.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h1 className="text-4xl font-bold">
            Practice Vietnamese with AI Voice Chat
          </h1>
          <p className="text-lg text-gray-600">
            Improve your Vietnamese speaking skills with personalized AI conversations.
            Get instant feedback on pronunciation, grammar, and vocabulary!
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/ai/voice-chat/speak">Start Voice Chat</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="AI Vietnamese Tutor"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      {/* User's Recent Conversations */}
      {user && (
        <section className="flex flex-col gap-6 mt-12">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Recent Conversations</h2>
            {hasPastConversations && (
              <Link
                href="/ai/voice-chat/speak"
                className="text-primary hover:underline"
              >
                View All →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hasPastConversations ? (
              userConversations.slice(0, 6).map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-lg">
                  You haven&apos;t had any conversations yet.
                </p>
                <p className="text-gray-400 mt-2">
                  Start your first voice chat to practice Vietnamese!
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Topics by Difficulty */}
      <section className="flex flex-col gap-8 mt-12">
        <div>
          <h2 className="text-2xl font-bold">Practice Topics</h2>
          <p className="text-gray-600 mt-2">
            Choose a topic based on your Vietnamese level
          </p>
        </div>

        {/* Beginner Topics */}
        {topicsByDifficulty.beginner.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                {DIFFICULTY_LABELS.beginner}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topicsByDifficulty.beginner.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </div>
        )}

        {/* Intermediate Topics */}
        {topicsByDifficulty.intermediate.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                {DIFFICULTY_LABELS.intermediate}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topicsByDifficulty.intermediate.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </div>
        )}

        {/* Advanced Topics */}
        {topicsByDifficulty.advanced.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                {DIFFICULTY_LABELS.advanced}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topicsByDifficulty.advanced.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="font-semibold mb-2">Choose a Topic</h3>
            <p className="text-gray-600 text-sm">
              Select a conversation topic that matches your level
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="font-semibold mb-2">Start Voice Chat</h3>
            <p className="text-gray-600 text-sm">
              Have a natural conversation with our AI tutor in Vietnamese
            </p>
          </div>

          <div className="text-center">
            <div className="bg-pink-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="font-semibold mb-2">Get Feedback</h3>
            <p className="text-gray-600 text-sm">
              Receive personalized feedback on pronunciation, grammar, and vocabulary
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Topic Card Component
function TopicCard({ topic }: { topic: VoiceTopic }) {
  return (
    <Link
      href={`/ai/voice-chat/speak?topic=${topic.id}`}
      className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex items-start gap-3">
        {topic.icon_name && (
          <div className="text-2xl">{getTopicIcon(topic.icon_name)}</div>
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-lg mb-1">{topic.title}</h4>
          {topic.description && (
            <p className="text-gray-500 text-sm line-clamp-2">
              {topic.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <span>📝 {topic.sample_prompts?.length || 0} prompts</span>
            {topic.usage_count > 0 && (
              <span>• 👥 {topic.usage_count} learners</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Conversation Card Component
function ConversationCard({ conversation }: { conversation: VoiceConversation }) {
  const difficultyColor =
    conversation.difficulty_level === "beginner"
      ? "bg-green-100 text-green-700"
      : conversation.difficulty_level === "intermediate"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <Link
      href={`/ai/voice-chat/speak/${conversation.id}`}
      className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold">{conversation.topic}</h4>
        {conversation.has_feedback && (
          <span className="text-green-500 text-sm">✓ Reviewed</span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs mb-3">
        <span className={`${difficultyColor} px-2 py-1 rounded`}>
          {DIFFICULTY_LABELS[conversation.difficulty_level]}
        </span>
        <span className="text-gray-500">
          {CONVERSATION_TYPE_LABELS[conversation.conversation_type]}
        </span>
      </div>

      <div className="text-xs text-gray-400">
        {conversation.duration_seconds
          ? `${Math.floor(conversation.duration_seconds / 60)} min`
          : "Not started"}{" "}
        • {new Date(conversation.created_at).toLocaleDateString()}
      </div>
    </Link>
  );
}

// Helper function to get icon emoji
function getTopicIcon(iconName: string): string {
  const iconMap: Record<string, string> = {
    User: "👤",
    MessageCircle: "💬",
    Users: "👨‍👩‍👧‍👦",
    ShoppingCart: "🛒",
    MapPin: "📍",
    Utensils: "🍽️",
    Cloud: "☁️",
    Heart: "❤️",
    Briefcase: "💼",
    Plane: "✈️",
    Globe: "🌍",
    BookOpen: "📖",
  };
  return iconMap[iconName] || "📚";
}

export default VoiceChatHome;
