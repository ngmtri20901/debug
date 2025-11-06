-- =====================================================
-- VOICE CHAT FEATURE - DATABASE SCHEMA
-- Ứng dụng học tiếng Việt với Vapi.ai
-- =====================================================
--
-- Cách chạy: Copy toàn bộ file này vào Supabase Dashboard > SQL Editor > New Query
-- Sau đó nhấn Run để tạo tất cả tables, indexes, và policies
--
-- =====================================================

-- Enable UUID extension (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE 1: voice_topics
-- Quản lý các chủ đề hội thoại cho người học tiếng Việt
-- =====================================================

CREATE TABLE IF NOT EXISTS public.voice_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Thông tin chủ đề
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty_level VARCHAR(50) NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),

  -- Icon và hình ảnh
  icon_name VARCHAR(100),                    -- Tên icon từ icon library
  cover_image_url TEXT,                      -- URL ảnh minh họa chủ đề

  -- Nội dung gợi ý
  sample_prompts TEXT[] DEFAULT '{}',        -- Các câu hỏi/câu mẫu
  vocabulary_focus TEXT[] DEFAULT '{}',      -- Từ vựng trọng tâm
  grammar_focus TEXT[] DEFAULT '{}',         -- Ngữ pháp trọng tâm

  -- Cấu hình Vapi
  vapi_assistant_config JSONB,               -- Config cho Vapi assistant (optional)

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,             -- Số lần được sử dụng

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes cho voice_topics
CREATE INDEX IF NOT EXISTS voice_topics_difficulty_idx ON public.voice_topics(difficulty_level);
CREATE INDEX IF NOT EXISTS voice_topics_active_order_idx ON public.voice_topics(is_active, display_order);
CREATE INDEX IF NOT EXISTS voice_topics_usage_idx ON public.voice_topics(usage_count DESC);

-- RLS Policies cho voice_topics
ALTER TABLE public.voice_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active topics" ON public.voice_topics;
CREATE POLICY "Anyone can view active topics"
  ON public.voice_topics FOR SELECT
  USING (is_active = TRUE);

-- Comments
COMMENT ON TABLE public.voice_topics IS 'Danh sách các chủ đề hội thoại cho tính năng voice chat';
COMMENT ON COLUMN public.voice_topics.difficulty_level IS 'Độ khó: beginner, intermediate, advanced';
COMMENT ON COLUMN public.voice_topics.sample_prompts IS 'Mảng các câu hỏi/prompt mẫu cho AI';
COMMENT ON COLUMN public.voice_topics.vapi_assistant_config IS 'Cấu hình JSON cho Vapi assistant (optional)';

-- =====================================================
-- TABLE 2: voice_conversations
-- Lưu trữ các phiên hội thoại của người dùng
-- =====================================================

CREATE TABLE IF NOT EXISTS public.voice_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.voice_topics(id) ON DELETE SET NULL,

  -- Thông tin cuộc hội thoại
  topic VARCHAR(255) NOT NULL,                           -- Tên chủ đề (backup nếu topic_id bị xóa)
  difficulty_level VARCHAR(50) NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  conversation_type VARCHAR(50) NOT NULL DEFAULT 'free_talk' CHECK (
    conversation_type IN ('free_talk', 'scenario_based', 'vocabulary_practice', 'pronunciation_drill')
  ),

  -- Nội dung
  prompts TEXT[] DEFAULT '{}',                           -- Các câu hỏi đã sử dụng
  vapi_call_id VARCHAR(255),                             -- ID của cuộc gọi từ Vapi
  duration_seconds INTEGER DEFAULT 0,                    -- Thời lượng cuộc trò chuyện

  -- Thống kê
  message_count INTEGER DEFAULT 0,                       -- Số lượng tin nhắn
  user_message_count INTEGER DEFAULT 0,                  -- Số lượng tin nhắn của user

  -- Trạng thái
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  is_completed BOOLEAN DEFAULT FALSE,
  has_feedback BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Full-text search (Vietnamese)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('simple', COALESCE(topic, ''))
  ) STORED
);

-- Indexes cho voice_conversations
CREATE INDEX IF NOT EXISTS voice_conversations_user_id_idx ON public.voice_conversations(user_id);
CREATE INDEX IF NOT EXISTS voice_conversations_topic_id_idx ON public.voice_conversations(topic_id);
CREATE INDEX IF NOT EXISTS voice_conversations_created_at_idx ON public.voice_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS voice_conversations_status_idx ON public.voice_conversations(status);
CREATE INDEX IF NOT EXISTS voice_conversations_search_idx ON public.voice_conversations USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS voice_conversations_user_created_idx ON public.voice_conversations(user_id, created_at DESC);

-- RLS Policies cho voice_conversations
ALTER TABLE public.voice_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON public.voice_conversations;
CREATE POLICY "Users can view own conversations"
  ON public.voice_conversations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON public.voice_conversations;
CREATE POLICY "Users can insert own conversations"
  ON public.voice_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.voice_conversations;
CREATE POLICY "Users can update own conversations"
  ON public.voice_conversations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.voice_conversations;
CREATE POLICY "Users can delete own conversations"
  ON public.voice_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.voice_conversations IS 'Các phiên hội thoại voice chat của người dùng';
COMMENT ON COLUMN public.voice_conversations.conversation_type IS 'Loại hội thoại: free_talk, scenario_based, vocabulary_practice, pronunciation_drill';
COMMENT ON COLUMN public.voice_conversations.vapi_call_id IS 'Call ID từ Vapi.ai để tracking';

-- =====================================================
-- TABLE 3: voice_transcripts
-- Lưu trữ chi tiết transcript của từng cuộc hội thoại
-- =====================================================

CREATE TABLE IF NOT EXISTS public.voice_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.voice_conversations(id) ON DELETE CASCADE NOT NULL,

  -- Nội dung transcript
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Timing
  timestamp_ms BIGINT NOT NULL,                          -- Timestamp trong cuộc gọi (milliseconds)
  sequence_number INTEGER NOT NULL DEFAULT 0,            -- Thứ tự tin nhắn

  -- Metadata từ Vapi
  vapi_message_type VARCHAR(50),                         -- 'transcript', 'function-call', etc.
  vapi_transcript_type VARCHAR(50),                      -- 'partial', 'final'
  raw_vapi_data JSONB,                                   -- Raw data từ Vapi message

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes cho voice_transcripts
CREATE INDEX IF NOT EXISTS voice_transcripts_conversation_id_idx ON public.voice_transcripts(conversation_id);
CREATE INDEX IF NOT EXISTS voice_transcripts_timestamp_idx ON public.voice_transcripts(timestamp_ms);
CREATE INDEX IF NOT EXISTS voice_transcripts_conversation_seq_idx ON public.voice_transcripts(conversation_id, sequence_number);
CREATE INDEX IF NOT EXISTS voice_transcripts_role_idx ON public.voice_transcripts(role);

-- RLS Policies cho voice_transcripts
ALTER TABLE public.voice_transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transcripts" ON public.voice_transcripts;
CREATE POLICY "Users can view own transcripts"
  ON public.voice_transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.voice_conversations
      WHERE id = voice_transcripts.conversation_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own transcripts" ON public.voice_transcripts;
CREATE POLICY "Users can insert own transcripts"
  ON public.voice_transcripts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.voice_conversations
      WHERE id = voice_transcripts.conversation_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own transcripts" ON public.voice_transcripts;
CREATE POLICY "Users can delete own transcripts"
  ON public.voice_transcripts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.voice_conversations
      WHERE id = voice_transcripts.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE public.voice_transcripts IS 'Chi tiết transcript từng câu nói trong cuộc hội thoại';
COMMENT ON COLUMN public.voice_transcripts.timestamp_ms IS 'Thời điểm trong cuộc gọi (milliseconds từ lúc bắt đầu)';
COMMENT ON COLUMN public.voice_transcripts.sequence_number IS 'Số thứ tự của message trong conversation';

-- =====================================================
-- TABLE 4: voice_feedback
-- Phản hồi và đánh giá chi tiết về kỹ năng ngôn ngữ
-- =====================================================

CREATE TABLE IF NOT EXISTS public.voice_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.voice_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Điểm tổng quan
  total_score NUMERIC(5,2) NOT NULL CHECK (total_score >= 0 AND total_score <= 100),

  -- Điểm chi tiết theo kỹ năng
  category_scores JSONB NOT NULL DEFAULT '[]',
  -- Format: [
  --   {"name": "Phát âm", "score": 85, "comment": "Phát âm rõ ràng..."},
  --   {"name": "Ngữ pháp", "score": 75, "comment": "Cần cải thiện..."},
  --   {"name": "Từ vựng", "score": 80, "comment": "Sử dụng tốt..."},
  --   {"name": "Giao tiếp", "score": 90, "comment": "Tự nhiên..."},
  --   {"name": "Độ trôi chảy", "score": 85, "comment": "Khá tốt..."}
  -- ]

  -- Phân tích chi tiết
  strengths TEXT[] DEFAULT '{}',                         -- Điểm mạnh
  areas_for_improvement TEXT[] DEFAULT '{}',             -- Điểm cần cải thiện
  final_assessment TEXT,                                 -- Đánh giá tổng thể

  -- Gợi ý học tập
  vocabulary_suggestions JSONB DEFAULT '[]',             -- Từ vựng gợi ý học
  -- Format: [
  --   {"word": "xin chào", "meaning": "hello", "example": "Xin chào, bạn khỏe không?"},
  --   {"word": "tạm biệt", "meaning": "goodbye", "example": "Tạm biệt, hẹn gặp lại!"}
  -- ]

  grammar_notes TEXT[] DEFAULT '{}',                     -- Lưu ý ngữ pháp
  pronunciation_tips TEXT[] DEFAULT '{}',                -- Gợi ý phát âm

  -- Metadata từ AI
  ai_model VARCHAR(100),                                 -- Model đã sử dụng (vd: "gemini-2.0-flash-001")
  ai_processing_time_ms INTEGER,                         -- Thời gian xử lý của AI

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes cho voice_feedback
CREATE INDEX IF NOT EXISTS voice_feedback_conversation_id_idx ON public.voice_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS voice_feedback_user_id_idx ON public.voice_feedback(user_id);
CREATE INDEX IF NOT EXISTS voice_feedback_user_created_idx ON public.voice_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS voice_feedback_total_score_idx ON public.voice_feedback(total_score DESC);

-- Unique constraint: Mỗi conversation chỉ có 1 feedback
CREATE UNIQUE INDEX IF NOT EXISTS voice_feedback_conversation_user_unique_idx
  ON public.voice_feedback(conversation_id, user_id);

-- RLS Policies cho voice_feedback
ALTER TABLE public.voice_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own feedback" ON public.voice_feedback;
CREATE POLICY "Users can view own feedback"
  ON public.voice_feedback FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own feedback" ON public.voice_feedback;
CREATE POLICY "Users can insert own feedback"
  ON public.voice_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own feedback" ON public.voice_feedback;
CREATE POLICY "Users can update own feedback"
  ON public.voice_feedback FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own feedback" ON public.voice_feedback;
CREATE POLICY "Users can delete own feedback"
  ON public.voice_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.voice_feedback IS 'Phản hồi và đánh giá kỹ năng tiếng Việt từ AI';
COMMENT ON COLUMN public.voice_feedback.category_scores IS 'Array JSON chứa điểm chi tiết cho từng kỹ năng';
COMMENT ON COLUMN public.voice_feedback.vocabulary_suggestions IS 'Danh sách từ vựng gợi ý học thêm';

-- =====================================================
-- TABLE 5: user_voice_stats
-- Thống kê voice chat của người dùng (table trung gian)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_voice_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Thống kê tổng quan
  total_conversation_time INTEGER DEFAULT 0,            -- Tổng thời gian (seconds)
  total_conversation_count INTEGER DEFAULT 0,           -- Tổng số cuộc hội thoại
  completed_conversation_count INTEGER DEFAULT 0,       -- Số cuộc đã hoàn thành

  -- Điểm trung bình
  average_total_score NUMERIC(5,2),                     -- Điểm TB tổng thể
  average_pronunciation_score NUMERIC(5,2),             -- Điểm TB phát âm
  average_grammar_score NUMERIC(5,2),                   -- Điểm TB ngữ pháp
  average_vocabulary_score NUMERIC(5,2),                -- Điểm TB từ vựng
  average_communication_score NUMERIC(5,2),             -- Điểm TB giao tiếp
  average_fluency_score NUMERIC(5,2),                   -- Điểm TB độ trôi chảy

  -- Level hiện tại
  current_level VARCHAR(50) DEFAULT 'beginner' CHECK (current_level IN ('beginner', 'intermediate', 'advanced')),

  -- Streaks
  current_streak_days INTEGER DEFAULT 0,                -- Streak hiện tại
  longest_streak_days INTEGER DEFAULT 0,                -- Streak dài nhất
  last_conversation_date DATE,                          -- Ngày cuộc hội thoại cuối

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: Mỗi user chỉ có 1 record
CREATE UNIQUE INDEX IF NOT EXISTS user_voice_stats_user_id_unique_idx ON public.user_voice_stats(user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS user_voice_stats_level_idx ON public.user_voice_stats(current_level);
CREATE INDEX IF NOT EXISTS user_voice_stats_score_idx ON public.user_voice_stats(average_total_score DESC);
CREATE INDEX IF NOT EXISTS user_voice_stats_streak_idx ON public.user_voice_stats(current_streak_days DESC);

-- RLS Policies cho user_voice_stats
ALTER TABLE public.user_voice_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stats" ON public.user_voice_stats;
CREATE POLICY "Users can view own stats"
  ON public.user_voice_stats FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_voice_stats;
CREATE POLICY "Users can insert own stats"
  ON public.user_voice_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stats" ON public.user_voice_stats;
CREATE POLICY "Users can update own stats"
  ON public.user_voice_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.user_voice_stats IS 'Thống kê voice chat của người dùng (không trực tiếp update user_profiles)';
COMMENT ON COLUMN public.user_voice_stats.current_streak_days IS 'Số ngày liên tiếp có voice chat';

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers cho updated_at
DROP TRIGGER IF EXISTS update_voice_topics_updated_at ON public.voice_topics;
CREATE TRIGGER update_voice_topics_updated_at
  BEFORE UPDATE ON public.voice_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_conversations_updated_at ON public.voice_conversations;
CREATE TRIGGER update_voice_conversations_updated_at
  BEFORE UPDATE ON public.voice_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_feedback_updated_at ON public.voice_feedback;
CREATE TRIGGER update_voice_feedback_updated_at
  BEFORE UPDATE ON public.voice_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_voice_stats_updated_at ON public.user_voice_stats;
CREATE TRIGGER update_user_voice_stats_updated_at
  BEFORE UPDATE ON public.user_voice_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Tự động tăng usage_count khi tạo conversation
CREATE OR REPLACE FUNCTION increment_topic_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.topic_id IS NOT NULL THEN
    UPDATE public.voice_topics
    SET usage_count = usage_count + 1
    WHERE id = NEW.topic_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_topic_usage ON public.voice_conversations;
CREATE TRIGGER increment_topic_usage
  AFTER INSERT ON public.voice_conversations
  FOR EACH ROW
  EXECUTE FUNCTION increment_topic_usage_count();

-- Function: Tự động cập nhật has_feedback khi tạo feedback
CREATE OR REPLACE FUNCTION update_conversation_feedback_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.voice_conversations
  SET has_feedback = TRUE
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_feedback ON public.voice_feedback;
CREATE TRIGGER update_conversation_feedback
  AFTER INSERT ON public.voice_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_feedback_status();

-- =====================================================
-- SEED DATA - Voice Topics
-- Dữ liệu mẫu cho các chủ đề hội thoại
-- =====================================================

-- Xóa dữ liệu cũ nếu có (optional - comment out nếu không muốn xóa)
-- DELETE FROM public.voice_topics;

INSERT INTO public.voice_topics (title, description, difficulty_level, icon_name, sample_prompts, vocabulary_focus, grammar_focus, display_order)
VALUES
  -- BEGINNER LEVEL
  (
    'Giới thiệu bản thân',
    'Học cách giới thiệu tên, tuổi, quê quán và nghề nghiệp bằng tiếng Việt',
    'beginner',
    'User',
    ARRAY[
      'Bạn tên là gì?',
      'Bạn bao nhiêu tuổi?',
      'Bạn đến từ đâu?',
      'Bạn làm nghề gì?',
      'Bạn sống ở đâu?'
    ],
    ARRAY['tên', 'tuổi', 'quê quán', 'nghề nghiệp', 'xin chào', 'tạm biệt'],
    ARRAY['Câu hỏi với "gì", "đâu", "bao nhiêu"', 'Cấu trúc "Tôi là..."', 'Sử dụng "ở"'],
    1
  ),
  (
    'Chào hỏi hàng ngày',
    'Thực hành các câu chào hỏi cơ bản trong giao tiếp hàng ngày',
    'beginner',
    'MessageCircle',
    ARRAY[
      'Chào bạn, bạn khỏe không?',
      'Hôm nay bạn thế nào?',
      'Hẹn gặp lại bạn!',
      'Cảm ơn bạn!',
      'Xin lỗi!'
    ],
    ARRAY['chào', 'khỏe', 'cảm ơn', 'xin lỗi', 'tạm biệt', 'hẹn gặp lại'],
    ARRAY['Câu hỏi yes/no', 'Cách dùng "không"', 'Cảm thán'],
    2
  ),
  (
    'Gia đình',
    'Nói về các thành viên trong gia đình và mối quan hệ',
    'beginner',
    'Users',
    ARRAY[
      'Gia đình bạn có bao nhiêu người?',
      'Bố mẹ bạn làm nghề gì?',
      'Bạn có anh chị em không?',
      'Bạn có con chưa?'
    ],
    ARRAY['bố', 'mẹ', 'anh', 'chị', 'em', 'con', 'gia đình', 'người'],
    ARRAY['Đại từ nhân xưng trong gia đình', 'Sử dụng "có"'],
    3
  ),
  (
    'Đi chợ mua sắm',
    'Học cách hỏi giá, mua bán và trả giá tại chợ',
    'beginner',
    'ShoppingCart',
    ARRAY[
      'Cái này bao nhiêu tiền?',
      'Có rẻ hơn không?',
      'Cho tôi xem cái kia',
      'Tôi mua 2 cái',
      'Đắt quá!'
    ],
    ARRAY['tiền', 'bao nhiêu', 'rẻ', 'đắt', 'mua', 'bán', 'cái này', 'cái kia'],
    ARRAY['Số đếm', 'Danh từ chỉ vật', 'Câu cảm thán'],
    4
  ),

  -- INTERMEDIATE LEVEL
  (
    'Hỏi đường dẫn',
    'Thực hành hỏi đường và chỉ đường trong thành phố',
    'intermediate',
    'MapPin',
    ARRAY[
      'Làm sao để đến bưu điện?',
      'Từ đây đến bệnh viện xa không?',
      'Tôi đi đường nào?',
      'Quẹo trái hay quẹo phải?',
      'Đi thẳng bao xa?'
    ],
    ARRAY['đường', 'trái', 'phải', 'thẳng', 'quẹo', 'gần', 'xa', 'đến'],
    ARRAY['Câu hỏi "làm sao"', 'Giới từ chỉ phương hướng', 'Khoảng cách'],
    5
  ),
  (
    'Gọi món ăn',
    'Thực hành gọi món tại nhà hàng và quán ăn',
    'intermediate',
    'Utensils',
    ARRAY[
      'Cho tôi xem thực đơn',
      'Tôi muốn gọi món',
      'Món này có cay không?',
      'Làm ơn cho thêm đá',
      'Tính tiền cho tôi'
    ],
    ARRAY['thực đơn', 'món ăn', 'cay', 'ngon', 'đá', 'nước', 'tính tiền', 'gọi món'],
    ARRAY['Câu yêu cầu lịch sự', 'Tính từ mô tả món ăn', 'Số lượng'],
    6
  ),
  (
    'Thời tiết',
    'Nói về thời tiết và các hiện tượng tự nhiên',
    'intermediate',
    'Cloud',
    ARRAY[
      'Hôm nay thời tiết thế nào?',
      'Trời có mưa không?',
      'Nóng quá!',
      'Trời se lạnh',
      'Mai trời đẹp không?'
    ],
    ARRAY['thời tiết', 'nóng', 'lạnh', 'mưa', 'nắng', 'gió', 'trời', 'se lạnh'],
    ARRAY['Tính từ mô tả thời tiết', 'Câu dự đoán tương lai', 'Câu cảm thán'],
    7
  ),
  (
    'Sở thích và hobbies',
    'Trò chuyện về sở thích, thể thao và giải trí',
    'intermediate',
    'Heart',
    ARRAY[
      'Bạn thích làm gì?',
      'Bạn có sở thích gì?',
      'Bạn thích chơi thể thao không?',
      'Bạn thường làm gì vào cuối tuần?',
      'Bạn thích âm nhạc loại nào?'
    ],
    ARRAY['thích', 'sở thích', 'thể thao', 'âm nhạc', 'xem phim', 'đọc sách', 'chơi game'],
    ARRAY['Động từ chỉ sở thích', 'Trạng từ tần suất', 'Câu hỏi về thói quen'],
    8
  ),

  -- ADVANCED LEVEL
  (
    'Cuộc sống công sở',
    'Thảo luận về công việc, đồng nghiệp và môi trường làm việc',
    'advanced',
    'Briefcase',
    ARRAY[
      'Công việc của bạn như thế nào?',
      'Bạn làm việc với ai?',
      'Áp lực công việc có lớn không?',
      'Bạn có thích công ty hiện tại không?',
      'Bạn muốn thăng tiến không?'
    ],
    ARRAY['công việc', 'đồng nghiệp', 'sếp', 'dự án', 'họp', 'thăng tiến', 'lương', 'áp lực'],
    ARRAY['Câu phức với "mặc dù"', 'Động từ chỉ hoạt động công việc', 'Câu điều kiện'],
    9
  ),
  (
    'Du lịch Việt Nam',
    'Trò chuyện về các địa điểm du lịch, văn hóa và ẩm thực Việt',
    'advanced',
    'Plane',
    ARRAY[
      'Bạn đã đi đâu ở Việt Nam?',
      'Món ăn Việt nào bạn thích nhất?',
      'Bạn biết gì về lịch sử Việt Nam?',
      'Bạn thấy văn hóa Việt thế nào?',
      'Bạn muốn đi tham quan đâu tiếp theo?'
    ],
    ARRAY['du lịch', 'danh lam thắng cảnh', 'ẩm thực', 'văn hóa', 'lịch sử', 'tham quan'],
    ARRAY['Thì quá khứ', 'So sánh hơn/nhất', 'Câu phức'],
    10
  ),
  (
    'Thảo luận xã hội',
    'Bàn luận về các vấn đề xã hội, môi trường và giáo dục',
    'advanced',
    'Globe',
    ARRAY[
      'Bạn nghĩ gì về vấn đề môi trường?',
      'Giáo dục ở Việt Nam có tốt không?',
      'Công nghệ ảnh hưởng như thế nào đến cuộc sống?',
      'Bạn lo lắng về vấn đề gì?',
      'Theo bạn, giải pháp là gì?'
    ],
    ARRAY['vấn đề', 'môi trường', 'giáo dục', 'công nghệ', 'xã hội', 'giải pháp', 'ảnh hưởng'],
    ARRAY['Câu hỏi ý kiến', 'Câu phức với quan hệ từ', 'Cấu trúc "theo tôi"'],
    11
  ),
  (
    'Kể chuyện và chia sẻ kinh nghiệm',
    'Luyện tập kể lại sự kiện, câu chuyện và kinh nghiệm cá nhân',
    'advanced',
    'BookOpen',
    ARRAY[
      'Kể cho tôi nghe về...',
      'Bạn đã từng trải qua điều gì đặc biệt?',
      'Lần đầu tiên bạn... như thế nào?',
      'Bạn học được gì từ kinh nghiệm đó?',
      'Nếu được quay lại, bạn sẽ làm gì khác?'
    ],
    ARRAY['kinh nghiệm', 'trải nghiệm', 'sự kiện', 'kỷ niệm', 'bài học', 'cảm xúc'],
    ARRAY['Thì quá khứ phức tạp', 'Liên từ kết nối ý', 'Câu điều kiện loại 2', 'Diễn đạt cảm xúc'],
    12
  )

ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- Uncomment để kiểm tra sau khi chạy migration
-- =====================================================

-- SELECT 'voice_topics' as table_name, COUNT(*) as row_count FROM public.voice_topics
-- UNION ALL
-- SELECT 'voice_conversations', COUNT(*) FROM public.voice_conversations
-- UNION ALL
-- SELECT 'voice_transcripts', COUNT(*) FROM public.voice_transcripts
-- UNION ALL
-- SELECT 'voice_feedback', COUNT(*) FROM public.voice_feedback
-- UNION ALL
-- SELECT 'user_voice_stats', COUNT(*) FROM public.user_voice_stats;

-- =====================================================
-- MIGRATION COMPLETED
-- =====================================================
-- Tất cả tables, indexes, policies và seed data đã được tạo
-- Bạn có thể bắt đầu sử dụng ngay!
-- =====================================================
