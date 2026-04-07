-- WorkoutOS v2: catalog-driven generator, admin approval, rich profiles.
-- Run seed.sql after this file to load reference data and exercises.

CREATE TABLE IF NOT EXISTS reference_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  meta JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (category, slug)
);

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  muscle_targets TEXT[] NOT NULL DEFAULT '{}',
  required_equipment_slugs TEXT[] NOT NULL DEFAULT '{}',
  goal_slugs TEXT[] NOT NULL DEFAULT '{}',
  min_experience_sort INT NOT NULL DEFAULT 0,
  max_experience_sort INT NOT NULL DEFAULT 2,
  sets_default INT NOT NULL DEFAULT 3,
  reps_scheme TEXT NOT NULL,
  rir_default INT NOT NULL DEFAULT 2,
  rest_seconds INT NOT NULL DEFAULT 90,
  load_meta JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  account_status TEXT NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age INT,
  height_cm INT,
  weight_kg NUMERIC,
  sex_slug TEXT,
  goal_slug TEXT,
  experience_slug TEXT,
  days_per_week INT,
  session_duration_min INT,
  equipment_slugs JSONB NOT NULL DEFAULT '[]'::jsonb,
  injuries_limitations TEXT,
  medications_notes TEXT,
  occupation_activity_slug TEXT,
  focus_muscle_slugs JSONB NOT NULL DEFAULT '[]'::jsonb,
  sleep_typical_hours NUMERIC,
  training_notes TEXT,
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS readiness_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sleep_hours NUMERIC,
  energy_score INT,
  soreness_score INT,
  stress_score INT,
  motivation_score INT,
  pain_today BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completion_percent INT,
  total_volume NUMERIC,
  avg_rir_delta NUMERIC,
  readiness_score NUMERIC,
  pain_flag BOOLEAN DEFAULT FALSE,
  feedback TEXT,
  plan_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  exercise_slug TEXT,
  exercise_name TEXT,
  planned_sets INT,
  planned_reps TEXT,
  planned_weight NUMERIC,
  planned_rir INT,
  actual_reps INT,
  actual_weight NUMERIC,
  actual_rir INT,
  completed BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_exercises_active ON exercises(active);
CREATE INDEX IF NOT EXISTS idx_reference_options_category ON reference_options(category);
