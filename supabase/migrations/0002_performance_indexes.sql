-- Acelera queries de analytics de volume por período (ex: volume semanal)
CREATE INDEX IF NOT EXISTS idx_set_logs_user_date
  ON set_logs (session_id, completed_at);

-- Acelera busca de exercícios dentro de workouts (ex: PR por exercício)
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise
  ON workout_exercises (exercise_id);

-- Acelera busca de sessões por workout (ex: comparativo de sessões)
CREATE INDEX IF NOT EXISTS idx_sessions_workout_user
  ON workout_sessions (workout_id, user_id, finished_at DESC)
  WHERE finished_at IS NOT NULL;
