/**
 * TypeScript Database Definitions cho Supabase (Dự án Langua)
 * Được thiết kế để tương thích với @supabase/supabase-js và @nuxtjs/supabase.
 * Có thể sinh lại tự động bằng lệnh:
 *   npx supabase gen types typescript --local > backend/supabase/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type LearningLanguage = 'en' | 'zh' | 'ja'
export type TargetExam = 'ielts' | 'toeic' | 'toefl' | 'hsk' | 'jlpt'
export type IeltsSkill = 'listening' | 'reading' | 'writing' | 'speaking'
export type ExamMode = 'practice' | 'exam'
export type QuestionType =
  | 'multiple_choice'
  | 'true_false_not_given'
  | 'fill_blank'
  | 'matching'
  | 'essay'
  | 'speaking_prompt'
export type DifficultyLevel = 'Dễ' | 'Trung bình' | 'Khó'
export type NotificationCategory = 'system' | 'streak' | 'lesson' | 'award'
export type TestStatus = 'chua_lam' | 'dang_lam' | 'da_xong'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_text: string | null
          avatar_url: string | null
          learning_lang: LearningLanguage
          target_exam: TargetExam
          current_band: number | null
          target_band: number | null
          target_exam_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_text?: string | null
          avatar_url?: string | null
          learning_lang?: LearningLanguage
          target_exam?: TargetExam
          current_band?: number | null
          target_band?: number | null
          target_exam_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_text?: string | null
          avatar_url?: string | null
          learning_lang?: LearningLanguage
          target_exam?: TargetExam
          current_band?: number | null
          target_band?: number | null
          target_exam_date?: string | null
          updated_at?: string
        }
      }
      daily_checkins: {
        Row: {
          id: string
          user_id: string
          checkin_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          checkin_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          checkin_date?: string
        }
      }
      xp_events: {
        Row: {
          id: string
          user_id: string
          xp_amount: number
          source: string
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          xp_amount: number
          source: string
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          xp_amount?: number
          source?: string
          reference_id?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          category: NotificationCategory
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          category?: NotificationCategory
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          category?: NotificationCategory
          is_read?: boolean
        }
      }
      vocab_levels: {
        Row: {
          id: number
          level_number: number
          code: string
          title: string
          cefr_equivalent: string | null
          target_word_count: number
          color_tone: string
          description: string | null
        }
        Insert: {
          id?: number
          level_number: number
          code: string
          title: string
          cefr_equivalent?: string | null
          target_word_count?: number
          color_tone?: string
          description?: string | null
        }
        Update: {
          id?: number
          level_number?: number
          code?: string
          title?: string
          cefr_equivalent?: string | null
          target_word_count?: number
          color_tone?: string
          description?: string | null
        }
      }
      vocab_sets: {
        Row: {
          id: string
          user_id: string | null
          level_id: number | null
          title: string
          description: string | null
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          level_id?: number | null
          title: string
          description?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          level_id?: number | null
          title?: string
          description?: string | null
          is_system?: boolean
          updated_at?: string
        }
      }
      vocab_words: {
        Row: {
          id: string
          set_id: string
          word: string
          phonetic: string | null
          part_of_speech: string | null
          meaning_vi: string
          example_sentence: string | null
          example_translation: string | null
          audio_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          set_id: string
          word: string
          phonetic?: string | null
          part_of_speech?: string | null
          meaning_vi: string
          example_sentence?: string | null
          example_translation?: string | null
          audio_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          set_id?: string
          word?: string
          phonetic?: string | null
          part_of_speech?: string | null
          meaning_vi?: string
          example_sentence?: string | null
          example_translation?: string | null
          audio_url?: string | null
        }
      }
      user_word_progress: {
        Row: {
          id: string
          user_id: string
          word_id: string
          easiness_factor: number
          repetition_count: number
          interval_days: number
          correct_count: number
          incorrect_count: number
          last_reviewed_at: string | null
          next_review_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word_id: string
          easiness_factor?: number
          repetition_count?: number
          interval_days?: number
          correct_count?: number
          incorrect_count?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word_id?: string
          easiness_factor?: number
          repetition_count?: number
          interval_days?: number
          correct_count?: number
          incorrect_count?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          updated_at?: string
        }
      }
      exams: {
        Row: {
          id: TargetExam
          name: string
          full_name: string
          is_active: boolean
          status_badge: string
          target_format: string | null
          sort_order: number
        }
        Insert: {
          id: TargetExam
          name: string
          full_name: string
          is_active?: boolean
          status_badge?: string
          target_format?: string | null
          sort_order?: number
        }
        Update: {
          id?: TargetExam
          name?: string
          full_name?: string
          is_active?: boolean
          status_badge?: string
          target_format?: string | null
          sort_order?: number
        }
      }
      exam_skills: {
        Row: {
          id: string
          exam_id: TargetExam
          skill_code: IeltsSkill
          name: string
          english_name: string
          description: string | null
          tone: string
        }
        Insert: {
          id?: string
          exam_id: TargetExam
          skill_code: IeltsSkill
          name: string
          english_name: string
          description?: string | null
          tone?: string
        }
        Update: {
          id?: string
          exam_id?: TargetExam
          skill_code?: IeltsSkill
          name?: string
          english_name?: string
          description?: string | null
          tone?: string
        }
      }
      exam_tests: {
        Row: {
          id: string
          exam_id: TargetExam
          skill: IeltsSkill
          title: string
          subtitle: string | null
          difficulty: DifficultyLevel
          time_minutes: number
          total_questions: number
          category_tags: string[]
          passage_title: string | null
          passage_content: string | null
          audio_title: string | null
          audio_duration_seconds: number | null
          audio_url: string | null
          audio_script: string | null
          task_number: number | null
          min_words: number | null
          prompt_requirements: string | null
          prep_time_seconds: number | null
          speak_time_seconds: number | null
          prompts: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          exam_id: TargetExam
          skill: IeltsSkill
          title: string
          subtitle?: string | null
          difficulty?: DifficultyLevel
          time_minutes?: number
          total_questions?: number
          category_tags?: string[]
          passage_title?: string | null
          passage_content?: string | null
          audio_title?: string | null
          audio_duration_seconds?: number | null
          audio_url?: string | null
          audio_script?: string | null
          task_number?: number | null
          min_words?: number | null
          prompt_requirements?: string | null
          prep_time_seconds?: number | null
          speak_time_seconds?: number | null
          prompts?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: TargetExam
          skill?: IeltsSkill
          title?: string
          subtitle?: string | null
          difficulty?: DifficultyLevel
          time_minutes?: number
          total_questions?: number
          category_tags?: string[]
          passage_title?: string | null
          passage_content?: string | null
          audio_title?: string | null
          audio_duration_seconds?: number | null
          audio_url?: string | null
          audio_script?: string | null
          task_number?: number | null
          min_words?: number | null
          prompt_requirements?: string | null
          prep_time_seconds?: number | null
          speak_time_seconds?: number | null
          prompts?: string[] | null
          updated_at?: string
        }
      }
      exam_questions: {
        Row: {
          id: string
          test_id: string
          question_number: number
          type: QuestionType
          question_text: string
          options: Json | null
          correct_answer: string
          explanation: string
          category_tag: string | null
          passage_section_ref: string | null
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          question_number: number
          type: QuestionType
          question_text: string
          options?: Json | null
          correct_answer: string
          explanation: string
          category_tag?: string | null
          passage_section_ref?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          question_number?: number
          type?: QuestionType
          question_text?: string
          options?: Json | null
          correct_answer?: string
          explanation?: string
          category_tag?: string | null
          passage_section_ref?: string | null
        }
      }
      exam_attempts: {
        Row: {
          id: string
          user_id: string
          test_id: string
          mode: ExamMode
          raw_score: number | null
          total_questions: number
          band_score: number | null
          duration_seconds: number
          submitted_essay: string | null
          speaking_audio_url: string | null
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          test_id: string
          mode?: ExamMode
          raw_score?: number | null
          total_questions: number
          band_score?: number | null
          duration_seconds?: number
          submitted_essay?: string | null
          speaking_audio_url?: string | null
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          test_id?: string
          mode?: ExamMode
          raw_score?: number | null
          total_questions?: number
          band_score?: number | null
          duration_seconds?: number
          submitted_essay?: string | null
          speaking_audio_url?: string | null
        }
      }
      exam_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          user_answer: string | null
          is_correct: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          user_answer?: string | null
          is_correct?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          user_answer?: string | null
          is_correct?: boolean | null
        }
      }
    }
    Views: {
      user_xp_totals: {
        Row: {
          user_id: string
          full_name: string
          avatar_text: string | null
          total_xp: number
        }
      }
      weekly_leaderboard: {
        Row: {
          rank: number
          user_id: string
          full_name: string
          avatar_text: string | null
          weekly_xp: number
        }
      }
      words_due_today: {
        Row: {
          progress_id: string
          user_id: string
          next_review_at: string
          repetition_count: number
          easiness_factor: number
          interval_days: number
          word_id: string
          word: string
          phonetic: string | null
          part_of_speech: string | null
          meaning_vi: string
          example_sentence: string | null
          example_translation: string | null
          audio_url: string | null
          set_title: string
          is_critical: boolean
        }
      }
      user_vocab_levels_summary: {
        Row: {
          level_number: number
          code: string
          title: string
          color_tone: string
          total_target: number
          user_id: string | null
          learned_count: number
        }
      }
      daily_user_stats: {
        Row: {
          user_id: string
          stat_date: string
          learning_time_minutes: number
          new_words_learned: number
          completed_lessons: number
          xp_gained_today: number
        }
      }
      weekly_user_summary: {
        Row: {
          user_id: string
          week_start: string
          current_streak_days: number
          total_weekly_minutes: number
          completed_tests_count: number
          weekly_words_learned: number
          weekly_xp: number
        }
      }
    }
    Functions: {
      get_user_streak: {
        Args: { p_user_id: string }
        Returns: number
      }
      claim_daily_checkin: {
        Args: Record<string, never>
        Returns: Json
      }
      get_my_today_stats: {
        Args: Record<string, never>
        Returns: {
          learning_time_minutes: number
          new_words_learned: number
          completed_lessons: number
          xp_gained_today: number
        }[]
      }
    }
  }
}
