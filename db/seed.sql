-- Catalog data: goals, experience, equipment, presets, muscles, exercises.
-- Safe to re-run: uses ON CONFLICT DO NOTHING.

INSERT INTO reference_options (category, slug, label, sort_order, meta) VALUES
  ('goal', 'muscle_gain', 'Muscle gain (hypertrophy)', 10, '{"planBias":"volume"}'),
  ('goal', 'strength_gain', 'Strength (heavy compounds)', 20, '{"planBias":"intensity"}'),
  ('goal', 'fat_loss', 'Fat loss (metabolic + strength)', 30, '{"planBias":"density"}'),
  ('goal', 'recomp', 'Recomposition (maintain + reshape)', 40, '{"planBias":"balanced"}')
ON CONFLICT (category, slug) DO NOTHING;

INSERT INTO reference_options (category, slug, label, sort_order, meta) VALUES
  ('experience', 'beginner', 'Beginner (< 1 year consistent)', 0, '{"volumeScale":0.9,"labelShort":"Beginner"}'),
  ('experience', 'intermediate', 'Intermediate (1–3 years)', 1, '{"volumeScale":1,"labelShort":"Intermediate"}'),
  ('experience', 'advanced', 'Advanced (3+ years)', 2, '{"volumeScale":1.08,"labelShort":"Advanced"}')
ON CONFLICT (category, slug) DO NOTHING;

INSERT INTO reference_options (category, slug, label, sort_order, meta) VALUES
  ('equipment', 'barbell', 'Barbell + plates', 10, '{}'),
  ('equipment', 'dumbbells', 'Dumbbells', 20, '{}'),
  ('equipment', 'kettlebell', 'Kettlebell(s)', 30, '{}'),
  ('equipment', 'cables', 'Cable station', 40, '{}'),
  ('equipment', 'machines', 'Weight machines', 50, '{}'),
  ('equipment', 'pullup_bar', 'Pull-up bar / rack', 60, '{}'),
  ('equipment', 'bench', 'Adjustable bench', 70, '{}'),
  ('equipment', 'squat_rack', 'Squat / power rack', 80, '{}'),
  ('equipment', 'bodyweight', 'Bodyweight only', 90, '{}'),
  ('equipment', 'cardio', 'Bike / rower / treadmill', 100, '{}')
ON CONFLICT (category, slug) DO NOTHING;

INSERT INTO reference_options (category, slug, label, sort_order, meta) VALUES
  ('equipment_preset', 'commercial_gym', 'Commercial gym (full kit)', 10, '{"equipment_slugs":["barbell","dumbbells","kettlebell","cables","machines","pullup_bar","bench","squat_rack","bodyweight","cardio"]}'),
  ('equipment_preset', 'home_gym', 'Home gym (barbell + bench + dumbbells)', 20, '{"equipment_slugs":["barbell","dumbbells","bench","squat_rack","pullup_bar","bodyweight"]}'),
  ('equipment_preset', 'minimal', 'Minimal (dumbbells + bodyweight)', 30, '{"equipment_slugs":["dumbbells","bodyweight","bench"]}')
ON CONFLICT (category, slug) DO NOTHING;

INSERT INTO reference_options (category, slug, label, sort_order, meta) VALUES
  ('sex', 'prefer_not', 'Prefer not to say', 0, '{}'),
  ('sex', 'female', 'Female', 10, '{}'),
  ('sex', 'male', 'Male', 20, '{}'),
  ('sex', 'other', 'Other / non-binary', 30, '{}')
ON CONFLICT (category, slug) DO NOTHING;

INSERT INTO reference_options (category, slug, label, sort_order, meta) VALUES
  ('occupation_activity', 'sedentary', 'Mostly desk / driving', 10, '{}'),
  ('occupation_activity', 'light', 'Light movement most days', 20, '{}'),
  ('occupation_activity', 'moderate', 'On feet or active job', 30, '{}'),
  ('occupation_activity', 'heavy', 'Very physical work', 40, '{}')
ON CONFLICT (category, slug) DO NOTHING;

INSERT INTO reference_options (category, slug, label, sort_order, meta) VALUES
  ('muscle_group', 'chest', 'Chest', 10, '{}'),
  ('muscle_group', 'back', 'Back', 20, '{}'),
  ('muscle_group', 'legs', 'Legs / glutes', 30, '{}'),
  ('muscle_group', 'shoulders', 'Shoulders', 40, '{}'),
  ('muscle_group', 'arms', 'Arms', 50, '{}'),
  ('muscle_group', 'core', 'Core', 60, '{}'),
  ('muscle_group', 'conditioning', 'Conditioning', 70, '{}')
ON CONFLICT (category, slug) DO NOTHING;

INSERT INTO exercises (slug, name, muscle_targets, required_equipment_slugs, goal_slugs, min_experience_sort, max_experience_sort, sets_default, reps_scheme, rir_default, rest_seconds, load_meta) VALUES
  ('back_squat', 'Back squat', ARRAY['legs']::text[], ARRAY['barbell','squat_rack']::text[], ARRAY['muscle_gain','strength_gain','recomp']::text[], 0, 2, 4, '6–10', 2, 150, '{"strategy":"bodyweight_pct","pct":{"beginner":0.38,"intermediate":0.52,"advanced":0.66}}'),
  ('bench_press', 'Barbell bench press', ARRAY['chest','arms']::text[], ARRAY['barbell','bench']::text[], ARRAY['muscle_gain','strength_gain','recomp']::text[], 0, 2, 4, '6–10', 2, 120, '{"strategy":"bodyweight_pct","pct":{"beginner":0.28,"intermediate":0.38,"advanced":0.48}}'),
  ('deadlift', 'Conventional deadlift', ARRAY['legs','back']::text[], ARRAY['barbell']::text[], ARRAY['strength_gain','muscle_gain','recomp']::text[], 1, 2, 3, '3–6', 2, 180, '{"strategy":"bodyweight_pct","pct":{"beginner":0.45,"intermediate":0.6,"advanced":0.75}}'),
  ('romanian_deadlift', 'Romanian deadlift', ARRAY['legs','back']::text[], ARRAY['barbell','dumbbells']::text[], ARRAY['muscle_gain','recomp','fat_loss']::text[], 0, 2, 3, '8–12', 2, 120, '{"strategy":"base_kg_scale","baseKg":40,"scale":{"beginner":0.85,"intermediate":1,"advanced":1.15}}'),
  ('lat_pulldown', 'Lat pulldown', ARRAY['back','arms']::text[], ARRAY['cables','machines']::text[], ARRAY['muscle_gain','recomp','fat_loss']::text[], 0, 2, 3, '10–12', 2, 90, '{"strategy":"base_kg_scale","baseKg":35,"scale":{"beginner":0.8,"intermediate":1,"advanced":1.2}}'),
  ('pull_up', 'Pull-up / chin-up', ARRAY['back','arms']::text[], ARRAY['pullup_bar','bodyweight']::text[], ARRAY['strength_gain','muscle_gain','recomp','fat_loss']::text[], 0, 2, 3, '6–10', 2, 90, '{"strategy":"assisted_bw","pct":{"beginner":0.15,"intermediate":0.25,"advanced":0.35}}'),
  ('db_press', 'Dumbbell bench press', ARRAY['chest','shoulders','arms']::text[], ARRAY['dumbbells','bench']::text[], ARRAY['muscle_gain','recomp','fat_loss']::text[], 0, 2, 3, '8–12', 2, 90, '{"strategy":"base_kg_scale","baseKg":14,"scale":{"beginner":0.85,"intermediate":1,"advanced":1.2}}'),
  ('goblet_squat', 'Goblet squat', ARRAY['legs','core']::text[], ARRAY['dumbbells','kettlebell','bodyweight']::text[], ARRAY['fat_loss','muscle_gain','recomp']::text[], 0, 2, 3, '10–15', 3, 75, '{"strategy":"base_kg_scale","baseKg":16,"scale":{"beginner":0.8,"intermediate":1,"advanced":1.15}}'),
  ('leg_press', 'Leg press', ARRAY['legs']::text[], ARRAY['machines']::text[], ARRAY['muscle_gain','recomp','fat_loss']::text[], 0, 2, 4, '8–12', 2, 120, '{"strategy":"base_kg_scale","baseKg":90,"scale":{"beginner":0.7,"intermediate":1,"advanced":1.25}}'),
  ('hip_thrust', 'Hip thrust', ARRAY['legs','back']::text[], ARRAY['barbell','bench','bodyweight']::text[], ARRAY['muscle_gain','recomp']::text[], 0, 2, 3, '10–12', 2, 90, '{"strategy":"base_kg_scale","baseKg":50,"scale":{"beginner":0.75,"intermediate":1,"advanced":1.2}}'),
  ('ohp', 'Overhead press', ARRAY['shoulders','arms']::text[], ARRAY['barbell','dumbbells']::text[], ARRAY['strength_gain','muscle_gain','recomp']::text[], 0, 2, 4, '6–10', 2, 120, '{"strategy":"base_kg_scale","baseKg":25,"scale":{"beginner":0.75,"intermediate":1,"advanced":1.2}}'),
  ('cable_row', 'Seated cable row', ARRAY['back','arms']::text[], ARRAY['cables','machines']::text[], ARRAY['muscle_gain','recomp','fat_loss']::text[], 0, 2, 3, '10–12', 2, 90, '{"strategy":"base_kg_scale","baseKg":32,"scale":{"beginner":0.8,"intermediate":1,"advanced":1.2}}'),
  ('lateral_raise', 'Lateral raise', ARRAY['shoulders']::text[], ARRAY['dumbbells','cables']::text[], ARRAY['muscle_gain','recomp']::text[], 0, 2, 3, '12–15', 2, 60, '{"strategy":"base_kg_scale","baseKg":6,"scale":{"beginner":0.85,"intermediate":1,"advanced":1.15}}'),
  ('plank', 'Plank', ARRAY['core']::text[], ARRAY['bodyweight']::text[], ARRAY['fat_loss','recomp','muscle_gain']::text[], 0, 2, 3, '45–60s', 4, 45, '{"strategy":"fixed","kg":0}'),
  ('walking_lunge', 'Walking lunge', ARRAY['legs']::text[], ARRAY['dumbbells','bodyweight']::text[], ARRAY['fat_loss','recomp','muscle_gain']::text[], 0, 2, 3, '10–12 / leg', 3, 75, '{"strategy":"base_kg_scale","baseKg":10,"scale":{"beginner":0.8,"intermediate":1,"advanced":1.15}}'),
  ('bike_intervals', 'Bike intervals', ARRAY['conditioning','legs']::text[], ARRAY['cardio']::text[], ARRAY['fat_loss']::text[], 0, 2, 6, '30s on / 60s off', 4, 30, '{"strategy":"fixed","kg":0}'),
  ('kb_swing', 'Kettlebell swing', ARRAY['legs','back','conditioning']::text[], ARRAY['kettlebell','dumbbells']::text[], ARRAY['fat_loss','recomp','strength_gain']::text[], 0, 2, 4, '12–15', 3, 60, '{"strategy":"base_kg_scale","baseKg":16,"scale":{"beginner":0.85,"intermediate":1,"advanced":1.15}}'),
  ('chest_supported_row', 'Chest-supported row', ARRAY['back','arms']::text[], ARRAY['dumbbells','bench']::text[], ARRAY['muscle_gain','recomp']::text[], 0, 2, 4, '8–12', 2, 90, '{"strategy":"base_kg_scale","baseKg":18,"scale":{"beginner":0.85,"intermediate":1,"advanced":1.2}}')
ON CONFLICT (slug) DO NOTHING;
