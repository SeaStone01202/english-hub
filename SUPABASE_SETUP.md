# Supabase Setup Guide

## 1. Initial Setup

You have three environment variables configured:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_GEMINI_API_KEY`: Your Google Gemini API key

## 2. Create Database Schema

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `/scripts/setup-db.sql`
4. Click "Run" to execute the migration

This will create:
- `users` table with user profiles
- `exercises` table for storing generated exercises
- `quiz_sessions` table for grouping exercises
- `quiz_questions` table for individual questions
- `user_progress` table for tracking completion and scores

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## 3. Authentication

The app now uses Supabase Auth with email/password authentication. Users will:
1. Sign up with email and password
2. A user profile is automatically created in the `users` table
3. Users can log in with their credentials

## 4. Gemini API Integration

The app uses Google's Gemini API to generate exercises on-demand. When a user generates an exercise:
1. The request is sent to `/api/exercises/generate`
2. Gemini generates the exercise content
3. The exercise is stored in the database
4. The exercise is returned to the user

## 5. Testing

Once setup is complete:
1. Register a new user
2. Navigate to "Practice" or "Quizzes"
3. Click "Generate New Exercise"
4. Select exercise type and difficulty
5. Gemini will generate a new exercise for you
