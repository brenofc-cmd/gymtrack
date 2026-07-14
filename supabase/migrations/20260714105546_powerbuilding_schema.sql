-- Extensão segura da rotina v4: força técnica + hipertrofia.
-- Esta migration adiciona metadados e check-in diário; não altera nem remove
-- sessões, séries, pesos, medidas ou templates existentes.

alter table public.workouts
  add column if not exists session_focus text not null default 'hypertrophy';
alter table public.workouts drop constraint if exists workouts_session_focus_check;
alter table public.workouts add constraint workouts_session_focus_check
  check (session_focus in ('strength_technique', 'hypertrophy', 'recovery'));

alter table public.workout_exercises
  add column if not exists progression_type text not null default 'double_progression',
  add column if not exists failure_allowed boolean not null default false,
  add column if not exists failure_risk_level text not null default 'moderate',
  add column if not exists top_set_enabled boolean not null default false,
  add column if not exists backoff_percentage numeric(5,2),
  add column if not exists aesthetic_function text;

alter table public.workout_exercises
  drop constraint if exists workout_exercises_progression_type_check;
alter table public.workout_exercises add constraint workout_exercises_progression_type_check
  check (progression_type in ('double_progression', 'top_set_backoff', 'bodyweight_control', 'range_control'));
alter table public.workout_exercises
  drop constraint if exists workout_exercises_failure_risk_level_check;
alter table public.workout_exercises add constraint workout_exercises_failure_risk_level_check
  check (failure_risk_level in ('low', 'moderate', 'high'));
alter table public.workout_exercises
  drop constraint if exists workout_exercises_backoff_percentage_check;
alter table public.workout_exercises add constraint workout_exercises_backoff_percentage_check
  check (backoff_percentage is null or backoff_percentage between 5 and 15);

alter table public.exercises
  add column if not exists training_objective text,
  add column if not exists difficulty_level text not null default 'beginner',
  add column if not exists risk_level text not null default 'moderate';

alter table public.exercises drop constraint if exists exercises_movement_pattern_check;
alter table public.exercises add constraint exercises_movement_pattern_check
  check (movement_pattern is null or movement_pattern in (
    'horizontal_push', 'incline_push', 'vertical_push',
    'vertical_pull', 'horizontal_pull', 'squat', 'hip_hinge',
    'unilateral_leg', 'knee_flexion', 'calf_raise',
    'lateral_delt', 'rear_delt', 'elbow_flexion', 'elbow_extension',
    'trunk_flexion', 'pelvic_curl', 'anti_extension', 'anti_rotation',
    -- valores legados, preservados para não invalidar histórico
    'flexao_tronco', 'retroversao_pelvica', 'anti_extensao'
  ));
alter table public.exercises drop constraint if exists exercises_difficulty_level_check;
alter table public.exercises add constraint exercises_difficulty_level_check
  check (difficulty_level in ('beginner', 'intermediate', 'advanced'));
alter table public.exercises drop constraint if exists exercises_risk_level_check;
alter table public.exercises add constraint exercises_risk_level_check
  check (risk_level in ('low', 'moderate', 'high'));

alter table public.set_logs
  add column if not exists set_role text not null default 'standard',
  add column if not exists rom_quality text,
  add column if not exists estimated_1rm numeric(8,2);
alter table public.set_logs drop constraint if exists set_logs_set_role_check;
alter table public.set_logs add constraint set_logs_set_role_check
  check (set_role in ('warmup', 'top', 'backoff', 'standard'));
alter table public.set_logs drop constraint if exists set_logs_rom_quality_check;
alter table public.set_logs add constraint set_logs_rom_quality_check
  check (rom_quality is null or rom_quality in ('completa', 'adequada', 'reduzida'));

alter table public.user_profiles
  add column if not exists training_phase text not null default 'fundamentals';
alter table public.user_profiles drop constraint if exists user_profiles_training_phase_check;
alter table public.user_profiles add constraint user_profiles_training_phase_check
  check (training_phase in ('fundamentals', 'intro_powerbuilding', 'advanced_powerbuilding'));

create table if not exists public.daily_readiness (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  readiness_date date not null default current_date,
  sleep_quality smallint not null check (sleep_quality between 1 and 5),
  energy smallint not null check (energy between 1 and 5),
  muscle_soreness smallint not null check (muscle_soreness between 1 and 5),
  joint_pain text not null check (joint_pain in ('none', 'mild', 'moderate', 'severe')),
  stress smallint not null check (stress between 1 and 5),
  motivation smallint not null check (motivation between 1 and 5),
  recovery_feeling smallint not null check (recovery_feeling between 1 and 5),
  recommendation text not null check (recommendation in ('ready', 'attention', 'low_recovery', 'stop_for_pain')),
  recommendation_reason text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, readiness_date)
);

create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  provenance text not null check (provenance in (
    'direct_primary_source', 'official_secondary_source',
    'scientific_evidence', 'implementation_inference'
  )),
  url text,
  summary text not null,
  accessed_on date not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_daily_readiness_user_date
  on public.daily_readiness(user_id, readiness_date desc);
create index if not exists idx_set_logs_valid_e1rm
  on public.set_logs(performed_exercise_id, estimated_1rm desc)
  where estimated_1rm is not null and is_warmup = false;

alter table public.daily_readiness enable row level security;
alter table public.content_sources enable row level security;

drop policy if exists "readiness do próprio usuário" on public.daily_readiness;
create policy "readiness do próprio usuário" on public.daily_readiness
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "fontes visíveis para autenticados" on public.content_sources;
create policy "fontes visíveis para autenticados" on public.content_sources
  for select to authenticated using (true);

-- Grants explícitos: novos defaults do Supabase deixam de expor tabelas
-- automaticamente à Data API.
grant select, insert, update, delete on public.daily_readiness to authenticated;
grant select on public.content_sources to authenticated;

-- Rollback documentado (não executar se já houver dados v4):
-- drop table if exists public.daily_readiness;
-- drop table if exists public.content_sources;
-- alter table public.set_logs drop column if exists set_role,
--   drop column if exists rom_quality, drop column if exists estimated_1rm;
-- alter table public.workout_exercises drop column if exists progression_type,
--   drop column if exists failure_allowed, drop column if exists failure_risk_level,
--   drop column if exists top_set_enabled, drop column if exists backoff_percentage,
--   drop column if exists aesthetic_function;
-- alter table public.workouts drop column if exists session_focus;
