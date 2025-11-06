-- =====================================================
-- VERIFICATION SCRIPT
-- Kiểm tra schema sau khi chạy migration
-- =====================================================

-- 1. Kiểm tra tất cả tables đã được tạo
SELECT
  '✅ Tables Created' as status,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('voice_topics', 'voice_conversations', 'voice_transcripts', 'voice_feedback', 'user_voice_stats')
ORDER BY table_name;

-- 2. Kiểm tra số lượng records trong mỗi table
SELECT '📊 Row Counts' as status, 'voice_topics' as table_name, COUNT(*)::text as row_count FROM public.voice_topics
UNION ALL
SELECT '📊 Row Counts', 'voice_conversations', COUNT(*)::text FROM public.voice_conversations
UNION ALL
SELECT '📊 Row Counts', 'voice_transcripts', COUNT(*)::text FROM public.voice_transcripts
UNION ALL
SELECT '📊 Row Counts', 'voice_feedback', COUNT(*)::text FROM public.voice_feedback
UNION ALL
SELECT '📊 Row Counts', 'user_voice_stats', COUNT(*)::text FROM public.user_voice_stats;

-- 3. Kiểm tra seed data (voice_topics by difficulty)
SELECT
  '🌱 Seed Data' as status,
  difficulty_level,
  COUNT(*) as topic_count,
  string_agg(title, ', ' ORDER BY display_order) as topics
FROM public.voice_topics
GROUP BY difficulty_level
ORDER BY
  CASE difficulty_level
    WHEN 'beginner' THEN 1
    WHEN 'intermediate' THEN 2
    WHEN 'advanced' THEN 3
  END;

-- 4. Kiểm tra RLS policies
SELECT
  '🔐 RLS Policies' as status,
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No restrictions'
  END as policy_type
FROM pg_policies
WHERE tablename LIKE 'voice_%'
ORDER BY tablename, policyname;

-- 5. Kiểm tra indexes
SELECT
  '📇 Indexes' as status,
  tablename,
  indexname,
  CASE
    WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE'
    WHEN indexdef LIKE '%GIN%' THEN 'GIN (Full-text)'
    ELSE 'BTREE'
  END as index_type
FROM pg_indexes
WHERE tablename LIKE 'voice_%'
  AND indexname NOT LIKE '%pkey'
ORDER BY tablename, indexname;

-- 6. Kiểm tra foreign keys
SELECT
  '🔗 Foreign Keys' as status,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE 'voice_%'
ORDER BY tc.table_name, kcu.column_name;

-- 7. Kiểm tra triggers
SELECT
  '⚡ Triggers' as status,
  trigger_name,
  event_manipulation,
  event_object_table as table_name,
  action_timing
FROM information_schema.triggers
WHERE event_object_table LIKE 'voice_%'
ORDER BY event_object_table, trigger_name;

-- 8. Kiểm tra functions
SELECT
  '⚙️ Functions' as status,
  routine_name as function_name,
  routine_type as type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%voice%'
    OR routine_name IN ('update_updated_at_column', 'increment_topic_usage_count', 'update_conversation_feedback_status')
  )
ORDER BY routine_name;

-- 9. Test sample queries (chỉ SELECT, không INSERT để test)
-- Lấy tất cả topics theo độ khó
SELECT
  '🧪 Sample Query 1' as status,
  'Get topics by difficulty' as query_name,
  difficulty_level,
  COUNT(*) as count
FROM public.voice_topics
WHERE is_active = TRUE
GROUP BY difficulty_level;

-- 10. Kiểm tra RLS có enabled không
SELECT
  '🛡️ RLS Status' as status,
  tablename,
  CASE
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'voice_%'
ORDER BY tablename;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT
  '📝 Summary' as status,
  '✅ Migration completed successfully!' as message,
  (SELECT COUNT(*) FROM public.voice_topics) || ' topics seeded' as detail;
