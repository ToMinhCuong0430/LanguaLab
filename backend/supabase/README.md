# Hướng Dẫn Cơ Sở Dữ Liệu Supabase - Dự Án Langua

Tài liệu này hướng dẫn quản trị cơ sở dữ liệu Supabase, thực thi migrations, cấu hình Row Level Security (RLS) và cách tích hợp với frontend Nuxt 4.

---

## 1. Cấu Trúc Thư Mục `backend/supabase/`

```text
backend/supabase/
├── config.toml           # Cấu hình cổng, auth, storage của Supabase CLI
├── seed.sql              # Dữ liệu mẫu khởi tạo (khớp 100% mock frontend)
├── README.md             # Tài liệu này
├── types/
│   └── database.types.ts # TypeScript database definitions cho frontend
└── migrations/
    ├── 20261022000001_init_extensions_and_enums.sql
    ├── 20261022000002_create_profiles.sql
    ├── 20261022000003_create_gamification_and_notifications.sql
    ├── 20261022000004_create_vocabulary.sql
    ├── 20261022000005_create_exams.sql
    ├── 20261022000006_create_stats_views.sql
    └── 20261022000007_setup_rls_and_storage.sql
```

---

## 2. Cách Chạy Local Bằng Supabase CLI

### Điều kiện tiên quyết
- Cài đặt **Docker Desktop** (bắt buộc đang chạy).
- Node.js >= 18.

### Các lệnh quản trị chính (chạy tại thư mục gốc dự án)

```bash
# 1. Khởi động các dịch vụ Supabase Local (PostgreSQL, Studio, Auth, Storage, Kong)
npx supabase start --workdir backend

# 2. Reset database: tự động chạy toàn bộ migrations và nạp dữ liệu từ seed.sql
npx supabase db reset --workdir backend

# 3. Tạo file migration mới khi có thay đổi cấu trúc
npx supabase migration new ten_tinh_nang --workdir backend

# 4. Sinh file types TypeScript mới nhất từ database local
npx supabase gen types typescript --local --workdir backend > backend/supabase/types/database.types.ts

# 5. Dừng các container Supabase khi không sử dụng
npx supabase stop --workdir backend
```

### Địa chỉ truy cập dịch vụ Local
- **Supabase Studio (Giao diện web trực quan)**: `http://localhost:54323`
- **API URL**: `http://localhost:54321`
- **Database URL (Postgres)**: `postgresql://postgres:postgres@localhost:54322/postgres`

---

## 3. Sơ Đồ Quan Hệ Thực Thể (ERD Tóm Tắt)

```text
auth.users (Supabase Auth)
  └── 1:1 ── profiles (Thông tin người học, ngôn ngữ, mục tiêu band)
               ├── 1:N ── daily_checkins (Điểm danh hàng ngày, UNIQUE user_id + date)
               ├── 1:N ── xp_events (Nhật ký cộng XP: streak, bài thi, từ vựng)
               ├── 1:N ── notifications (Thông báo hệ thống, nhắc streak, đề thi mới)
               ├── 1:N ── vocab_sets (Bộ từ do người dùng tự tạo; bộ hệ thống có user_id = NULL)
               │            └── 1:N ── vocab_words (Từ vựng, phiên âm, nghĩa tiếng Việt, ví dụ)
               │                         └── 1:1 ── user_word_progress (Tiến độ ôn tập SRS của user)
               └── 1:N ── exam_attempts (Lượt làm bài thi: practice / exam, điểm thô, band quy đổi)
                            ├── N:1 ── exam_tests (Đề thi: Reading, Listening, Writing, Speaking)
                            │            ├── N:1 ── exams (IELTS, TOEIC, TOEFL, HSK, JLPT)
                            │            └── 1:N ── exam_questions (Câu hỏi, đáp án đúng, giải thích)
                            └── 1:N ── exam_answers (Đáp án của user cho từng câu hỏi, đúng/sai)
```

### Các View & Hàm RPC Tích Hợp Sẵn
- **`weekly_leaderboard`**: Bảng vàng Top 10 rèn luyện trong tuần (chỉ hiển thị `rank`, `full_name`, `avatar_text`, `weekly_xp`).
- **`user_xp_totals`**: Tổng điểm XP tích lũy của từng học viên.
- **`words_due_today`**: Danh sách các từ cần ôn tập hôm nay theo thuật toán lặp lại ngắt quãng (SRS).
- **`daily_user_stats`**: Thống kê hoạt động trong ngày (thời gian học, từ mới, bài hoàn thành, XP).
- **`weekly_user_summary`**: Tổng kết tuần dạng Story (thời gian học, chuỗi streak, từ đã học).
- **`claim_daily_checkin()`**: Hàm RPC điểm danh atomic transaction (tự động cộng 20 XP và cập nhật streak).

---

## 4. Chính Sách Bảo Mật Row Level Security (RLS)

Tất cả bảng đều bật `ROW LEVEL SECURITY` với chính sách tường minh:
1. **Dữ liệu cá nhân** (`profiles`, `daily_checkins`, `xp_events`, `notifications`, `user_word_progress`, `exam_attempts`, `exam_answers`):
   - Người dùng chỉ được `SELECT`, `INSERT`, `UPDATE` dữ liệu của chính mình (`auth.uid() = user_id`).
2. **Dữ liệu học liệu công khai** (`exams`, `exam_skills`, `exam_tests`, `exam_questions`, `vocab_levels`):
   - Mọi người (kể cả khách vãng lai `anon`) đều có quyền đọc `SELECT`.
   - Quyền ghi chỉ dành cho quản trị viên (`service_role`).
3. **Bộ từ vựng** (`vocab_sets`, `vocab_words`):
   - Người dùng đọc được các bộ từ hệ thống (`is_system = true`) và bộ từ do chính mình tạo.
4. **Supabase Storage**:
   - Bucket `speaking-recordings` (riêng tư): Chỉ người dùng sở hữu mới có quyền tải lên và nghe lại bài nói của mình (`/speaking-recordings/{user_id}/*`).
   - Bucket `avatars` (công khai đọc): Ai cũng xem được ảnh đại diện, chỉ user sở hữu được tải lên.

---

## 5. Hướng Dẫn Frontend Nuxt 4 Kết Nối Supabase

### Bước 1: Cài đặt module `@nuxtjs/supabase`
*(Khi triển khai thật)*:
```bash
cd frontend
npm install @nuxtjs/supabase
```

Thêm vào `frontend/nuxt.config.ts`:
```ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/supabase',
    // ... các module khác
  ],
  supabase: {
    redirect: false, // Tắt tự động redirect để trang công khai vẫn truy cập được
  },
})
```

Tạo file `frontend/.env`:
```env
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Anon key lấy từ supabase start)
```

### Bước 2: Code mẫu thay thế Mock Data trong Composables

#### 1. Lấy thông tin người dùng & Điểm danh (`useHomeData.ts`):
```ts
import type { Database } from '~~/../backend/supabase/types/database.types'

export const useHomeData = () => {
  const client = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  // Lấy Profile
  const fetchProfile = async () => {
    if (!user.value) return null
    const { data } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    return data
  }

  // Thực hiện điểm danh an toàn qua RPC
  const toggleCheckIn = async () => {
    const { data, error } = await client.rpc('claim_daily_checkin')
    if (!error && data?.success) {
      console.log('Điểm danh thành công:', data)
    }
  }

  // Lấy Bảng xếp hạng tuần
  const fetchLeaderboard = async () => {
    const { data } = await client
      .from('weekly_leaderboard')
      .select('*')
      .limit(10)
    return data
  }

  return { fetchProfile, toggleCheckIn, fetchLeaderboard }
}
```

#### 2. Lấy danh sách đề thi IELTS & Nộp bài (`useIelts.ts`):
```ts
// Lấy danh sách đề thi theo kỹ năng
const fetchTestsBySkill = async (skill: string) => {
  const { data } = await client
    .from('exam_tests')
    .select('*, questions:exam_questions(*)')
    .eq('skill', skill)
  return data
}

// Nộp bài thi IELTS
const submitExamAttempt = async (payload: {
  testId: string
  mode: 'practice' | 'exam'
  rawScore: number
  totalQuestions: number
  bandScore: number
  durationSeconds: number
  answers: Record<number, string>
}) => {
  const { data: attempt, error } = await client
    .from('exam_attempts')
    .insert({
      test_id: payload.testId,
      mode: payload.mode,
      raw_score: payload.rawScore,
      total_questions: payload.totalQuestions,
      band_score: payload.bandScore,
      duration_seconds: payload.durationSeconds,
    })
    .select()
    .single()

  return attempt
}

// Upload file ghi âm Speaking lên Storage
const uploadSpeakingAudio = async (testId: string, audioBlob: Blob) => {
  const fileName = `${user.value.id}/${testId}_${Date.now()}.webm`
  const { data, error } = await client.storage
    .from('speaking-recordings')
    .upload(fileName, audioBlob)
  return data?.path
}
```

---

## 7. Triển Khai Edge Functions (Edge Functions Deployment)

Hệ thống có Edge Function `delete-account` để xoá tài khoản an toàn kèm dọn dẹp các tệp lưu trữ trong Storage:

```bash
# Deploy function delete-account lên Supabase Cloud:
npx supabase functions deploy delete-account --workdir backend --no-verify-jwt

# Thiết lập biến môi trường (nếu cần thiết lập ngoài mặc định):
# npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key --workdir backend
```

