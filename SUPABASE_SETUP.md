# Supabase Setup Guide (v2)

## 1) Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY` (server-side key, do not expose in browser)
- Optional: `GEMINI_MODEL` (default fallback chain is used if empty)

## 2) Run Database Script

1. Open Supabase dashboard.
2. Go to SQL Editor.
3. Run `scripts/setup-db.sql`.

This creates:

- `users`
- `learning_sessions`
- `ai_generations`
- `session_questions`
- `question_options`
- `user_answers`
- `vocabulary_items`
- `vocabulary_progress`

It also enables RLS and creates an auth trigger so new `auth.users` rows auto-create profile rows in `public.users`.

## 3) App Flow

- `POST /api/exercises/generate`
  - creates or continues a learning session
  - calls Gemini for structured JSON
  - stores generation logs and generated content
- `GET /api/exercises/fetch`
  - `?sessionId=...` returns full session content
  - without `sessionId` returns recent sessions list (optional mode filter)

## 4) UI Entry Points

- `/dashboard/practice`
  - Grammar, Vocabulary, Mock Test in one studio
  - supports continue-generation flow
- `/dashboard/quizzes`
  - mock test session launcher/history
