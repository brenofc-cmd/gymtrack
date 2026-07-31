-- David Laid Powerbuilding DUP — Gymshark Exact v7
--
-- Reproduz exatamente a divisão A–F publicada pela Gymshark (dias, ordem,
-- exercícios, séries, repetições e esforços de 1RM/3RM/5RM). RIR e descanso
-- não são informados pela fonte: ficam NULL (RIR, já nullable) ou marcados
-- como sugestão do GymTrack via a nova coluna rest_seconds_source.
--
-- Escopo intencionalmente restrito à conta principal (cd801c7a-...). A conta
-- demo/secundária (b3069778-...) e a v6 arquivada NÃO são tocadas. Nenhuma
-- sessão, série, máxima ou histórico é apagado — apenas arquivado.

alter table public.workout_exercises
  add column if not exists rest_seconds_source text not null default 'source';
alter table public.workout_exercises drop constraint if exists workout_exercises_rest_seconds_source_check;
alter table public.workout_exercises add constraint workout_exercises_rest_seconds_source_check
  check (rest_seconds_source in ('source', 'app_suggested'));
comment on column public.workout_exercises.rest_seconds_source is
  'source = descanso vem da ficha original; app_suggested = sugestão do GymTrack quando a fonte não especifica.';

create or replace function public.provision_david_laid_gymshark_exact_v7(p_user_id uuid)
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
  v_rest_seconds integer;
  v_days integer;
  v_exercises integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select count(*) into v_days from public.workouts
  where user_id = p_user_id and routine_version = 7 and is_archived = false and is_daily = false;
  if v_days = 6 then
    return jsonb_build_object('created', false, 'routine_version', 7, 'days', 6);
  end if;

  -- Backup completo da ficha ativa (qualquer versão) antes de arquivar.
  if exists (select 1 from public.workouts where user_id = p_user_id and is_archived = false and is_daily = false) then
    insert into public.routine_backups(user_id, label, payload)
    select p_user_id, 'pre-david-laid-gymshark-exact-v7-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
      jsonb_agg(jsonb_build_object(
        'workout', to_jsonb(w),
        'exercises', (select coalesce(jsonb_agg(to_jsonb(we) order by we.order_index), '[]'::jsonb)
                      from public.workout_exercises we where we.workout_id = w.id)
      ) order by w.order_index)
    from public.workouts w where w.user_id = p_user_id and w.is_archived = false and w.is_daily = false;
  end if;

  -- Sessão em aberto é cancelada logicamente; nenhuma série é removida.
  update public.workout_sessions s
  set cancelled_at = now(),
      cancel_reason = 'Encerrada ao ativar David Laid Powerbuilding DUP — Gymshark Exact v7. Séries preservadas.'
  from public.workouts w
  where s.user_id = p_user_id
    and s.workout_id = w.id
    and s.finished_at is null
    and s.cancelled_at is null
    and w.routine_version <> 7;

  update public.workouts set is_archived = true
  where user_id = p_user_id and is_archived = false and is_daily = false;

  update public.training_program_blocks
  set status = 'cancelled', completed_at = coalesce(completed_at, now())
  where user_id = p_user_id and status in ('active', 'paused') and routine_version <> 7;

  for v_day in select value from jsonb_array_elements($routine$
  [
    {"letter":"A","day":1,"name":"Legs 1 — Agachamento 5RM e volume","focus":"max_strength_hypertrophy","objective":"Inicia com esforço máximo de cinco repetições no agachamento e continua com alto volume para quadríceps, glúteos e posteriores.","items":[
      ["back-squat",1,5,5,"rep_max_effort",5,300,"standard",null],
      ["back-squat",4,12,12,"fixed_reps",null,null,"backoff",null],
      ["romanian-deadlift",3,10,10,"fixed_reps",null,null,"standard",null],
      ["walking-lunge",3,10,10,"fixed_reps",null,null,"standard",null],
      ["glute-ham-raise",3,10,10,"fixed_reps",null,null,"standard","reverse-hyper"]
    ]},
    {"letter":"B","day":2,"name":"Push 1 — Supino 1RM","focus":"max_strength_hypertrophy","objective":"Sessão pesada de empurrar, começando com uma repetição máxima no supino e continuando com força e volume para peito, ombros e tríceps.","items":[
      ["barbell-bench-press",1,1,1,"rep_max_effort",1,300,"standard",null],
      ["barbell-bench-press",4,4,4,"fixed_reps",null,null,"backoff",null],
      ["push-press",3,4,4,"fixed_reps",null,null,"standard",null],
      ["weighted-dip",3,10,10,"fixed_reps",null,null,"standard",null],
      ["dumbbell-fly",3,10,10,"fixed_reps",null,null,"standard","pec-deck"],
      ["dumbbell-lateral-raise",3,10,10,"fixed_reps",null,null,"standard",null],
      ["skull-crusher",3,10,10,"fixed_reps",null,null,"standard",null],
      ["dumbbell-triceps-extension",3,10,10,"fixed_reps",null,null,"standard",null]
    ]},
    {"letter":"C","day":3,"name":"Pull 1 — Terra 3RM","focus":"max_strength_hypertrophy","objective":"Sessão de puxada iniciada por um esforço de três repetições máximas no levantamento terra, seguida por volume para cadeia posterior, dorsais, trapézio e bíceps.","items":[
      ["conventional-deadlift",1,3,3,"rep_max_effort",3,300,"standard",null],
      ["conventional-deadlift",4,6,6,"fixed_reps",null,null,"backoff",null],
      ["stiff-leg-deadlift",3,10,10,"fixed_reps",null,null,"standard",null],
      ["pull-up",3,8,10,"rep_range",null,null,"standard",null],
      ["yates-row",3,10,10,"fixed_reps",null,null,"standard",null],
      ["barbell-shrug",3,10,10,"fixed_reps",null,null,"standard",null],
      ["barbell-curl",3,10,10,"fixed_reps",null,null,"standard",null],
      ["seated-hammer-curl",3,10,10,"fixed_reps",null,null,"standard",null]
    ]},
    {"letter":"D","day":4,"name":"Legs 2 — Agachamento 3RM","focus":"max_strength_hypertrophy","objective":"Segundo dia de pernas, começando com esforço máximo de três repetições no agachamento e continuando com séries de volume moderado.","items":[
      ["back-squat",1,3,3,"rep_max_effort",3,300,"standard",null],
      ["back-squat",4,8,8,"fixed_reps",null,null,"backoff",null],
      ["romanian-deadlift",3,10,10,"fixed_reps",null,null,"standard",null],
      ["walking-lunge",3,10,10,"fixed_reps",null,null,"standard",null],
      ["glute-ham-raise",3,10,10,"fixed_reps",null,null,"standard","reverse-hyper"]
    ]},
    {"letter":"E","day":5,"name":"Push 2 — Desenvolvimento militar 5RM","focus":"max_strength_hypertrophy","objective":"Sessão de empurrar com prioridade para ombros, iniciada por um esforço máximo de cinco repetições no desenvolvimento militar.","items":[
      ["barbell-overhead-press",1,5,5,"rep_max_effort",5,300,"standard",null],
      ["barbell-overhead-press",4,12,12,"fixed_reps",null,null,"backoff",null],
      ["incline-barbell-bench-press",3,12,12,"fixed_reps",null,null,"standard",null],
      ["dumbbell-lateral-raise",3,10,10,"fixed_reps",null,null,"standard",null],
      ["weighted-dip",3,10,10,"fixed_reps",null,null,"standard",null],
      ["dumbbell-triceps-extension",3,10,10,"fixed_reps",null,null,"standard",null],
      ["skull-crusher",3,10,10,"fixed_reps",null,null,"standard",null]
    ]},
    {"letter":"F","day":6,"name":"Pull 2 — Terra 1RM","focus":"max_strength_hypertrophy","objective":"Segundo dia de puxada, começando com uma repetição máxima no levantamento terra e seguindo com séries pesadas e acessórios para costas e braços.","items":[
      ["conventional-deadlift",1,1,1,"rep_max_effort",1,300,"standard",null],
      ["conventional-deadlift",4,2,2,"fixed_reps",null,null,"backoff",null],
      ["stiff-leg-deadlift",3,10,10,"fixed_reps",null,null,"standard",null],
      ["pull-up",3,8,10,"rep_range",null,null,"standard",null],
      ["yates-row",3,10,10,"fixed_reps",null,null,"standard",null],
      ["barbell-shrug",3,10,10,"fixed_reps",null,null,"standard",null],
      ["barbell-curl",3,10,10,"fixed_reps",null,null,"standard",null],
      ["seated-hammer-curl",3,10,10,"fixed_reps",null,null,"standard",null]
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
      'Sugestão do GymTrack — não faz parte das séries publicadas da rotina. Aqueça progressivamente até o esforço máximo do dia.',
      7,
      v_day->>'focus',
      false,
      false
    )
    returning id into v_workout_id;

    for v_item in select value from jsonb_array_elements(v_day->'items')
    loop
      select id into v_exercise_id from public.exercises where slug = v_item->>0;
      if v_exercise_id is null then
        raise exception 'required exercise missing: %', v_item->>0;
      end if;

      -- Descanso não é informado pela fonte: usamos a sugestão do catálogo
      -- (ou 300s para o esforço máximo) e marcamos como app_suggested.
      v_rest_seconds := coalesce(
        case when v_item->>6 <> 'null' then (v_item->>6)::integer end,
        (select default_rest_seconds from public.exercises where id = v_exercise_id),
        90
      );

      insert into public.workout_exercises(
        workout_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max,
        rest_seconds, rest_seconds_source, rir_min, rir_max, progression_type, failure_allowed,
        failure_risk_level, technique_notes, prescription_type, fixed_reps,
        rep_max_target, prescription_locked, default_set_role, superset_group
      ) values (
        v_workout_id,
        v_exercise_id,
        (select count(*) from public.workout_exercises where workout_id = v_workout_id),
        (v_item->>1)::integer,
        (v_item->>2)::integer,
        (v_item->>3)::integer,
        v_rest_seconds,
        'app_suggested',
        null,
        null,
        case
          when v_item->>4 = 'rep_max_effort' then 'range_control'
          when v_item->>4 = 'rep_range' then 'bodyweight_control'
          else 'double_progression'
        end,
        false,
        (select risk_level from public.exercises where id = v_exercise_id),
        (select instructions from public.exercises where id = v_exercise_id),
        v_item->>4,
        case when v_item->>4 = 'fixed_reps' then (v_item->>2)::integer end,
        case when v_item->>5 <> 'null' then (v_item->>5)::integer end,
        true,
        v_item->>7,
        null
      ) returning id into v_workout_exercise_id;

      v_sub_slug := v_item->>8;
      if v_sub_slug is not null and v_sub_slug <> 'null' then
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
  where w.user_id = p_user_id and w.routine_version = 7 and w.is_archived = false and w.is_daily = false;
  if v_days <> 6 or v_exercises <> 41 then
    raise exception 'routine validation failed: % days, % exercises', v_days, v_exercises;
  end if;

  return jsonb_build_object('created', true, 'routine_version', 7, 'days', v_days, 'exercises', v_exercises);
end $$;

revoke all on function public.provision_david_laid_gymshark_exact_v7(uuid) from public, anon;
grant execute on function public.provision_david_laid_gymshark_exact_v7(uuid) to authenticated;

create or replace function public.ensure_active_david_laid_gymshark_exact_v7()
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

  v_routine := public.provision_david_laid_gymshark_exact_v7(v_user_id);

  update public.training_program_blocks
  set status = 'cancelled', completed_at = coalesce(completed_at, now())
  where user_id = v_user_id and routine_version <> 7 and status in ('active', 'paused');

  select id into v_block_id from public.training_program_blocks
  where user_id = v_user_id and routine_version = 7 and status in ('active', 'paused')
  order by started_at desc limit 1;

  if v_block_id is null then
    insert into public.training_program_blocks(
      user_id, program_block_id, week_number, status, routine_version, total_weeks, cycle_number
    ) values (
      v_user_id,
      'gymshark-exact-v7-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
      1, 'active', 7, 9,
      coalesce((select max(cycle_number) + 1 from public.training_program_blocks where user_id = v_user_id), 1)
    )
    returning id into v_block_id;
  end if;

  insert into public.user_preferences(
    id, onboarding_done, weight_unit, rest_timer_sound, rest_timer_vibrate, routine_provisioned_version
  ) values (
    v_user_id, false, 'kg', true, true, 7
  )
  on conflict (id) do update set routine_provisioned_version = 7, updated_at = now();

  return v_routine || jsonb_build_object('program_block_id', v_block_id);
end $$;

revoke all on function public.ensure_active_david_laid_gymshark_exact_v7() from public, anon;
grant execute on function public.ensure_active_david_laid_gymshark_exact_v7() to authenticated;

-- Aplicado SOMENTE à conta principal (perfil existente, treino real).
-- A conta demo/secundária (b3069778-2ee2-455d-b19b-537dc1890ff1) permanece
-- intocada na v6, exatamente como solicitado.
do $$
begin
  perform set_config('request.jwt.claim.sub', 'cd801c7a-7674-47f5-904f-5ce8c28d7819', true);
  perform public.ensure_active_david_laid_gymshark_exact_v7();
end $$;

-- Rollback seguro: arquivar a v7 e reativar manualmente os IDs do último
-- routine_backups (label 'pre-david-laid-gymshark-exact-v7-...'). Nunca
-- remover workout_sessions, set_logs ou o histórico de daily_core_*.
-- update public.workouts set is_archived = true where routine_version = 7;
