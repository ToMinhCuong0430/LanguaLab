export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_feedback: {
        Row: {
          attempt_id: string | null
          completed_at: string | null
          created_at: string
          criteria: Json | null
          error_code: string | null
          error_message: string | null
          id: string
          input_tokens: number | null
          model: string | null
          model_answer: string | null
          output_tokens: number | null
          overall_band: number | null
          prompt_text: string
          provider: string | null
          run_count: number
          skill: Database["public"]["Enums"]["ielts_skill"]
          started_at: string | null
          status: string
          submission_text: string
          suggestions: Json | null
          summary: string | null
          task_number: number | null
          test_id: string
          updated_at: string
          user_id: string
          word_count: number
        }
        Insert: {
          attempt_id?: string | null
          completed_at?: string | null
          created_at?: string
          criteria?: Json | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          model?: string | null
          model_answer?: string | null
          output_tokens?: number | null
          overall_band?: number | null
          prompt_text: string
          provider?: string | null
          run_count?: number
          skill: Database["public"]["Enums"]["ielts_skill"]
          started_at?: string | null
          status?: string
          submission_text: string
          suggestions?: Json | null
          summary?: string | null
          task_number?: number | null
          test_id: string
          updated_at?: string
          user_id: string
          word_count?: number
        }
        Update: {
          attempt_id?: string | null
          completed_at?: string | null
          created_at?: string
          criteria?: Json | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          model?: string | null
          model_answer?: string | null
          output_tokens?: number | null
          overall_band?: number | null
          prompt_text?: string
          provider?: string | null
          run_count?: number
          skill?: Database["public"]["Enums"]["ielts_skill"]
          started_at?: string | null
          status?: string
          submission_text?: string
          suggestions?: Json | null
          summary?: string | null
          task_number?: number | null
          test_id?: string
          updated_at?: string
          user_id?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "exam_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_import_logs: {
        Row: {
          admin_id: string
          content_type: string
          created_at: string
          errors: Json | null
          file_name: string
          id: string
          rows_failed: number
          rows_ok: number
          rows_total: number
          status: string
        }
        Insert: {
          admin_id: string
          content_type: string
          created_at?: string
          errors?: Json | null
          file_name: string
          id?: string
          rows_failed?: number
          rows_ok?: number
          rows_total?: number
          status?: string
        }
        Update: {
          admin_id?: string
          content_type?: string
          created_at?: string
          errors?: Json | null
          file_name?: string
          id?: string
          rows_failed?: number
          rows_ok?: number
          rows_total?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_import_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_import_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_import_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_import_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_import_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dictionary_entries: {
        Row: {
          created_at: string
          data: Json
          headword: string
          id: string
          language: Database["public"]["Enums"]["learning_language"]
          license: string
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          headword: string
          id?: string
          language: Database["public"]["Enums"]["learning_language"]
          license: string
          source: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          headword?: string
          id?: string
          language?: Database["public"]["Enums"]["learning_language"]
          license?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          question_id: string
          user_answer: string | null
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          user_answer?: string | null
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          user_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          band_score: number | null
          completed_at: string
          duration_seconds: number
          id: string
          mode: Database["public"]["Enums"]["exam_mode"]
          raw_score: number | null
          speaking_audio_url: string | null
          submitted_essay: string | null
          test_id: string
          total_questions: number
          user_id: string
        }
        Insert: {
          band_score?: number | null
          completed_at?: string
          duration_seconds?: number
          id?: string
          mode?: Database["public"]["Enums"]["exam_mode"]
          raw_score?: number | null
          speaking_audio_url?: string | null
          submitted_essay?: string | null
          test_id: string
          total_questions: number
          user_id: string
        }
        Update: {
          band_score?: number | null
          completed_at?: string
          duration_seconds?: number
          id?: string
          mode?: Database["public"]["Enums"]["exam_mode"]
          raw_score?: number | null
          speaking_audio_url?: string | null
          submitted_essay?: string | null
          test_id?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "exam_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          category_tag: string | null
          correct_answer: string
          created_at: string
          explanation: string
          id: string
          options: Json | null
          passage_section_ref: string | null
          question_number: number
          question_text: string
          test_id: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          category_tag?: string | null
          correct_answer: string
          created_at?: string
          explanation: string
          id?: string
          options?: Json | null
          passage_section_ref?: string | null
          question_number: number
          question_text: string
          test_id: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          category_tag?: string | null
          correct_answer?: string
          created_at?: string
          explanation?: string
          id?: string
          options?: Json | null
          passage_section_ref?: string | null
          question_number?: number
          question_text?: string
          test_id?: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "exam_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_skills: {
        Row: {
          description: string | null
          english_name: string
          exam_id: Database["public"]["Enums"]["target_exam"]
          id: string
          name: string
          skill_code: Database["public"]["Enums"]["ielts_skill"]
          tone: string
        }
        Insert: {
          description?: string | null
          english_name: string
          exam_id: Database["public"]["Enums"]["target_exam"]
          id?: string
          name: string
          skill_code: Database["public"]["Enums"]["ielts_skill"]
          tone?: string
        }
        Update: {
          description?: string | null
          english_name?: string
          exam_id?: Database["public"]["Enums"]["target_exam"]
          id?: string
          name?: string
          skill_code?: Database["public"]["Enums"]["ielts_skill"]
          tone?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_skills_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_tests: {
        Row: {
          audio_duration_seconds: number | null
          audio_script: string | null
          audio_title: string | null
          audio_url: string | null
          category_tags: string[]
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          exam_id: Database["public"]["Enums"]["target_exam"]
          id: string
          is_published: boolean
          min_words: number | null
          part_number: number | null
          passage_content: string | null
          passage_title: string | null
          prep_time_seconds: number | null
          prompt_requirements: string | null
          prompts: string[] | null
          skill: Database["public"]["Enums"]["ielts_skill"]
          speak_time_seconds: number | null
          subtitle: string | null
          task_number: number | null
          time_minutes: number
          title: string
          total_questions: number
          updated_at: string
        }
        Insert: {
          audio_duration_seconds?: number | null
          audio_script?: string | null
          audio_title?: string | null
          audio_url?: string | null
          category_tags?: string[]
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          exam_id: Database["public"]["Enums"]["target_exam"]
          id: string
          is_published?: boolean
          min_words?: number | null
          part_number?: number | null
          passage_content?: string | null
          passage_title?: string | null
          prep_time_seconds?: number | null
          prompt_requirements?: string | null
          prompts?: string[] | null
          skill: Database["public"]["Enums"]["ielts_skill"]
          speak_time_seconds?: number | null
          subtitle?: string | null
          task_number?: number | null
          time_minutes?: number
          title: string
          total_questions?: number
          updated_at?: string
        }
        Update: {
          audio_duration_seconds?: number | null
          audio_script?: string | null
          audio_title?: string | null
          audio_url?: string | null
          category_tags?: string[]
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          exam_id?: Database["public"]["Enums"]["target_exam"]
          id?: string
          is_published?: boolean
          min_words?: number | null
          part_number?: number | null
          passage_content?: string | null
          passage_title?: string | null
          prep_time_seconds?: number | null
          prompt_requirements?: string | null
          prompts?: string[] | null
          skill?: Database["public"]["Enums"]["ielts_skill"]
          speak_time_seconds?: number | null
          subtitle?: string | null
          task_number?: number | null
          time_minutes?: number
          title?: string
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_tests_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          full_name: string
          id: Database["public"]["Enums"]["target_exam"]
          is_active: boolean
          name: string
          sort_order: number
          status_badge: string
          target_format: string | null
        }
        Insert: {
          full_name: string
          id: Database["public"]["Enums"]["target_exam"]
          is_active?: boolean
          name: string
          sort_order?: number
          status_badge?: string
          target_format?: string | null
        }
        Update: {
          full_name?: string
          id?: Database["public"]["Enums"]["target_exam"]
          is_active?: boolean
          name?: string
          sort_order?: number
          status_badge?: string
          target_format?: string | null
        }
        Relationships: []
      }
      feature_request_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feature_requests_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_request_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feature_request_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_request_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feature_request_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feature_request_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      feature_request_votes: {
        Row: {
          created_at: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_request_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_request_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feature_requests_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_request_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feature_request_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_request_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feature_request_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feature_request_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          category: string
          comment_count: number
          created_at: string
          description: string
          id: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          vote_count: number
        }
        Insert: {
          category: string
          comment_count?: number
          created_at?: string
          description: string
          id?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          vote_count?: number
        }
        Update: {
          category?: string
          comment_count?: number
          created_at?: string
          description?: string
          id?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "feature_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feature_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feature_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feature_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      grammar_attempts: {
        Row: {
          answers: Json
          completed_at: string
          duration_seconds: number
          id: string
          point_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string
          duration_seconds?: number
          id?: string
          point_id: string
          score?: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          duration_seconds?: number
          id?: string
          point_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_attempts_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grammar_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "grammar_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grammar_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "grammar_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "grammar_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      grammar_exercises: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string
          id: string
          options: Json | null
          point_id: string
          prompt: string
          question: string | null
          question_type: string
          sort_order: number
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation: string
          id?: string
          options?: Json | null
          point_id: string
          prompt: string
          question?: string | null
          question_type: string
          sort_order?: number
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string
          id?: string
          options?: Json | null
          point_id?: string
          prompt?: string
          question?: string | null
          question_type?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "grammar_exercises_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_points: {
        Row: {
          common_mistakes: Json
          created_at: string
          examples: Json
          explanation: string
          formula: Json
          id: string
          is_published: boolean
          language: Database["public"]["Enums"]["learning_language"]
          level: string
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
          vietnamese_title: string
          xp_reward: number
        }
        Insert: {
          common_mistakes?: Json
          created_at?: string
          examples?: Json
          explanation: string
          formula?: Json
          id: string
          is_published?: boolean
          language: Database["public"]["Enums"]["learning_language"]
          level: string
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
          vietnamese_title: string
          xp_reward?: number
        }
        Update: {
          common_mistakes?: Json
          created_at?: string
          examples?: Json
          explanation?: string
          formula?: Json
          id?: string
          is_published?: boolean
          language?: Database["public"]["Enums"]["learning_language"]
          level?: string
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
          vietnamese_title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      learning_stages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          language: Database["public"]["Enums"]["learning_language"]
          level: string
          sort_order: number
          stage_type: string
          title: string
          unlock_requirement: Json | null
          xp_required: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          language: Database["public"]["Enums"]["learning_language"]
          level: string
          sort_order?: number
          stage_type: string
          title: string
          unlock_requirement?: Json | null
          xp_required?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          language?: Database["public"]["Enums"]["learning_language"]
          level?: string
          sort_order?: number
          stage_type?: string
          title?: string
          unlock_requirement?: Json | null
          xp_required?: number
        }
        Relationships: []
      }
      media_cues: {
        Row: {
          end_ms: number
          id: string
          media_id: string
          sort_order: number
          start_ms: number
          subtitle_lang: string
          text: string
          translation_vi: string | null
          vocab_hints: Json | null
        }
        Insert: {
          end_ms: number
          id?: string
          media_id: string
          sort_order?: number
          start_ms: number
          subtitle_lang?: string
          text: string
          translation_vi?: string | null
          vocab_hints?: Json | null
        }
        Update: {
          end_ms?: number
          id?: string
          media_id?: string
          sort_order?: number
          start_ms?: number
          subtitle_lang?: string
          text?: string
          translation_vi?: string | null
          vocab_hints?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "media_cues_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          is_published: boolean
          language: Database["public"]["Enums"]["learning_language"]
          level: string
          media_type: string
          provider: string
          source_url: string
          speaker: string | null
          title: string
          topic: string
          updated_at: string
          vietnamese_title: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id: string
          is_published?: boolean
          language: Database["public"]["Enums"]["learning_language"]
          level: string
          media_type: string
          provider: string
          source_url: string
          speaker?: string | null
          title: string
          topic: string
          updated_at?: string
          vietnamese_title?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          is_published?: boolean
          language?: Database["public"]["Enums"]["learning_language"]
          level?: string
          media_type?: string
          provider?: string
          source_url?: string
          speaker?: string | null
          title?: string
          topic?: string
          updated_at?: string
          vietnamese_title?: string | null
        }
        Relationships: []
      }
      media_quiz_questions: {
        Row: {
          correct_index: number
          explanation: string | null
          id: string
          media_id: string
          options: Json
          question: string
          segment_time_sec: number
        }
        Insert: {
          correct_index: number
          explanation?: string | null
          id?: string
          media_id: string
          options?: Json
          question: string
          segment_time_sec?: number
        }
        Update: {
          correct_index?: number
          explanation?: string | null
          id?: string
          media_id?: string
          options?: Json
          question?: string
          segment_time_sec?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_quiz_questions_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          category: Database["public"]["Enums"]["notification_category"]
          content: string
          created_at: string
          id: string
          is_read: boolean
          title: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["notification_category"]
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["notification_category"]
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_text: string | null
          avatar_url: string | null
          created_at: string
          current_band: number | null
          full_name: string
          id: string
          learning_lang: Database["public"]["Enums"]["learning_language"]
          target_band: number | null
          target_exam: Database["public"]["Enums"]["target_exam"]
          target_exam_date: string | null
          updated_at: string
        }
        Insert: {
          avatar_text?: string | null
          avatar_url?: string | null
          created_at?: string
          current_band?: number | null
          full_name: string
          id: string
          learning_lang?: Database["public"]["Enums"]["learning_language"]
          target_band?: number | null
          target_exam?: Database["public"]["Enums"]["target_exam"]
          target_exam_date?: string | null
          updated_at?: string
        }
        Update: {
          avatar_text?: string | null
          avatar_url?: string | null
          created_at?: string
          current_band?: number | null
          full_name?: string
          id?: string
          learning_lang?: Database["public"]["Enums"]["learning_language"]
          target_band?: number | null
          target_exam?: Database["public"]["Enums"]["target_exam"]
          target_exam_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pronunciation_recordings: {
        Row: {
          audio_path: string
          created_at: string
          feedback: Json | null
          id: string
          score: number | null
          user_id: string
          word_id: string | null
          word_text: string
        }
        Insert: {
          audio_path: string
          created_at?: string
          feedback?: Json | null
          id?: string
          score?: number | null
          user_id: string
          word_id?: string | null
          word_text: string
        }
        Update: {
          audio_path?: string
          created_at?: string
          feedback?: Json | null
          id?: string
          score?: number | null
          user_id?: string
          word_id?: string | null
          word_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "pronunciation_recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pronunciation_recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pronunciation_recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pronunciation_recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pronunciation_recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pronunciation_recordings_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "vocab_words"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pronunciation_recordings_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words_due_today"
            referencedColumns: ["word_id"]
          },
        ]
      }
      reading_items: {
        Row: {
          author: string
          content_type: string
          created_at: string
          id: string
          is_published: boolean
          language: Database["public"]["Enums"]["learning_language"]
          level: string
          license: string
          reading_time_minutes: number
          source_note: string | null
          source_url: string | null
          title: string
          updated_at: string
          vietnamese_title: string | null
          word_count: number
        }
        Insert: {
          author: string
          content_type: string
          created_at?: string
          id: string
          is_published?: boolean
          language: Database["public"]["Enums"]["learning_language"]
          level: string
          license: string
          reading_time_minutes?: number
          source_note?: string | null
          source_url?: string | null
          title: string
          updated_at?: string
          vietnamese_title?: string | null
          word_count?: number
        }
        Update: {
          author?: string
          content_type?: string
          created_at?: string
          id?: string
          is_published?: boolean
          language?: Database["public"]["Enums"]["learning_language"]
          level?: string
          license?: string
          reading_time_minutes?: number
          source_note?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
          vietnamese_title?: string | null
          word_count?: number
        }
        Relationships: []
      }
      reading_sections: {
        Row: {
          created_at: string
          id: string
          original_text: string
          reading_id: string
          sort_order: number
          translated_text: string
          vocab_notes: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          original_text: string
          reading_id: string
          sort_order?: number
          translated_text: string
          vocab_notes?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          original_text?: string
          reading_id?: string
          sort_order?: number
          translated_text?: string
          vocab_notes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_sections_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "reading_items"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_attempts: {
        Row: {
          created_at: string
          id: string
          section_id: string
          user_id: string
          user_translation: string
        }
        Insert: {
          created_at?: string
          id?: string
          section_id: string
          user_id: string
          user_translation: string
        }
        Update: {
          created_at?: string
          id?: string
          section_id?: string
          user_id?: string
          user_translation?: string
        }
        Relationships: [
          {
            foreignKeyName: "translation_attempts_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "reading_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "translation_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "translation_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "translation_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      typing_attempts: {
        Row: {
          accuracy: number
          completed_at: string
          duration_seconds: number
          id: string
          topic_id: string
          user_id: string
          wpm: number
          xp_earned: number
        }
        Insert: {
          accuracy: number
          completed_at?: string
          duration_seconds?: number
          id?: string
          topic_id: string
          user_id: string
          wpm: number
          xp_earned?: number
        }
        Update: {
          accuracy?: number
          completed_at?: string
          duration_seconds?: number
          id?: string
          topic_id?: string
          user_id?: string
          wpm?: number
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "typing_attempts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "typing_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "typing_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "typing_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "typing_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      typing_sentences: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          grammar_note: string | null
          hint_word: string | null
          id: string
          reading: string | null
          sort_order: number
          topic_id: string
          translation: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          grammar_note?: string | null
          hint_word?: string | null
          id?: string
          reading?: string | null
          sort_order?: number
          topic_id: string
          translation: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          grammar_note?: string | null
          hint_word?: string | null
          id?: string
          reading?: string | null
          sort_order?: number
          topic_id?: string
          translation?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_sentences_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "typing_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_topics: {
        Row: {
          created_at: string
          description: string | null
          group_type: string
          icon_name: string | null
          id: string
          is_published: boolean
          language: Database["public"]["Enums"]["learning_language"]
          level: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_type: string
          icon_name?: string | null
          id: string
          is_published?: boolean
          language: Database["public"]["Enums"]["learning_language"]
          level: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_type?: string
          icon_name?: string | null
          id?: string
          is_published?: boolean
          language?: Database["public"]["Enums"]["learning_language"]
          level?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_grammar_progress: {
        Row: {
          best_score: number | null
          completed_at: string | null
          id: string
          is_completed: boolean
          point_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          best_score?: number | null
          completed_at?: string | null
          id?: string
          is_completed?: boolean
          point_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          best_score?: number | null
          completed_at?: string | null
          id?: string
          is_completed?: boolean
          point_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_grammar_progress_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_grammar_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_grammar_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_grammar_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_grammar_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_grammar_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_media_progress: {
        Row: {
          dictation_score: number | null
          id: string
          is_completed: boolean
          last_watched_at: string
          media_id: string
          quiz_score: number | null
          shadowing_score: number | null
          updated_at: string
          user_id: string
          watch_position_ms: number
        }
        Insert: {
          dictation_score?: number | null
          id?: string
          is_completed?: boolean
          last_watched_at?: string
          media_id: string
          quiz_score?: number | null
          shadowing_score?: number | null
          updated_at?: string
          user_id: string
          watch_position_ms?: number
        }
        Update: {
          dictation_score?: number | null
          id?: string
          is_completed?: boolean
          last_watched_at?: string
          media_id?: string
          quiz_score?: number | null
          shadowing_score?: number | null
          updated_at?: string
          user_id?: string
          watch_position_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_media_progress_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_media_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_media_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_media_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_media_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_media_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_reading_progress: {
        Row: {
          bookmarks: Json | null
          id: string
          is_completed: boolean
          last_read_at: string
          last_read_section: number
          reading_id: string
          user_id: string
        }
        Insert: {
          bookmarks?: Json | null
          id?: string
          is_completed?: boolean
          last_read_at?: string
          last_read_section?: number
          reading_id: string
          user_id: string
        }
        Update: {
          bookmarks?: Json | null
          id?: string
          is_completed?: boolean
          last_read_at?: string
          last_read_section?: number
          reading_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_progress_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "reading_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_saved_words: {
        Row: {
          context_sentence: string | null
          created_at: string
          id: string
          meaning: string
          phonetic: string | null
          reading: string | null
          source_ref: string | null
          source_type: string
          target_set_id: string | null
          user_id: string
          word: string
        }
        Insert: {
          context_sentence?: string | null
          created_at?: string
          id?: string
          meaning: string
          phonetic?: string | null
          reading?: string | null
          source_ref?: string | null
          source_type: string
          target_set_id?: string | null
          user_id: string
          word: string
        }
        Update: {
          context_sentence?: string | null
          created_at?: string
          id?: string
          meaning?: string
          phonetic?: string | null
          reading?: string | null
          source_ref?: string | null
          source_type?: string
          target_set_id?: string | null
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_words_target_set_id_fkey"
            columns: ["target_set_id"]
            isOneToOne: false
            referencedRelation: "vocab_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_saved_words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_saved_words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_saved_words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_stage_progress: {
        Row: {
          completed_at: string | null
          id: string
          is_completed: boolean
          stage_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean
          stage_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean
          stage_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stage_progress_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "learning_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stage_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_stage_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stage_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_stage_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_stage_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_texts: {
        Row: {
          content: string
          created_at: string
          id: string
          language: Database["public"]["Enums"]["learning_language"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["learning_language"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["learning_language"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_texts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_texts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_texts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_texts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_texts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_video_cues: {
        Row: {
          created_at: string
          end_ms: number
          id: string
          sort_order: number
          start_ms: number
          text: string
          translation_vi: string | null
          user_id: string
          user_video_id: string
        }
        Insert: {
          created_at?: string
          end_ms: number
          id?: string
          sort_order?: number
          start_ms: number
          text: string
          translation_vi?: string | null
          user_id: string
          user_video_id: string
        }
        Update: {
          created_at?: string
          end_ms?: number
          id?: string
          sort_order?: number
          start_ms?: number
          text?: string
          translation_vi?: string | null
          user_id?: string
          user_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_video_cues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_video_cues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_video_cues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_video_cues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_video_cues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_video_cues_user_video_id_fkey"
            columns: ["user_video_id"]
            isOneToOne: false
            referencedRelation: "user_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_videos: {
        Row: {
          created_at: string
          id: string
          language: Database["public"]["Enums"]["learning_language"]
          title: string
          updated_at: string
          user_id: string
          youtube_id: string
          youtube_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["learning_language"]
          title: string
          updated_at?: string
          user_id: string
          youtube_id: string
          youtube_url: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["learning_language"]
          title?: string
          updated_at?: string
          user_id?: string
          youtube_id?: string
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_word_progress: {
        Row: {
          correct_count: number
          created_at: string
          easiness_factor: number
          id: string
          incorrect_count: number
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string
          repetition_count: number
          updated_at: string
          user_id: string
          word_id: string
        }
        Insert: {
          correct_count?: number
          created_at?: string
          easiness_factor?: number
          id?: string
          incorrect_count?: number
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          repetition_count?: number
          updated_at?: string
          user_id: string
          word_id: string
        }
        Update: {
          correct_count?: number
          created_at?: string
          easiness_factor?: number
          id?: string
          incorrect_count?: number
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          repetition_count?: number
          updated_at?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_word_progress_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "vocab_words"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_word_progress_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words_due_today"
            referencedColumns: ["word_id"]
          },
        ]
      }
      vocab_levels: {
        Row: {
          cefr_equivalent: string | null
          code: string
          color_tone: string
          description: string | null
          id: number
          level_number: number
          target_word_count: number
          title: string
        }
        Insert: {
          cefr_equivalent?: string | null
          code: string
          color_tone?: string
          description?: string | null
          id?: number
          level_number: number
          target_word_count?: number
          title: string
        }
        Update: {
          cefr_equivalent?: string | null
          code?: string
          color_tone?: string
          description?: string | null
          id?: number
          level_number?: number
          target_word_count?: number
          title?: string
        }
        Relationships: []
      }
      vocab_sets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          is_published: boolean
          is_system: boolean
          language: Database["public"]["Enums"]["learning_language"]
          level_id: number | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          is_published?: boolean
          is_system?: boolean
          language?: Database["public"]["Enums"]["learning_language"]
          level_id?: number | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          is_published?: boolean
          is_system?: boolean
          language?: Database["public"]["Enums"]["learning_language"]
          level_id?: number | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vocab_sets_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "vocab_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocab_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocab_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocab_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocab_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocab_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vocab_words: {
        Row: {
          audio_url: string | null
          created_at: string
          example_sentence: string | null
          example_translation: string | null
          examples: Json | null
          id: string
          meaning_vi: string
          part_of_speech: string | null
          phonetic: string | null
          reading: string | null
          set_id: string
          word: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          example_sentence?: string | null
          example_translation?: string | null
          examples?: Json | null
          id?: string
          meaning_vi: string
          part_of_speech?: string | null
          phonetic?: string | null
          reading?: string | null
          set_id: string
          word: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          example_sentence?: string | null
          example_translation?: string | null
          examples?: Json | null
          id?: string
          meaning_vi?: string
          part_of_speech?: string | null
          phonetic?: string | null
          reading?: string | null
          set_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocab_words_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "vocab_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          created_at: string
          id: string
          reference_id: string | null
          source: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          reference_id?: string | null
          source: string
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          reference_id?: string | null
          source?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      daily_user_stats: {
        Row: {
          completed_lessons: number | null
          learning_time_minutes: number | null
          new_words_learned: number | null
          stat_date: string | null
          user_id: string | null
          xp_gained_today: number | null
        }
        Insert: {
          completed_lessons?: never
          learning_time_minutes?: never
          new_words_learned?: never
          stat_date?: never
          user_id?: string | null
          xp_gained_today?: never
        }
        Update: {
          completed_lessons?: never
          learning_time_minutes?: never
          new_words_learned?: never
          stat_date?: never
          user_id?: string | null
          xp_gained_today?: never
        }
        Relationships: []
      }
      feature_requests_public: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          category: string | null
          comment_count: number | null
          created_at: string | null
          description: string | null
          id: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          vote_count: number | null
        }
        Relationships: []
      }
      user_vocab_levels_summary: {
        Row: {
          code: string | null
          color_tone: string | null
          learned_count: number | null
          level_number: number | null
          title: string | null
          total_target: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_xp_totals: {
        Row: {
          avatar_text: string | null
          full_name: string | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: []
      }
      weekly_leaderboard: {
        Row: {
          avatar_text: string | null
          full_name: string | null
          rank: number | null
          user_id: string | null
          weekly_xp: number | null
        }
        Relationships: []
      }
      weekly_user_summary: {
        Row: {
          completed_tests_count: number | null
          current_streak_days: number | null
          total_weekly_minutes: number | null
          user_id: string | null
          week_start: string | null
          weekly_words_learned: number | null
          weekly_xp: number | null
        }
        Insert: {
          completed_tests_count?: never
          current_streak_days?: never
          total_weekly_minutes?: never
          user_id?: string | null
          week_start?: never
          weekly_words_learned?: never
          weekly_xp?: never
        }
        Update: {
          completed_tests_count?: never
          current_streak_days?: never
          total_weekly_minutes?: never
          user_id?: string | null
          week_start?: never
          weekly_words_learned?: never
          weekly_xp?: never
        }
        Relationships: []
      }
      words_due_today: {
        Row: {
          audio_url: string | null
          easiness_factor: number | null
          example_sentence: string | null
          example_translation: string | null
          interval_days: number | null
          is_critical: boolean | null
          meaning_vi: string | null
          next_review_at: string | null
          part_of_speech: string | null
          phonetic: string | null
          progress_id: string | null
          repetition_count: number | null
          set_title: string | null
          user_id: string | null
          word: string | null
          word_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "daily_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_xp_totals"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_user_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      award_xp: {
        Args: { p_ref_id?: string; p_source: string; p_user_id?: string }
        Returns: Json
      }
      claim_daily_checkin: { Args: never; Returns: Json }
      complete_stage: { Args: { p_stage_id: string }; Returns: Json }
      submit_exam_attempt: {
        Args: {
          p_answers: Json
          p_audio_path?: string | null
          p_duration_seconds: number
          p_essay?: string | null
          p_mode: Database['public']['Enums']['exam_mode']
          p_test_id: string
        }
        Returns: Json
      }
      get_my_today_stats: {
        Args: never
        Returns: {
          completed_lessons: number
          learning_time_minutes: number
          new_words_learned: number
          xp_gained_today: number
        }[]
      }
      get_user_streak: { Args: { p_user_id: string }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      review_word: {
        Args: { p_rating: number; p_word_id: string }
        Returns: Json
      }
      submit_grammar_attempt: {
        Args: {
          p_answers: Json
          p_duration_seconds?: number
          p_point_id: string
        }
        Returns: Json
      }
      submit_typing_attempt: {
        Args: {
          p_accuracy: number
          p_duration_seconds: number
          p_topic_id: string
          p_wpm: number
        }
        Returns: Json
      }
      toggle_feature_vote: { Args: { p_request_id: string }; Returns: Json }
    }
    Enums: {
      difficulty_level: "Dß╗à" | "Trung b├¼nh" | "Kh├│"
      exam_mode: "practice" | "exam"
      ielts_skill: "listening" | "reading" | "writing" | "speaking"
      learning_language: "en" | "zh" | "ja"
      notification_category: "system" | "streak" | "lesson" | "award"
      question_type:
        | "multiple_choice"
        | "true_false_not_given"
        | "fill_blank"
        | "matching"
        | "essay"
        | "speaking_prompt"
      target_exam: "ielts" | "toeic" | "toefl" | "hsk" | "jlpt"
      test_status: "chua_lam" | "dang_lam" | "da_xong"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          lifecycle_configuration: Json | null
          lifecycle_configuration_generation: string | null
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
          versioning_status: string
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          lifecycle_configuration?: Json | null
          lifecycle_configuration_generation?: string | null
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          lifecycle_configuration?: Json | null
          lifecycle_configuration_generation?: string | null
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          archived_at: string | null
          bucket_id: string | null
          created_at: string | null
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: { delete_markers?: string; noncurrent_versions?: string }
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
          raw_prefix_param?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delete_markers?: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          next_token_archived_at?: string
          next_token_version?: string
          noncurrent_versions?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          archived_at: string
          created_at: string
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
          version: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          delete_markers?: string
          levels?: number
          limits?: number
          noncurrent_versions?: string
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          archived_at: string
          created_at: string
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
          version: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          delete_markers?: string
          noncurrent_versions?: string
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
          p_start_after_version?: string
        }
        Returns: {
          archived_at: string
          created_at: string
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
          version: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          delete_markers?: string
          levels?: number
          limits?: number
          noncurrent_versions?: string
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
          start_after_archived_at?: string
          start_after_is_continuation?: boolean
          start_after_version?: string
        }
        Returns: {
          archived_at: string
          created_at: string
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
          version: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      difficulty_level: ["Dß╗à", "Trung b├¼nh", "Kh├│"],
      exam_mode: ["practice", "exam"],
      ielts_skill: ["listening", "reading", "writing", "speaking"],
      learning_language: ["en", "zh", "ja"],
      notification_category: ["system", "streak", "lesson", "award"],
      question_type: [
        "multiple_choice",
        "true_false_not_given",
        "fill_blank",
        "matching",
        "essay",
        "speaking_prompt",
      ],
      target_exam: ["ielts", "toeic", "toefl", "hsk", "jlpt"],
      test_status: ["chua_lam", "dang_lam", "da_xong"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
