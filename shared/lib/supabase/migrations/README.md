# Voice Chat Database Migrations

## 📋 Tổng quan

Migration này tạo toàn bộ database schema cho tính năng **Voice Chat** trong ứng dụng học tiếng Việt với Vapi.ai.

## 🗂️ Tables được tạo

1. **`voice_topics`** - Danh sách chủ đề hội thoại (12 chủ đề mẫu)
2. **`voice_conversations`** - Các phiên hội thoại của người dùng
3. **`voice_transcripts`** - Chi tiết transcript từng câu nói
4. **`voice_feedback`** - Phản hồi AI về kỹ năng ngôn ngữ
5. **`user_voice_stats`** - Thống kê voice chat (table trung gian)

## 🚀 Cách chạy Migration

### Bước 1: Mở Supabase Dashboard
1. Truy cập: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào mục **SQL Editor** (biểu tượng database ở sidebar)

### Bước 2: Tạo Query mới
1. Click nút **"New Query"**
2. Copy toàn bộ nội dung file `001_voice_chat_tables.sql`
3. Paste vào SQL Editor

### Bước 3: Chạy Migration
1. Click nút **"Run"** (hoặc Ctrl/Cmd + Enter)
2. Đợi ~5-10 giây để hoàn thành
3. Kiểm tra kết quả

## ✅ Kiểm tra sau khi chạy

### 1. Kiểm tra Tables
Chạy query sau trong SQL Editor:

```sql
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE 'voice_%'
ORDER BY table_name;
```

Kết quả mong đợi: 5 tables (voice_topics, voice_conversations, voice_transcripts, voice_feedback, user_voice_stats)

### 2. Kiểm tra Seed Data
Chạy query:

```sql
SELECT difficulty_level, COUNT(*) as topic_count
FROM public.voice_topics
GROUP BY difficulty_level
ORDER BY difficulty_level;
```

Kết quả mong đợi:
- beginner: 4 topics
- intermediate: 4 topics
- advanced: 4 topics

### 3. Kiểm tra RLS Policies
Chạy query:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename LIKE 'voice_%'
ORDER BY tablename, policyname;
```

Kết quả: Mỗi table có 3-4 policies (SELECT, INSERT, UPDATE, DELETE)

### 4. Kiểm tra Indexes
Chạy query:

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename LIKE 'voice_%'
ORDER BY tablename, indexname;
```

## 📊 Seed Data - 12 Chủ đề mẫu

### Beginner (4 chủ đề)
1. Giới thiệu bản thân
2. Chào hỏi hàng ngày
3. Gia đình
4. Đi chợ mua sắm

### Intermediate (4 chủ đề)
5. Hỏi đường dẫn
6. Gọi món ăn
7. Thời tiết
8. Sở thích và hobbies

### Advanced (4 chủ đề)
9. Cuộc sống công sở
10. Du lịch Việt Nam
11. Thảo luận xã hội
12. Kể chuyện và chia sẻ kinh nghiệm

## 🔐 Row Level Security (RLS)

Tất cả tables đã có RLS policies đảm bảo:
- ✅ User chỉ xem được data của mình
- ✅ User chỉ tạo/sửa/xóa data của mình
- ✅ `voice_topics` public (ai cũng xem được)
- ✅ Cascade delete khi xóa conversation/user

## 🔧 Triggers tự động

1. **`updated_at`** - Tự động cập nhật timestamp khi update record
2. **`usage_count`** - Tự động tăng khi topic được sử dụng
3. **`has_feedback`** - Tự động set TRUE khi có feedback

## 🗃️ Schema Relationships

```
auth.users (Supabase Auth)
    ↓
user_voice_stats (1:1)
    ↓
voice_conversations (1:N)
    ↓                ↓
voice_transcripts  voice_feedback
    (N:1)             (1:1)

voice_topics (M:N với voice_conversations)
```

## 📝 TypeScript Types

Sau khi chạy migration, cập nhật TypeScript types:

```bash
# Generate types từ Supabase (optional)
npx supabase gen types typescript --project-id <PROJECT_ID> > shared/lib/supabase/database.types.ts
```

## ⚠️ Lưu ý quan trọng

1. **Chạy 1 lần duy nhất**: Migration có `IF NOT EXISTS`, chạy nhiều lần không sao
2. **Không xóa user_profiles**: Migration không touch vào table này
3. **Seed data**: Chạy lại sẽ skip (ON CONFLICT DO NOTHING)
4. **RLS**: Đảm bảo user đã login mới insert được data

## 🐛 Troubleshooting

### Lỗi: "permission denied"
→ Đảm bảo bạn là owner/admin của Supabase project

### Lỗi: "relation already exists"
→ Bỏ qua (safe), table đã tồn tại

### Seed data không insert
→ Có thể đã có data, check bằng: `SELECT COUNT(*) FROM voice_topics;`

## 📞 Next Steps

Sau khi chạy migration thành công:

1. ✅ Test insert/select data qua Supabase Table Editor
2. ✅ Update TypeScript types trong code
3. ✅ Chuyển sang Phase 2: Migrate Actions
4. ✅ Test RLS bằng cách login với user khác nhau

## 📚 Tài liệu tham khảo

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/trigger-definition.html)
- [Supabase Database](https://supabase.com/docs/guides/database)
