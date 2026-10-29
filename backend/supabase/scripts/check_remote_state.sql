-- Kiểm tra trạng thái hiện tại trên remote database sau lần push bị lỗi
-- Chạy script này trong Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. 5 migration gần nhất đã được áp
select version, name 
from supabase_migrations.schema_migrations 
order by version desc 
limit 5;

-- 2. Kiểm tra số lượng dòng hiện có ở các bảng liên quan đến seed
select 'vocab_levels' as t, count(*) from public.vocab_levels
union all select 'exams', count(*) from public.exams
union all select 'exam_skills', count(*) from public.exam_skills
union all select 'learning_stages', count(*) from public.learning_stages
union all select 'typing_topics', count(*) from public.typing_topics
union all select 'typing_sentences', count(*) from public.typing_sentences
union all select 'vocab_sets_system', count(*) from public.vocab_sets where user_id is null
union all select 'vocab_words', count(*) from public.vocab_words
union all select 'grammar_points', count(*) from public.grammar_points;
