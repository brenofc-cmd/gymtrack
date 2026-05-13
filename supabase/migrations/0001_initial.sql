-- GymTrack — Schema inicial
-- Aplicar via: Supabase Dashboard > SQL Editor

-- ============================================================
-- 1. Catálogo de exercícios (compartilhado, read-only)
-- ============================================================
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name_pt text not null,
  name_en text,
  exercisedb_id text,
  gif_url text,
  muscle_group text not null,
  equipment text,
  instructions text[],
  created_at timestamptz default now()
);

-- ============================================================
-- 2. Treinos (templates) — A, B, C...
-- ============================================================
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  letter text not null check (letter in ('A', 'B', 'C', 'D', 'E')),
  name text not null,
  notes text,
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. Exercícios dentro de cada treino
-- ============================================================
create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts on delete cascade not null,
  exercise_id uuid references exercises not null,
  order_index int not null,
  target_sets int not null,
  target_reps_min int not null,
  target_reps_max int not null,
  rest_seconds int not null,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- 4. Sessões de treino
-- ============================================================
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  workout_id uuid references workouts not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_seconds int,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. Logs de séries
-- ============================================================
create table set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions on delete cascade not null,
  workout_exercise_id uuid references workout_exercises not null,
  set_number int not null,
  weight_kg numeric(6,2),
  reps int not null,
  rpe int,
  completed_at timestamptz default now()
);

-- Índice para puxar último log rapidamente
create index idx_set_logs_exercise on set_logs(workout_exercise_id, completed_at desc);
create index idx_set_logs_session on set_logs(session_id);
create index idx_sessions_user on workout_sessions(user_id, started_at desc);
create index idx_workouts_user on workouts(user_id);

-- ============================================================
-- RLS — habilitar em todas as tabelas
-- ============================================================
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table set_logs enable row level security;

-- exercises: público para leitura
create policy "exercises leitura pública" on exercises
  for select using (true);

-- workouts: usuário vê e gerencia os próprios
create policy "workouts do usuário" on workouts
  for all using (auth.uid() = user_id);

-- workout_exercises: via workout do usuário
create policy "workout_exercises do usuário" on workout_exercises
  for all using (
    exists (
      select 1 from workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

-- workout_sessions: usuário vê e gerencia as próprias
create policy "sessions do usuário" on workout_sessions
  for all using (auth.uid() = user_id);

-- set_logs: via session do usuário
create policy "set_logs do usuário" on set_logs
  for all using (
    exists (
      select 1 from workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
