# 📊 Database Schema Diagram - Voice Chat Feature

## 🗂️ Entity Relationship Diagram

```
┌─────────────────────────┐
│   auth.users            │ (Supabase Auth - Existing)
│   (Supabase built-in)   │
└───────────┬─────────────┘
            │
            │ 1:1
            │
┌───────────▼──────────────────────────────────────────────────┐
│  user_voice_stats                                             │
│  ─────────────────────────────────────────────────────────── │
│  • id (PK)                                                    │
│  • user_id (FK → auth.users)                                 │
│  • total_conversation_time                                   │
│  • total_conversation_count                                  │
│  • average_pronunciation_score                               │
│  • average_grammar_score                                     │
│  • current_level (beginner/intermediate/advanced)            │
│  • current_streak_days                                       │
└───────────────────────────────────────────────────────────────┘


┌──────────────────────────┐         ┌─────────────────────────┐
│  voice_topics            │         │   auth.users            │
│  ──────────────────────  │         └──────────┬──────────────┘
│  • id (PK)               │                    │
│  • title                 │                    │ 1:N
│  • difficulty_level      │                    │
│  • sample_prompts[]      │         ┌──────────▼──────────────────────────────────┐
│  • vocabulary_focus[]    │    M:N  │  voice_conversations                        │
│  • grammar_focus[]       │◄────────┤  ─────────────────────────────────────────  │
│  • is_active             │         │  • id (PK)                                  │
│  • usage_count           │         │  • user_id (FK → auth.users)                │
└──────────────────────────┘         │  • topic_id (FK → voice_topics)             │
                                     │  • topic (varchar backup)                   │
                                     │  • difficulty_level                         │
                                     │  • conversation_type                        │
                                     │  • duration_seconds                         │
                                     │  • is_completed                             │
                                     │  • has_feedback                             │
                                     │  • vapi_call_id                             │
                                     └──┬──────────────────────────────────────┬───┘
                                        │                                      │
                                        │ 1:N                                  │ 1:1
                                        │                                      │
              ┌─────────────────────────▼───────────┐    ┌──────────────────▼──────────────────────────┐
              │  voice_transcripts                  │    │  voice_feedback                             │
              │  ─────────────────────────────────  │    │  ─────────────────────────────────────────  │
              │  • id (PK)                          │    │  • id (PK)                                  │
              │  • conversation_id (FK)             │    │  • conversation_id (FK, UNIQUE)             │
              │  • role (user/assistant/system)     │    │  • user_id (FK → auth.users)                │
              │  • content (text)                   │    │  • total_score (0-100)                      │
              │  • timestamp_ms                     │    │  • category_scores (JSONB)                  │
              │  • sequence_number                  │    │  • strengths[]                              │
              │  • vapi_message_type                │    │  • areas_for_improvement[]                  │
              │  • raw_vapi_data (JSONB)            │    │  • vocabulary_suggestions (JSONB)           │
              └─────────────────────────────────────┘    │  • grammar_notes[]                          │
                                                         │  • pronunciation_tips[]                     │
                                                         │  • ai_model (gemini-2.0-flash-001)          │
                                                         └─────────────────────────────────────────────┘
```

---

## 📋 Table Details

### 1. **voice_topics** (Seed: 12 records)
**Purpose:** Danh sách chủ đề hội thoại chuẩn bị sẵn

**Key Fields:**
- `title` - Tên chủ đề (VD: "Giới thiệu bản thân")
- `difficulty_level` - beginner | intermediate | advanced
- `sample_prompts[]` - Mảng câu hỏi mẫu cho AI
- `vocabulary_focus[]` - Từ vựng trọng tâm
- `usage_count` - Auto increment khi được dùng

**RLS:** Public read (ai cũng xem được)

---

### 2. **voice_conversations**
**Purpose:** Lưu mỗi phiên voice chat của user

**Key Fields:**
- `user_id` - User sở hữu conversation
- `topic_id` - Link đến voice_topics (nullable)
- `conversation_type` - free_talk | scenario_based | vocabulary_practice | pronunciation_drill
- `vapi_call_id` - ID từ Vapi.ai để tracking
- `duration_seconds` - Thời lượng cuộc gọi
- `is_completed` - Đã hoàn thành chưa
- `has_feedback` - Đã có feedback chưa (auto-set bởi trigger)

**RLS:** User chỉ CRUD conversations của mình

**Relationships:**
- N:1 với auth.users
- M:N với voice_topics
- 1:N với voice_transcripts
- 1:1 với voice_feedback

---

### 3. **voice_transcripts**
**Purpose:** Lưu từng câu nói trong conversation

**Key Fields:**
- `conversation_id` - Thuộc conversation nào
- `role` - user | assistant | system
- `content` - Nội dung câu nói
- `timestamp_ms` - Thời điểm trong cuộc gọi (milliseconds)
- `sequence_number` - Thứ tự message
- `raw_vapi_data` - JSON gốc từ Vapi (để debug)

**RLS:** User chỉ xem transcripts của conversations mình sở hữu

**Use case:**
- Hiển thị lịch sử chat
- Phân tích ngữ pháp/từ vựng
- Generate feedback

---

### 4. **voice_feedback**
**Purpose:** AI đánh giá kỹ năng tiếng Việt của user

**Key Fields:**
- `conversation_id` - UNIQUE constraint (1 conversation = 1 feedback)
- `total_score` - Điểm tổng (0-100)
- `category_scores` - JSONB array:
  ```json
  [
    {"name": "Phát âm", "score": 85, "comment": "..."},
    {"name": "Ngữ pháp", "score": 75, "comment": "..."},
    {"name": "Từ vựng", "score": 80, "comment": "..."},
    {"name": "Giao tiếp", "score": 90, "comment": "..."},
    {"name": "Độ trôi chảy", "score": 85, "comment": "..."}
  ]
  ```
- `vocabulary_suggestions` - JSONB array từ vựng nên học
- `grammar_notes[]` - Lưu ý ngữ pháp
- `pronunciation_tips[]` - Gợi ý phát âm
- `ai_model` - Model AI đã dùng (tracking)

**RLS:** User chỉ xem feedback của mình

**Trigger:** Khi insert → auto set `voice_conversations.has_feedback = TRUE`

---

### 5. **user_voice_stats** (Table trung gian)
**Purpose:** Thống kê tổng hợp của user (thay vì update user_profiles)

**Key Fields:**
- `user_id` - UNIQUE (1 user = 1 record)
- `total_conversation_time` - Tổng thời gian (seconds)
- `total_conversation_count` - Số lượng conversations
- `average_*_score` - Điểm trung bình các kỹ năng
- `current_level` - Level hiện tại
- `current_streak_days` - Streak liên tiếp
- `last_conversation_date` - Ngày chat cuối

**RLS:** User chỉ xem stats của mình

**Update method:** Sẽ có function/trigger cập nhật stats (Phase 2)

---

## 🔗 Relationships Summary

```
auth.users (1) ──────── (N) voice_conversations
auth.users (1) ──────── (1) user_voice_stats

voice_topics (M) ──────── (N) voice_conversations

voice_conversations (1) ── (N) voice_transcripts
voice_conversations (1) ── (1) voice_feedback
voice_conversations (N) ── (1) auth.users
```

---

## 🔐 Security (RLS Policies)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| voice_topics | ✅ Public (is_active=true) | ❌ | ❌ | ❌ |
| voice_conversations | ✅ Own only | ✅ Own only | ✅ Own only | ✅ Own only |
| voice_transcripts | ✅ Own conv only | ✅ Own conv only | ❌ | ✅ Own conv only |
| voice_feedback | ✅ Own only | ✅ Own only | ✅ Own only | ✅ Own only |
| user_voice_stats | ✅ Own only | ✅ Own only | ✅ Own only | ❌ |

---

## ⚡ Auto Triggers

### 1. `update_updated_at_column()`
**Applies to:** All tables (voice_topics, voice_conversations, voice_feedback, user_voice_stats)
**Action:** Auto update `updated_at = NOW()` trước khi UPDATE

### 2. `increment_topic_usage_count()`
**Applies to:** voice_conversations (AFTER INSERT)
**Action:** Tăng `voice_topics.usage_count` khi topic được sử dụng

### 3. `update_conversation_feedback_status()`
**Applies to:** voice_feedback (AFTER INSERT)
**Action:** Set `voice_conversations.has_feedback = TRUE`

---

## 📈 Indexes for Performance

### voice_topics
- `difficulty_level` (BTREE)
- `is_active, display_order` (BTREE composite)
- `usage_count DESC` (BTREE)

### voice_conversations
- `user_id` (BTREE)
- `topic_id` (BTREE)
- `created_at DESC` (BTREE)
- `user_id, created_at DESC` (BTREE composite)
- `search_vector` (GIN - full-text search)

### voice_transcripts
- `conversation_id` (BTREE)
- `conversation_id, sequence_number` (BTREE composite)
- `timestamp_ms` (BTREE)
- `role` (BTREE)

### voice_feedback
- `conversation_id` (BTREE)
- `user_id` (BTREE)
- `user_id, created_at DESC` (BTREE composite)
- `total_score DESC` (BTREE)
- `conversation_id, user_id` (UNIQUE index)

### user_voice_stats
- `user_id` (UNIQUE)
- `current_level` (BTREE)
- `average_total_score DESC` (BTREE)
- `current_streak_days DESC` (BTREE)

---

## 🎯 Data Flow Example

### User starts a voice conversation:

```
1. User clicks "Giới thiệu bản thân" topic
   ↓
2. INSERT into voice_conversations
   - user_id = current_user.id
   - topic_id = selected_topic.id
   - status = 'active'
   ↓
3. TRIGGER: increment_topic_usage_count()
   - voice_topics.usage_count += 1
   ↓
4. Vapi call starts
   ↓
5. For each message → INSERT into voice_transcripts
   - conversation_id
   - role (user/assistant)
   - content
   - timestamp_ms
   ↓
6. Call ends → UPDATE voice_conversations
   - status = 'completed'
   - is_completed = true
   - duration_seconds = X
   ↓
7. Generate feedback → INSERT into voice_feedback
   - Analyze all voice_transcripts
   - Generate scores with Gemini AI
   ↓
8. TRIGGER: update_conversation_feedback_status()
   - voice_conversations.has_feedback = true
   ↓
9. (Phase 2) UPDATE user_voice_stats
   - Recalculate averages
   - Update streak
```

---

## 💾 Estimated Storage

### For 1000 users, each doing 10 conversations/month:

| Table | Records/month | Size estimate |
|-------|---------------|---------------|
| voice_topics | 12 (static) | ~50 KB |
| voice_conversations | 10,000 | ~2 MB |
| voice_transcripts | ~500,000 (50/conv) | ~100 MB |
| voice_feedback | 10,000 | ~5 MB |
| user_voice_stats | 1,000 | ~200 KB |
| **TOTAL** | | **~107 MB/month** |

After 1 year: ~1.3 GB (very manageable for Supabase free tier: 500 MB, paid: unlimited)

---

## 🔄 Migration Version

**Version:** 001
**Created:** 2024
**Status:** ✅ Ready to deploy
**Rollback:** Available (`rollback.sql`)
