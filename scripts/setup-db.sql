-- English Hub v2 schema
-- Reset-oriented migration: run in Supabase SQL editor.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS public.vocabulary_progress CASCADE;
DROP TABLE IF EXISTS public.user_answers CASCADE;
DROP TABLE IF EXISTS public.question_options CASCADE;
DROP TABLE IF EXISTS public.session_questions CASCADE;
DROP TABLE IF EXISTS public.vocabulary_items CASCADE;
DROP TABLE IF EXISTS public.ai_generations CASCADE;
DROP TABLE IF EXISTS public.learning_sessions CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.quiz_sessions CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('grammar', 'vocabulary', 'mock_test')),
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  topic TEXT NOT NULL DEFAULT 'General English',
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prompt_version TEXT NOT NULL DEFAULT 'v2',
  model TEXT NOT NULL,
  request_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  response_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES public.ai_generations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'fill_blank', 'matching')),
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_session_questions_unique_order
  ON public.session_questions(session_id, order_index);

CREATE TABLE public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.session_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_order INTEGER NOT NULL DEFAULT 0,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX idx_question_options_unique_order
  ON public.question_options(question_id, option_order);

CREATE TABLE public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.session_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.vocabulary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES public.ai_generations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  topic TEXT NOT NULL,
  word TEXT NOT NULL,
  phonetic TEXT,
  part_of_speech TEXT,
  meaning_vi TEXT NOT NULL,
  meaning_en TEXT,
  example_sentence TEXT NOT NULL,
  example_translation TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_vocabulary_items_unique_order
  ON public.vocabulary_items(session_id, order_index);

CREATE TABLE public.vocabulary_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vocab_item_id UUID NOT NULL REFERENCES public.vocabulary_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'mastered')),
  familiarity INTEGER NOT NULL DEFAULT 0 CHECK (familiarity BETWEEN 0 AND 5),
  next_review_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, vocab_item_id)
);

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER learning_sessions_set_updated_at
BEFORE UPDATE ON public.learning_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER session_questions_set_updated_at
BEFORE UPDATE ON public.session_questions
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER vocabulary_items_set_updated_at
BEFORE UPDATE ON public.vocabulary_items
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER vocabulary_progress_set_updated_at
BEFORE UPDATE ON public.vocabulary_progress
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_insert_own ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY learning_sessions_select_own ON public.learning_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY learning_sessions_insert_own ON public.learning_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY learning_sessions_update_own ON public.learning_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY learning_sessions_delete_own ON public.learning_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY ai_generations_select_own ON public.ai_generations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ai_generations_insert_own ON public.ai_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY session_questions_select_own ON public.session_questions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY session_questions_insert_own ON public.session_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY session_questions_update_own ON public.session_questions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY session_questions_delete_own ON public.session_questions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY question_options_select_own ON public.question_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.session_questions sq
      WHERE sq.id = question_options.question_id
        AND sq.user_id = auth.uid()
    )
  );
CREATE POLICY question_options_insert_own ON public.question_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.session_questions sq
      WHERE sq.id = question_options.question_id
        AND sq.user_id = auth.uid()
    )
  );
CREATE POLICY question_options_delete_own ON public.question_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.session_questions sq
      WHERE sq.id = question_options.question_id
        AND sq.user_id = auth.uid()
    )
  );

CREATE POLICY user_answers_select_own ON public.user_answers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_answers_insert_own ON public.user_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_answers_update_own ON public.user_answers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY user_answers_delete_own ON public.user_answers
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY vocabulary_items_select_own ON public.vocabulary_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY vocabulary_items_insert_own ON public.vocabulary_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY vocabulary_items_update_own ON public.vocabulary_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY vocabulary_items_delete_own ON public.vocabulary_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY vocabulary_progress_select_own ON public.vocabulary_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY vocabulary_progress_insert_own ON public.vocabulary_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY vocabulary_progress_update_own ON public.vocabulary_progress
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY vocabulary_progress_delete_own ON public.vocabulary_progress
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_learning_sessions_user ON public.learning_sessions(user_id, updated_at DESC);
CREATE INDEX idx_ai_generations_session ON public.ai_generations(session_id, created_at DESC);
CREATE INDEX idx_session_questions_session ON public.session_questions(session_id, order_index);
CREATE INDEX idx_question_options_question ON public.question_options(question_id, option_order);
CREATE INDEX idx_user_answers_user ON public.user_answers(user_id, answered_at DESC);
CREATE INDEX idx_vocabulary_items_session ON public.vocabulary_items(session_id, order_index);
CREATE INDEX idx_vocabulary_progress_user ON public.vocabulary_progress(user_id, next_review_at);

COMMIT;
