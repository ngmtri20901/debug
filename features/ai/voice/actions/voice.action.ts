"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";

// =====================================================
// VOICE TOPICS
// =====================================================

export async function getAllTopics(): Promise<VoiceTopic[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("voice_topics")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching topics:", error);
    return [];
  }

  return data as VoiceTopic[];
}

export async function getTopicById(topicId: string): Promise<VoiceTopic | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("voice_topics")
    .select("*")
    .eq("id", topicId)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Error fetching topic:", error);
    return null;
  }

  return data as VoiceTopic;
}

export async function getTopicsByDifficulty(
  difficultyLevel: DifficultyLevel
): Promise<VoiceTopic[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("voice_topics")
    .select("*")
    .eq("is_active", true)
    .eq("difficulty_level", difficultyLevel)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching topics by difficulty:", error);
    return [];
  }

  return data as VoiceTopic[];
}

// =====================================================
// VOICE CONVERSATIONS
// =====================================================

export async function createConversation(
  params: CreateConversationParams
): Promise<CreateConversationResponse> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized: Please login to continue",
    };
  }

  const { data, error } = await supabase
    .from("voice_conversations")
    .insert({
      user_id: user.id,
      topic_id: params.topicId,
      topic: params.topic,
      difficulty_level: params.difficultyLevel,
      conversation_type: params.conversationType,
      prompts: params.prompts || [],
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return {
      success: false,
      error: "Failed to create conversation",
    };
  }

  return {
    success: true,
    data: {
      conversationId: data.id,
      conversation: data as VoiceConversation,
    },
  };
}

export async function getConversationById(
  conversationId: string
): Promise<VoiceConversation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("voice_conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }

  return data as VoiceConversation;
}

export async function updateConversation(
  params: UpdateConversationParams
): Promise<ApiResponse> {
  const supabase = await createClient();

  const updateData: any = {};

  if (params.vapiCallId !== undefined) updateData.vapi_call_id = params.vapiCallId;
  if (params.durationSeconds !== undefined)
    updateData.duration_seconds = params.durationSeconds;
  if (params.messageCount !== undefined) updateData.message_count = params.messageCount;
  if (params.userMessageCount !== undefined)
    updateData.user_message_count = params.userMessageCount;
  if (params.status !== undefined) updateData.status = params.status;
  if (params.isCompleted !== undefined) updateData.is_completed = params.isCompleted;
  if (params.completedAt !== undefined) updateData.completed_at = params.completedAt;

  const { error } = await supabase
    .from("voice_conversations")
    .update(updateData)
    .eq("id", params.conversationId);

  if (error) {
    console.error("Error updating conversation:", error);
    return {
      success: false,
      error: "Failed to update conversation",
    };
  }

  return { success: true };
}

export async function getConversationsByUser(
  params: GetConversationsByUserParams
): Promise<VoiceConversation[]> {
  const supabase = await createClient();

  let query = supabase
    .from("voice_conversations")
    .select("*")
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  return data as VoiceConversation[];
}

// =====================================================
// VOICE TRANSCRIPTS
// =====================================================

export async function createTranscript(
  params: CreateTranscriptParams
): Promise<ApiResponse> {
  const supabase = await createClient();

  const { error } = await supabase.from("voice_transcripts").insert({
    conversation_id: params.conversationId,
    role: params.role,
    content: params.content,
    timestamp_ms: params.timestampMs,
    sequence_number: params.sequenceNumber,
    vapi_message_type: params.vapiMessageType || null,
    vapi_transcript_type: params.vapiTranscriptType || null,
    raw_vapi_data: params.rawVapiData || null,
  });

  if (error) {
    console.error("Error creating transcript:", error);
    return {
      success: false,
      error: "Failed to save transcript",
    };
  }

  return { success: true };
}

export async function getTranscriptsByConversation(
  conversationId: string
): Promise<VoiceTranscript[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("voice_transcripts")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("sequence_number", { ascending: true });

  if (error) {
    console.error("Error fetching transcripts:", error);
    return [];
  }

  return data as VoiceTranscript[];
}

// =====================================================
// VOICE FEEDBACK - with Gemini AI
// =====================================================

// Feedback schema for Gemini AI
const feedbackSchema = z.object({
  totalScore: z.number().min(0).max(100).describe("Điểm tổng thể từ 0-100"),
  categoryScores: z
    .array(
      z.object({
        name: z.string().describe("Tên kỹ năng"),
        score: z.number().min(0).max(100).describe("Điểm từ 0-100"),
        comment: z.string().describe("Nhận xét chi tiết"),
      })
    )
    .describe("Điểm chi tiết cho từng kỹ năng"),
  strengths: z
    .array(z.string())
    .describe("Các điểm mạnh của người học (tiếng Việt)"),
  areasForImprovement: z
    .array(z.string())
    .describe("Các điểm cần cải thiện (tiếng Việt)"),
  finalAssessment: z.string().describe("Đánh giá tổng thể bằng tiếng Việt"),
  vocabularySuggestions: z
    .array(
      z.object({
        word: z.string().describe("Từ tiếng Việt"),
        meaning: z.string().describe("Nghĩa tiếng Anh"),
        example: z.string().describe("Câu ví dụ tiếng Việt"),
      })
    )
    .describe("Danh sách từ vựng nên học thêm"),
  grammarNotes: z
    .array(z.string())
    .describe("Lưu ý về ngữ pháp tiếng Việt (tiếng Việt)"),
  pronunciationTips: z
    .array(z.string())
    .describe("Gợi ý cải thiện phát âm (tiếng Việt)"),
});

export async function createFeedback(
  params: CreateFeedbackParams
): Promise<CreateFeedbackResponse> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    const startTime = Date.now();

    // Format transcript for AI
    const formattedTranscript = params.transcript
      .map((msg) => `- ${msg.role === "user" ? "Học sinh" : "AI"}: ${msg.content}`)
      .join("\n");

    // Generate feedback using Gemini AI
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        Bạn là một giáo viên tiếng Việt chuyên nghiệp. Nhiệm vụ của bạn là đánh giá kỹ năng tiếng Việt của học sinh dựa trên cuộc hội thoại sau.

        **Cuộc hội thoại:**
        ${formattedTranscript}

        **Yêu cầu đánh giá:**

        1. Chấm điểm từ 0-100 cho các kỹ năng sau (ĐÚNG TÊN):
           - **Phát âm (Pronunciation)**: Độ chính xác phát âm, thanh điệu
           - **Ngữ pháp (Grammar)**: Cấu trúc câu, ngữ pháp tiếng Việt
           - **Từ vựng (Vocabulary)**: Độ phong phú và chính xác của từ vựng
           - **Giao tiếp (Communication)**: Khả năng truyền đạt ý tưởng
           - **Độ trôi chảy (Fluency)**: Độ tự nhiên và mạch lạc khi nói

        2. Liệt kê 3-5 điểm mạnh của học sinh

        3. Liệt kê 3-5 điểm cần cải thiện

        4. Đưa ra đánh giá tổng thể (2-3 câu)

        5. Gợi ý 5-8 từ vựng hữu ích liên quan đến cuộc trò chuyện (với nghĩa tiếng Anh và ví dụ)

        6. Đưa ra 2-4 lưu ý ngữ pháp quan trọng

        7. Đưa ra 2-4 gợi ý cải thiện phát âm

        **Lưu ý quan trọng:**
        - Đánh giá công bằng, không quá dễ dãi
        - Sử dụng tiếng Việt cho tất cả nhận xét
        - Cụ thể, có ví dụ từ cuộc hội thoại
        - Khuyến khích nhưng cũng chỉ ra lỗi rõ ràng
      `,
      system:
        "Bạn là giáo viên tiếng Việt nhiều kinh nghiệm, chuyên đánh giá kỹ năng ngôn ngữ của người học nước ngoài.",
    });

    const processingTime = Date.now() - startTime;

    // Prepare feedback data
    const feedbackData = {
      conversation_id: params.conversationId,
      user_id: user.id,
      total_score: object.totalScore,
      category_scores: object.categoryScores,
      strengths: object.strengths,
      areas_for_improvement: object.areasForImprovement,
      final_assessment: object.finalAssessment,
      vocabulary_suggestions: object.vocabularySuggestions,
      grammar_notes: object.grammarNotes,
      pronunciation_tips: object.pronunciationTips,
      ai_model: "gemini-2.0-flash-001",
      ai_processing_time_ms: processingTime,
    };

    // Upsert feedback (update if exists, insert if not)
    const { data, error } = await supabase
      .from("voice_feedback")
      .upsert(feedbackData, {
        onConflict: "conversation_id,user_id",
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving feedback:", error);
      return {
        success: false,
        error: "Failed to save feedback",
      };
    }

    return {
      success: true,
      data: {
        feedbackId: data.id,
        feedback: data as VoiceFeedback,
      },
    };
  } catch (error) {
    console.error("Error generating feedback:", error);
    return {
      success: false,
      error: "Failed to generate feedback",
    };
  }
}

export async function getFeedbackByConversation(
  params: GetFeedbackByConversationParams
): Promise<VoiceFeedback | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("voice_feedback")
    .select("*")
    .eq("conversation_id", params.conversationId)
    .eq("user_id", params.userId)
    .single();

  if (error) {
    // Not found is not an error, just return null
    if (error.code === "PGRST116") return null;

    console.error("Error fetching feedback:", error);
    return null;
  }

  return data as VoiceFeedback;
}

// =====================================================
// USER VOICE STATS
// =====================================================

export async function getUserStats(userId: string): Promise<UserVoiceStats | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_voice_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // Not found is not an error - user hasn't had any conversations yet
    if (error.code === "PGRST116") {
      return {
        id: "",
        user_id: userId,
        total_conversation_time: 0,
        total_conversation_count: 0,
        completed_conversation_count: 0,
        average_total_score: null,
        average_pronunciation_score: null,
        average_grammar_score: null,
        average_vocabulary_score: null,
        average_communication_score: null,
        average_fluency_score: null,
        current_level: "beginner",
        current_streak_days: 0,
        longest_streak_days: 0,
        last_conversation_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    console.error("Error fetching user stats:", error);
    return null;
  }

  return data as UserVoiceStats;
}

export async function initializeUserStats(userId: string): Promise<ApiResponse> {
  const supabase = await createClient();

  const { error } = await supabase.from("user_voice_stats").insert({
    user_id: userId,
    current_level: "beginner",
  });

  if (error) {
    // Already exists is OK
    if (error.code === "23505") {
      return { success: true };
    }

    console.error("Error initializing user stats:", error);
    return {
      success: false,
      error: "Failed to initialize user stats",
    };
  }

  return { success: true };
}

// TODO: Implement updateUserStats() function
// This should be called after completing a conversation to recalculate averages
// Will be implemented in a future update
