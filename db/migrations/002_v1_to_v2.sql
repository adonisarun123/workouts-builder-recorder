-- Migrate legacy "MVP" schema (users.goal_primary, user_profiles.equipment text, etc.) to WorkoutOS v2.
-- Safe to run multiple times where supported (IF NOT EXISTS / IF EXISTS checks).

-- --- reference_options.active (if 001 not applied) ---
ALTER TABLE reference_options ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- --- users: v2 auth columns ---
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID;

UPDATE users SET role = 'user' WHERE role IS NULL;
UPDATE users SET account_status = 'approved' WHERE account_status IS NULL;

ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE users ALTER COLUMN account_status SET DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_account_status_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_account_status_check CHECK (account_status IN ('pending', 'approved', 'rejected'));
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE users ALTER COLUMN role SET NOT NULL;
ALTER TABLE users ALTER COLUMN account_status SET NOT NULL;

-- --- Move legacy goal / experience from users into profiles ---
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'goal_primary'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS goal_slug TEXT;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS experience_slug TEXT;

    UPDATE user_profiles p
    SET goal_slug = CASE trim(both FROM COALESCE(u.goal_primary, ''))
        WHEN 'Muscle Gain' THEN 'muscle_gain'
        WHEN 'Strength Gain' THEN 'strength_gain'
        WHEN 'Fat Loss' THEN 'fat_loss'
        WHEN 'Recomposition' THEN 'recomp'
        WHEN '' THEN p.goal_slug
        ELSE lower(regexp_replace(trim(both FROM u.goal_primary), '[[:space:]]+', '_', 'g'))
      END,
        experience_slug = CASE trim(both FROM COALESCE(u.experience_level, ''))
        WHEN 'Beginner' THEN 'beginner'
        WHEN 'Intermediate' THEN 'intermediate'
        WHEN 'Advanced' THEN 'advanced'
        WHEN '' THEN p.experience_slug
        ELSE lower(regexp_replace(trim(both FROM u.experience_level), '[[:space:]]+', '_', 'g'))
      END
    FROM users u
    WHERE u.id = p.user_id;

    ALTER TABLE users DROP COLUMN IF EXISTS goal_primary;
    ALTER TABLE users DROP COLUMN IF EXISTS experience_level;
  END IF;
END $$;

-- --- user_profiles: new columns + legacy column renames ---
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS height_cm INT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sex_slug TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS session_duration_min INT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS equipment_slugs JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS injuries_limitations TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS medications_notes TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS occupation_activity_slug TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS focus_muscle_slugs JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sleep_typical_hours NUMERIC;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS training_notes TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- equipment (text) -> equipment_slugs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'equipment'
  ) THEN
    UPDATE user_profiles
    SET equipment_slugs = CASE trim(both FROM COALESCE(equipment, ''))
        WHEN 'Commercial Gym' THEN '["barbell","dumbbells","kettlebell","cables","machines","pullup_bar","bench","squat_rack","bodyweight","cardio"]'::jsonb
        WHEN 'Home Gym' THEN '["barbell","dumbbells","bench","squat_rack","pullup_bar","bodyweight"]'::jsonb
        WHEN 'Minimal Equipment' THEN '["dumbbells","bodyweight","bench"]'::jsonb
        ELSE '[]'::jsonb
      END
    WHERE equipment IS NOT NULL;

    ALTER TABLE user_profiles DROP COLUMN equipment;
  END IF;
END $$;

-- max_duration -> session_duration_min
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'max_duration'
  ) THEN
    UPDATE user_profiles SET session_duration_min = max_duration WHERE session_duration_min IS NULL;
    ALTER TABLE user_profiles DROP COLUMN max_duration;
  END IF;
END $$;

-- injuries -> injuries_limitations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'injuries'
  ) THEN
    UPDATE user_profiles SET injuries_limitations = injuries WHERE injuries_limitations IS NULL AND injuries IS NOT NULL;
    ALTER TABLE user_profiles DROP COLUMN injuries;
  END IF;
END $$;

-- workout_sessions.plan_snapshot
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS plan_snapshot JSONB;

-- session_exercise_logs extended columns
ALTER TABLE session_exercise_logs ADD COLUMN IF NOT EXISTS exercise_id UUID;
ALTER TABLE session_exercise_logs ADD COLUMN IF NOT EXISTS exercise_slug TEXT;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exercises') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_exercise_logs_exercise_id_fkey') THEN
      ALTER TABLE session_exercise_logs
        ADD CONSTRAINT session_exercise_logs_exercise_id_fkey
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;
