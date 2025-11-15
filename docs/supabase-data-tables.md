# Supabase Database Schema - Vietnamese Learning Platform

## 📋 Tổng quan

Tài liệu này cung cấp thông tin chi tiết về tất cả các bảng (tables) trong cơ sở dữ liệu Supabase của ứng dụng học tiếng Việt, được chia theo từng service chính. Mỗi bảng bao gồm mô tả công dụng, các cột và mối quan hệ với các bảng khác.

## 🏗️ Cấu trúc Database

### Thông tin chung
- **Database**: PostgreSQL 15.8
- **Project ID**: `uavvljncupscxoxofcvp` (Vietnamese Learning App)
- **Region**: Asia Pacific (ap-southeast-1)
- **Total Tables**: 38 tables

---

## 🎯 1. Daily Quests System

### quest_templates
**Mục đích**: Lưu trữ các mẫu quest có thể tái sử dụng để tạo quest hàng ngày và đặc biệt.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất của quest template |
| title | VARCHAR(255) | - | NOT NULL | Tên hiển thị của quest |
| description | TEXT | - | - | Mô tả chi tiết quest |
| category | VARCHAR(50) | - | NOT NULL | Loại quest (flashcard, exercise, streak, etc.) |
| target_type | VARCHAR(50) | - | NOT NULL | Loại tiến trình cần theo dõi |
| base_target | INTEGER | - | NOT NULL | Mục tiêu cơ bản để hoàn thành |
| reward_coins | INTEGER | 50 | - | Số xu thưởng khi hoàn thành |
| difficulty_level | INTEGER | 1 | - | Mức độ khó (1-5) |
| quest_type | VARCHAR(50) | 'daily' | - | Loại quest: daily, weekly, special |
| icon | VARCHAR(50) | - | - | Biểu tượng cho UI |
| is_active | BOOLEAN | true | - | Template có đang hoạt động |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |

### user_quests
**Mục đích**: Theo dõi tiến trình quest riêng lẻ của từng user và trạng thái hoàn thành.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất của user quest |
| user_id | UUID | auth.uid() | FK → user_profiles.id | ID người dùng |
| quest_id | UUID | - | FK → quest_templates.id | ID quest template |
| progress | INTEGER | 0 | - | Tiến trình hiện tại |
| completed_at | TIMESTAMPTZ | - | - | Thời gian hoàn thành |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo quest |
| updated_at | TIMESTAMPTZ | - | - | Thời gian cập nhật |

### user_progress_summary
**Mục đích**: Bảng tổng hợp bị denormalize để tối ưu hiệu suất và hiển thị dashboard thời gian thực.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| user_id | UUID | - | UNIQUE, FK → user_profiles.id | ID người dùng |
| daily_quests | JSONB | [] | - | Quest hàng ngày hiện tại |
| active_quest_count | INTEGER | 0 | - | Số quest đang hoạt động |
| completed_quest_count | INTEGER | 0 | - | Tổng quest đã hoàn thành |
| last_quest_reset | DATE | CURRENT_DATE | - | Lần reset quest hàng ngày cuối |
| total_achievements_unlocked | INTEGER | 0 | - | Tổng achievement đã mở khóa |
| achievement_categories_unlocked | JSONB | {} | - | Các category achievement đã mở |
| total_flashcards_reviewed | INTEGER | 0 | - | Tổng flashcard đã ôn tập |
| total_exercises_completed | INTEGER | 0 | - | Tổng bài tập đã hoàn thành |
| total_study_time_minutes | INTEGER | 0 | - | Tổng thời gian học (phút) |
| total_blog_posts_read | INTEGER | 0 | - | Bài blog đã đọc |
| total_flashcards_created | INTEGER | 0 | - | Flashcard tự tạo |
| current_streak_days | INTEGER | 0 | - | Chuỗi học hiện tại |
| max_streak_days | INTEGER | 0 | - | Chuỗi học dài nhất |
| total_login_days | INTEGER | 0 | - | Tổng ngày đăng nhập |
| best_accuracy_rate | NUMERIC(5,2) | 0.00 | - | Độ chính xác tốt nhất |
| consecutive_perfect_sessions | INTEGER | 0 | - | Số phiên hoàn hảo liên tiếp |
| total_achievements_shared | INTEGER | 0 | - | Achievement đã chia sẻ |
| last_activity | TIMESTAMPTZ | now() | - | Hoạt động cuối cùng |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |

---

## 📝 2. Exercises System

### questions
**Mục đích**: Lưu trữ câu hỏi cho các bài tập, hỗ trợ nhiều loại (multiple-choice, word-matching, dialogue-completion, v.v.).

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | BIGINT | - | PRIMARY KEY, IDENTITY | ID duy nhất của câu hỏi |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| category_id | BIGINT | - | FK → question_categories.id | ID danh mục |
| level | question_level | - | ENUM: easy, medium, hard | Mức độ khó |
| updated_at | TIMESTAMPTZ | - | - | Thời gian cập nhật |
| image_url | JSONB | - | - | Dữ liệu ảnh cho câu hỏi (nếu có) |
| extra_data | JSONB | '{}' | - | Dữ liệu linh hoạt bổ sung (audioUrl, highlight, v.v.) |
| correct_choice_id | TEXT | - | - | ID đáp án đúng trong `question_data.choices` |
| audio_url | JSONB | - | - | Dữ liệu âm thanh (nếu có) |
| question_type | question_type | - | ENUM: multiple-choice, word-matching, ... | Loại câu hỏi |
| question_subtype | question_subtype | - | ENUM: mcq_text_only, mcq_image_question, ... | Biến thể |
| question_data | JSONB | - | - | Payload câu hỏi (choices, context, images, ...)

Ví dụ (sample rows):

```json
{
  "id": 39,
  "category_id": 2,
  "level": "easy",
  "question_type": "multiple-choice",
  "question_subtype": "mcq_text_only",
  "correct_choice_id": "a",
  "question_data": {
    "questionText": "Nghề nghiệp của Lan là gì?",
    "context": "Lan là giáo viên tiểu học...",
    "choices": [
      {"id": "a", "text": "Giáo viên"},
      {"id": "b", "text": "Bác sĩ"},
      {"id": "c", "text": "Công nhân"}
    ]
  }
}
```
```json
{
  "id": 40,
  "category_id": 2,
  "level": "easy",
  "question_type": "multiple-choice",
  "question_subtype": "mcq_image_question",
  "correct_choice_id": "b",
  "question_data": {
    "questionImage": "/images/doctor-hospital.jpg",
    "choices": [
      {"id": "a", "text": "Giáo viên"},
      {"id": "b", "text": "Bác sĩ"},
      {"id": "c", "text": "Nông dân"}
    ]
  }
}
```

<!-- answers: ĐÃ LOẠI BỎ. Lựa chọn/đáp án được nhúng trong trường JSONB `question_data` của bảng `questions`. -->

### question_categories
**Mục đích**: Lưu trữ danh mục để phân loại câu hỏi theo chủ đề.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | BIGINT | - | PRIMARY KEY, IDENTITY | ID duy nhất của danh mục |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| name | VARCHAR(255) | - | - | Tên danh mục |
| parent_id | SMALLINT | - | - | ID danh mục cha |
| sort_order | SMALLINT | - | - | Thứ tự sắp xếp |
| status | SMALLINT | - | - | Trạng thái danh mục |

### practice_sets
**Mục đích**: Lưu trữ các bộ bài tập được nhóm lại để học tập có cấu trúc.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất của practice set |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| description | VARCHAR(255) | - | - | Mô tả bộ bài tập |
| total_question | SMALLINT | - | - | Tổng số câu hỏi |
| num_of_hard | SMALLINT | - | - | Số câu hỏi khó |
| num_of_medium | SMALLINT | - | - | Số câu hỏi trung bình |
| num_of_easy | SMALLINT | - | - | Số câu hỏi dễ |
| status | status | - | ENUM: ACTIVE, INACTIVE, DRAFT | Trạng thái |
| updated_at | TIMESTAMPTZ | - | - | Thời gian cập nhật |
| topic | VARCHAR(255) | - | - | Chủ đề của bộ bài tập |
| reward_coins | INTEGER | 0 | - | Xu thưởng khi hoàn thành |
| topic_id | BIGINT | - | FK → topics.topic_id | Liên kết topic |
| lesson_id | BIGINT | - | FK → lessons.id | Liên kết bài học |
| title | VARCHAR(255) | - | - | Tiêu đề practice set |
| coin_reward | INTEGER | 50 | - | Xu thưởng khi qua bài |
| xp_reward | INTEGER | 100 | - | XP thưởng |
| pass_threshold | NUMERIC | 0.70 | - | Ngưỡng qua bài (tỉ lệ) |
| estimated_duration | INTEGER | - | - | Ước tính thời lượng (phút) |
| is_active | BOOLEAN | true | - | Kích hoạt hiển thị |
| sequence_order | INTEGER | 0 | - | Thứ tự sắp xếp |

Ví dụ (sample row):

```json
{
  "id": "b0cddfcc-99b7-4218-b9ff-94c99b95e7fd",
  "title": "Locations and Workplace - Advanced",
  "total_question": 13,
  "status": "ACTIVE",
  "estimated_duration": 25,
  "is_active": true
}
```

### practice_set_questions
**Mục đích**: Liên kết câu hỏi với các practice set và xác định thứ tự.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | BIGINT | - | PRIMARY KEY, IDENTITY | ID duy nhất |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| question_id | BIGINT | - | FK → questions.id | ID câu hỏi |
| practice_set_id | UUID | - | FK → practice_sets.id | ID practice set |
| sort_order | SMALLINT | - | - | Thứ tự trong practice set |

### practice_results
**Mục đích**: Lưu trữ kết quả làm bài của người dùng để phân tích hiệu suất học tập.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất của kết quả |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| practice_date | DATE | - | - | Ngày làm bài |
| user_id | UUID | auth.uid() | FK → user_profiles.id | ID người dùng |
| practice_set_id | UUID | - | FK → practice_sets.id | ID practice set |
| total_mark | REAL | - | - | Tổng điểm |
| num_of_correct | BIGINT | - | - | Số câu đúng |
| num_of_incorrect | BIGINT | - | - | Số câu sai |
| weak_topics | JSONB | - | - | Chủ đề yếu |
| time_taken | TIME | - | - | Thời gian làm bài |
| updated_at | TIMESTAMPTZ | - | - | Thời gian cập nhật |

### practice_result_details
**Mục đích**: Lưu trữ chi tiết từng câu hỏi trong kết quả làm bài.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| question_id | BIGINT | - | FK → questions.id | ID câu hỏi |
| practice_result_id | UUID | - | FK → practice_results.id | ID kết quả |
| choose_answer_id | BIGINT | - | - | ID đáp án đã chọn (nếu có) |
| is_correct | BOOLEAN | - | - | Đáp án có đúng không |
| updated_at | TIMESTAMPTZ | - | - | Thời gian cập nhật |

### user_practice_attempts
**Mục đích**: Theo dõi các lần làm bài (attempt) của người dùng trên mỗi practice set.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| user_id | UUID | - | FK → user_profiles.id | Người dùng |
| practice_set_id | UUID | - | FK → practice_sets.id | Practice set |
| started_at | TIMESTAMPTZ | now() | - | Bắt đầu làm |
| completed_at | TIMESTAMPTZ | - | - | Hoàn thành |
| time_spent | INTEGER | - | - | Tổng thời gian (giây) |
| total_questions | INTEGER | - | - | Số câu |
| correct_answers | INTEGER | 0 | - | Số đúng |
| incorrect_answers | INTEGER | 0 | - | Số sai |
| skipped_answers | INTEGER | 0 | - | Số bỏ qua |
| score | NUMERIC | - | - | Điểm |
| passed | BOOLEAN | false | - | Đạt ngưỡng qua bài |
| coins_earned | INTEGER | 0 | - | Xu thưởng |
| xp_earned | INTEGER | 0 | - | XP thưởng |

---

## 🃏 3. Flashcards System

### review_sessions
**Mục đích**: Theo dõi các phiên ôn tập flashcard với số liệu hiệu suất.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất của phiên ôn tập |
| user_id | UUID | - | FK → user_profiles.id | ID người dùng |
| session_type | VARCHAR(50) | 'standard' | - | Loại phiên: standard, custom, etc. |
| status | review_session_status | 'in_progress' | ENUM: in_progress, completed, abandoned | Trạng thái phiên |
| total_cards | INTEGER | 0 | - | Tổng số thẻ trong phiên |
| completed_cards | INTEGER | 0 | - | Số thẻ đã hoàn thành |
| correct_answers | INTEGER | 0 | - | Số đáp án đúng |
| session_config | JSONB | {} | - | Cấu hình phiên |
| started_at | TIMESTAMPTZ | now() | - | Thời gian bắt đầu |
| completed_at | TIMESTAMPTZ | - | - | Thời gian hoàn thành |
| total_time_seconds | INTEGER | - | - | Tổng thời gian (giây) |
| coins_earned | INTEGER | 0 | - | Xu kiếm được |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |
| filters_applied | JSONB | {} | - | Bộ lọc đã áp dụng |

### review_session_cards
**Mục đích**: Ghi lại từng thẻ flashcard đã ôn tập trong phiên để phân tích chi tiết.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| session_id | UUID | - | FK → review_sessions.id | ID phiên ôn tập |
| flashcard_id | VARCHAR(255) | - | - | ID của flashcard |
| flashcard_type | VARCHAR(50) | 'APP' | - | Loại flashcard: APP, CUSTOM |
| card_order | INTEGER | - | - | Thứ tự thẻ trong phiên |
| result | review_result | - | ENUM: correct, incorrect, skipped, unsure | Kết quả ôn tập |
| difficulty_rating | card_difficulty | - | ENUM: easy, medium, hard | Mức độ khó tự đánh giá |
| time_spent_seconds | INTEGER | - | - | Thời gian dành cho thẻ (giây) |
| reviewed_at | TIMESTAMPTZ | - | - | Thời gian ôn tập thẻ |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |

### flashcard_srs_records
**Mục đích**: Triển khai hệ thống Spaced Repetition (SRS) sử dụng thuật toán SM-2 để tối ưu khoảng cách ôn tập.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| user_id | UUID | - | FK → user_profiles.id | ID người dùng |
| flashcard_id | VARCHAR(255) | - | - | ID của flashcard |
| flashcard_type | VARCHAR(50) | 'APP' | - | Loại flashcard |
| ease_factor | NUMERIC(3,2) | 2.50 | - | Hệ số dễ dàng (ease factor) |
| repetition_number | INTEGER | 0 | - | Số lần lặp lại |
| interval_days | INTEGER | 1 | - | Khoảng cách ôn tập (ngày) |
| due_date | DATE | CURRENT_DATE | - | Ngày đến hạn ôn tập |
| total_reviews | INTEGER | 0 | - | Tổng số lần ôn tập |
| correct_reviews | INTEGER | 0 | - | Số lần ôn tập đúng |
| last_reviewed | TIMESTAMPTZ | - | - | Lần ôn tập cuối |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |

### flashcard_statistics
**Mục đích**: Theo dõi số liệu ôn tập hàng ngày để phân tích hiệu suất và xu hướng học tập.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| user_id | UUID | - | FK → user_profiles.id | ID người dùng |
| date | DATE | CURRENT_DATE | - | Ngày thống kê |
| flashcards_reviewed | INTEGER | 0 | - | Số flashcard đã ôn tập |
| correct_answers | INTEGER | 0 | - | Số đáp án đúng |
| total_questions | INTEGER | 0 | - | Tổng số câu hỏi |
| accuracy_rate | NUMERIC(5,2) | 0.00 | CHECK: 0-100 | Tỷ lệ chính xác (%) |
| time_spent_minutes | INTEGER | 0 | - | Thời gian học (phút) |
| topics_covered | JSONB | [] | - | Chủ đề đã ôn tập |
| weak_topics | JSONB | [] | - | Chủ đề yếu |
| learning_streak | INTEGER | 0 | - | Chuỗi học liên tiếp |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |

### saved_flashcards
**Mục đích**: Lưu trữ flashcard được người dùng đánh dấu để ôn tập nhanh.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| saved_at | TIMESTAMPTZ | now() | - | Thời gian lưu |
| updated_at | TIMESTAMPTZ | - | - | Thời gian cập nhật |
| UserID | UUID | auth.uid() | FK → user_profiles.id | ID người dùng |
| flashcard_id | VARCHAR(255) | - | - | ID flashcard (APP hoặc CUSTOM) |
| flashcard_type | VARCHAR(50) | 'APP' | CHECK: APP, CUSTOM | Loại flashcard |
| topic | VARCHAR(255) | - | - | Chủ đề |
| tags | JSONB | [] | - | Thẻ phân loại |
| review_count | INTEGER | 0 | - | Số lần ôn tập |
| last_reviewed | TIMESTAMPTZ | - | - | Lần ôn tập cuối |
| notes | TEXT | - | - | Ghi chú cá nhân |
| is_favorite | BOOLEAN | false | - | Đánh dấu yêu thích |

---

## 👤 4. User Management System

### user_profiles
**Mục đích**: Lưu trữ thông tin hồ sơ chính của người dùng và thống kê học tập cơ bản.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | auth.uid() | PRIMARY KEY, FK → auth.users.id | ID người dùng |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo tài khoản |
| name | VARCHAR(255) | - | - | Tên hiển thị |
| email | VARCHAR(255) | - | - | Email |
| birthdate | DATE | - | - | Ngày sinh |
| subscription_type | subscription_type | 'FREE' | ENUM: FREE, PLUS, UNLIMITED | Loại gói đăng ký |
| last_login | TIMESTAMPTZ | - | - | Đăng nhập cuối |
| streak_days | INTEGER | 0 | - | Chuỗi học hiện tại |
| coins | INTEGER | 0 | - | Số xu hiện có |
| updated_at | TIMESTAMPTZ | - | - | Thời gian cập nhật |
| xp | INTEGER | 0 | - | Điểm kinh nghiệm |
| level | INTEGER | 1 | - | Cấp độ người dùng |
| last_accessed | TIMESTAMPTZ | now() | - | Truy cập cuối |
| timezone | VARCHAR(255) | '+07' | - | Múi giờ |

### user_settings
**Mục đích**: Lưu trữ tùy chọn và cài đặt cá nhân của người dùng cho ứng dụng học tiếng Việt.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| user_id | UUID | - | UNIQUE, FK → auth.users.id | ID người dùng |
| settings | JSONB | {} | - | Cài đặt dưới dạng JSON |
| settings_version | INTEGER | 1 | - | Phiên bản cài đặt |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |

### custom_flashcards
**Mục đích**: Lưu trữ flashcard được tạo bởi người dùng với nội dung tùy chỉnh.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | - | - | Thời gian cập nhật |
| vietnamese_text | VARCHAR(255) | - | - | Văn bản tiếng Việt |
| english_text | VARCHAR(255) | - | - | Văn bản tiếng Anh |
| ipa_pronunciation | VARCHAR(255) | - | - | Phiên âm IPA |
| image_url | VARCHAR(255) | - | - | URL hình ảnh |
| topic | VARCHAR(255) | - | - | Chủ đề |
| notes | TEXT | - | - | Ghi chú |
| status | VARCHAR(50) | 'ACTIVE' | CHECK: ACTIVE, DRAFT, ARCHIVED | Trạng thái |
| user_id | UUID | auth.uid() | FK → user_profiles.id | ID người tạo |

---

## 🏆 5. Achievement System

### achievement_definitions
**Mục đích**: Định nghĩa tất cả achievement có sẵn với yêu cầu và phần thưởng.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất của achievement |
| category | VARCHAR(100) | - | - | Danh mục achievement |
| level | INTEGER | - | - | Cấp độ trong danh mục |
| title | VARCHAR(255) | - | - | Tên hiển thị |
| description | TEXT | - | - | Mô tả chi tiết |
| requirement_value | INTEGER | - | - | Giá trị mục tiêu |
| requirement_type | VARCHAR(100) | - | - | Loại yêu cầu cần theo dõi |
| badge_data | JSONB | {} | - | Dữ liệu thiết kế badge |
| coin_reward | INTEGER | 50 | - | Xu thưởng |
| rarity | VARCHAR(50) | - | - | Độ hiếm: Common, Rare, Epic, etc. |
| icon | VARCHAR(50) | - | - | Biểu tượng |
| badge_color | VARCHAR(20) | - | - | Màu badge |
| sort_order | INTEGER | 0 | - | Thứ tự sắp xếp |
| is_active | BOOLEAN | true | - | Achievement có hoạt động |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |

### user_achievements
**Mục đích**: Theo dõi tiến trình của người dùng hướng tới achievement và trạng thái hoàn thành.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| user_id | UUID | - | FK → user_profiles.id | ID người dùng |
| achievement_id | UUID | - | FK → achievement_definitions.id | ID achievement |
| current_progress | INTEGER | 0 | - | Tiến trình hiện tại |
| is_completed | BOOLEAN | false | - | Đã hoàn thành chưa |
| completed_at | TIMESTAMPTZ | - | - | Thời gian hoàn thành |
| claimed_at | TIMESTAMPTZ | - | - | Thời gian nhận thưởng |
| additional_progress | JSONB | {} | - | Tiến trình bổ sung |
| created_at | TIMESTAMPTZ | now() | - | Thời gian bắt đầu theo dõi |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |

---

## 🎁 6. Rewards & Economy System

### rewards
**Mục đích**: Lưu trữ các phần thưởng có thể đổi bằng xu.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất của phần thưởng |
| name | VARCHAR(255) | - | - | Tên phần thưởng |
| description | TEXT | - | - | Mô tả phần thưởng |
| coin_cost | INTEGER | - | - | Chi phí xu |
| file_url | VARCHAR(255) | - | - | URL file phần thưởng |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | - | - | Thời gian cập nhật |

### user_rewards
**Mục đích**: Theo dõi phần thưởng đã đổi bởi người dùng.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| user_id | UUID | auth.uid() | FK → user_profiles.id | ID người dùng |
| reward_id | UUID | - | FK → rewards.id | ID phần thưởng |
| redeemed_at | TIMESTAMPTZ | - | - | Thời gian đổi thưởng |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | - | - | Thời gian cập nhật |

---

## 📚 7. Content Management System

### topics
**Mục đích**: Lưu trữ chủ đề (topic) để tổ chức các bài học theo chủ đề.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| topic_id | BIGINT | - | PRIMARY KEY, IDENTITY | ID duy nhất của topic |
| vietnamese_title | TEXT | - | - | Tiêu đề tiếng Việt |
| topic_description | TEXT | - | - | Mô tả topic |
| image | VARCHAR(255) | - | - | URL hình ảnh |
| status | topic_status | 'draft' | ENUM: draft, published, archived | Trạng thái |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| zone_id | SMALLINT | - | FK → zones.id | ID zone |
| english_title | VARCHAR(255) | - | - | Tiêu đề tiếng Anh |
| topic_number | SMALLINT | - | - | Số thứ tự topic |
| sort_order | SMALLINT | 1 | - | Thứ tự sắp xếp |
| slug | TEXT | - | - | URL slug |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |
| metadata | JSONB | {} | - | Metadata bổ sung |
| is_review | BOOLEAN | false | - | Có phải topic ôn tập |

### zones
**Mục đích**: Lưu trữ danh mục để nhóm các topic theo chủ đề lớn.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | BIGINT | - | PRIMARY KEY, IDENTITY | ID duy nhất của zone |
| name | VARCHAR(255) | - | - | Tên zone |
| sort_order | SMALLINT | - | - | Thứ tự sắp xếp |
| seo_alias | VARCHAR(255) | - | - | SEO alias |
| seo_meta_keywords | VARCHAR(255) | - | - | SEO keywords |
| seo_meta_description | VARCHAR(255) | - | - | SEO description |
| seo_title | VARCHAR(255) | - | - | SEO title |
| parent_id | BIGINT | - | - | ID zone cha |
| status | SMALLINT | - | CHECK: 0, 1 | Trạng thái |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| description | TEXT | - | - | Mô tả zone |
| level | SMALLINT | - | CHECK: 1-5, UNIQUE | Cấp độ zone |
| image | VARCHAR(255) | - | - | URL hình ảnh |

### lessons
**Mục đích**: Lưu trữ các bài học trong hệ thống học tập.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | BIGINT | - | PRIMARY KEY, IDENTITY | ID duy nhất của bài học |
| topic_id | BIGINT | - | FK → topics.topic_id | ID topic |
| slug | TEXT | - | - | URL slug |
| lesson_name | VARCHAR(255) | - | - | Tên bài học |
| summary | TEXT | - | - | Tóm tắt bài học |
| sort_order | SMALLINT | 1 | - | Thứ tự sắp xếp |
| duration_minutes | SMALLINT | - | CHECK: > 0 | Thời lượng (phút) |
| coins_reward | SMALLINT | - | CHECK: >= 0 | Xu thưởng |
| is_checkpoint | BOOLEAN | false | - | Có phải checkpoint |
| status | lesson_status | 'draft' | ENUM: draft, published, archived | Trạng thái |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |

### lesson_materials
**Mục đích**: Lưu trữ nội dung và tài liệu của từng bài học.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| lesson_id | BIGINT | - | FK → lessons.id | ID bài học |
| side | material_side | 'main' | ENUM: main, sidebar | Vị trí hiển thị |
| type | material_type | - | ENUM: video, image, dialogue, etc. | Loại tài liệu |
| order_index | INTEGER | - | - | Thứ tự trong bài học |
| title | TEXT | - | - | Tiêu đề tài liệu |
| explanation | JSONB | - | - | Giải thích |
| data | JSONB | - | - | Dữ liệu tài liệu |
| media_url | TEXT | - | - | URL media |
| lang | TEXT | - | - | Ngôn ngữ |
| visibility | material_visibility | 'public' | ENUM: public, plus, unlimited, hidden | Quyền truy cập |
| meta | JSONB | {} | - | Metadata bổ sung |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |

### flashcard_topics
**Mục đích**: Lưu trữ chủ đề cho flashcard system.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| name | VARCHAR(255) | - | UNIQUE | Tên chủ đề |
| description | TEXT | - | - | Mô tả chủ đề |
| icon | VARCHAR(255) | - | - | Biểu tượng |
| sort_order | SMALLINT | 0 | - | Thứ tự sắp xếp |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |

---

## 🤖 8. Chat & AI System

### chat_sessions
**Mục đích**: Quản lý các phiên chat với AI để hỗ trợ học tập.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất của phiên chat |
| user_id | UUID | - | FK → auth.users.id | ID người dùng |
| title | VARCHAR(255) | 'New Chat' | - | Tiêu đề phiên chat |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |
| is_active | BOOLEAN | true | - | Phiên có đang hoạt động |

### chat_messages
**Mục đích**: Lưu trữ tất cả tin nhắn trong các phiên chat.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| session_id | UUID | - | FK → chat_sessions.id | ID phiên chat |
| role | TEXT | - | CHECK: user, assistant, system | Vai trò người gửi |
| content | TEXT | - | - | Nội dung tin nhắn |
| metadata | JSONB | {} | - | Metadata bổ sung |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| message_order | INTEGER | - | - | Thứ tự tin nhắn |

### chat_context
**Mục đích**: Lưu trữ ngữ cảnh và tóm tắt cho các phiên chat để cải thiện trải nghiệm hội thoại.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| session_id | UUID | - | FK → chat_sessions.id | ID phiên chat |
| context_summary | TEXT | - | - | Tóm tắt ngữ cảnh AI tạo |
| main_topics | TEXT[] | - | - | Mảng chủ đề chính |
| user_intent | VARCHAR(255) | - | - | Ý định chính của user |
| conversation_tone | VARCHAR(255) | - | - | Tông điệu hội thoại |
| language_used | VARCHAR(255) | 'en' | - | Ngôn ngữ sử dụng |
| context_metadata | JSONB | {} | - | Metadata ngữ cảnh |
| message_count | INTEGER | 0 | - | Số lượng tin nhắn |
| last_activity_at | TIMESTAMPTZ | - | - | Hoạt động cuối trong phiên |
| context_version | INTEGER | 1 | - | Phiên bản ngữ cảnh |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |

### chat_analytics
**Mục đích**: Phân tích và theo dõi các sự kiện trong hệ thống chat.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| user_id | UUID | - | FK → auth.users.id | ID người dùng |
| session_id | UUID | - | FK → chat_sessions.id | ID phiên chat |
| event_type | VARCHAR(255) | - | - | Loại sự kiện |
| event_data | JSONB | {} | - | Dữ liệu sự kiện |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |

---

## 🔍 9. RAG & Search System

### documents
**Mục đích**: Lưu trữ tài liệu được vector hóa cho hệ thống RAG (Retrieval-Augmented Generation).

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | uuid_generate_v4() | PRIMARY KEY | ID duy nhất |
| type | TEXT | - | CHECK: grammar, folklore, proverb | Loại tài liệu |
| chunk_id | UUID | - | UNIQUE, FK | ID chunk tham chiếu |
| content_summary | TEXT | - | - | Tóm tắt nội dung |
| vector_main | VECTOR | - | - | Vector chính cho tìm kiếm |
| chunk_path | TEXT | - | - | Đường dẫn chunk |
| created_at | TIMESTAMPTZ | CURRENT_TIMESTAMP | - | Thời gian tạo |

### grammar_chunks
**Mục đích**: Lưu trữ các chunk ngữ pháp được vector hóa.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | uuid_generate_v4() | PRIMARY KEY | ID duy nhất |
| content | TEXT | - | - | Nội dung chunk |
| contextualized_chunk | TEXT | - | - | Chunk có ngữ cảnh |
| metadata | JSONB | - | - | Metadata bổ sung |
| category_vi | TEXT | - | - | Danh mục tiếng Việt |
| category_en | TEXT | - | - | Danh mục tiếng Anh |
| vector_content | VECTOR | - | - | Vector nội dung |
| vector_contextualized_chunk | VECTOR | - | - | Vector chunk có ngữ cảnh |
| vector_keywords | VECTOR | - | - | Vector từ khóa |
| created_at | TIMESTAMPTZ | CURRENT_TIMESTAMP | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | CURRENT_TIMESTAMP | - | Thời gian cập nhật |

### folklore_chunks
**Mục đích**: Lưu trữ các chunk văn hóa dân gian (ca dao, tục ngữ) được vector hóa.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | uuid_generate_v4() | PRIMARY KEY | ID duy nhất |
| type | TEXT | - | CHECK: proverb, ca_dao | Loại văn hóa dân gian |
| vi_content | JSONB | - | - | Nội dung tiếng Việt |
| en_content | JSONB | - | - | Nội dung tiếng Anh |
| category_vi | TEXT | - | - | Danh mục tiếng Việt |
| category_en | TEXT | - | - | Danh mục tiếng Anh |
| sub_category_vi | TEXT | - | - | Tiểu danh mục tiếng Việt |
| sub_category_en | TEXT | - | - | Tiểu danh mục tiếng Anh |
| definition_vi | TEXT | - | - | Định nghĩa tiếng Việt |
| definition_en | TEXT | - | - | Định nghĩa tiếng Anh |
| detailed_explanations | JSONB | - | - | Giải thích chi tiết |
| vector | VECTOR | - | - | Vector cho tìm kiếm |
| metadata | JSONB | - | - | Metadata bổ sung |
| created_at | TIMESTAMPTZ | CURRENT_TIMESTAMP | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | CURRENT_TIMESTAMP | - | Thời gian cập nhật |

### rag_cache
**Mục đích**: Cache kết quả tìm kiếm RAG để tối ưu hiệu suất.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| cache_key | VARCHAR(255) | - | UNIQUE | Khóa cache |
| original_query | TEXT | - | - | Query gốc |
| cache_data | JSONB | - | - | Dữ liệu cache |
| augmented_query | TEXT | - | - | Query đã tăng cường |
| hit_count | INTEGER | 1 | - | Số lần truy cập |
| model_name | VARCHAR(255) | 'gpt-4.1-nano' | - | Tên model AI |
| tokens_used | INTEGER | 0 | - | Số token đã dùng |
| estimated_cost | NUMERIC | 0.000000 | - | Chi phí ước tính |
| response_content | TEXT | - | - | Nội dung phản hồi |
| processing_time_ms | INTEGER | 0 | - | Thời gian xử lý (ms) |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | now() | - | Thời gian cập nhật |
| expires_at | TIMESTAMPTZ | now() + 7 days | - | Thời gian hết hạn |
| chunks_retrieved | JSONB | [] | - | Chunk đã truy xuất |

---

## 📊 10. System & Audit

### audit_logs
**Mục đích**: Ghi lại tất cả thay đổi trong database để audit và debugging.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| created_at | TIMESTAMPTZ | now() | - | Thời gian tạo |
| table_name | VARCHAR(255) | - | - | Tên bảng bị thay đổi |
| record_id | VARCHAR(255) | - | - | ID record bị thay đổi |
| action | audit_action | - | ENUM: INSERT, UPDATE, DELETE | Loại hành động |
| old_data | JSONB | - | - | Dữ liệu cũ |
| new_data | JSONB | - | - | Dữ liệu mới |
| changed_by | UUID | auth.uid() | FK → user_profiles.id | Người thực hiện |
| changed_at | TIMESTAMPTZ | - | - | Thời gian thay đổi |

### cleanup_log
**Mục đích**: Ghi lại các hoạt động dọn dẹp dữ liệu cũ trong hệ thống.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | BIGINT | - | PRIMARY KEY | ID duy nhất |
| operation | VARCHAR(255) | - | - | Loại hoạt động dọn dẹp |
| deleted_sessions | INTEGER | 0 | - | Số phiên đã xóa |
| deleted_messages | INTEGER | 0 | - | Số tin nhắn đã xóa |
| deleted_context | INTEGER | 0 | - | Số ngữ cảnh đã xóa |
| cutoff_date | TIMESTAMP | - | - | Ngày cắt dữ liệu |
| executed_at | TIMESTAMP | now() | - | Thời gian thực hiện |
| execution_time_ms | INTEGER | - | - | Thời gian thực hiện (ms) |

### contact_submissions
**Mục đích**: Lưu trữ các yêu cầu liên hệ từ người dùng.

| Column | Data Type | Default | Constraints | Mô tả |
|--------|-----------|---------|-------------|--------|
| id | UUID | gen_random_uuid() | PRIMARY KEY | ID duy nhất |
| first_name | VARCHAR(255) | - | - | Tên |
| last_name | VARCHAR(255) | - | - | Họ |
| email | VARCHAR(255) | - | - | Email |
| phone | VARCHAR(255) | - | - | Số điện thoại |
| subject | VARCHAR(255) | - | - | Chủ đề |
| message | TEXT | - | - | Nội dung tin nhắn |
| privacy_policy_agreed | BOOLEAN | false | - | Đồng ý chính sách bảo mật |
| created_at | TIMESTAMPTZ | timezone('utc'::text, now()) | - | Thời gian tạo |
| updated_at | TIMESTAMPTZ | timezone('utc'::text, now()) | - | Thời gian cập nhật |

---

## 🔐 Security & Data Integrity

### Row Level Security (RLS)
- **Enabled on**: Tất cả bảng user-related
- **Policy**: Users can only access their own data
- **Implementation**: `auth.uid()` based policies

### Foreign Key Constraints
- **Cascade Deletes**: Khi xóa user, xóa tất cả dữ liệu liên quan
- **Referential Integrity**: Đảm bảo tính toàn vẹn dữ liệu

### Data Validation
- **Check Constraints**: Validation trên các trường quan trọng
- **ENUM Types**: Đảm bảo data consistency
- **Default Values**: Giá trị mặc định cho các trường bắt buộc

---

## 📈 Performance Optimizations

### Indexing Strategy
- **Primary Keys**: UUID indexes trên tất cả bảng
- **Foreign Keys**: Indexes cho tất cả FK relationships
- **Composite Indexes**: Cho các truy vấn phức tạp
- **Partial Indexes**: Cho các truy vấn có điều kiện

### Query Optimization
- **Denormalization**: `user_progress_summary` cho dashboard queries
- **JSONB Indexes**: GIN indexes cho JSON fields
- **Partitioning**: Có thể áp dụng cho bảng lớn (statistics, logs)

---

## 🔄 Data Flow Summary

### Real-time Updates
1. **User Actions** → **Progress Tracking** → **Quest Updates** → **Achievement Checks** → **UI Updates**

### Batch Processing  
1. **Daily Quest Generation** → **Personalization** → **User Assignment** → **Notification**

### Analytics Pipeline
1. **Activity Logging** → **Statistics Aggregation** → **Dashboard Updates** → **Insights Generation**

---

**Total Tables**: 38 | **Total Rows**: ~10,000+ | **Last Updated**: September 2025

*Tài liệu này được tạo tự động từ Supabase API và phản ánh schema hiện tại của database.*
