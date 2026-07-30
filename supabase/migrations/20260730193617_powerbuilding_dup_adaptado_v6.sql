-- Powerbuilding DUP Adaptado — 8 semanas.
-- Migração não destrutiva: sessões, séries, máximos e fichas anteriores ficam
-- preservados. Somente templates antigos ativos são arquivados.

alter table public.set_logs
  add column if not exists external_assistance boolean;

alter table public.training_program_blocks
  drop constraint if exists training_program_blocks_week_number_check;
alter table public.training_program_blocks
  add constraint training_program_blocks_week_number_check
  check (
    total_weeks in (8, 9)
    and week_number between 1 and total_weeks
  );

-- Correções definitivas do catálogo já existente.
update public.exercises
set
  name_pt = 'Remada Yates',
  name_en = 'Yates row',
  gif_url = '/exercises/Reverse_Grip_Bent-Over_Rows.jpg',
  instructions = array[
    'Use pegada supinada e mantenha o tronco mais elevado que na remada curvada tradicional.',
    'Mantenha os cotovelos próximos e puxe a barra para a região inferior do abdômen.'
  ],
  technical_warnings = array['Evite impulso lombar e interrompa se perder a posição.']
where slug = 'yates-row';

update public.exercises
set
  gif_url = '/exercises/Seated_Hammer_Curl.jpg',
  instructions = array[
    'Sente-se com tronco estável e pés apoiados.',
    'Use pegada neutra, mantenha os braços próximos e não balance o tronco.'
  ],
  technical_warnings = array['A mídia e a execução devem permanecer sentadas.']
where slug = 'seated-hammer-curl';

update public.exercises
set
  name_pt = 'Stiff-leg deadlift em déficit baixo',
  name_en = 'Low-deficit stiff-leg deadlift',
  equipment = 'barra e plataforma baixa de 3–5 cm',
  gif_url = '/exercises/Stiff_Leg_Deadlift_Low_Deficit.jpg',
  instructions = array[
    'Use déficit pequeno, coluna estável e barra próxima das pernas.',
    'Limite a amplitude antes de arredondar a lombar.'
  ],
  technical_warnings = array[
    'Retire o déficit se perder posição ou mobilidade.',
    'Interrompa se houver dor.'
  ]
where slug = 'deficit-stiff-leg-deadlift';

update public.exercises
set
  instructions = array[
    'Comece somente com o peso corporal.',
    'Acrescente carga quando completar todas as séries com execução controlada.'
  ]
where slug = 'weighted-dip';

-- Novos exercícios necessários na ficha v6.
insert into public.exercises (
  slug,name_pt,name_en,muscle_group,secondary_muscles,exercise_type,equipment,
  movement_pattern,load_unit,is_unilateral,instructions,technical_warnings,
  gif_url,risk_level,difficulty_level,default_rest_seconds,min_increment_kg,
  training_objective
) values
(
  'triceps-pushdown','Tríceps na polia','Cable triceps pushdown','tríceps','{}',
  'isolador','polia com barra ou corda','elbow_extension','added_load_kg',false,
  array['Mantenha os cotovelos próximos e estenda com controle.'],
  array['Reduza a carga se precisar mover o tronco.'],
  '/exercises/Triceps_Pushdown_-_Rope_Attachment.jpg','low','beginner',75,1,
  'Hipertrofia de tríceps'
),
(
  'cable-crunch','Abdominal no cabo','Cable crunch','abdômen','{}',
  'abdominal','polia alta e corda','trunk_flexion','added_load_kg',false,
  array['Aproxime costelas e pelve usando o abdômen e mantenha o quadril estável.'],
  array['Não transforme o movimento em puxada de braços.'],
  '/exercises/Cable_Crunch.jpg','moderate','beginner',75,1,
  'Hipertrofia abdominal'
),
(
  'reverse-crunch','Reverse crunch','Reverse crunch','abdômen','{}',
  'abdominal','colchonete ou banco','pelvic_curl','added_load_kg',false,
  array['Inicie a repetição com retroversão pélvica e controle a descida.'],
  array['Não use balanço nem force a lombar.'],
  '/exercises/Reverse_Crunch.jpg','low','beginner',75,1,
  'Hipertrofia abdominal'
)
on conflict (slug) where slug is not null do update set
  name_pt=excluded.name_pt,
  name_en=excluded.name_en,
  muscle_group=excluded.muscle_group,
  secondary_muscles=excluded.secondary_muscles,
  exercise_type=excluded.exercise_type,
  equipment=excluded.equipment,
  movement_pattern=excluded.movement_pattern,
  load_unit=excluded.load_unit,
  is_unilateral=excluded.is_unilateral,
  instructions=excluded.instructions,
  technical_warnings=excluded.technical_warnings,
  gif_url=excluded.gif_url,
  risk_level=excluded.risk_level,
  difficulty_level=excluded.difficulty_level,
  default_rest_seconds=excluded.default_rest_seconds,
  min_increment_kg=excluded.min_increment_kg,
  training_objective=excluded.training_objective;

-- Vacuum verdadeiro, em pé, com aviso de tontura.
update public.daily_core_exercises
set
  image_url = '/exercises/Stomach_Vacuum.jpg',
  image_alt = 'Pessoa em pé executando vacuum abdominal após expirar',
  instructions = array[
    'Expire de forma confortável.',
    'Recolha suavemente o abdômen sem transformar em esforço máximo.',
    'Interrompa imediatamente se houver tontura ou desconforto.'
  ],
  common_mistakes = array[
    'Simular somente respiração diafragmática.',
    'Prender o ar até sentir tontura.'
  ]
where slug in ('core-v2-vacuum-a', 'core-v2-vacuum-b');

create or replace function public.provision_powerbuilding_dup_adapted_v6(p_user_id uuid)
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
  v_days integer;
  v_exercises integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select count(*) into v_days
  from public.workouts
  where user_id=p_user_id
    and routine_version=6
    and is_archived=false
    and is_daily=false;

  if v_days = 6 then
    return jsonb_build_object('created',false,'routine_version',6,'days',6);
  elsif v_days <> 0 then
    update public.workouts
    set is_archived=true
    where user_id=p_user_id
      and routine_version=6
      and is_archived=false
      and is_daily=false;
  end if;

  if exists (
    select 1 from public.workouts
    where user_id=p_user_id and is_archived=false and is_daily=false
  ) then
    insert into public.routine_backups(user_id,label,payload)
    select
      p_user_id,
      'pre-powerbuilding-dup-adaptado-v6-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISS'),
      jsonb_agg(
        jsonb_build_object(
          'workout',to_jsonb(w),
          'exercises',(
            select coalesce(jsonb_agg(to_jsonb(we) order by we.order_index),'[]'::jsonb)
            from public.workout_exercises we
            where we.workout_id=w.id
          )
        )
        order by w.order_index
      )
    from public.workouts w
    where w.user_id=p_user_id and w.is_archived=false and w.is_daily=false;
  end if;

  -- Sessão antiga é cancelada logicamente; nenhuma série é removida.
  update public.workout_sessions s
  set
    cancelled_at=now(),
    cancel_reason='Encerrada ao ativar Powerbuilding DUP Adaptado v6. Séries preservadas.'
  from public.workouts w
  where s.user_id=p_user_id
    and s.workout_id=w.id
    and s.finished_at is null
    and s.cancelled_at is null
    and w.routine_version<>6;

  update public.workouts
  set is_archived=true
  where user_id=p_user_id and is_archived=false and is_daily=false;

  update public.training_program_blocks
  set
    status='cancelled',
    completed_at=coalesce(completed_at,now())
  where user_id=p_user_id
    and status in ('active','paused')
    and routine_version<>6;

  for v_day in
    select value from jsonb_array_elements($routine$
    [
      {"letter":"A","day":1,"name":"Legs 1","focus":"strength_hypertrophy","objective":"Priorizar agachamento e treinar posterior sem excesso de dobradiças.","items":[["back-squat",4,5,180,2,2,null],["romanian-deadlift",3,8,180,2,2,null],["walking-lunge",3,10,90,1,2,null],["glute-ham-raise",3,10,75,1,2,null]]},
      {"letter":"B","day":2,"name":"Push 1","focus":"strength_hypertrophy","objective":"Força no supino e volume de empurrar com supersets apenas nos isoladores.","items":[["barbell-bench-press",4,4,180,2,2,null],["push-press",3,5,180,2,2,null],["weighted-dip",3,8,120,2,2,null],["pec-deck",2,12,75,1,2,1],["dumbbell-lateral-raise",3,15,75,1,2,1],["skull-crusher",2,10,75,1,2,null],["triceps-pushdown",2,12,75,1,2,null]]},
      {"letter":"C","day":3,"name":"Pull 1","focus":"strength_hypertrophy","objective":"Treinar o terra sem stiff adicional e completar costas, braços e abdômen.","items":[["conventional-deadlift",3,4,180,2,2,null],["pull-up",3,8,150,2,2,null],["yates-row",3,8,150,2,2,null],["barbell-shrug",2,10,75,1,2,1],["barbell-curl",2,10,75,1,2,1],["seated-hammer-curl",2,10,75,1,2,2],["cable-crunch",3,12,75,1,2,2]]},
      {"letter":"D","day":4,"name":"Legs 2","focus":"hypertrophy","objective":"Treinar pernas sem repetir o terra romeno e controlar a fadiga lombar.","items":[["back-squat",4,8,180,2,2,null],["walking-lunge",3,10,90,1,2,null],["reverse-hyper",3,12,75,1,2,null]]},
      {"letter":"E","day":5,"name":"Push 2","focus":"strength_hypertrophy","objective":"Priorizar desenvolvimento e usar apenas um movimento acima da cabeça para tríceps.","items":[["barbell-overhead-press",4,6,180,2,2,null],["incline-barbell-bench-press",3,10,150,2,2,null],["weighted-dip",3,10,120,2,2,null],["dumbbell-lateral-raise",3,15,75,1,2,1],["triceps-pushdown",2,12,75,1,2,1],["dumbbell-triceps-extension",2,12,75,1,2,null]]},
      {"letter":"F","day":6,"name":"Pull 2","focus":"strength_technique","objective":"Praticar terra técnico com RIR 3 e usar déficit pequeno somente sem dor e com coluna estável.","items":[["conventional-deadlift",3,3,180,3,3,null],["deficit-stiff-leg-deadlift",2,10,180,3,3,null],["pull-up",3,10,150,2,2,null],["yates-row",3,10,150,2,2,null],["barbell-shrug",2,12,75,1,2,1],["barbell-curl",2,12,75,1,2,1],["seated-hammer-curl",2,12,75,1,2,2],["reverse-crunch",3,12,75,1,2,2]]}
    ]$routine$::jsonb)
  loop
    insert into public.workouts(
      user_id,letter,name,order_index,day_of_week,objective,warmup_note,
      routine_version,session_focus,is_archived,is_daily
    ) values (
      p_user_id,
      v_day->>'letter',
      v_day->>'name',
      (v_day->>'day')::integer-1,
      (v_day->>'day')::integer,
      v_day->>'objective',
      'Aquecimento de 8–10 minutos e séries progressivas; não conta no volume prescrito.',
      6,
      v_day->>'focus',
      false,
      false
    )
    returning id into v_workout_id;

    for v_item in select value from jsonb_array_elements(v_day->'items')
    loop
      select id into v_exercise_id
      from public.exercises
      where slug=v_item->>0;
      if v_exercise_id is null then
        raise exception 'required exercise missing: %',v_item->>0;
      end if;

      insert into public.workout_exercises(
        workout_id,exercise_id,order_index,target_sets,target_reps_min,target_reps_max,
        rest_seconds,rir_min,rir_max,progression_type,failure_allowed,
        failure_risk_level,technique_notes,prescription_type,fixed_reps,
        rep_max_target,prescription_locked,default_set_role,superset_group,
        top_set_enabled
      ) values (
        v_workout_id,
        v_exercise_id,
        (select count(*) from public.workout_exercises where workout_id=v_workout_id),
        (v_item->>1)::integer,
        (v_item->>2)::integer,
        (v_item->>2)::integer,
        (v_item->>3)::integer,
        (v_item->>4)::integer,
        (v_item->>5)::integer,
        case when v_item->>0='pull-up' then 'bodyweight_control' else 'double_progression' end,
        false,
        (select risk_level from public.exercises where id=v_exercise_id),
        (select instructions from public.exercises where id=v_exercise_id),
        'fixed_reps',
        (v_item->>2)::integer,
        null,
        true,
        'standard',
        case when v_item->>6 <> 'null' then (v_item->>6)::integer end,
        false
      );
    end loop;
  end loop;

  select count(*),coalesce(sum(x.exercise_count),0)
  into v_days,v_exercises
  from public.workouts w
  cross join lateral (
    select count(*)::integer exercise_count
    from public.workout_exercises we
    where we.workout_id=w.id
  ) x
  where w.user_id=p_user_id
    and w.routine_version=6
    and w.is_archived=false
    and w.is_daily=false;

  if v_days<>6 or v_exercises<>35 then
    raise exception 'routine validation failed: % days, % exercises',v_days,v_exercises;
  end if;

  return jsonb_build_object(
    'created',true,
    'routine_version',6,
    'days',v_days,
    'exercises',v_exercises
  );
end $$;

revoke all on function public.provision_powerbuilding_dup_adapted_v6(uuid) from public,anon;
grant execute on function public.provision_powerbuilding_dup_adapted_v6(uuid) to authenticated;

create or replace function public.ensure_active_powerbuilding_dup_adapted_v6()
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_user_id uuid:=auth.uid();
  v_routine jsonb;
  v_block_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode='42501';
  end if;

  v_routine:=public.provision_powerbuilding_dup_adapted_v6(v_user_id);

  update public.training_program_blocks
  set status='cancelled',completed_at=coalesce(completed_at,now())
  where user_id=v_user_id
    and routine_version<>6
    and status in ('active','paused');

  select id into v_block_id
  from public.training_program_blocks
  where user_id=v_user_id
    and routine_version=6
    and status in ('active','paused')
  order by started_at desc
  limit 1;

  if v_block_id is null then
    insert into public.training_program_blocks(
      user_id,program_block_id,week_number,status,routine_version,total_weeks,cycle_number
    ) values (
      v_user_id,
      'adapted-dup-v6-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISS'),
      1,
      'active',
      6,
      8,
      coalesce((
        select max(cycle_number)+1
        from public.training_program_blocks
        where user_id=v_user_id
      ),1)
    )
    returning id into v_block_id;
  end if;

  insert into public.user_preferences(
    id,onboarding_done,weight_unit,rest_timer_sound,rest_timer_vibrate,
    routine_provisioned_version
  ) values (
    v_user_id,false,'kg',true,true,6
  )
  on conflict(id) do update
  set routine_provisioned_version=6,updated_at=now();

  return v_routine || jsonb_build_object('program_block_id',v_block_id);
end $$;

revoke all on function public.ensure_active_powerbuilding_dup_adapted_v6() from public,anon;
grant execute on function public.ensure_active_powerbuilding_dup_adapted_v6() to authenticated;

create or replace function public.advance_active_dup_block_week()
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_user_id uuid:=auth.uid();
  v_block public.training_program_blocks;
  v_completed_letters integer:=0;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode='42501';
  end if;

  select * into v_block
  from public.training_program_blocks
  where user_id=v_user_id and status='active'
  order by started_at desc
  limit 1
  for update;
  if v_block.id is null then
    raise exception 'active block not found';
  end if;

  select count(distinct w.letter)::integer into v_completed_letters
  from public.workout_sessions s
  join public.workouts w on w.id=s.workout_id
  where s.user_id=v_user_id
    and s.program_block_id=v_block.id
    and s.block_week_number=v_block.week_number
    and s.finished_at is not null
    and s.cancelled_at is null
    and w.letter in ('A','B','C','D','E','F');

  if v_completed_letters<6 then
    return jsonb_build_object(
      'advanced',false,
      'completed',false,
      'week_number',v_block.week_number,
      'completed_letters',v_completed_letters
    );
  end if;

  if v_block.week_number=v_block.total_weeks then
    update public.training_program_blocks
    set status='completed',completed_at=now(),next_block_suggested=true
    where id=v_block.id;
    return jsonb_build_object(
      'advanced',true,
      'completed',true,
      'week_number',v_block.total_weeks,
      'completed_letters',6
    );
  end if;

  update public.training_program_blocks
  set week_number=week_number+1
  where id=v_block.id;
  return jsonb_build_object(
    'advanced',true,
    'completed',false,
    'week_number',v_block.week_number+1,
    'completed_letters',6
  );
end $$;

revoke all on function public.advance_active_dup_block_week() from public,anon;
grant execute on function public.advance_active_dup_block_week() to authenticated;

-- Contas existentes recebem a v6 sem apagar qualquer histórico.
do $$
declare
  v_user_id uuid;
begin
  for v_user_id in
    select distinct user_id
    from public.workouts
    where is_daily=false
  loop
    perform set_config('request.jwt.claim.sub',v_user_id::text,true);
    perform public.ensure_active_powerbuilding_dup_adapted_v6();
  end loop;
end $$;
