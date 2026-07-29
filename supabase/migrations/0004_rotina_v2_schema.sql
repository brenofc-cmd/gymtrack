-- 0004 — Schema da Rotina v2 (PPL 6 dias)
--
-- Parte 1: sincroniza o repositório com colunas que já existem no banco
--          (adicionadas anteriormente via dashboard) usando IF NOT EXISTS.
-- Parte 2: novos objetos para a rotina v2: substituições permitidas,
--          variação executada por série, padrão de movimento e backups.
--
-- Rollback (down):
--   drop table if exists workout_exercise_substitutions;
--   drop table if exists routine_backups;
--   alter table set_logs drop column if exists performed_exercise_id;
--   alter table exercises drop column if exists movement_pattern;
--   alter table workouts drop column if exists routine_version;
--   (as demais colunas da Parte 1 são pré-existentes no banco de produção
--    e não devem ser removidas em rollback.)

-- ============================================================
-- Parte 1 — sincronização de colunas pré-existentes
-- ============================================================
alter table workouts add column if not exists is_daily boolean not null default false;
alter table workouts add column if not exists day_of_week int check (day_of_week between 1 and 7);
alter table workouts add column if not exists objective text;
alter table workouts add column if not exists warmup_note text;
alter table workouts add column if not exists is_archived boolean not null default false;

alter table workout_exercises add column if not exists is_priority boolean not null default false;
alter table workout_exercises add column if not exists is_hidden boolean not null default false;
alter table workout_exercises add column if not exists user_note text;
alter table workout_exercises add column if not exists superset_group int;
alter table workout_exercises add column if not exists rir_min int;
alter table workout_exercises add column if not exists rir_max int;
alter table workout_exercises add column if not exists load_guidance text;
alter table workout_exercises add column if not exists technique_notes text[];

alter table set_logs add column if not exists notes text;
alter table set_logs add column if not exists rir int;
alter table set_logs add column if not exists is_warmup boolean not null default false;
alter table set_logs add column if not exists pain_level text
  check (pain_level in ('nenhuma', 'leve', 'moderada', 'forte'));
alter table set_logs add column if not exists execution_quality text
  check (execution_quality in ('boa', 'aceitavel', 'ruim'));

alter table exercises add column if not exists exercise_type text;
alter table exercises add column if not exists secondary_muscles text[];
alter table exercises add column if not exists load_guidance text;

-- ============================================================
-- Parte 2 — novos objetos da rotina v2
-- ============================================================

-- exercise_type passa a aceitar 'abdominal'
alter table exercises drop constraint if exists exercises_exercise_type_check;
alter table exercises add constraint exercises_exercise_type_check
  check (exercise_type is null or exercise_type in ('composto', 'isolador', 'abdominal'));

-- Padrão de movimento (exibido para exercícios abdominais)
alter table exercises add column if not exists movement_pattern text
  check (movement_pattern is null or movement_pattern in
    ('flexao_tronco', 'retroversao_pelvica', 'anti_extensao'));

-- Versão da rotina no treino (v1 = rotina anterior, v2 = definitiva)
alter table workouts add column if not exists routine_version int not null default 1;

-- Variação realmente executada em cada série (histórico separado por variação)
alter table set_logs add column if not exists performed_exercise_id uuid references exercises(id);
create index if not exists idx_set_logs_performed_exercise
  on set_logs(performed_exercise_id) where performed_exercise_id is not null;

-- Substituições permitidas por exercício do treino
create table if not exists workout_exercise_substitutions (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references workout_exercises(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  order_index int not null default 0,
  created_at timestamptz default now(),
  unique (workout_exercise_id, exercise_id)
);
create index if not exists idx_we_substitutions_we
  on workout_exercise_substitutions(workout_exercise_id);

alter table workout_exercise_substitutions enable row level security;

drop policy if exists "substitutions do usuário" on workout_exercise_substitutions;
create policy "substitutions do usuário" on workout_exercise_substitutions
  for all using (
    exists (
      select 1
      from workout_exercises we
      join workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

-- Backup de fichas (snapshot antes de trocar de rotina)
create table if not exists routine_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  label text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

alter table routine_backups enable row level security;

drop policy if exists "backups do usuário" on routine_backups;
create policy "backups do usuário" on routine_backups
  for all using (auth.uid() = user_id);

-- Índices de apoio
create index if not exists idx_workouts_user_active
  on workouts(user_id, day_of_week) where is_archived = false;
