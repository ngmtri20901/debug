# 🚀 Quick Start Guide - Voice Chat Migration

## ✅ Phase 1: Database Setup - HOÀN TẤT

### 📁 Files đã tạo

```
shared/lib/supabase/migrations/
├── 001_voice_chat_tables.sql    ← Main migration (CHẠY FILE NÀY!)
├── verify_schema.sql             ← Kiểm tra sau khi chạy
├── rollback.sql                  ← Rollback nếu cần (cẩn thận!)
├── README.md                     ← Hướng dẫn chi tiết
└── QUICK_START.md                ← File này
```

---

## 🎯 HƯỚNG DẪN CHẠY MIGRATION - 3 BƯỚC ĐƠN GIẢN

### Bước 1️⃣: Mở Supabase SQL Editor

1. Vào: https://supabase.com/dashboard
2. Chọn project: **frontend-viovietnamese**
3. Click **SQL Editor** (icon database bên trái)
4. Click **New Query**

### Bước 2️⃣: Copy & Run Migration

1. Mở file: `001_voice_chat_tables.sql`
2. **Copy toàn bộ nội dung** (Ctrl+A, Ctrl+C)
3. **Paste** vào SQL Editor
4. Click **Run** (hoặc nhấn Ctrl+Enter)
5. Đợi ~10 giây ⏳

### Bước 3️⃣: Verify kết quả

**Cách 1: Quick check**
```sql
SELECT COUNT(*) FROM public.voice_topics;
-- Kết quả mong đợi: 12 (12 topics đã seed)
```

**Cách 2: Full verification**
1. Tạo **New Query** mới
2. Copy & paste toàn bộ nội dung file `verify_schema.sql`
3. Click **Run**
4. Xem kết quả chi tiết về tables, indexes, RLS, triggers...

---

## ✨ Những gì đã được tạo

### 🗃️ 5 Tables

| Table | Mô tả | Records |
|-------|-------|---------|
| `voice_topics` | Chủ đề hội thoại | 12 topics (seeded) |
| `voice_conversations` | Phiên chat của user | 0 (empty) |
| `voice_transcripts` | Chi tiết transcript | 0 (empty) |
| `voice_feedback` | Feedback từ AI | 0 (empty) |
| `user_voice_stats` | Thống kê user | 0 (empty) |

### 🎨 12 Topics được seed

**Beginner (4):**
- Giới thiệu bản thân
- Chào hỏi hàng ngày
- Gia đình
- Đi chợ mua sắm

**Intermediate (4):**
- Hỏi đường dẫn
- Gọi món ăn
- Thời tiết
- Sở thích và hobbies

**Advanced (4):**
- Cuộc sống công sở
- Du lịch Việt Nam
- Thảo luận xã hội
- Kể chuyện và chia sẻ kinh nghiệm

### 🔐 Security

- ✅ Row Level Security (RLS) enabled
- ✅ Users chỉ thấy data của mình
- ✅ CASCADE delete khi xóa user/conversation
- ✅ Indexes tối ưu cho performance

### ⚡ Auto Triggers

- ✅ `updated_at` tự động update
- ✅ `usage_count` tăng khi topic được dùng
- ✅ `has_feedback` set TRUE khi có feedback

---

## 📊 Xem data sau khi chạy

### Trong Supabase Dashboard:

1. Vào **Table Editor** (icon table bên trái)
2. Chọn table `voice_topics`
3. Thấy 12 rows với đầy đủ thông tin

### Query mẫu:

```sql
-- Xem tất cả topics
SELECT id, title, difficulty_level, display_order
FROM public.voice_topics
ORDER BY display_order;

-- Xem topics theo level
SELECT difficulty_level, COUNT(*) as count
FROM public.voice_topics
GROUP BY difficulty_level;

-- Xem sample prompts của 1 topic
SELECT title, sample_prompts, vocabulary_focus
FROM public.voice_topics
WHERE title = 'Giới thiệu bản thân';
```

---

## ⚠️ Troubleshooting

### ❌ Lỗi: "permission denied"
**Giải pháp:** Đảm bảo bạn là owner/admin của Supabase project

### ❌ Lỗi: "relation already exists"
**Giải pháp:** Table đã tồn tại, an toàn bỏ qua (migration có `IF NOT EXISTS`)

### ❌ Seed data = 0
**Nguyên nhân:** Có thể do data đã tồn tại
**Kiểm tra:**
```sql
SELECT COUNT(*) FROM public.voice_topics;
```

### ❌ Muốn chạy lại từ đầu
**Giải pháp:**
1. Chạy file `rollback.sql` để xóa tất cả
2. Chạy lại file `001_voice_chat_tables.sql`

---

## ✅ Checklist hoàn thành Phase 1

- [ ] Đã chạy `001_voice_chat_tables.sql` thành công
- [ ] Chạy `verify_schema.sql` và thấy 5 tables
- [ ] `voice_topics` có 12 records
- [ ] RLS policies hiển thị đúng
- [ ] Triggers và functions được tạo

**Nếu tất cả ✅, bạn đã hoàn thành Phase 1!**

---

## 🎯 Next Steps - Phase 2

Sau khi hoàn thành Phase 1, báo lại để tiếp tục:

**Phase 2: Migrate Actions**
- Xóa Firebase auth actions
- Viết lại data actions với Supabase
- Update TypeScript types

**Phase 3: Update UI/UX**
- Chuyển context từ Interview → Vietnamese Learning
- Update Vapi prompts
- Update feedback schema

---

## 📞 Cần giúp đỡ?

1. Kiểm tra file `README.md` để có hướng dẫn chi tiết hơn
2. Chạy `verify_schema.sql` để debug
3. Xem Supabase logs: Dashboard → Logs → Postgres Logs

---

**🎉 Chúc bạn thành công!**
