-- Migration 1: Khởi tạo Extensions, Enums và Hàm tiện ích cập nhật thời gian
-- Dự án: Langua (Học ngoại ngữ & Luyện thi phi thương mại)

-- 1. Bật Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Định nghĩa các Enum chuẩn hóa dữ liệu
CREATE TYPE learning_language AS ENUM ('en', 'zh', 'ja');
CREATE TYPE target_exam AS ENUM ('ielts', 'toeic', 'toefl', 'hsk', 'jlpt');
CREATE TYPE ielts_skill AS ENUM ('listening', 'reading', 'writing', 'speaking');
CREATE TYPE exam_mode AS ENUM ('practice', 'exam');
CREATE TYPE question_type AS ENUM (
  'multiple_choice',
  'true_false_not_given',
  'fill_blank',
  'matching',
  'essay',
  'speaking_prompt'
);
CREATE TYPE difficulty_level AS ENUM ('Dễ', 'Trung bình', 'Khó');
CREATE TYPE notification_category AS ENUM ('system', 'streak', 'lesson', 'award');
CREATE TYPE test_status AS ENUM ('chua_lam', 'dang_lam', 'da_xong');

-- 3. Hàm trigger tự động cập nhật cột updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
