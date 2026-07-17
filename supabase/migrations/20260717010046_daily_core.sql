-- 20260717010046 — Abdômen Diário v1
--
-- Cria uma rotina matinal independente, com templates globais e registros por
-- usuário. O histórico da musculação principal nunca é apagado: os exercícios
-- abdominais da ficha ativa são apenas ocultados e registrados em
-- daily_core_main_exercise_conflicts para restauração.
--
-- Rollback seguro (executar nesta ordem):
--   update public.workout_exercises we
--      set is_hidden = c.was_hidden
--     from public.daily_core_main_exercise_conflicts c
--    where c.workout_exercise_id = we.id;
--   drop table if exists public.daily_core_main_exercise_conflicts;
--   drop table if exists public.daily_core_pain_logs;
--   drop table if exists public.daily_core_progressions;
--   drop table if exists public.daily_core_sets;
--   drop table if exists public.daily_core_sessions;
--   drop table if exists public.daily_core_reminders;
--   drop table if exists public.daily_core_preferences;
--   drop table if exists public.daily_core_variations;
--   drop table if exists public.daily_core_exercises;
--   drop table if exists public.daily_core_days;
--   drop function if exists public.daily_core_set_updated_at();

create function public.daily_core_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.daily_core_set_updated_at() from public;

create table public.daily_core_days (
  day_of_week smallint primary key check (day_of_week between 1 and 7),
  name text not null,
  objective text not null,
  session_type text not null check (session_type in ('hipertrofia', 'estabilidade', 'recuperacao', 'descanso')),
  intensity text not null check (intensity in ('moderada', 'leve', 'muito_leve', 'descanso')),
  duration_min smallint not null check (duration_min between 0 and 20),
  duration_max smallint not null check (duration_max between duration_min and 20),
  is_rest boolean not null default false,
  educational_note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_core_exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  day_of_week smallint not null references public.daily_core_days(day_of_week),
  name text not null,
  objective text not null,
  exercise_type text not null check (exercise_type in ('hipertrofia', 'estabilidade', 'anti_rotacao', 'anti_extensao', 'recuperacao', 'respiracao')),
  measure_type text not null check (measure_type in ('repeticoes', 'tempo', 'respiracoes')),
  target_sets smallint not null check (target_sets between 1 and 5),
  target_reps_min smallint check (target_reps_min between 1 and 100),
  target_reps_max smallint check (target_reps_max between target_reps_min and 100),
  target_seconds_min smallint check (target_seconds_min between 5 and 300),
  target_seconds_max smallint check (target_seconds_max between target_seconds_min and 300),
  per_side boolean not null default false,
  rir_min smallint check (rir_min between 0 and 5),
  rir_max smallint check (rir_max between rir_min and 5),
  rest_seconds_min smallint not null check (rest_seconds_min between 0 and 180),
  rest_seconds_max smallint not null check (rest_seconds_max between rest_seconds_min and 180),
  primary_muscle text not null default 'abdômen',
  equipment text,
  short_cue text not null,
  instructions text[] not null default '{}',
  progression_rule text not null,
  order_index smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (measure_type = 'tempo' and target_seconds_min is not null and target_seconds_max is not null)
    or (measure_type <> 'tempo' and target_reps_min is not null and target_reps_max is not null)
  )
);

create table public.daily_core_variations (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.daily_core_exercises(id) on delete cascade,
  name text not null,
  difficulty smallint not null check (difficulty between 1 and 5),
  equipment_required text,
  is_default boolean not null default false,
  is_equipment_fallback boolean not null default false,
  order_index smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (exercise_id, name)
);

create table public.daily_core_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  has_ab_wheel boolean not null default false,
  has_resistance_band boolean not null default false,
  has_weighted_backpack boolean not null default true,
  manual_rep_count boolean not null default true,
  routine_time time not null default '07:00',
  adaptation_started_on date not null default current_date,
  skip_adaptation boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_core_reminders (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  reminder_time time not null default '07:00',
  weekdays smallint[] not null default '{1,2,3,4,5,6}',
  sound_enabled boolean not null default true,
  vibration_enabled boolean not null default true,
  snoozed_until timestamptz,
  disabled_until timestamptz,
  last_notified_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (weekdays <@ array[1,2,3,4,5,6,7]::smallint[])
);

create table public.daily_core_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week smallint not null references public.daily_core_days(day_of_week),
  session_date date not null,
  session_type text not null check (session_type in ('hipertrofia', 'estabilidade', 'recuperacao', 'descanso')),
  status text not null default 'nao_iniciado' check (status in ('nao_iniciado', 'em_andamento', 'concluido', 'interrompido')),
  completion_kind text check (completion_kind in ('treino', 'recuperacao_completa', 'descanso', 'pausa_por_dor')),
  adaptation_week smallint not null default 1 check (adaptation_week between 0 and 99),
  started_at timestamptz,
  finished_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  client_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, session_date)
);

create table public.daily_core_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.daily_core_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.daily_core_exercises(id),
  variation_id uuid references public.daily_core_variations(id),
  set_number smallint not null check (set_number between 1 and 10),
  reps smallint check (reps is null or reps between 0 and 200),
  duration_seconds smallint check (duration_seconds is null or duration_seconds between 0 and 600),
  weight_kg numeric(6,2) check (weight_kg is null or weight_kg >= 0),
  rir smallint check (rir is null or rir between 0 and 10),
  execution_quality text check (execution_quality in ('excelente', 'boa', 'aceitavel', 'ruim')),
  pain_level text check (pain_level in ('sem_dor', 'desconforto_leve', 'dor_moderada', 'dor_forte', 'dor_lombar')),
  lumbar_controlled boolean,
  notes text,
  completed_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, exercise_id, set_number)
);

create table public.daily_core_progressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.daily_core_exercises(id) on delete cascade,
  current_variation_id uuid references public.daily_core_variations(id),
  suggested_variation_id uuid references public.daily_core_variations(id),
  suggested_reps smallint,
  suggested_seconds smallint,
  suggested_weight_kg numeric(6,2),
  status text not null default 'manter' check (status in ('manter', 'progredir', 'bloqueada_por_dor', 'revisar_tecnica')),
  reason text not null default 'Complete sessões para receber uma sugestão.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create table public.daily_core_pain_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.daily_core_sessions(id) on delete set null,
  exercise_id uuid references public.daily_core_exercises(id) on delete set null,
  logged_on date not null default current_date,
  pain_level text not null check (pain_level in ('sem_dor', 'dor_muscular_leve', 'dor_muscular_moderada', 'dor_forte', 'dor_lombar')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_core_main_exercise_conflicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  was_hidden boolean not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (workout_exercise_id)
);

create index daily_core_exercises_day_idx on public.daily_core_exercises(day_of_week, order_index);
create index daily_core_variations_exercise_idx on public.daily_core_variations(exercise_id, order_index);
create index daily_core_sessions_user_date_idx on public.daily_core_sessions(user_id, session_date desc);
create index daily_core_sessions_user_status_idx on public.daily_core_sessions(user_id, status) where status = 'em_andamento';
create index daily_core_sets_session_idx on public.daily_core_sets(session_id, set_number);
create index daily_core_sets_user_exercise_idx on public.daily_core_sets(user_id, exercise_id, completed_at desc);
create index daily_core_sets_variation_idx on public.daily_core_sets(variation_id) where variation_id is not null;
create index daily_core_progressions_user_idx on public.daily_core_progressions(user_id);
create index daily_core_progressions_exercise_idx on public.daily_core_progressions(exercise_id);
create index daily_core_pain_user_date_idx on public.daily_core_pain_logs(user_id, logged_on desc);
create index daily_core_pain_session_idx on public.daily_core_pain_logs(session_id) where session_id is not null;
create index daily_core_pain_exercise_idx on public.daily_core_pain_logs(exercise_id) where exercise_id is not null;
create index daily_core_conflicts_user_idx on public.daily_core_main_exercise_conflicts(user_id);

create trigger daily_core_days_updated_at before update on public.daily_core_days
for each row execute function public.daily_core_set_updated_at();
create trigger daily_core_exercises_updated_at before update on public.daily_core_exercises
for each row execute function public.daily_core_set_updated_at();
create trigger daily_core_preferences_updated_at before update on public.daily_core_preferences
for each row execute function public.daily_core_set_updated_at();
create trigger daily_core_reminders_updated_at before update on public.daily_core_reminders
for each row execute function public.daily_core_set_updated_at();
create trigger daily_core_sessions_updated_at before update on public.daily_core_sessions
for each row execute function public.daily_core_set_updated_at();
create trigger daily_core_sets_updated_at before update on public.daily_core_sets
for each row execute function public.daily_core_set_updated_at();
create trigger daily_core_progressions_updated_at before update on public.daily_core_progressions
for each row execute function public.daily_core_set_updated_at();
create trigger daily_core_pain_updated_at before update on public.daily_core_pain_logs
for each row execute function public.daily_core_set_updated_at();

alter table public.daily_core_days enable row level security;
alter table public.daily_core_exercises enable row level security;
alter table public.daily_core_variations enable row level security;
alter table public.daily_core_preferences enable row level security;
alter table public.daily_core_reminders enable row level security;
alter table public.daily_core_sessions enable row level security;
alter table public.daily_core_sets enable row level security;
alter table public.daily_core_progressions enable row level security;
alter table public.daily_core_pain_logs enable row level security;
alter table public.daily_core_main_exercise_conflicts enable row level security;

create policy "daily core days readable" on public.daily_core_days for select to authenticated using (true);
create policy "daily core exercises readable" on public.daily_core_exercises for select to authenticated using (true);
create policy "daily core variations readable" on public.daily_core_variations for select to authenticated using (true);

create policy "daily core preferences select own" on public.daily_core_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily core preferences insert own" on public.daily_core_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "daily core preferences update own" on public.daily_core_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily core preferences delete own" on public.daily_core_preferences for delete to authenticated using ((select auth.uid()) = user_id);

create policy "daily core reminders select own" on public.daily_core_reminders for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily core reminders insert own" on public.daily_core_reminders for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "daily core reminders update own" on public.daily_core_reminders for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily core reminders delete own" on public.daily_core_reminders for delete to authenticated using ((select auth.uid()) = user_id);

create policy "daily core sessions select own" on public.daily_core_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily core sessions insert own" on public.daily_core_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "daily core sessions update own" on public.daily_core_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily core sessions delete own" on public.daily_core_sessions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "daily core sets select own" on public.daily_core_sets for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily core sets insert own" on public.daily_core_sets for insert to authenticated with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.daily_core_sessions s where s.id = session_id and s.user_id = (select auth.uid())
  )
);
create policy "daily core sets update own" on public.daily_core_sets for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.daily_core_sessions s where s.id = session_id and s.user_id = (select auth.uid())
    )
  );
create policy "daily core sets delete own" on public.daily_core_sets for delete to authenticated using ((select auth.uid()) = user_id);

create policy "daily core progressions select own" on public.daily_core_progressions for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily core progressions insert own" on public.daily_core_progressions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "daily core progressions update own" on public.daily_core_progressions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily core progressions delete own" on public.daily_core_progressions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "daily core pain select own" on public.daily_core_pain_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily core pain insert own" on public.daily_core_pain_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "daily core pain update own" on public.daily_core_pain_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily core pain delete own" on public.daily_core_pain_logs for delete to authenticated using ((select auth.uid()) = user_id);

create policy "daily core conflicts select own" on public.daily_core_main_exercise_conflicts for select to authenticated using ((select auth.uid()) = user_id);

grant select on public.daily_core_days, public.daily_core_exercises, public.daily_core_variations to authenticated;
grant select, insert, update, delete on public.daily_core_preferences, public.daily_core_reminders,
  public.daily_core_sessions, public.daily_core_sets, public.daily_core_progressions,
  public.daily_core_pain_logs to authenticated;
grant select on public.daily_core_main_exercise_conflicts to authenticated;

insert into public.daily_core_days
  (day_of_week, name, objective, session_type, intensity, duration_min, duration_max, is_rest, educational_note)
values
  (1, 'Flexão do tronco', 'Hipertrofia do reto abdominal com flexão controlada.', 'hipertrofia', 'moderada', 8, 10, false, 'Treine perto da falha, mantendo 1–2 RIR e técnica limpa.'),
  (2, 'Estabilidade leve', 'Controle lombopélvico e estabilidade lateral.', 'estabilidade', 'leve', 6, 8, false, 'Sessão técnica: não chegue à falha.'),
  (3, 'Elevação pélvica', 'Hipertrofia com retroversão pélvica consciente.', 'hipertrofia', 'moderada', 8, 10, false, 'A repetição só conta quando a pelve se move com controle.'),
  (4, 'Controle e anti-rotação', 'Resistir à rotação e manter quadril e lombar estáveis.', 'estabilidade', 'leve', 6, 8, false, 'Use resistência que permita manter o tronco imóvel.'),
  (5, 'Anti-extensão', 'Hipertrofia e controle contra a extensão lombar.', 'hipertrofia', 'moderada', 8, 12, false, 'Amplitude termina antes de perder o controle da lombar.'),
  (6, 'Recuperação ativa', 'Respiração, coordenação e controle sem fadiga.', 'recuperacao', 'muito_leve', 5, 5, false, 'A sessão deve melhorar o controle, não provocar exaustão.'),
  (7, 'Descanso completo', 'Recuperar o abdômen para crescer e funcionar bem.', 'descanso', 'descanso', 0, 0, true, 'Hoje é dia de recuperação. A próxima sessão será segunda-feira: flexão do tronco.');

insert into public.daily_core_exercises
  (slug, day_of_week, name, objective, exercise_type, measure_type, target_sets, target_reps_min, target_reps_max,
   target_seconds_min, target_seconds_max, per_side, rir_min, rir_max, rest_seconds_min, rest_seconds_max,
   equipment, short_cue, instructions, progression_rule, order_index)
values
  ('crunch-carga', 1, 'Crunch com carga', 'Aproximar costelas da pelve.', 'hipertrofia', 'repeticoes', 3, 10, 15, null, null, false, 1, 2, 60, 75, 'mochila opcional', 'Costelas em direção à pelve; expire ao subir.', array['Não puxe o pescoço com as mãos.', 'Evite balanço e controle a descida.', 'Mantenha a lombar confortável.'], 'Ao fazer 3×15 com boa técnica, RIR ≥ 1 e sem dor, aumente pouco a carga ou a dificuldade.', 0),
  ('dead-bug-terca', 2, 'Dead bug', 'Controlar a lombar durante a extensão.', 'estabilidade', 'repeticoes', 2, 8, 12, null, null, true, null, null, 30, 45, null, 'Lombar controlada; mova devagar.', array['Expire ao estender braço e perna.', 'Reduza a amplitude se a lombar arquear.'], 'Aumente primeiro o controle e depois as repetições, sem transformar em sessão pesada.', 0),
  ('prancha-lateral', 2, 'Prancha lateral', 'Estabilidade lateral do tronco.', 'estabilidade', 'tempo', 2, null, null, 20, 40, true, null, null, 30, 45, null, 'Cabeça, tronco e quadril alinhados.', array['Não deixe o quadril cair.', 'Interrompa em caso de dor no ombro ou lombar.'], 'Aumente 5–10 s por vez; ao chegar a 40 s com controle, avance a variação.', 1),
  ('reverse-crunch', 3, 'Reverse crunch', 'Realizar retroversão pélvica sem impulso.', 'hipertrofia', 'repeticoes', 3, 8, 15, null, null, false, 1, 2, 60, 75, null, 'Enrole a pelve e retire levemente o quadril.', array['Não apenas movimente as pernas.', 'Controle a descida e evite impulso.'], 'Ao fazer 3×15 com retroversão correta e sem dor, avance a variação.', 0),
  ('bird-dog', 4, 'Bird dog', 'Controle do quadril e da lombar.', 'estabilidade', 'repeticoes', 2, 8, 10, null, null, true, null, null, 30, 45, null, 'Quadril imóvel; pause na extensão.', array['Não gire o quadril.', 'Não arqueie a lombar.', 'Estenda braço e perna opostos lentamente.'], 'Progrida por controle e pausa, sem chegar à falha.', 0),
  ('pallof-press', 4, 'Pallof press', 'Resistir à rotação do tronco.', 'anti_rotacao', 'repeticoes', 2, 10, 15, null, null, true, null, null, 30, 45, 'elástico', 'Estenda os braços sem deixar o tronco girar.', array['Use resistência controlável.', 'Mantenha quadril e costelas alinhados.'], 'Aumente a resistência somente quando fizer 15 repetições sem rotação.', 1),
  ('ab-wheel', 5, 'Ab wheel', 'Resistir à extensão da lombar.', 'anti_extensao', 'repeticoes', 3, 6, 12, null, null, false, 1, 2, 75, 90, 'roda abdominal', 'Contraia abdômen e glúteos; pare antes de arquear.', array['Comece ajoelhado.', 'Não busque amplitude sacrificando a postura.', 'Interrompa em caso de dor lombar.'], 'Progrida repetições, amplitude e pausa apenas com lombar controlada, técnica boa/excelente, RIR ≥ 1 e sem dor.', 0),
  ('prancha-longa', 5, 'Prancha longa', 'Alternativa de anti-extensão sem roda.', 'anti_extensao', 'tempo', 3, null, null, 20, 40, false, 1, 2, 60, 60, null, 'Cotovelos à frente; abdômen e glúteos firmes.', array['Não permita que a lombar afunde.', 'Encurte a alavanca se perder a postura.'], 'Aumente 5–10 s por vez até 40 s; depois aumente a alavanca.', 1),
  ('dead-bug-sabado', 6, 'Dead bug', 'Recuperar o controle lombopélvico.', 'recuperacao', 'repeticoes', 2, 8, 8, null, null, true, null, null, 20, 30, null, 'Movimento confortável e lento.', array['Mantenha a lombar controlada.', 'Respire normalmente.'], 'Sem progressão pesada nesta sessão.', 0),
  ('prancha-frontal', 6, 'Prancha frontal', 'Ativar o tronco sem exaustão.', 'recuperacao', 'tempo', 2, null, null, 20, 30, false, null, null, 20, 30, null, 'Postura confortável; pare longe da falha.', array['Mantenha respiração calma.', 'Não deixe a lombar afundar.'], 'Mantenha o controle; não ultrapasse 30 s nesta recuperação.', 1),
  ('respiracao-abdominal', 6, 'Respiração e contração abdominal', 'Coordenar expiração e contração.', 'respiracao', 'respiracoes', 2, 5, 5, null, null, false, null, null, 20, 30, null, 'Expire devagar e contraia sem prender o ar.', array['Inspire pelo nariz.', 'Não prenda o ar excessivamente.'], 'Priorize controle e relaxamento.', 2);

insert into public.daily_core_variations (exercise_id, name, difficulty, equipment_required, is_default, is_equipment_fallback, order_index)
select e.id, v.name, v.difficulty, v.equipment, v.is_default, v.is_fallback, v.order_index
from public.daily_core_exercises e
join (values
  ('crunch-carga', 'Crunch no chão sem carga', 1, null, true, true, 0),
  ('crunch-carga', 'Crunch com mochila sobre o peito', 2, 'mochila', false, false, 1),
  ('crunch-carga', 'Crunch com anilha', 3, 'anilha', false, false, 2),
  ('crunch-carga', 'Cable crunch na academia', 4, 'cabo', false, false, 3),
  ('reverse-crunch', 'Reverse crunch com joelhos flexionados', 1, null, true, true, 0),
  ('reverse-crunch', 'Reverse crunch com pernas mais estendidas', 2, null, false, false, 1),
  ('reverse-crunch', 'Elevação de joelhos pendurado', 3, 'barra', false, false, 2),
  ('reverse-crunch', 'Elevação de pernas pendurado', 4, 'barra', false, false, 3),
  ('ab-wheel', 'Ab wheel com amplitude curta', 1, 'roda abdominal', true, false, 0),
  ('ab-wheel', 'Ab wheel ajoelhado completo', 2, 'roda abdominal', false, false, 1),
  ('ab-wheel', 'Ab wheel com pausa na extensão', 3, 'roda abdominal', false, false, 2),
  ('prancha-longa', 'Prancha longa', 1, null, true, true, 0),
  ('pallof-press', 'Pallof press com elástico', 1, 'elástico', true, false, 0),
  ('pallof-press', 'Dead bug sem elástico', 1, null, false, true, 1),
  ('pallof-press', 'Prancha lateral sem elástico', 2, null, false, true, 2)
) as v(slug, name, difficulty, equipment, is_default, is_fallback, order_index) on v.slug = e.slug;

-- Snapshot legível e reversível antes de ocultar duplicidades na ficha ativa.
insert into public.routine_backups (user_id, label, payload)
select w.user_id, 'pre-daily-core-v1', jsonb_build_object(
  'workout_exercises', jsonb_agg(jsonb_build_object(
    'id', we.id,
    'workout_id', we.workout_id,
    'exercise_id', we.exercise_id,
    'is_hidden', we.is_hidden,
    'exercise_name', e.name_pt
  ) order by w.day_of_week, we.order_index)
)
from public.workout_exercises we
join public.workouts w on w.id = we.workout_id
join public.exercises e on e.id = we.exercise_id
where w.is_archived = false
  and e.exercise_type = 'abdominal'
  and not exists (
    select 1 from public.routine_backups rb
    where rb.user_id = w.user_id and rb.label = 'pre-daily-core-v1'
  )
group by w.user_id;

insert into public.daily_core_main_exercise_conflicts
  (user_id, workout_exercise_id, was_hidden, reason)
select w.user_id, we.id, we.is_hidden,
  'Ocultado no modelo ativo para evitar duplicidade com o Abdômen Diário; histórico preservado.'
from public.workout_exercises we
join public.workouts w on w.id = we.workout_id
join public.exercises e on e.id = we.exercise_id
where w.is_archived = false and e.exercise_type = 'abdominal'
on conflict (workout_exercise_id) do nothing;

update public.workout_exercises we
set is_hidden = true
from public.daily_core_main_exercise_conflicts c
where c.workout_exercise_id = we.id;
