-- 20260729150000 — Alternativas opcionais: hiperextensão e dips
--
-- Cadastra dois exercícios no CATÁLOGO como alternativas, sem alterar a
-- prescrição da rotina v4. Motivo (auditoria delta, itens 5.9 e 5.10):
--
--  * Hiperextensão: a rotina já acumula fadiga lombar em terra romeno/stiff,
--    agachamento búlgaro, hip thrust e remadas. Cadastrar como exercício
--    OPCIONAL de cadeia posterior (para semanas de menor carga ou como
--    substituição), nunca como série obrigatória adicional.
--  * Dips: alternativa de empurrar com foco peitoral/tríceps. Não é
--    obrigatória, tem versão assistida e traz alerta explícito de desconforto
--    no ombro. Carga adicional não é recomendada antes de dominar a versão
--    com peso corporal.
--
-- Nenhuma linha de workout_exercises é criada: o usuário escolhe usar (ou não)
-- pela troca de exercício. Nenhum volume é adicionado automaticamente.
--
-- Rollback seguro (apenas para ambientes novos; NUNCA em produção — apagaria
-- o catálogo se já houver histórico apontando para estes exercícios):
--   delete from public.workout_exercise_substitutions
--    where exercise_id in (
--      select id from public.exercises
--       where name_pt in ('Hiperextensão (banco 45° ou romano)', 'Paralelas (dips)', 'Paralelas assistidas (dips na máquina)')
--    );
--   delete from public.exercises
--    where name_pt in ('Hiperextensão (banco 45° ou romano)', 'Paralelas (dips)', 'Paralelas assistidas (dips na máquina)')
--      and not exists (select 1 from public.set_logs sl where sl.performed_exercise_id = exercises.id);

do $$
declare
  v_hiper uuid;
  v_dips uuid;
  v_dips_assist uuid;
  v_target uuid;
begin
  -- ---------------------------------------------------------------------
  -- Hiperextensão — cadeia posterior, opcional
  -- ---------------------------------------------------------------------
  select id into v_hiper from public.exercises
   where name_pt = 'Hiperextensão (banco 45° ou romano)' limit 1;
  if v_hiper is null then
    insert into public.exercises (
      name_pt, name_en, muscle_group, equipment, exercise_type, movement_pattern,
      secondary_muscles, instructions, training_objective, risk_level, difficulty_level
    ) values (
      'Hiperextensão (banco 45° ou romano)', 'Back Extension', 'isquiotibiais', 'peso corporal',
      'isolador', 'hip_hinge', array['glúteos', 'lombar'],
      array[
        'Ajuste o apoio na altura das cristas ilíacas, não na barriga.',
        'Desça controlando com o quadril; o movimento é de dobradiça, não de enrolar a lombar.',
        'Suba até o tronco alinhar com as pernas e PARE — não passe da linha (não hiperestenda).',
        'Comece sem carga; só adicione peso quando o controle estiver consistente.',
        'Opcional: use em semanas de menor carga ou como substituição, não como série extra.'
      ],
      'Cadeia posterior e controle do tronco com baixa carga axial', 'moderate', 'beginner'
    ) returning id into v_hiper;
  end if;

  -- ---------------------------------------------------------------------
  -- Dips — alternativa de empurrar
  -- ---------------------------------------------------------------------
  select id into v_dips from public.exercises where name_pt = 'Paralelas (dips)' limit 1;
  if v_dips is null then
    insert into public.exercises (
      name_pt, name_en, muscle_group, equipment, exercise_type, movement_pattern,
      secondary_muscles, instructions, training_objective, risk_level, difficulty_level
    ) values (
      'Paralelas (dips)', 'Parallel Bar Dips', 'peito', 'peso corporal',
      'composto', 'horizontal_push', array['tríceps', 'deltoide anterior'],
      array[
        'Tronco levemente inclinado à frente enfatiza o peitoral; tronco vertical enfatiza o tríceps.',
        'Desça só até onde o ombro ficar confortável — profundidade excessiva estressa a articulação.',
        'Ombros para baixo e para trás; evite encolher.',
        'INTERROMPA se houver desconforto no ombro; prefira a versão assistida ou outro empurrar.',
        'Não adicione carga antes de dominar a versão com peso corporal.'
      ],
      'Empurrar composto com ênfase ajustável entre peitoral e tríceps', 'high', 'intermediate'
    ) returning id into v_dips;
  end if;

  select id into v_dips_assist from public.exercises
   where name_pt = 'Paralelas assistidas (dips na máquina)' limit 1;
  if v_dips_assist is null then
    insert into public.exercises (
      name_pt, name_en, muscle_group, equipment, exercise_type, movement_pattern,
      secondary_muscles, instructions, training_objective, risk_level, difficulty_level
    ) values (
      'Paralelas assistidas (dips na máquina)', 'Assisted Dips', 'peito', 'máquina assistida',
      'composto', 'horizontal_push', array['tríceps', 'deltoide anterior'],
      array[
        'Comece com assistência suficiente para completar a faixa com boa execução.',
        'Progredir aqui significa REDUZIR a assistência, não aumentar o peso da máquina.',
        'Amplitude confortável para o ombro; sem descer além do que controla.',
        'Base segura antes de tentar a versão livre.'
      ],
      'Progressão assistida até as paralelas livres', 'moderate', 'beginner'
    ) returning id into v_dips_assist;
  end if;

  -- ---------------------------------------------------------------------
  -- Disponibilizar como SUBSTITUIÇÕES (opcionais) na ficha ativa
  -- ---------------------------------------------------------------------

  -- Hiperextensão como alternativa do terra romeno / stiff
  for v_target in
    select we.id from public.workout_exercises we
      join public.exercises e on e.id = we.exercise_id
      join public.workouts w on w.id = we.workout_id
     where w.is_archived = false and e.name_pt like 'Terra romeno%'
  loop
    insert into public.workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
    values (v_target, v_hiper, 90)
    on conflict (workout_exercise_id, exercise_id) do nothing;
  end loop;

  -- Dips (livre e assistida) como alternativas dos supinos da ficha ativa
  for v_target in
    select we.id from public.workout_exercises we
      join public.exercises e on e.id = we.exercise_id
      join public.workouts w on w.id = we.workout_id
     where w.is_archived = false
       and e.movement_pattern in ('horizontal_push', 'incline_push')
       and e.exercise_type = 'composto'
  loop
    insert into public.workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
    values (v_target, v_dips_assist, 91)
    on conflict (workout_exercise_id, exercise_id) do nothing;
    insert into public.workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
    values (v_target, v_dips, 92)
    on conflict (workout_exercise_id, exercise_id) do nothing;
  end loop;
end $$;
