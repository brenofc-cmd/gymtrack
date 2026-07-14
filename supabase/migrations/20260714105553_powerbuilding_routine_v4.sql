-- Migration Powerbuilding v4 (PPL 6 dias) — GERADA por scripts/generate-rotina-v2-sql.ts
-- Fonte principal: lib/routine/powerbuilding-v4.ts.
--
-- Para cada usuário com rotina anterior ativa (Push A..Legs B não arquivados):
--   1. backup jsonb em routine_backups
--   2. arquiva os treinos ativos (preserva sessões e set_logs)
--   3. cria a rotina v4 com foco, progressão, RIR, descanso e substituições
--
-- Rollback (down): ver bloco comentado no fim do arquivo.

do $$
declare
  v_user uuid;
  v_workout uuid;
  v_ex uuid;
  v_we uuid;
begin
  for v_user in
    select distinct user_id from workouts
    where is_archived = false
      and routine_version < 4
      and name in ('Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B')
  loop
    -- 1. Backup da ficha ativa
    insert into routine_backups (user_id, label, payload)
    select v_user, 'pre-rotina-v4',
      jsonb_build_object(
        'workouts',
        (
          select jsonb_agg(
            to_jsonb(w) || jsonb_build_object(
              'workout_exercises',
              (
                select coalesce(jsonb_agg(to_jsonb(we) order by we.order_index), '[]'::jsonb)
                from workout_exercises we where we.workout_id = w.id
              )
            )
          )
          from workouts w
          where w.user_id = v_user and w.is_archived = false
        )
      );

    -- 2. Arquivar a rotina anterior (não apaga nada)
    update workouts set is_archived = true
    where user_id = v_user and is_archived = false;

  -- ------------------------------------------------------------
  -- Push A (A) — dia 1
  -- ------------------------------------------------------------
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version, session_focus)
  values (v_user, 'A', 'Push A', 0, 1, 'Força técnica no peitoral superior, ombros e tríceps; sem teste máximo.', '5–10 min de movimento leve. No primeiro composto, faça séries progressivas sem fadiga. Nos dias de pernas, inclua preparação breve de core e bracing.', 4, 'strength_technique')
  returning id into v_workout;

  select id into v_ex from exercises where name_pt = 'Supino inclinado com halteres' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Supino inclinado com halteres', 'peito', 'halter', 'composto', 'incline_push', array['deltoide anterior', 'tríceps'], array['Top set submáximo de 6–8; back-offs de 8–10 com 5–10% menos carga.', 'Escápulas estáveis, pés firmes e amplitude confortável.'], 'Peitoral superior e força de empurrar', 'high')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('incline_push', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['deltoide anterior', 'tríceps']),
      training_objective = coalesce('Peitoral superior e força de empurrar', training_objective),
      risk_level = 'high'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 0, 3,
    6, 10, 180,
    2, 2, array['Top set submáximo de 6–8; back-offs de 8–10 com 5–10% menos carga.', 'Escápulas estáveis, pés firmes e amplitude confortável.'], null,
    'top_set_backoff', false, 'high',
    true, 7.5, 'Peitoral superior e força de empurrar'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Supino inclinado na máquina' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Supino inclinado na máquina', 'peito', 'máquina', 'composto', null, null, array['Ajuste o banco e empurre com controle', 'Foco no peitoral superior'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Supino inclinado (barra)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Supino inclinado (barra)', 'peito', 'barra', 'composto', null, null, array['Banco a 30-45°', 'Desça a barra até o peitoral superior com controle'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Chest press convergente' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Chest press convergente', 'peito', 'máquina', 'composto', 'horizontal_push', array['tríceps'], array['Controle a volta e mantenha as escápulas apoiadas.'], 'Volume de peitoral', 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('horizontal_push', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['tríceps']),
      training_objective = coalesce('Volume de peitoral', training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 1, 2,
    8, 12, 120,
    2, 2, array['Controle a volta e mantenha as escápulas apoiadas.'], null,
    'double_progression', false, 'moderate',
    false, null, 'Volume de peitoral'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Supino reto com halteres (chest press)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Supino reto com halteres (chest press)', 'peito', 'halter', 'composto', null, null, array['Desça os halteres com controle até o alongamento confortável'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Supino em máquina' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Supino em máquina', 'peito', 'máquina', 'composto', null, null, array['Escápulas apoiadas', 'Empurre e retorne com controle'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Desenvolvimento sentado na máquina' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Desenvolvimento sentado na máquina', 'ombros', 'máquina', 'composto', 'vertical_push', array['tríceps'], array['Tronco apoiado; evite hiperextensão lombar.'], 'Força e massa dos ombros', 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('vertical_push', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['tríceps']),
      training_objective = coalesce('Força e massa dos ombros', training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 2, 2,
    6, 10, 150,
    2, 3, array['Tronco apoiado; evite hiperextensão lombar.'], null,
    'double_progression', false, 'moderate',
    false, null, 'Força e massa dos ombros'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Elevação lateral unilateral no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Elevação lateral unilateral no cabo', 'deltoide lateral', 'cabo', 'isolador', 'lateral_delt', null, array['Tensão contínua, sem balanço ou encolhimento.'], 'Largura dos ombros', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('lateral_delt', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Largura dos ombros', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 3, 4,
    12, 20, 75,
    1, 2, array['Tensão contínua, sem balanço ou encolhimento.'], 'Repetições por lado',
    'double_progression', true, 'low',
    false, null, 'Largura dos ombros'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Tríceps na corda' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Tríceps na corda', 'tríceps', 'cabo', 'isolador', 'elbow_extension', null, array['Cotovelos estáveis; abra a corda no final.'], 'Massa de tríceps', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('elbow_extension', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Massa de tríceps', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 4, 3,
    10, 15, 75,
    1, 2, array['Cotovelos estáveis; abra a corda no final.'], null,
    'double_progression', true, 'low',
    false, null, 'Massa de tríceps'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Tríceps overhead no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Tríceps overhead no cabo', 'tríceps', 'cabo', 'isolador', 'elbow_extension', null, array['Cotovelos estáveis e alongamento controlado.'], 'Cabeça longa do tríceps', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('elbow_extension', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Cabeça longa do tríceps', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 5, 2,
    10, 15, 90,
    1, 2, array['Cotovelos estáveis e alongamento controlado.'], null,
    'double_progression', true, 'low',
    false, null, 'Cabeça longa do tríceps'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Cable crunch' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Cable crunch', 'abdômen', 'cabo', 'abdominal', 'trunk_flexion', null, array['Aproxime costelas e pelve; não puxe apenas com os braços.'], 'Flexão carregada do core', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('trunk_flexion', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Flexão carregada do core', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 6, 3,
    8, 15, 90,
    1, 2, array['Aproxime costelas e pelve; não puxe apenas com os braços.'], null,
    'double_progression', true, 'low',
    false, null, 'Flexão carregada do core'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Abdominal na máquina (com carga)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Abdominal na máquina (com carga)', 'abdômen', 'máquina', 'abdominal', 'flexao_tronco', null, array['Flexione o tronco contraindo o abdômen', 'Controle o retorno'], null, 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('flexao_tronco', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Crunch com anilha (resistência)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Crunch com anilha (resistência)', 'abdômen', 'anilha', 'abdominal', 'flexao_tronco', null, array['Anilha no peito', 'Aproxime as costelas da pelve com controle'], null, 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('flexao_tronco', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  -- ------------------------------------------------------------
  -- Pull A (B) — dia 2
  -- ------------------------------------------------------------
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version, session_focus)
  values (v_user, 'B', 'Pull A', 1, 2, 'Força técnica de puxar, largura de costas, deltoide posterior e bíceps.', '5–10 min de movimento leve. No primeiro composto, faça séries progressivas sem fadiga. Nos dias de pernas, inclua preparação breve de core e bracing.', 4, 'strength_technique')
  returning id into v_workout;

  select id into v_ex from exercises where name_pt = 'Puxada alta pronada média' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Puxada alta pronada média', 'costas', 'cabo', 'composto', 'vertical_pull', array['bíceps'], array['Cotovelos para baixo; evite jogar o tronco para trás.'], 'Largura das dorsais', 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('vertical_pull', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['bíceps']),
      training_objective = coalesce('Largura das dorsais', training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 0, 3,
    6, 10, 150,
    2, 3, array['Cotovelos para baixo; evite jogar o tronco para trás.'], null,
    'double_progression', false, 'moderate',
    false, null, 'Largura das dorsais'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Pulldown pegada neutra' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Pulldown pegada neutra', 'costas', 'cabo', 'composto', null, null, array['Puxe em direção ao peitoral superior', 'Foque na contração do dorsal'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Barra fixa assistida (ou puxada neutra)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Barra fixa assistida (ou puxada neutra)', 'costas', 'máquina', 'composto', null, null, array['Amplitude completa com controle'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Remada com apoio no peito' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Remada com apoio no peito', 'costas', 'máquina', 'composto', 'horizontal_pull', array['bíceps', 'deltoide posterior'], array['Peito apoiado e sem impulso.'], 'Espessura das costas', 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('horizontal_pull', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['bíceps', 'deltoide posterior']),
      training_objective = coalesce('Espessura das costas', training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 1, 3,
    6, 10, 150,
    2, 3, array['Peito apoiado e sem impulso.'], null,
    'double_progression', false, 'moderate',
    false, null, 'Espessura das costas'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Remada em máquina com apoio' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Remada em máquina com apoio', 'costas', 'máquina', 'composto', null, null, array['Peito apoiado', 'Puxe com as costas, sem impulso'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Remada T (ou máquina com apoio)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Remada T (ou máquina com apoio)', 'costas', 'máquina', 'composto', null, null, array['Tronco apoiado', 'Retraia as escápulas no pico'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Straight-arm pulldown' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Straight-arm pulldown', 'costas', 'cabo', 'isolador', 'vertical_pull', null, array['Braços quase estendidos e tronco estável.'], 'Dorsais em posição alongada', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('vertical_pull', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Dorsais em posição alongada', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 2, 2,
    12, 15, 75,
    1, 2, array['Braços quase estendidos e tronco estável.'], null,
    'double_progression', true, 'low',
    false, null, 'Dorsais em posição alongada'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Crucifixo inverso na máquina' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Crucifixo inverso na máquina', 'deltoide posterior', 'máquina', 'isolador', 'rear_delt', null, array['Abra com controle, sem impulso.'], 'Ombro posterior', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('rear_delt', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Ombro posterior', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 3, 3,
    12, 20, 75,
    1, 2, array['Abra com controle, sem impulso.'], null,
    'double_progression', true, 'low',
    false, null, 'Ombro posterior'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Rosca direta com barra W' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Rosca direta com barra W', 'bíceps', 'barra W', 'isolador', 'elbow_flexion', null, array['Cotovelos estáveis.'], 'Massa de bíceps', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('elbow_flexion', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Massa de bíceps', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 4, 3,
    8, 12, 90,
    1, 2, array['Cotovelos estáveis.'], null,
    'double_progression', true, 'low',
    false, null, 'Massa de bíceps'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Rosca martelo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Rosca martelo', 'bíceps', 'halter', 'isolador', 'elbow_flexion', array['braquial'], array['Punhos neutros e sem balanço.'], 'Braquial e antebraço', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('elbow_flexion', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['braquial']),
      training_objective = coalesce('Braquial e antebraço', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 5, 2,
    10, 15, 75,
    1, 2, array['Punhos neutros e sem balanço.'], null,
    'double_progression', true, 'low',
    false, null, 'Braquial e antebraço'
  ) returning id into v_we;


  -- ------------------------------------------------------------
  -- Legs A (C) — dia 3
  -- ------------------------------------------------------------
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version, session_focus)
  values (v_user, 'C', 'Legs A', 2, 3, 'Força técnica de agachamento, cadeia posterior, panturrilhas e core.', '5–10 min de movimento leve. No primeiro composto, faça séries progressivas sem fadiga. Nos dias de pernas, inclua preparação breve de core e bracing.', 4, 'strength_technique')
  returning id into v_workout;

  select id into v_ex from exercises where name_pt = 'Hack squat' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Hack squat', 'quadríceps', 'máquina', 'composto', 'squat', array['glúteos'], array['Top set de 5–8 e dois back-offs de 8–10, sempre submáximos.', 'Brace antes de descer; amplitude segura e consistente.'], 'Força técnica e quadríceps', 'high')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('squat', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['glúteos']),
      training_objective = coalesce('Força técnica e quadríceps', training_objective),
      risk_level = 'high'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 0, 3,
    5, 10, 180,
    2, 3, array['Top set de 5–8 e dois back-offs de 8–10, sempre submáximos.', 'Brace antes de descer; amplitude segura e consistente.'], null,
    'top_set_backoff', false, 'high',
    true, 7.5, 'Força técnica e quadríceps'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Agachamento livre' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Agachamento livre', 'quadríceps', 'barra', 'composto', null, null, array['Desça com controle até amplitude segura', 'Joelhos na direção dos pés'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Agachamento no Smith' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Agachamento no Smith', 'quadríceps', 'máquina', 'composto', null, null, array['Use quando tecnicamente adequado', 'Amplitude consistente'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Leg press' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Leg press', 'quadríceps', 'máquina', 'composto', 'squat', array['glúteos'], array['Lombar apoiada e profundidade controlada.'], 'Volume de quadríceps', 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('squat', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['glúteos']),
      training_objective = coalesce('Volume de quadríceps', training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 1, 3,
    10, 15, 180,
    2, 2, array['Lombar apoiada e profundidade controlada.'], null,
    'double_progression', false, 'moderate',
    false, null, 'Volume de quadríceps'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Terra romeno / stiff' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Terra romeno / stiff', 'isquiotibiais', 'barra', 'composto', 'hip_hinge', array['glúteos'], array['Quadril para trás, coluna neutra e barra próxima ao corpo.'], 'Cadeia posterior', 'high')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('hip_hinge', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['glúteos']),
      training_objective = coalesce('Cadeia posterior', training_objective),
      risk_level = 'high'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 2, 3,
    6, 10, 180,
    2, 3, array['Quadril para trás, coluna neutra e barra próxima ao corpo.'], null,
    'double_progression', false, 'high',
    false, null, 'Cadeia posterior'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Flexora sentada' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Flexora sentada', 'isquiotibiais', 'máquina', 'isolador', 'knee_flexion', null, array['Controle a volta.'], 'Flexores do joelho', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('knee_flexion', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Flexores do joelho', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 3, 3,
    10, 15, 120,
    1, 2, array['Controle a volta.'], null,
    'double_progression', true, 'low',
    false, null, 'Flexores do joelho'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Mesa flexora' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Mesa flexora', 'isquiotibiais', 'máquina', 'isolador', null, null, array['Flexione com controle, sem levantar o quadril'], null, 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Flexora unilateral' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Flexora unilateral', 'isquiotibiais', 'máquina', 'isolador', null, null, array['Uma perna por vez, com controle total'], null, 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Panturrilha em pé' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Panturrilha em pé', 'panturrilha', 'máquina', 'isolador', 'calf_raise', null, array['Pausa no alongamento e no topo.'], 'Panturrilha', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('calf_raise', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Panturrilha', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 4, 3,
    10, 15, 90,
    1, 2, array['Pausa no alongamento e no topo.'], null,
    'double_progression', true, 'low',
    false, null, 'Panturrilha'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Reverse crunch no banco' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Reverse crunch no banco', 'abdômen', 'corpo', 'abdominal', 'pelvic_curl', null, array['Enrole a pelve; evite balanço.'], 'Flexão inferior e controle pélvico', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('pelvic_curl', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Flexão inferior e controle pélvico', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 5, 3,
    8, 15, 90,
    1, 2, array['Enrole a pelve; evite balanço.'], null,
    'bodyweight_control', true, 'low',
    false, null, 'Flexão inferior e controle pélvico'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Capitão (elevação de joelhos)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Capitão (elevação de joelhos)', 'abdômen', 'corpo', 'abdominal', 'retroversao_pelvica', null, array['Enrole a pelve ao subir os joelhos', 'Sem balanço'], null, 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('retroversao_pelvica', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Elevação de joelhos pendurado' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Elevação de joelhos pendurado', 'abdômen', 'corpo', 'abdominal', 'retroversao_pelvica', null, array['Somente se conseguir evitar balanço', 'Controle a descida'], null, 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('retroversao_pelvica', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  -- ------------------------------------------------------------
  -- Push B (D) — dia 4
  -- ------------------------------------------------------------
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version, session_focus)
  values (v_user, 'D', 'Push B', 3, 4, 'Hipertrofia de peitoral, ombros e tríceps com volume controlado.', '5–10 min de movimento leve. No primeiro composto, faça séries progressivas sem fadiga. Nos dias de pernas, inclua preparação breve de core e bracing.', 4, 'hypertrophy')
  returning id into v_workout;

  select id into v_ex from exercises where name_pt = 'Supino reto com barra' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Supino reto com barra', 'peito', 'barra', 'composto', 'horizontal_push', array['tríceps'], array['Sem falha; use travas ou spotter quando disponível.'], 'Massa de peitoral', 'high')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('horizontal_push', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['tríceps']),
      training_objective = coalesce('Massa de peitoral', training_objective),
      risk_level = 'high'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 0, 3,
    8, 12, 150,
    2, 2, array['Sem falha; use travas ou spotter quando disponível.'], null,
    'double_progression', false, 'high',
    false, null, 'Massa de peitoral'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Supino em máquina' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Supino em máquina', 'peito', 'máquina', 'composto', null, null, array['Escápulas apoiadas', 'Empurre e retorne com controle'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Supino inclinado na máquina' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Supino inclinado na máquina', 'peito', 'máquina', 'composto', 'incline_push', array['tríceps'], array['Controle a descida.'], 'Peitoral superior', 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('incline_push', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['tríceps']),
      training_objective = coalesce('Peitoral superior', training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 1, 3,
    8, 12, 120,
    2, 2, array['Controle a descida.'], null,
    'double_progression', false, 'moderate',
    false, null, 'Peitoral superior'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Supino inclinado com halteres' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Supino inclinado com halteres', 'peito', 'halter', 'composto', 'incline_push', null, array['Top set submáximo de 6–8; back-offs de 8–10 com 5–10% menos carga.', 'Escápulas estáveis, pés firmes e amplitude confortável.'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('incline_push', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Crossover baixo para cima' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Crossover baixo para cima', 'peito', 'cabo', 'isolador', 'incline_push', null, array['Cruze para cima sem perder controle.'], 'Peitoral superior', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('incline_push', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Peitoral superior', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 2, 2,
    12, 20, 75,
    1, 2, array['Cruze para cima sem perder controle.'], null,
    'double_progression', true, 'low',
    false, null, 'Peitoral superior'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Elevação lateral com halteres' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Elevação lateral com halteres', 'deltoide lateral', 'halter', 'isolador', 'lateral_delt', null, array['Sem balanço.'], 'Largura dos ombros', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('lateral_delt', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Largura dos ombros', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 3, 4,
    12, 20, 75,
    1, 2, array['Sem balanço.'], null,
    'double_progression', true, 'low',
    false, null, 'Largura dos ombros'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Elevação lateral unilateral no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Elevação lateral unilateral no cabo', 'deltoide lateral', 'cabo', 'isolador', 'lateral_delt', null, array['Tensão contínua, sem balanço ou encolhimento.'], null, 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('lateral_delt', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Tríceps testa no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Tríceps testa no cabo', 'tríceps', 'cabo', 'isolador', 'elbow_extension', null, array['Cotovelos apontados para a frente.'], 'Massa de tríceps', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('elbow_extension', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Massa de tríceps', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 4, 3,
    8, 12, 90,
    1, 2, array['Cotovelos apontados para a frente.'], null,
    'double_progression', true, 'low',
    false, null, 'Massa de tríceps'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Tríceps unilateral no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Tríceps unilateral no cabo', 'tríceps', 'cabo', 'isolador', 'elbow_extension', null, array['Controle por lado.'], 'Simetria de tríceps', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('elbow_extension', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Simetria de tríceps', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 5, 2,
    12, 20, 75,
    1, 2, array['Controle por lado.'], 'Repetições por lado',
    'double_progression', true, 'low',
    false, null, 'Simetria de tríceps'
  ) returning id into v_we;


  -- ------------------------------------------------------------
  -- Pull B (E) — dia 5
  -- ------------------------------------------------------------
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version, session_focus)
  values (v_user, 'E', 'Pull B', 4, 5, 'Hipertrofia de dorsais, espessura de costas, ombro posterior e bíceps.', '5–10 min de movimento leve. No primeiro composto, faça séries progressivas sem fadiga. Nos dias de pernas, inclua preparação breve de core e bracing.', 4, 'hypertrophy')
  returning id into v_workout;

  select id into v_ex from exercises where name_pt = 'Barra fixa assistida com pegada neutra' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Barra fixa assistida com pegada neutra', 'costas', 'máquina assistida', 'composto', 'vertical_pull', array['bíceps'], array['Amplitude controlada e sem balanço.'], 'Largura das dorsais', 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('vertical_pull', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['bíceps']),
      training_objective = coalesce('Largura das dorsais', training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 0, 3,
    8, 12, 150,
    2, 2, array['Amplitude controlada e sem balanço.'], null,
    'bodyweight_control', false, 'moderate',
    false, null, 'Largura das dorsais'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Puxada neutra' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Puxada neutra', 'costas', 'cabo', 'composto', null, null, array['Puxe com amplitude controlada e cotovelos em direção ao tronco'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Remada unilateral no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Remada unilateral no cabo', 'costas', 'cabo', 'composto', 'horizontal_pull', array['bíceps'], array['Puxe o cotovelo em direção ao quadril.'], 'Dorsal por lado', 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('horizontal_pull', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['bíceps']),
      training_objective = coalesce('Dorsal por lado', training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 1, 2,
    8, 12, 120,
    2, 2, array['Puxe o cotovelo em direção ao quadril.'], 'Repetições por lado',
    'double_progression', false, 'moderate',
    false, null, 'Dorsal por lado'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Remada T (ou máquina com apoio)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Remada T (ou máquina com apoio)', 'costas', 'máquina', 'composto', 'horizontal_pull', array['bíceps', 'deltoide posterior'], array['Peito apoiado e sem impulso.'], 'Espessura das costas', 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('horizontal_pull', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['bíceps', 'deltoide posterior']),
      training_objective = coalesce('Espessura das costas', training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 2, 2,
    8, 12, 120,
    2, 2, array['Peito apoiado e sem impulso.'], null,
    'double_progression', false, 'moderate',
    false, null, 'Espessura das costas'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Remada com apoio no peito' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Remada com apoio no peito', 'costas', 'máquina', 'composto', 'horizontal_pull', null, array['Peito apoiado e sem impulso.'], null, 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('horizontal_pull', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Crucifixo inverso no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Crucifixo inverso no cabo', 'deltoide posterior', 'cabo', 'isolador', 'rear_delt', null, array['Controle o retorno.'], 'Ombro posterior', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('rear_delt', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Ombro posterior', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 3, 3,
    12, 20, 75,
    1, 2, array['Controle o retorno.'], null,
    'double_progression', true, 'low',
    false, null, 'Ombro posterior'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Rosca alternada no banco inclinado' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Rosca alternada no banco inclinado', 'bíceps', 'halter', 'isolador', 'elbow_flexion', null, array['Ombros para trás e sem balanço.'], 'Bíceps em posição alongada', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('elbow_flexion', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Bíceps em posição alongada', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 4, 3,
    8, 12, 90,
    1, 2, array['Ombros para trás e sem balanço.'], null,
    'double_progression', true, 'low',
    false, null, 'Bíceps em posição alongada'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Rosca direta no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Rosca direta no cabo', 'bíceps', 'cabo', 'isolador', 'elbow_flexion', null, array['Cotovelos estáveis.'], 'Tensão contínua no bíceps', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('elbow_flexion', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Tensão contínua no bíceps', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 5, 2,
    12, 15, 75,
    1, 2, array['Cotovelos estáveis.'], null,
    'double_progression', true, 'low',
    false, null, 'Tensão contínua no bíceps'
  ) returning id into v_we;


  -- ------------------------------------------------------------
  -- Legs B (F) — dia 6
  -- ------------------------------------------------------------
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version, session_focus)
  values (v_user, 'F', 'Legs B', 5, 6, 'Hipertrofia de pernas, glúteos, estabilidade e core anti-extensão/anti-rotação.', '5–10 min de movimento leve. No primeiro composto, faça séries progressivas sem fadiga. Nos dias de pernas, inclua preparação breve de core e bracing.', 4, 'hypertrophy')
  returning id into v_workout;

  select id into v_ex from exercises where name_pt = 'Agachamento búlgaro' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Agachamento búlgaro', 'quadríceps', 'halter', 'composto', 'unilateral_leg', array['glúteos'], array['Repetições por perna; mantenha o pé dianteiro estável.'], 'Quadríceps e estabilidade unilateral', 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('unilateral_leg', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['glúteos']),
      training_objective = coalesce('Quadríceps e estabilidade unilateral', training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 0, 3,
    8, 12, 150,
    2, 2, array['Repetições por perna; mantenha o pé dianteiro estável.'], 'Repetições por lado',
    'double_progression', false, 'moderate',
    false, null, 'Quadríceps e estabilidade unilateral'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Hip thrust' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Hip thrust', 'glúteos', 'barra', 'composto', 'hip_hinge', array['isquiotibiais'], array['Queixo recolhido; termine com glúteos, sem hiperestender a lombar.'], 'Glúteos e extensão de quadril', 'moderate')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce('hip_hinge', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['isquiotibiais']),
      training_objective = coalesce('Glúteos e extensão de quadril', training_objective),
      risk_level = 'moderate'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 1, 3,
    8, 12, 150,
    2, 2, array['Queixo recolhido; termine com glúteos, sem hiperestender a lombar.'], null,
    'double_progression', false, 'moderate',
    false, null, 'Glúteos e extensão de quadril'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Cadeira extensora' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Cadeira extensora', 'quadríceps', 'máquina', 'isolador', 'squat', null, array['Subida controlada, sem tirar o quadril do banco.'], 'Quadríceps', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('squat', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Quadríceps', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 2, 3,
    12, 15, 90,
    1, 2, array['Subida controlada, sem tirar o quadril do banco.'], null,
    'double_progression', true, 'low',
    false, null, 'Quadríceps'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Flexora deitada' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Flexora deitada', 'isquiotibiais', 'máquina', 'isolador', 'knee_flexion', null, array['Não levante o quadril.'], 'Posteriores de coxa', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('knee_flexion', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Posteriores de coxa', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 3, 3,
    10, 15, 120,
    1, 2, array['Não levante o quadril.'], null,
    'double_progression', true, 'low',
    false, null, 'Posteriores de coxa'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Flexora sentada' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Flexora sentada', 'isquiotibiais', 'máquina', 'isolador', 'knee_flexion', null, array['Controle a volta.'], null, 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('knee_flexion', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Panturrilha sentada' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Panturrilha sentada', 'panturrilha', 'máquina', 'isolador', 'calf_raise', null, array['Amplitude completa.'], 'Panturrilha', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce('calf_raise', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Panturrilha', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 4, 3,
    12, 20, 90,
    1, 2, array['Amplitude completa.'], null,
    'double_progression', true, 'low',
    false, null, 'Panturrilha'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Ab wheel ajoelhado' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Ab wheel ajoelhado', 'abdômen', 'roda abdominal', 'abdominal', 'anti_extension', null, array['Pare antes de perder a posição lombar.'], 'Anti-extensão do core', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('anti_extension', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce('Anti-extensão do core', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 5, 3,
    6, 12, 90,
    1, 2, array['Pare antes de perder a posição lombar.'], null,
    'range_control', true, 'low',
    false, null, 'Anti-extensão do core'
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Rollout com barra' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Rollout com barra', 'abdômen', 'barra', 'abdominal', 'anti_extensao', null, array['Mesma mecânica do ab wheel com barra anilhada'], null, 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('anti_extensao', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Body saw' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Body saw', 'abdômen', 'corpo', 'abdominal', 'anti_extensao', null, array['Em prancha, deslize para frente e para trás sem perder a retroversão'], null, 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('anti_extensao', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Prancha com alavanca progressiva' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Prancha com alavanca progressiva', 'abdômen', 'corpo', 'abdominal', 'anti_extensao', null, array['Aumente a alavanca (cotovelos à frente) para progredir'], null, 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('anti_extensao', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null),
      training_objective = coalesce(null, training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 2)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Pallof press' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions, training_objective, risk_level)
    values ('Pallof press', 'abdômen', 'cabo', 'abdominal', 'anti_rotation', array['oblíquos'], array['Resista à rotação e mantenha costelas sobre a pelve.'], 'Anti-rotação e estabilidade', 'low')
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('anti_rotation', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['oblíquos']),
      training_objective = coalesce('Anti-rotação e estabilidade', training_objective),
      risk_level = 'low'
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes,
    progression_type, failure_allowed, failure_risk_level,
    top_set_enabled, backoff_percentage, aesthetic_function
  ) values (
    v_workout, v_ex, 6, 2,
    10, 15, 75,
    2, 3, array['Resista à rotação e mantenha costelas sobre a pelve.'], 'Repetições por lado',
    'range_control', true, 'low',
    false, null, 'Anti-rotação e estabilidade'
  ) returning id into v_we;

  end loop;
end $$;

insert into public.content_sources (slug, title, category, provenance, url, summary, accessed_on)
values
  ('david-training-philosophy', 'Filosofia pública de treino', 'Powerbuilding', 'direct_primary_source', 'https://davidlaid.com/', 'Força como métrica de progresso aplicada ao desenvolvimento físico; não é prescrição individual.', '2026-07-14'),
  ('gymshark-powerbuilding', 'Síntese pública de powerbuilding', 'Powerbuilding', 'official_secondary_source', 'https://row.gymshark.com/blog/article/david-laid-workout', 'Combinação de compostos, acessórios, sobrecarga progressiva e variação de estímulo.', '2026-07-14'),
  ('acsm-2026', 'ACSM 2026 — treinamento resistido', 'Evidência', 'scientific_evidence', 'https://pubmed.ncbi.nlm.nih.gov/41843416/', 'Consistência, esforço adequado e volume são mais importantes do que complexidade desnecessária.', '2026-07-14'),
  ('periodization-meta', 'Periodização e força/hipertrofia', 'Evidência', 'scientific_evidence', 'https://pubmed.ncbi.nlm.nih.gov/35044672/', 'A periodização pode organizar variações de carga; esta implementação usa micro-DUP conservadora.', '2026-07-14'),
  ('failure-proximity', 'Proximidade da falha', 'Evidência', 'scientific_evidence', 'https://pubmed.ncbi.nlm.nih.gov/36334240/', 'Falha não é obrigatória; o custo de fadiga e o risco do exercício orientam o uso.', '2026-07-14'),
  ('failure-vs-nonfailure', 'Falha versus não falha', 'Evidência', 'scientific_evidence', 'https://pubmed.ncbi.nlm.nih.gov/33497853/', 'Séries sem falha podem gerar progresso; compostos de risco permanecem submáximos.', '2026-07-14'),
  ('micro-dup-inference', 'Micro-DUP para iniciante', 'Adaptação do app', 'implementation_inference', null, 'Sessões A priorizam força técnica em 5–10 repetições; sessões B priorizam hipertrofia em 8–20.', '2026-07-14'),
  ('readiness-inference', 'Prontidão diária', 'Adaptação do app', 'implementation_inference', null, 'Sono, energia, dor, estresse e recuperação ajustam sugestões, nunca diagnosticam lesão ou overtraining.', '2026-07-14'),
  ('expectations-inference', 'Expectativas realistas', 'Adaptação do app', 'implementation_inference', null, 'Referências estéticas são inspiração; genética, estrutura, tempo, alimentação e consistência tornam o resultado individual.', '2026-07-14')
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  provenance = excluded.provenance,
  url = excluded.url,
  summary = excluded.summary,
  accessed_on = excluded.accessed_on;

-- ============================================================
-- Rollback (down) — reversível:
--   1. delete from workout_exercise_substitutions where workout_exercise_id in
--        (select id from workout_exercises where workout_id in
--          (select id from workouts where routine_version = 4));
--   2. delete from workout_exercises where workout_id in
--        (select id from workouts where routine_version = 4)
--        and id not in (select workout_exercise_id from set_logs);
--   3. delete from workouts where routine_version = 4
--        and id not in (select workout_id from workout_sessions);
--   4. update workouts set is_archived = false
--        where routine_version < 4
--        and id in (select (e->>'id')::uuid from routine_backups rb,
--                   jsonb_array_elements(rb.payload->'workouts') e
--                   where rb.label = 'pre-rotina-v4');
--   (sessões realizadas na v2 são preservadas; por isso os deletes acima
--    excluem registros já referenciados por histórico.)
-- ============================================================
