import { z } from "zod";

// =====================================================
// VIETNAMESE LEARNING - VAPI ASSISTANT CONFIG
// =====================================================

export const vietnameseTutorAssistant = {
  model: {
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: `Bạn là một trợ lý AI giúp người nước ngoài luyện nói tiếng Việt.

**Vai trò của bạn:**
- Trò chuyện bằng tiếng Việt với người học
- Nói rõ ràng, từ từ, phát âm chuẩn
- Sửa lỗi một cách nhẹ nhàng, khuyến khích
- Đặt câu hỏi để duy trì cuộc trò chuyện
- Giúp người học mở rộng từ vựng

**Nguyên tắc:**
- Sử dụng từ vựng phù hợp với trình độ
- Không nói tiếng Anh trừ khi được yêu cầu
- Lặp lại và giải thích khi người học không hiểu
- Khuyến khích người học nói nhiều hơn bạn
- Tạo không khí thoải mái, thân thiện

**Khi người học mắc lỗi:**
- Sửa nhẹ nhàng: "À, ý bạn là... phải không?"
- Khen ngợi trước khi sửa lỗi
- Đưa ra câu đúng để họ lặp lại

Hãy bắt đầu cuộc trò chuyện một cách tự nhiên và thân thiện!`,
      },
    ],
  },
  voice: {
    provider: "openai",
    voiceId: "alloy",
  },
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "vi",
  },
  firstMessage: "Xin chào! Tôi là trợ lý AI. Hôm nay bạn muốn nói về chủ đề gì?",
};

// =====================================================
// FEEDBACK SCHEMA FOR GEMINI AI (Deprecated)
// Moved to voice.action.ts
// =====================================================

export const feedbackSchema = z.object({
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

// =====================================================
// DIFFICULTY LEVELS
// =====================================================

export const DIFFICULTY_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
} as const;

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Sơ cấp",
  intermediate: "Trung cấp",
  advanced: "Cao cấp",
};

// =====================================================
// CONVERSATION TYPES
// =====================================================

export const CONVERSATION_TYPES = {
  FREE_TALK: "free_talk",
  SCENARIO_BASED: "scenario_based",
  VOCABULARY_PRACTICE: "vocabulary_practice",
  PRONUNCIATION_DRILL: "pronunciation_drill",
} as const;

export const CONVERSATION_TYPE_LABELS: Record<string, string> = {
  free_talk: "Trò chuyện tự do",
  scenario_based: "Tình huống thực tế",
  vocabulary_practice: "Luyện từ vựng",
  pronunciation_drill: "Luyện phát âm",
};

// =====================================================
// FEEDBACK CATEGORIES (for Vietnamese learning)
// =====================================================

export const FEEDBACK_CATEGORIES = [
  {
    key: "pronunciation",
    name: "Phát âm (Pronunciation)",
    description: "Độ chính xác phát âm, thanh điệu",
    color: "blue",
  },
  {
    key: "grammar",
    name: "Ngữ pháp (Grammar)",
    description: "Cấu trúc câu, ngữ pháp tiếng Việt",
    color: "green",
  },
  {
    key: "vocabulary",
    name: "Từ vựng (Vocabulary)",
    description: "Độ phong phú và chính xác của từ vựng",
    color: "purple",
  },
  {
    key: "communication",
    name: "Giao tiếp (Communication)",
    description: "Khả năng truyền đạt ý tưởng",
    color: "orange",
  },
  {
    key: "fluency",
    name: "Độ trôi chảy (Fluency)",
    description: "Độ tự nhiên và mạch lạc khi nói",
    color: "pink",
  },
];

// =====================================================
// SCORE THRESHOLDS
// =====================================================

export const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  AVERAGE: 60,
  NEEDS_IMPROVEMENT: 40,
};

export const SCORE_LABELS: Record<string, string> = {
  excellent: "Xuất sắc",
  good: "Tốt",
  average: "Trung bình",
  needs_improvement: "Cần cải thiện",
  poor: "Yếu",
};

export function getScoreLabel(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_LABELS.excellent;
  if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_LABELS.good;
  if (score >= SCORE_THRESHOLDS.AVERAGE) return SCORE_LABELS.average;
  if (score >= SCORE_THRESHOLDS.NEEDS_IMPROVEMENT)
    return SCORE_LABELS.needs_improvement;
  return SCORE_LABELS.poor;
}
