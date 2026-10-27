-- Migration 2: Bảng hồ sơ người dùng (profiles) và Trigger tự động tạo khi đăng ký auth.users

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_text VARCHAR(10) DEFAULT 'LA',
  avatar_url TEXT,
  learning_lang learning_language NOT NULL DEFAULT 'en',
  target_exam target_exam NOT NULL DEFAULT 'ielts',
  current_band NUMERIC(3, 1) DEFAULT 5.5 CHECK (current_band >= 0 AND current_band <= 9.0),
  target_band NUMERIC(3, 1) DEFAULT 7.0 CHECK (target_band >= 0 AND target_band <= 9.0),
  target_exam_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index tìm kiếm & hiệu năng
CREATE INDEX idx_profiles_learning_lang ON public.profiles(learning_lang);
CREATE INDEX idx_profiles_target_exam ON public.profiles(target_exam);

-- Trigger cập nhật updated_at
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Hàm trigger tự động tạo profile khi người dùng đăng ký qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_name TEXT;
  extracted_avatar TEXT;
BEGIN
  -- Lấy tên hiển thị từ metadata hoặc cắt từ email
  extracted_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Sinh ký tự đại diện cho avatar (2 chữ cái hoa đầu)
  IF LENGTH(extracted_name) >= 2 THEN
    extracted_avatar := UPPER(SUBSTRING(extracted_name FROM 1 FOR 2));
  ELSE
    extracted_avatar := 'LA';
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_text,
    learning_lang,
    target_exam,
    current_band,
    target_band
  ) VALUES (
    NEW.id,
    extracted_name,
    extracted_avatar,
    'en',
    'ielts',
    5.5,
    7.0
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger vào bảng auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
