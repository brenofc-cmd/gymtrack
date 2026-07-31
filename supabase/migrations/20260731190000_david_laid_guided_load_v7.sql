-- David Laid Powerbuilding DUP — Guided Load v7
--
-- Mesma divisão pública A–F associada a David Laid pela Gymshark, na mesma
-- ordem de dias e exercícios, com as mesmas séries/repetições-fonte (ver
-- supabase/migrations/20260731120000_david_laid_gymshark_exact_v7.sql, cujos
-- itens são reproduzidos aqui exatamente). A diferença desta versão é a
-- camada de orientação própria do GymTrack: os esforços de 1RM/3RM/5RM da
-- fonte viram top sets técnicos (RIR 2, sem tentativa máxima obrigatória),
-- com carga inicial por percentual de e1RM, e RIR/percentual/estratégia de
-- carga explícitos por exercício — nunca fórmulas do programa pago.
--
-- Convive com a Gymshark Exact v7 (routine_version 7): esta versão nova usa
-- routine_version 8 e, ao ser provisionada, arquiva (não apaga) o que
-- estiver ativo — exatamente como a v7 arquivou a v6. Nenhuma sessão, série,
-- máxima ou histórico é apagado.
--
-- Escopo intencionalmente restrito à conta principal (cd801c7a-...,
-- verificada nesta rodada). A conta demo (b3069778-...) não é tocada.

-- ============================================================
-- 1. Colunas novas em workout_exercises: separam fonte de orientação.
-- ============================================================
alter table public.workout_exercises
  add column if not exists percentage_of_e1rm numeric(5,2),
  add column if not exists load_strategy text,
  add column if not exists source_prescription text,
  add column if not exists guided_prescription text,
  add column if not exists guided_reps_fixed integer;

alter table public.workout_exercises drop constraint if exists workout_exercises_load_strategy_check;
alter table public.workout_exercises add constraint workout_exercises_load_strategy_check
  check (load_strategy is null or load_strategy in (
    'percentage_of_e1rm_topset', 'percentage_of_e1rm_backoff',
    'history_rir', 'bodyweight_assisted'
  ));

-- Novo tipo de prescrição: top set técnico guiado. Diferente de
-- rep_max_effort (tentativa de RM literal, fixed_reps nulo), este tipo tem
-- fixed_reps preenchido com o mesmo valor do esforço-fonte (1/3/5) — é uma
-- série de repetições fixas com RIR-alvo, não uma tentativa máxima.
alter table public.workout_exercises drop constraint if exists workout_exercises_prescription_check;
alter table public.workout_exercises add constraint workout_exercises_prescription_check check (
  (prescription_type = 'fixed_reps' and fixed_reps = target_reps_min and target_reps_min = target_reps_max and rep_max_target is null)
  or (prescription_type = 'rep_range' and fixed_reps is null and target_reps_min < target_reps_max and rep_max_target is null)
  or (prescription_type = 'rep_max_effort' and fixed_reps is null and target_reps_min = rep_max_target and target_reps_max = rep_max_target and rep_max_target in (1,3,5))
  or (prescription_type = 'guided_top_set' and fixed_reps = target_reps_min and target_reps_min = target_reps_max and target_reps_max = rep_max_target and rep_max_target in (1,3,5))
);

-- ============================================================
-- 2. Calibração de equipamento (barra, menor anilha, assistência) e perfil
--    de força (contagem de amostras válidas + confiança) já têm base em
--    user_preferences / exercise_reference_maxes (20260730110000). Só
--    faltam os campos de calculadora de anilhas.
-- ============================================================
alter table public.user_preferences
  add column if not exists bar_weight_kg numeric(5,2) not null default 20,
  add column if not exists smallest_plate_kg numeric(5,2) not null default 1.25,
  add column if not exists assistance_increment_kg numeric(5,2) not null default 2.5;

-- ============================================================
-- 3. Estado de familiarização por exercício (baixa confiança de e1RM/
--    técnica): reduz carga, eleva piso de RIR e bloqueia recordes até duas
--    exposições válidas com técnica boa e sem dor.
-- ============================================================
create table if not exists public.exercise_familiarization_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  entered_at timestamptz not null default now(),
  valid_exposures_count integer not null default 0,
  exited_at timestamptz,
  primary key (user_id, exercise_id)
);
alter table public.exercise_familiarization_state enable row level security;
drop policy if exists "familiarização própria" on public.exercise_familiarization_state;
create policy "familiarização própria" on public.exercise_familiarization_state
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.exercise_familiarization_state to authenticated;

-- ============================================================
-- 4. Função de provisionamento — mesmo formato de
--    provision_david_laid_gymshark_exact_v7, routine_version 8.
-- ============================================================
create or replace function public.provision_david_laid_guided_load_v7(p_user_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_day jsonb;
  v_item jsonb;
  v_workout_id uuid;
  v_exercise_id uuid;
  v_workout_exercise_id uuid;
  v_substitution_exercise_id uuid;
  v_sub_slug text;
  v_days integer;
  v_exercises integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select count(*) into v_days from public.workouts
  where user_id = p_user_id and routine_version = 8 and is_archived = false and is_daily = false;
  if v_days = 6 then
    return jsonb_build_object('created', false, 'routine_version', 8, 'days', 6);
  end if;

  if exists (select 1 from public.workouts where user_id = p_user_id and is_archived = false and is_daily = false) then
    insert into public.routine_backups(user_id, label, payload)
    select p_user_id, 'pre-david-laid-guided-load-v7-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
      jsonb_agg(jsonb_build_object(
        'workout', to_jsonb(w),
        'exercises', (select coalesce(jsonb_agg(to_jsonb(we) order by we.order_index), '[]'::jsonb)
                      from public.workout_exercises we where we.workout_id = w.id)
      ) order by w.order_index)
    from public.workouts w where w.user_id = p_user_id and w.is_archived = false and w.is_daily = false;
  end if;

  update public.workout_sessions s
  set cancelled_at = now(),
      cancel_reason = 'Encerrada ao ativar David Laid Powerbuilding DUP — Guided Load v7. Séries preservadas.'
  from public.workouts w
  where s.user_id = p_user_id
    and s.workout_id = w.id
    and s.finished_at is null
    and s.cancelled_at is null
    and w.routine_version <> 8;

  update public.workouts set is_archived = true
  where user_id = p_user_id and is_archived = false and is_daily = false;

  update public.training_program_blocks
  set status = 'cancelled', completed_at = coalesce(completed_at, now())
  where user_id = p_user_id and status in ('active', 'paused') and routine_version <> 8;

  for v_day in select value from jsonb_array_elements($routine$
  [
    {"letter":"A","day":1,"name":"Legs 1 — Agachamento e volume","focus":"max_strength_hypertrophy","objective":"Top set técnico de cinco repetições no agachamento (RIR 2, não é tentativa máxima) seguido de alto volume para quadríceps, glúteos e posteriores.","items":[
      {"slug":"back-squat","sets":1,"srcMin":5,"srcMax":5,"type":"guided_top_set","fixedReps":5,"rm":5,"rirMin":2,"rirMax":2,"rest":240,"pct":80,"strategy":"percentage_of_e1rm_topset","src":"Fonte: 5RM effort","guided":"GymTrack: 1×5, RIR 2","role":"standard"},
      {"slug":"back-squat","sets":4,"srcMin":12,"srcMax":12,"type":"fixed_reps","rirMin":2,"rirMax":3,"rest":150,"pct":57.5,"strategy":"percentage_of_e1rm_backoff","src":"Fonte: 4×12","guided":"GymTrack: 4×12, RIR 2–3","role":"backoff"},
      {"slug":"romanian-deadlift","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":3,"rest":150,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 2–3","role":"standard"},
      {"slug":"walking-lunge","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":2,"rest":105,"strategy":"history_rir","src":"Fonte: 3×10 (por perna)","guided":"GymTrack: 3×10 por perna, RIR 2","role":"standard"},
      {"slug":"glute-ham-raise","alt":"reverse-hyper","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":3,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 2–3","role":"standard"}
    ]},
    {"letter":"B","day":2,"name":"Push 1 — Força no supino","focus":"max_strength_hypertrophy","objective":"Top set técnico de uma repetição no supino (RIR 2, não é tentativa máxima) seguido de força e volume para peito, ombros e tríceps.","items":[
      {"slug":"barbell-bench-press","sets":1,"srcMin":1,"srcMax":1,"type":"guided_top_set","fixedReps":1,"rm":1,"rirMin":2,"rirMax":2,"rest":270,"pct":90,"strategy":"percentage_of_e1rm_topset","src":"Fonte: 1RM effort","guided":"GymTrack: 1×1, RIR 2","role":"standard"},
      {"slug":"barbell-bench-press","sets":4,"srcMin":4,"srcMax":4,"type":"fixed_reps","rirMin":2,"rirMax":2,"rest":180,"pct":77.5,"strategy":"percentage_of_e1rm_backoff","src":"Fonte: 4×4","guided":"GymTrack: 4×4, RIR 2","role":"backoff"},
      {"slug":"push-press","sets":3,"srcMin":4,"srcMax":4,"type":"fixed_reps","rirMin":2,"rirMax":2,"rest":180,"pct":75,"strategy":"percentage_of_e1rm_backoff","src":"Fonte: 3×4","guided":"GymTrack: 3×4, RIR 2","role":"standard"},
      {"slug":"weighted-dip","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":2,"rest":120,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 2","role":"standard"},
      {"slug":"dumbbell-fly","alt":"pec-deck","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":1,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 1–2","role":"standard"},
      {"slug":"dumbbell-lateral-raise","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 2","role":"standard"},
      {"slug":"skull-crusher","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":1,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 1–2","role":"standard"},
      {"slug":"dumbbell-triceps-extension","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":1,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 1–2","role":"standard"}
    ]},
    {"letter":"C","day":3,"name":"Pull 1 — Força no levantamento terra","focus":"max_strength_hypertrophy","objective":"Top set técnico de três repetições no levantamento terra (RIR 2, não é tentativa máxima) seguido de volume para cadeia posterior, dorsais, trapézio e bíceps.","items":[
      {"slug":"conventional-deadlift","sets":1,"srcMin":3,"srcMax":3,"type":"guided_top_set","fixedReps":3,"rm":3,"rirMin":2,"rirMax":2,"rest":240,"pct":85,"strategy":"percentage_of_e1rm_topset","src":"Fonte: 3RM effort","guided":"GymTrack: 1×3, RIR 2","role":"standard"},
      {"slug":"conventional-deadlift","sets":4,"srcMin":6,"srcMax":6,"type":"fixed_reps","rirMin":2,"rirMax":2,"rest":210,"pct":72.5,"strategy":"percentage_of_e1rm_backoff","src":"Fonte: 4×6","guided":"GymTrack: 4×6, RIR 2","role":"backoff"},
      {"slug":"stiff-leg-deadlift","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":3,"rest":150,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 2–3","role":"standard"},
      {"slug":"pull-up","sets":3,"srcMin":8,"srcMax":10,"type":"rep_range","guidedFixed":10,"rirMin":2,"rirMax":2,"rest":150,"strategy":"bodyweight_assisted","src":"Fonte: 3×8–10","guided":"GymTrack: alvo fixo 3×10, RIR 2","role":"standard"},
      {"slug":"yates-row","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":2,"rest":120,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 2","role":"standard"},
      {"slug":"barbell-shrug","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":1,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 1–2","role":"standard"},
      {"slug":"barbell-curl","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":1,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 1–2","role":"standard"},
      {"slug":"seated-hammer-curl","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":1,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 1–2","role":"standard"}
    ]},
    {"letter":"D","day":4,"name":"Legs 2 — Agachamento pesado e volume","focus":"max_strength_hypertrophy","objective":"Top set técnico de três repetições no agachamento (RIR 2, não é tentativa máxima) seguido de séries de volume moderado.","items":[
      {"slug":"back-squat","sets":1,"srcMin":3,"srcMax":3,"type":"guided_top_set","fixedReps":3,"rm":3,"rirMin":2,"rirMax":2,"rest":240,"pct":85,"strategy":"percentage_of_e1rm_topset","src":"Fonte: 3RM effort","guided":"GymTrack: 1×3, RIR 2","role":"standard"},
      {"slug":"back-squat","sets":4,"srcMin":8,"srcMax":8,"type":"fixed_reps","rirMin":2,"rirMax":3,"rest":180,"pct":67.5,"strategy":"percentage_of_e1rm_backoff","src":"Fonte: 4×8","guided":"GymTrack: 4×8, RIR 2–3","role":"backoff"},
      {"slug":"romanian-deadlift","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":3,"rest":150,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 2–3","role":"standard"},
      {"slug":"walking-lunge","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":2,"rest":105,"strategy":"history_rir","src":"Fonte: 3×10 (por perna)","guided":"GymTrack: 3×10 por perna, RIR 2","role":"standard"},
      {"slug":"glute-ham-raise","alt":"reverse-hyper","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":3,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 2–3","role":"standard"}
    ]},
    {"letter":"E","day":5,"name":"Push 2 — Desenvolvimento militar","focus":"max_strength_hypertrophy","objective":"Top set técnico de cinco repetições no desenvolvimento militar (RIR 2, não é tentativa máxima) com prioridade para ombros.","items":[
      {"slug":"barbell-overhead-press","sets":1,"srcMin":5,"srcMax":5,"type":"guided_top_set","fixedReps":5,"rm":5,"rirMin":2,"rirMax":2,"rest":240,"pct":80,"strategy":"percentage_of_e1rm_topset","src":"Fonte: 5RM effort","guided":"GymTrack: 1×5, RIR 2","role":"standard"},
      {"slug":"barbell-overhead-press","sets":4,"srcMin":12,"srcMax":12,"type":"fixed_reps","rirMin":2,"rirMax":3,"rest":150,"pct":57.5,"strategy":"percentage_of_e1rm_backoff","src":"Fonte: 4×12","guided":"GymTrack: 4×12, RIR 2–3","role":"backoff"},
      {"slug":"incline-barbell-bench-press","sets":3,"srcMin":12,"srcMax":12,"type":"fixed_reps","rirMin":2,"rirMax":2,"rest":150,"strategy":"history_rir","src":"Fonte: 3×12","guided":"GymTrack: 3×12, RIR 2","role":"standard"},
      {"slug":"dumbbell-lateral-raise","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 2","role":"standard"},
      {"slug":"weighted-dip","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":2,"rest":120,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 2","role":"standard"},
      {"slug":"dumbbell-triceps-extension","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":1,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 1–2","role":"standard"},
      {"slug":"skull-crusher","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":1,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 1–2","role":"standard"}
    ]},
    {"letter":"F","day":6,"name":"Pull 2 — Levantamento terra pesado","focus":"max_strength_hypertrophy","objective":"Top set técnico de uma repetição no levantamento terra (RIR 2, não é tentativa máxima) seguido de séries pesadas e acessórios para costas e braços.","items":[
      {"slug":"conventional-deadlift","sets":1,"srcMin":1,"srcMax":1,"type":"guided_top_set","fixedReps":1,"rm":1,"rirMin":2,"rirMax":2,"rest":270,"pct":90,"strategy":"percentage_of_e1rm_topset","src":"Fonte: 1RM effort","guided":"GymTrack: 1×1, RIR 2","role":"standard"},
      {"slug":"conventional-deadlift","sets":4,"srcMin":2,"srcMax":2,"type":"fixed_reps","rirMin":2,"rirMax":3,"rest":210,"pct":82.5,"strategy":"percentage_of_e1rm_backoff","src":"Fonte: 4×2","guided":"GymTrack: 4×2, RIR 2–3","role":"backoff"},
      {"slug":"stiff-leg-deadlift","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":3,"rest":150,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 2–3","role":"standard"},
      {"slug":"pull-up","sets":3,"srcMin":8,"srcMax":10,"type":"rep_range","guidedFixed":10,"rirMin":2,"rirMax":2,"rest":150,"strategy":"bodyweight_assisted","src":"Fonte: 3×8–10","guided":"GymTrack: alvo fixo 3×10, RIR 2","role":"standard"},
      {"slug":"yates-row","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":2,"rirMax":2,"rest":120,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 2","role":"standard"},
      {"slug":"barbell-shrug","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":1,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 1–2","role":"standard"},
      {"slug":"barbell-curl","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":1,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 1–2","role":"standard"},
      {"slug":"seated-hammer-curl","sets":3,"srcMin":10,"srcMax":10,"type":"fixed_reps","rirMin":1,"rirMax":2,"rest":90,"strategy":"history_rir","src":"Fonte: 3×10","guided":"GymTrack: 3×10, RIR 1–2","role":"standard"}
    ]}
  ]$routine$::jsonb)
  loop
    insert into public.workouts(
      user_id, letter, name, order_index, day_of_week, objective, warmup_note,
      routine_version, session_focus, is_archived, is_daily
    ) values (
      p_user_id,
      v_day->>'letter',
      v_day->>'name',
      (v_day->>'day')::integer - 1,
      (v_day->>'day')::integer,
      v_day->>'objective',
      'Sugestão do GymTrack — não faz parte das séries publicadas da rotina. Aqueça progressivamente até o top set do dia.',
      8,
      v_day->>'focus',
      false,
      false
    )
    returning id into v_workout_id;

    for v_item in select value from jsonb_array_elements(v_day->'items')
    loop
      select id into v_exercise_id from public.exercises where slug = v_item->>'slug';
      if v_exercise_id is null then
        raise exception 'required exercise missing: %', v_item->>'slug';
      end if;

      insert into public.workout_exercises(
        workout_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max,
        rest_seconds, rest_seconds_source, rir_min, rir_max, progression_type, failure_allowed,
        failure_risk_level, technique_notes, prescription_type, fixed_reps,
        rep_max_target, prescription_locked, default_set_role, superset_group,
        percentage_of_e1rm, load_strategy, source_prescription, guided_prescription, guided_reps_fixed
      ) values (
        v_workout_id,
        v_exercise_id,
        (select count(*) from public.workout_exercises where workout_id = v_workout_id),
        (v_item->>'sets')::integer,
        (v_item->>'srcMin')::integer,
        (v_item->>'srcMax')::integer,
        (v_item->>'rest')::integer,
        'app_suggested',
        (v_item->>'rirMin')::integer,
        (v_item->>'rirMax')::integer,
        case
          when v_item->>'type' = 'guided_top_set' then 'top_set_backoff'
          when v_item->>'type' = 'rep_range' then 'bodyweight_control'
          else 'double_progression'
        end,
        false,
        (select risk_level from public.exercises where id = v_exercise_id),
        (select instructions from public.exercises where id = v_exercise_id),
        v_item->>'type',
        case
          when v_item->>'type' in ('fixed_reps', 'guided_top_set') then (v_item->>'srcMin')::integer
          else null
        end,
        case when v_item ? 'rm' then (v_item->>'rm')::integer else null end,
        true,
        v_item->>'role',
        null,
        case when v_item ? 'pct' then (v_item->>'pct')::numeric else null end,
        v_item->>'strategy',
        v_item->>'src',
        v_item->>'guided',
        case when v_item ? 'guidedFixed' then (v_item->>'guidedFixed')::integer else null end
      ) returning id into v_workout_exercise_id;

      v_sub_slug := v_item->>'alt';
      if v_sub_slug is not null then
        select id into v_substitution_exercise_id from public.exercises where slug = v_sub_slug;
        if v_substitution_exercise_id is null then
          raise exception 'required substitution missing: %', v_sub_slug;
        end if;
        insert into public.workout_exercise_substitutions(workout_exercise_id, exercise_id, order_index)
        values (v_workout_exercise_id, v_substitution_exercise_id, 0)
        on conflict (workout_exercise_id, exercise_id) do nothing;
      end if;
    end loop;
  end loop;

  select count(*), coalesce(sum(x.exercise_count), 0) into v_days, v_exercises
  from public.workouts w
  cross join lateral (select count(*)::integer exercise_count from public.workout_exercises we where we.workout_id = w.id) x
  where w.user_id = p_user_id and w.routine_version = 8 and w.is_archived = false and w.is_daily = false;
  if v_days <> 6 or v_exercises <> 41 then
    raise exception 'routine validation failed: % days, % exercises', v_days, v_exercises;
  end if;

  return jsonb_build_object('created', true, 'routine_version', 8, 'days', v_days, 'exercises', v_exercises);
end $$;

revoke all on function public.provision_david_laid_guided_load_v7(uuid) from public, anon;
grant execute on function public.provision_david_laid_guided_load_v7(uuid) to authenticated;

create or replace function public.ensure_active_david_laid_guided_load_v7()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_routine jsonb;
  v_block_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  v_routine := public.provision_david_laid_guided_load_v7(v_user_id);

  update public.training_program_blocks
  set status = 'cancelled', completed_at = coalesce(completed_at, now())
  where user_id = v_user_id and routine_version <> 8 and status in ('active', 'paused');

  select id into v_block_id from public.training_program_blocks
  where user_id = v_user_id and routine_version = 8 and status in ('active', 'paused')
  order by started_at desc limit 1;

  if v_block_id is null then
    insert into public.training_program_blocks(
      user_id, program_block_id, week_number, status, routine_version, total_weeks, cycle_number
    ) values (
      v_user_id,
      'guided-load-v7-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
      1, 'active', 8, 9,
      coalesce((select max(cycle_number) + 1 from public.training_program_blocks where user_id = v_user_id), 1)
    )
    returning id into v_block_id;
  end if;

  insert into public.user_preferences(
    id, onboarding_done, weight_unit, rest_timer_sound, rest_timer_vibrate, routine_provisioned_version
  ) values (
    v_user_id, false, 'kg', true, true, 8
  )
  on conflict (id) do update set routine_provisioned_version = 8, updated_at = now();

  return v_routine || jsonb_build_object('program_block_id', v_block_id);
end $$;

revoke all on function public.ensure_active_david_laid_guided_load_v7() from public, anon;
grant execute on function public.ensure_active_david_laid_guided_load_v7() to authenticated;

-- Aplicado SOMENTE à conta principal (perfil existente, treino real),
-- igual ao padrão da migration da Gymshark Exact v7. A conta demo/secundária
-- (b3069778-2ee2-455d-b19b-537dc1890ff1) permanece intocada na v6.
-- A Gymshark Exact v7, hoje ativa para a conta principal, é arquivada (não
-- apagada) por este provisionamento — mesmo tratamento que a v6 recebeu.
do $$
begin
  perform set_config('request.jwt.claim.sub', 'cd801c7a-7674-47f5-904f-5ce8c28d7819', true);
  perform public.ensure_active_david_laid_guided_load_v7();
end $$;

-- Rollback seguro: arquivar a v8 e reativar manualmente os IDs do último
-- routine_backups (label 'pre-david-laid-guided-load-v7-...'). Nunca
-- remover workout_sessions, set_logs ou o histórico de daily_core_*.
-- update public.workouts set is_archived = true where routine_version = 8;
