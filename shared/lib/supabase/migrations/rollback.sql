-- =====================================================
-- ROLLBACK SCRIPT - VOICE CHAT TABLES
-- ⚠️ CẢNH BÁO: Script này sẽ XÓA TOÀN BỘ data!
-- =====================================================
--
-- Chỉ sử dụng khi:
-- 1. Cần rollback migration trong quá trình development
-- 2. Cần reset database để test lại
-- 3. Phát hiện lỗi nghiêm trọng cần fix
--
-- ⛔ KHÔNG chạy trên production khi đã có user data!
--
-- =====================================================

-- Xác nhận trước khi chạy
DO $$
BEGIN
  RAISE NOTICE '⚠️  BẠN SẮP XÓA TOÀN BỘ VOICE CHAT DATA!';
  RAISE NOTICE '⚠️  Nhấn Ctrl+C để hủy trong 3 giây...';
  PERFORM pg_sleep(3);
  RAISE NOTICE '▶️  Bắt đầu rollback...';
END $$;

-- =====================================================
-- BƯỚC 1: DROP TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS update_voice_topics_updated_at ON public.voice_topics;
DROP TRIGGER IF EXISTS update_voice_conversations_updated_at ON public.voice_conversations;
DROP TRIGGER IF EXISTS update_voice_feedback_updated_at ON public.voice_feedback;
DROP TRIGGER IF EXISTS update_user_voice_stats_updated_at ON public.user_voice_stats;
DROP TRIGGER IF EXISTS increment_topic_usage ON public.voice_conversations;
DROP TRIGGER IF EXISTS update_conversation_feedback ON public.voice_feedback;

-- =====================================================
-- BƯỚC 2: DROP FUNCTIONS
-- =====================================================
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_topic_usage_count() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_feedback_status() CASCADE;

-- =====================================================
-- BƯỚC 3: DROP TABLES (theo thứ tự dependency)
-- =====================================================

-- Drop tables có foreign key trước
DROP TABLE IF EXISTS public.voice_transcripts CASCADE;
DROP TABLE IF EXISTS public.voice_feedback CASCADE;
DROP TABLE IF EXISTS public.user_voice_stats CASCADE;
DROP TABLE IF EXISTS public.voice_conversations CASCADE;

-- Drop parent table sau cùng
DROP TABLE IF EXISTS public.voice_topics CASCADE;

-- =====================================================
-- BƯỚC 4: VERIFICATION
-- =====================================================

-- Kiểm tra tất cả tables đã bị xóa
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO remaining_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE 'voice_%';

  IF remaining_count = 0 THEN
    RAISE NOTICE '✅ Rollback thành công! Tất cả voice_* tables đã bị xóa.';
  ELSE
    RAISE WARNING '⚠️  Vẫn còn % tables chưa xóa!', remaining_count;
  END IF;
END $$;

-- Kiểm tra functions đã bị xóa
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO remaining_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN (
      'update_updated_at_column',
      'increment_topic_usage_count',
      'update_conversation_feedback_status'
    );

  IF remaining_count = 0 THEN
    RAISE NOTICE '✅ Tất cả functions đã bị xóa.';
  ELSE
    RAISE WARNING '⚠️  Vẫn còn % functions chưa xóa!', remaining_count;
  END IF;
END $$;

-- =====================================================
-- ROLLBACK COMPLETED
-- =====================================================
SELECT
  '✅ ROLLBACK HOÀN TẤT' as status,
  'Tất cả voice chat tables, triggers và functions đã bị xóa' as message;

-- =====================================================
-- HƯỚNG DẪN SAU KHI ROLLBACK
-- =====================================================
/*
Sau khi rollback, bạn có thể:

1. Chạy lại migration:
   - Chạy file: 001_voice_chat_tables.sql

2. Kiểm tra lại schema:
   - Chạy file: verify_schema.sql

3. Test lại từ đầu
*/
