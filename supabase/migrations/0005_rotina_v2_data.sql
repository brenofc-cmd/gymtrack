-- 0005 — Dados da Rotina v2 (PPL 6 dias) — GERADO por scripts/generate-rotina-v2-sql.ts
-- NÃO EDITE MANUALMENTE: altere lib/routine/rotina-v2.ts e regenere.
--
-- Para cada usuário com a rotina v1 ativa (Push A..Legs B não arquivados):
--   1. backup jsonb em routine_backups
--   2. arquiva os treinos ativos (preserva sessões e set_logs)
--   3. cria a rotina v2 com dias, exercícios, RIR, descanso e substituições
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
      and routine_version < 2
      and name in ('Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B')
  loop
    -- 1. Backup da ficha ativa
    insert into routine_backups (user_id, label, payload)
    select v_user, 'pre-rotina-v2',
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
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version)
  values (v_user, 'A', 'Push A', 0, 1, 'Peitoral superior, deltoide lateral, ombros, tríceps e primeiro estímulo direto de abdômen da semana.', 'Aquecimento geral leve (~5 min) e séries de aproximação no primeiro composto: ~40% × 8–12, ~60% × 5–6, ~75–80% × 2–4. Séries de aquecimento não contam no volume e não devem cansar.', 2)
  returning id into v_workout;

  select id into v_ex from exercises where name_pt = 'Supino inclinado com halteres (banco a 30°)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Supino inclinado com halteres (banco a 30°)', 'peito', 'halter', 'composto', null, array['deltoide anterior', 'tríceps'], array['Inclinação do banco em ~20–30°; não transformar em desenvolvimento', 'Pés firmes e escápulas estáveis', 'Controlar a descida, amplitude confortável e consistente', 'Não bater os halteres nem encurtar a amplitude para usar mais carga'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['deltoide anterior', 'tríceps'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 0, 3,
    6, 10, 180,
    2, 2, array['Inclinação do banco em ~20–30°; não transformar em desenvolvimento', 'Pés firmes e escápulas estáveis', 'Controlar a descida, amplitude confortável e consistente', 'Não bater os halteres nem encurtar a amplitude para usar mais carga'], null
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Supino inclinado na máquina' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Supino inclinado na máquina', 'peito', 'máquina', 'composto', null, null, array['Ajuste o banco e empurre com controle', 'Foco no peitoral superior'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Supino inclinado (barra)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Supino inclinado (barra)', 'peito', 'barra', 'composto', null, null, array['Banco a 30-45°', 'Desça a barra até o peitoral superior com controle'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Chest press convergente' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Chest press convergente', 'peito', 'máquina', 'composto', null, array['tríceps', 'deltoide anterior'], array['Escápulas apoiadas no banco', 'Controle total na volta'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['tríceps', 'deltoide anterior'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 1, 2,
    8, 12, 120,
    2, 2, array['Escápulas apoiadas no banco', 'Controle total na volta'], null
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Supino reto com halteres (chest press)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Supino reto com halteres (chest press)', 'peito', 'halter', 'composto', null, null, array['Desça os halteres com controle até o alongamento confortável'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Supino em máquina' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Supino em máquina', 'peito', 'máquina', 'composto', null, null, array['Escápulas apoiadas', 'Empurre e retorne com controle'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Desenvolvimento sentado (máquina ou halteres)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Desenvolvimento sentado (máquina ou halteres)', 'ombro', 'máquina', 'composto', null, array['tríceps'], array['Preferir máquina convergente estável; senão, halteres sentado', 'Tronco apoiado, sem hiperextensão excessiva da lombar', 'Controlar a fase de descida, sem impulso das pernas'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['tríceps'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 2, 2,
    8, 12, 150,
    2, 2, array['Preferir máquina convergente estável; senão, halteres sentado', 'Tronco apoiado, sem hiperextensão excessiva da lombar', 'Controlar a fase de descida, sem impulso das pernas'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Elevação lateral unilateral no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Elevação lateral unilateral no cabo', 'ombro', 'cabo', 'isolador', null, null, array['Tensão contínua; não virar encolhimento', 'Não balançar o tronco nem elevar o ombro em direção à orelha', 'Carga que permita controle'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 3, 4,
    12, 20, 75,
    1, 2, array['Tensão contínua; não virar encolhimento', 'Não balançar o tronco nem elevar o ombro em direção à orelha', 'Carga que permita controle'], 'Repetições por lado'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Tríceps francês / overhead no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Tríceps francês / overhead no cabo', 'tríceps', 'cabo', 'isolador', null, null, array['Ênfase na cabeça longa; cotovelos estáveis'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 4, 2,
    10, 15, 90,
    1, 2, array['Ênfase na cabeça longa; cotovelos estáveis'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Tríceps na corda (pushdown)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Tríceps na corda (pushdown)', 'tríceps', 'cabo', 'isolador', null, null, array['Cotovelos junto ao corpo, abrir a corda no final'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 5, 2,
    10, 15, 75,
    1, 2, array['Cotovelos junto ao corpo, abrir a corda no final'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Cable crunch' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Cable crunch', 'abdômen', 'cabo', 'abdominal', 'flexao_tronco', null, array['Flexionar a coluna contraindo o abdômen: aproximar costelas da pelve', 'Não transformar em flexão de quadril nem puxar só com os braços', 'Controlar o retorno; carga progressiva; sem repetições rápidas e curtas'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('flexao_tronco', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 6, 3,
    10, 15, 90,
    1, 2, array['Flexionar a coluna contraindo o abdômen: aproximar costelas da pelve', 'Não transformar em flexão de quadril nem puxar só com os braços', 'Controlar o retorno; carga progressiva; sem repetições rápidas e curtas'], null
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Abdominal na máquina (com carga)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Abdominal na máquina (com carga)', 'abdômen', 'máquina', 'abdominal', 'flexao_tronco', null, array['Flexione o tronco contraindo o abdômen', 'Controle o retorno'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('flexao_tronco', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Crunch com anilha (resistência)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Crunch com anilha (resistência)', 'abdômen', 'anilha', 'abdominal', 'flexao_tronco', null, array['Anilha no peito', 'Aproxime as costelas da pelve com controle'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('flexao_tronco', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  -- ------------------------------------------------------------
  -- Pull A (B) — dia 2
  -- ------------------------------------------------------------
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version)
  values (v_user, 'B', 'Pull A', 1, 2, 'Largura das costas, parte média das costas, deltoide posterior e bíceps.', 'Aquecimento geral leve (~5 min) e séries de aproximação no primeiro composto: ~40% × 8–12, ~60% × 5–6, ~75–80% × 2–4. Séries de aquecimento não contam no volume e não devem cansar.', 2)
  returning id into v_workout;

  select id into v_ex from exercises where name_pt = 'Puxada alta pegada pronada média-aberta (com straps)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Puxada alta pegada pronada média-aberta (com straps)', 'costas', 'cabo', 'composto', null, array['bíceps', 'parte superior das costas'], array['Iniciar estabilizando e abaixando as escápulas', 'Levar os cotovelos para baixo; não puxar só com as mãos', 'Não jogar o tronco para trás em excesso; amplitude consistente'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['bíceps', 'parte superior das costas'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 0, 3,
    6, 10, 150,
    2, 2, array['Iniciar estabilizando e abaixando as escápulas', 'Levar os cotovelos para baixo; não puxar só com as mãos', 'Não jogar o tronco para trás em excesso; amplitude consistente'], null
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Pulldown pegada neutra' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Pulldown pegada neutra', 'costas', 'cabo', 'composto', null, null, array['Puxe em direção ao peitoral superior', 'Foque na contração do dorsal'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Barra fixa assistida (ou puxada neutra)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Barra fixa assistida (ou puxada neutra)', 'costas', 'máquina', 'composto', null, null, array['Amplitude completa com controle'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Remada com apoio no peito' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Remada com apoio no peito', 'costas', 'máquina', 'composto', null, array['bíceps', 'deltoide posterior'], array['Peito colado no apoio; puxar com as costas'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['bíceps', 'deltoide posterior'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 1, 3,
    8, 12, 120,
    2, 2, array['Peito colado no apoio; puxar com as costas'], null
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Remada em máquina com apoio' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Remada em máquina com apoio', 'costas', 'máquina', 'composto', null, null, array['Peito apoiado', 'Puxe com as costas, sem impulso'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Remada T (ou máquina com apoio)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Remada T (ou máquina com apoio)', 'costas', 'máquina', 'composto', null, null, array['Tronco apoiado', 'Retraia as escápulas no pico'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Straight-arm pulldown (ativação)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Straight-arm pulldown (ativação)', 'costas', 'cabo', 'isolador', null, null, array['Braços estendidos; sentir o dorsal alongar e contrair'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 2, 2,
    12, 15, 75,
    1, 2, array['Braços estendidos; sentir o dorsal alongar e contrair'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Crucifixo inverso (reverse fly)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Crucifixo inverso (reverse fly)', 'deltoide posterior', 'máquina', 'isolador', null, null, array['Abrir com controle, sem impulso'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 3, 3,
    12, 20, 75,
    1, 2, array['Abrir com controle, sem impulso'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Rosca direta (barra W)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Rosca direta (barra W)', 'bíceps', 'barra', 'isolador', null, null, array['Cotovelos fixos ao lado do corpo'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 4, 2,
    8, 12, 90,
    1, 2, array['Cotovelos fixos ao lado do corpo'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Rosca martelo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Rosca martelo', 'bíceps', 'halter', 'isolador', null, array['braquial', 'braquiorradial'], array['Pegada neutra; punhos retos'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['braquial', 'braquiorradial'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 5, 2,
    10, 15, 75,
    1, 2, array['Pegada neutra; punhos retos'], null
  ) returning id into v_we;


  -- ------------------------------------------------------------
  -- Legs A (C) — dia 3
  -- ------------------------------------------------------------
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version)
  values (v_user, 'C', 'Legs A', 2, 3, 'Quadríceps, posteriores, panturrilhas e segundo estímulo direto de abdômen.', 'Aquecimento geral leve (~5 min) e séries de aproximação no primeiro composto: ~40% × 8–12, ~60% × 5–6, ~75–80% × 2–4. Séries de aquecimento não contam no volume e não devem cansar.', 2)
  returning id into v_workout;

  select id into v_ex from exercises where name_pt = 'Hack squat' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Hack squat', 'quadríceps', 'máquina', 'composto', null, array['glúteos', 'isquiotibiais'], array['Escolha hack squat ou agachamento livre e mantenha a variação no histórico', 'Amplitude segura e consistente; joelhos na direção dos pés', 'Não sacrificar profundidade para aumentar carga', 'Encerrar a série quando a técnica começar a se desfazer; sem falha sem estrutura segura'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['glúteos', 'isquiotibiais'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 0, 3,
    6, 10, 180,
    2, 3, array['Escolha hack squat ou agachamento livre e mantenha a variação no histórico', 'Amplitude segura e consistente; joelhos na direção dos pés', 'Não sacrificar profundidade para aumentar carga', 'Encerrar a série quando a técnica começar a se desfazer; sem falha sem estrutura segura'], null
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Agachamento livre' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Agachamento livre', 'quadríceps', 'barra', 'composto', null, null, array['Desça com controle até amplitude segura', 'Joelhos na direção dos pés'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Agachamento no Smith' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Agachamento no Smith', 'quadríceps', 'máquina', 'composto', null, null, array['Use quando tecnicamente adequado', 'Amplitude consistente'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Leg press' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Leg press', 'quadríceps', 'máquina', 'composto', null, array['glúteos'], array['Descer com controle até amplitude segura; não travar os joelhos'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['glúteos'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 1, 3,
    10, 15, 180,
    2, 2, array['Descer com controle até amplitude segura; não travar os joelhos'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Cadeira extensora' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Cadeira extensora', 'quadríceps', 'máquina', 'isolador', null, null, array['Contrair no topo, descer devagar'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 2, 2,
    12, 15, 90,
    1, 2, array['Contrair no topo, descer devagar'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Cadeira flexora (leg curl)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Cadeira flexora (leg curl)', 'isquiotibiais', 'máquina', 'isolador', null, null, array['Preferir a flexora sentada quando houver máquina adequada'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 3, 3,
    10, 15, 120,
    1, 2, array['Preferir a flexora sentada quando houver máquina adequada'], null
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Mesa flexora' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Mesa flexora', 'isquiotibiais', 'máquina', 'isolador', null, null, array['Flexione com controle, sem levantar o quadril'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Flexora unilateral' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Flexora unilateral', 'isquiotibiais', 'máquina', 'isolador', null, null, array['Uma perna por vez, com controle total'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Panturrilha em pé' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Panturrilha em pé', 'panturrilha', 'máquina', 'isolador', null, null, array['Amplitude completa com pausa curta na posição alongada', 'Subir completamente; evitar repetições rápidas e parciais'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 4, 3,
    8, 15, 90,
    1, 2, array['Amplitude completa com pausa curta na posição alongada', 'Subir completamente; evitar repetições rápidas e parciais'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Reverse crunch (banco)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Reverse crunch (banco)', 'abdômen', 'corpo', 'abdominal', 'retroversao_pelvica', null, array['Iniciar enrolando a pelve em direção ao tronco (retroversão)', 'Evitar apenas levantar e abaixar as pernas; sem balanço', 'Controlar a descida; não arquear excessivamente a lombar', 'Progredir por repetições, controle, amplitude ou resistência'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('retroversao_pelvica', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 5, 3,
    10, 15, 90,
    1, 2, array['Iniciar enrolando a pelve em direção ao tronco (retroversão)', 'Evitar apenas levantar e abaixar as pernas; sem balanço', 'Controlar a descida; não arquear excessivamente a lombar', 'Progredir por repetições, controle, amplitude ou resistência'], null
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Capitão (elevação de joelhos)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Capitão (elevação de joelhos)', 'abdômen', 'corpo', 'abdominal', 'retroversao_pelvica', null, array['Enrole a pelve ao subir os joelhos', 'Sem balanço'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('retroversao_pelvica', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Elevação de joelhos pendurado' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Elevação de joelhos pendurado', 'abdômen', 'corpo', 'abdominal', 'retroversao_pelvica', null, array['Somente se conseguir evitar balanço', 'Controle a descida'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('retroversao_pelvica', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  -- ------------------------------------------------------------
  -- Push B (D) — dia 4
  -- ------------------------------------------------------------
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version)
  values (v_user, 'D', 'Push B', 3, 4, 'Peitoral completo, peitoral superior, deltoide lateral e tríceps.', 'Aquecimento geral leve (~5 min) e séries de aproximação no primeiro composto: ~40% × 8–12, ~60% × 5–6, ~75–80% × 2–4. Séries de aquecimento não contam no volume e não devem cansar.', 2)
  returning id into v_workout;

  select id into v_ex from exercises where name_pt = 'Supino reto com barra' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Supino reto com barra', 'peito', 'barra', 'composto', null, array['tríceps', 'deltoide anterior'], array['Barra ou máquina; não levar deliberadamente à falha no livre'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['tríceps', 'deltoide anterior'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 0, 3,
    6, 10, 180,
    2, 2, array['Barra ou máquina; não levar deliberadamente à falha no livre'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Supino inclinado na máquina' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Supino inclinado na máquina', 'peito', 'máquina', 'composto', null, array['tríceps', 'deltoide anterior'], array['Foco no peitoral superior'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['tríceps', 'deltoide anterior'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 1, 2,
    8, 12, 120,
    2, 2, array['Foco no peitoral superior'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Crossover de baixo para cima (low-to-high)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Crossover de baixo para cima (low-to-high)', 'peito', 'cabo', 'isolador', null, null, array['Direcionamento para a região clavicular'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 2, 2,
    12, 20, 75,
    1, 2, array['Direcionamento para a região clavicular'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Elevação lateral (halteres ou cabo)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Elevação lateral (halteres ou cabo)', 'ombro', 'halter', 'isolador', null, null, array['Sem balanço; não elevar o ombro em direção à orelha'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 3, 4,
    12, 20, 75,
    1, 2, array['Sem balanço; não elevar o ombro em direção à orelha'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Tríceps testa no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Tríceps testa no cabo', 'tríceps', 'cabo', 'isolador', null, null, array['Preferência pelo cabo: tensão contínua e ajuste fácil'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 4, 2,
    8, 12, 90,
    1, 2, array['Preferência pelo cabo: tensão contínua e ajuste fácil'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Tríceps unilateral no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Tríceps unilateral no cabo', 'tríceps', 'cabo', 'isolador', null, null, array['12 a 20 repetições por braço'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 5, 2,
    12, 20, 75,
    1, 2, array['12 a 20 repetições por braço'], 'Repetições por lado'
  ) returning id into v_we;


  -- ------------------------------------------------------------
  -- Pull B (E) — dia 5
  -- ------------------------------------------------------------
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version)
  values (v_user, 'E', 'Pull B', 4, 5, 'Dorsal, espessura das costas, deltoide posterior, deltoide lateral e bíceps.', 'Aquecimento geral leve (~5 min) e séries de aproximação no primeiro composto: ~40% × 8–12, ~60% × 5–6, ~75–80% × 2–4. Séries de aquecimento não contam no volume e não devem cansar.', 2)
  returning id into v_workout;

  select id into v_ex from exercises where name_pt = 'Barra fixa assistida (ou puxada neutra)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Barra fixa assistida (ou puxada neutra)', 'costas', 'máquina', 'composto', null, array['bíceps'], array['Amplitude completa com controle'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['bíceps'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 0, 3,
    6, 10, 150,
    2, 2, array['Amplitude completa com controle'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Remada unilateral no cabo (ou máquina)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Remada unilateral no cabo (ou máquina)', 'costas', 'cabo', 'composto', null, array['bíceps'], array['Conduzir o cotovelo em direção ao quadril para maior participação da dorsal', 'Controlar a posição alongada; não girar o tronco em excesso; sem impulso'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['bíceps'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 1, 3,
    8, 12, 120,
    2, 2, array['Conduzir o cotovelo em direção ao quadril para maior participação da dorsal', 'Controlar a posição alongada; não girar o tronco em excesso; sem impulso'], 'Repetições por lado'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Crucifixo inverso no cabo' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Crucifixo inverso no cabo', 'deltoide posterior', 'cabo', 'isolador', null, null, array['Movimento amplo e controlado'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 2, 3,
    12, 20, 75,
    1, 2, array['Movimento amplo e controlado'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Elevação lateral (cabo)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Elevação lateral (cabo)', 'ombro', 'cabo', 'isolador', null, null, array['Tensão contínua no deltoide lateral'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 3, 2,
    15, 25, 75,
    1, 2, array['Tensão contínua no deltoide lateral'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Rosca alternada no banco inclinado' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Rosca alternada no banco inclinado', 'bíceps', 'halter', 'isolador', null, null, array['Alongamento maior do bíceps no banco inclinado'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 4, 2,
    8, 12, 90,
    1, 2, array['Alongamento maior do bíceps no banco inclinado'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Rosca direta no cabo (barra reta)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Rosca direta no cabo (barra reta)', 'bíceps', 'cabo', 'isolador', null, null, array['Tensão contínua; sem balanço'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 5, 2,
    12, 15, 75,
    1, 2, array['Tensão contínua; sem balanço'], null
  ) returning id into v_we;


  -- ------------------------------------------------------------
  -- Legs B (F) — dia 6
  -- ------------------------------------------------------------
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version)
  values (v_user, 'F', 'Legs B', 5, 6, 'Posteriores de coxa, glúteos, quadríceps, estabilidade unilateral, panturrilhas e terceiro estímulo direto de abdômen.', 'Aquecimento geral leve (~5 min) e séries de aproximação no primeiro composto: ~40% × 8–12, ~60% × 5–6, ~75–80% × 2–4. Séries de aquecimento não contam no volume e não devem cansar.', 2)
  returning id into v_workout;

  select id into v_ex from exercises where name_pt = 'Stiff / Terra romeno' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Stiff / Terra romeno', 'isquiotibiais', 'barra', 'composto', null, array['glúteos', 'eretores da coluna'], array['Coluna neutra; conduzir o quadril para trás', 'Peso próximo ao corpo; parar a descida antes de perder a posição', 'Não arredondar a lombar; amplitude compatível com a mobilidade', 'Não levar deliberadamente à falha'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['glúteos', 'eretores da coluna'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 0, 3,
    6, 10, 180,
    2, 3, array['Coluna neutra; conduzir o quadril para trás', 'Peso próximo ao corpo; parar a descida antes de perder a posição', 'Não arredondar a lombar; amplitude compatível com a mobilidade', 'Não levar deliberadamente à falha'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Agachamento búlgaro' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Agachamento búlgaro', 'quadríceps', 'halter', 'composto', null, array['glúteos'], array['8 a 12 repetições por perna; tronco estável'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['glúteos'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 1, 3,
    8, 12, 150,
    2, 2, array['8 a 12 repetições por perna; tronco estável'], 'Repetições por lado'
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Cadeira flexora (leg curl)' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Cadeira flexora (leg curl)', 'isquiotibiais', 'máquina', 'isolador', null, null, array['Sentada ou deitada, conforme disponibilidade'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 2, 3,
    10, 15, 120,
    1, 2, array['Sentada ou deitada, conforme disponibilidade'], null
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Mesa flexora' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Mesa flexora', 'isquiotibiais', 'máquina', 'isolador', null, null, array['Flexione com controle, sem levantar o quadril'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Flexora unilateral' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Flexora unilateral', 'isquiotibiais', 'máquina', 'isolador', null, null, array['Uma perna por vez, com controle total'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Hip thrust' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Hip thrust', 'glúteos', 'barra', 'composto', null, array['isquiotibiais'], array['Não hiperestender a lombar; finalizar com contração dos glúteos', 'Queixo levemente recolhido; controlar a descida'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('composto', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['isquiotibiais'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 3, 2,
    8, 12, 120,
    1, 2, array['Não hiperestender a lombar; finalizar com contração dos glúteos', 'Queixo levemente recolhido; controlar a descida'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Panturrilha sentada' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Panturrilha sentada', 'panturrilha', 'máquina', 'isolador', null, null, array['Pausa na posição alongada; subida completa'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('isolador', exercise_type),
      movement_pattern = coalesce(null, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 4, 3,
    12, 20, 90,
    1, 2, array['Pausa na posição alongada; subida completa'], null
  ) returning id into v_we;


  select id into v_ex from exercises where name_pt = 'Ab wheel' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Ab wheel', 'abdômen', 'corpo', 'abdominal', 'anti_extensao', array['oblíquos', 'estabilizadores'], array['Contrair glúteos e manter leve retroversão pélvica', 'Impedir que a lombar afunde; avançar só até manter o tronco estável', 'Interromper a série se houver dor lombar', 'Progressões: rollout curto ajoelhado → maior amplitude → completo'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('anti_extensao', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, array['oblíquos', 'estabilizadores'])
    where id = v_ex;
  end if;
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, 5, 3,
    6, 12, 90,
    1, 2, array['Contrair glúteos e manter leve retroversão pélvica', 'Impedir que a lombar afunde; avançar só até manter o tronco estável', 'Interromper a série se houver dor lombar', 'Progressões: rollout curto ajoelhado → maior amplitude → completo'], null
  ) returning id into v_we;

  select id into v_ex from exercises where name_pt = 'Rollout com barra' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Rollout com barra', 'abdômen', 'barra', 'abdominal', 'anti_extensao', null, array['Mesma mecânica do ab wheel com barra anilhada'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('anti_extensao', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 0)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Body saw' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Body saw', 'abdômen', 'corpo', 'abdominal', 'anti_extensao', null, array['Em prancha, deslize para frente e para trás sem perder a retroversão'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('anti_extensao', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 1)
  on conflict (workout_exercise_id, exercise_id) do nothing;

  select id into v_ex from exercises where name_pt = 'Prancha com alavanca progressiva' limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values ('Prancha com alavanca progressiva', 'abdômen', 'corpo', 'abdominal', 'anti_extensao', null, array['Aumente a alavanca (cotovelos à frente) para progredir'])
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce('abdominal', exercise_type),
      movement_pattern = coalesce('anti_extensao', movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, null)
    where id = v_ex;
  end if;
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, 2)
  on conflict (workout_exercise_id, exercise_id) do nothing;
  end loop;
end $$;

-- ============================================================
-- Rollback (down) — reversível:
--   1. delete from workout_exercise_substitutions where workout_exercise_id in
--        (select id from workout_exercises where workout_id in
--          (select id from workouts where routine_version = 2));
--   2. delete from workout_exercises where workout_id in
--        (select id from workouts where routine_version = 2)
--        and id not in (select workout_exercise_id from set_logs);
--   3. delete from workouts where routine_version = 2
--        and id not in (select workout_id from workout_sessions);
--   4. update workouts set is_archived = false
--        where routine_version < 2
--        and id in (select (e->>'id')::uuid from routine_backups rb,
--                   jsonb_array_elements(rb.payload->'workouts') e
--                   where rb.label = 'pre-rotina-v2');
--   (sessões realizadas na v2 são preservadas; por isso os deletes acima
--    excluem registros já referenciados por histórico.)
-- ============================================================
