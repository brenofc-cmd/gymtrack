-- 0006 — Rotina definitiva v3. Esta migration nunca apaga histórico.
-- Ela faz snapshot da ficha ativa, arquiva os templates anteriores e cria
-- exatamente uma rotina principal PPL de segunda a sábado por usuário.

create temporary table routine_v3_definition (
  day_of_week int, letter text, workout_name text, objective text,
  order_index int, exercise_name text, muscle_group text, equipment text,
  exercise_type text, movement_pattern text, target_sets int, reps_min int,
  reps_max int, rir_min int, rir_max int, rest_seconds int, per_side boolean
) on commit drop;

insert into routine_v3_definition values
 (1,'A','Push A','Peitoral superior, deltoide lateral, ombros, tríceps e abdômen.',0,'Supino inclinado com halteres','peito','halter','composto',null,3,6,10,2,2,180,false),
 (1,'A','Push A','Peitoral superior, deltoide lateral, ombros, tríceps e abdômen.',1,'Chest press convergente','peito','máquina','composto',null,2,8,12,2,2,120,false),
 (1,'A','Push A','Peitoral superior, deltoide lateral, ombros, tríceps e abdômen.',2,'Desenvolvimento sentado na máquina','ombros','máquina','composto',null,2,8,12,2,2,150,false),
 (1,'A','Push A','Peitoral superior, deltoide lateral, ombros, tríceps e abdômen.',3,'Elevação lateral unilateral no cabo','deltoide lateral','cabo','isolador',null,4,12,20,1,2,75,true),
 (1,'A','Push A','Peitoral superior, deltoide lateral, ombros, tríceps e abdômen.',4,'Tríceps overhead no cabo','tríceps','cabo','isolador',null,2,10,15,1,2,90,false),
 (1,'A','Push A','Peitoral superior, deltoide lateral, ombros, tríceps e abdômen.',5,'Tríceps na corda','tríceps','cabo','isolador',null,2,10,15,1,2,75,false),
 (1,'A','Push A','Peitoral superior, deltoide lateral, ombros, tríceps e abdômen.',6,'Cable crunch','abdômen','cabo','abdominal','flexao_tronco',4,8,15,1,2,90,false),
 (2,'B','Pull A','Largura de costas, parte média das costas, deltoide posterior e bíceps.',0,'Puxada alta pronada média','costas','cabo','composto',null,3,6,10,2,2,150,false),
 (2,'B','Pull A','Largura de costas, parte média das costas, deltoide posterior e bíceps.',1,'Remada com apoio no peito','costas','máquina','composto',null,3,8,12,2,2,120,false),
 (2,'B','Pull A','Largura de costas, parte média das costas, deltoide posterior e bíceps.',2,'Straight-arm pulldown','costas','cabo','isolador',null,2,12,15,1,2,75,false),
 (2,'B','Pull A','Largura de costas, parte média das costas, deltoide posterior e bíceps.',3,'Crucifixo inverso na máquina','deltoide posterior','máquina','isolador',null,3,12,20,1,2,75,false),
 (2,'B','Pull A','Largura de costas, parte média das costas, deltoide posterior e bíceps.',4,'Rosca direta com barra W','bíceps','barra W','isolador',null,2,8,12,1,2,90,false),
 (2,'B','Pull A','Largura de costas, parte média das costas, deltoide posterior e bíceps.',5,'Rosca martelo','bíceps','halter','isolador',null,2,10,15,1,2,75,false),
 (3,'C','Legs A','Quadríceps, posteriores, panturrilhas e abdômen.',0,'Hack squat','quadríceps','máquina','composto',null,3,6,10,2,3,180,false),
 (3,'C','Legs A','Quadríceps, posteriores, panturrilhas e abdômen.',1,'Leg press','quadríceps','máquina','composto',null,3,10,15,2,2,180,false),
 (3,'C','Legs A','Quadríceps, posteriores, panturrilhas e abdômen.',2,'Cadeira extensora','quadríceps','máquina','isolador',null,2,12,15,1,2,90,false),
 (3,'C','Legs A','Quadríceps, posteriores, panturrilhas e abdômen.',3,'Flexora sentada','isquiotibiais','máquina','isolador',null,3,10,15,1,2,120,false),
 (3,'C','Legs A','Quadríceps, posteriores, panturrilhas e abdômen.',4,'Panturrilha em pé','panturrilha','máquina','isolador',null,4,8,15,1,2,90,false),
 (3,'C','Legs A','Quadríceps, posteriores, panturrilhas e abdômen.',5,'Reverse crunch no banco','abdômen','corpo','abdominal','retroversao_pelvica',4,10,20,1,2,90,false),
 (4,'D','Push B','Peitoral completo e superior, deltoide lateral e tríceps.',0,'Supino reto com barra','peito','barra','composto',null,3,6,10,2,2,180,false),
 (4,'D','Push B','Peitoral completo e superior, deltoide lateral e tríceps.',1,'Supino inclinado na máquina','peito','máquina','composto',null,2,8,12,2,2,120,false),
 (4,'D','Push B','Peitoral completo e superior, deltoide lateral e tríceps.',2,'Crossover baixo para cima','peito','cabo','isolador',null,2,12,20,1,2,75,false),
 (4,'D','Push B','Peitoral completo e superior, deltoide lateral e tríceps.',3,'Elevação lateral com halteres','deltoide lateral','halter','isolador',null,4,12,20,1,2,75,false),
 (4,'D','Push B','Peitoral completo e superior, deltoide lateral e tríceps.',4,'Tríceps testa no cabo','tríceps','cabo','isolador',null,2,8,12,1,2,90,false),
 (4,'D','Push B','Peitoral completo e superior, deltoide lateral e tríceps.',5,'Tríceps unilateral no cabo','tríceps','cabo','isolador',null,2,12,20,1,2,75,true),
 (5,'E','Pull B','Dorsal, espessura das costas, deltoide posterior e bíceps.',0,'Barra fixa assistida com pegada neutra','costas','máquina assistida','composto',null,3,6,10,2,2,150,false),
 (5,'E','Pull B','Dorsal, espessura das costas, deltoide posterior e bíceps.',1,'Remada unilateral no cabo','costas','cabo','composto',null,3,8,12,2,2,120,true),
 (5,'E','Pull B','Dorsal, espessura das costas, deltoide posterior e bíceps.',2,'Crucifixo inverso no cabo','deltoide posterior','cabo','isolador',null,3,12,20,1,2,75,false),
 (5,'E','Pull B','Dorsal, espessura das costas, deltoide posterior e bíceps.',3,'Rosca alternada no banco inclinado','bíceps','halter','isolador',null,2,8,12,1,2,90,false),
 (5,'E','Pull B','Dorsal, espessura das costas, deltoide posterior e bíceps.',4,'Rosca direta no cabo','bíceps','cabo','isolador',null,2,12,15,1,2,75,false),
 (6,'F','Legs B','Posteriores, glúteos, quadríceps, panturrilhas, deltoide lateral e abdômen.',0,'Terra romeno / stiff','isquiotibiais','barra','composto',null,3,6,10,2,3,180,false),
 (6,'F','Legs B','Posteriores, glúteos, quadríceps, panturrilhas, deltoide lateral e abdômen.',1,'Agachamento búlgaro','quadríceps','halter','composto',null,3,8,12,2,2,150,true),
 (6,'F','Legs B','Posteriores, glúteos, quadríceps, panturrilhas, deltoide lateral e abdômen.',2,'Flexora deitada','isquiotibiais','máquina','isolador',null,3,10,15,1,2,120,false),
 (6,'F','Legs B','Posteriores, glúteos, quadríceps, panturrilhas, deltoide lateral e abdômen.',3,'Panturrilha sentada','panturrilha','máquina','isolador',null,4,12,20,1,2,90,false),
 (6,'F','Legs B','Posteriores, glúteos, quadríceps, panturrilhas, deltoide lateral e abdômen.',4,'Elevação lateral unilateral no cabo','deltoide lateral','cabo','isolador',null,2,15,25,2,2,75,true),
 (6,'F','Legs B','Posteriores, glúteos, quadríceps, panturrilhas, deltoide lateral e abdômen.',5,'Ab wheel ajoelhado','abdômen','roda abdominal','abdominal','anti_extensao',4,6,12,1,2,90,false);

do $$
declare u record; d record; e record; v_workout uuid; v_exercise uuid;
begin
  for u in select distinct user_id from workouts where is_archived = false and routine_version < 3 loop
    insert into routine_backups(user_id, label, payload)
    select u.user_id, 'pre-rotina-v3', jsonb_build_object('workouts', coalesce(jsonb_agg(to_jsonb(w)), '[]'::jsonb))
      from workouts w where w.user_id = u.user_id and w.is_archived = false
    on conflict do nothing;

    update workouts set is_archived = true where user_id = u.user_id and is_archived = false;

    for d in select distinct day_of_week, letter, workout_name, objective from routine_v3_definition order by day_of_week loop
      insert into workouts(user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version)
      values (u.user_id, d.letter, d.workout_name, d.day_of_week - 1, d.day_of_week, d.objective,
        '5–10 min de movimento leve; antes do primeiro composto faça séries leves de 8–12, 4–6 e 1–3 repetições. Aquecimento não conta no volume.', 3)
      returning id into v_workout;

      for e in select * from routine_v3_definition where day_of_week = d.day_of_week order by order_index loop
        select id into v_exercise from exercises where name_pt = e.exercise_name order by created_at limit 1;
        if v_exercise is null then
          insert into exercises(name_pt, muscle_group, equipment, exercise_type, movement_pattern, instructions)
          values (e.exercise_name, e.muscle_group, e.equipment, e.exercise_type, e.movement_pattern,
            array['Consulte as instruções da rotina; interrompa em caso de dor forte ou progressiva.'])
          returning id into v_exercise;
        end if;
        insert into workout_exercises(workout_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds, rir_min, rir_max, notes)
        values (v_workout, v_exercise, e.order_index, e.target_sets, e.reps_min, e.reps_max, e.rest_seconds, e.rir_min, e.rir_max,
          case when e.per_side then 'Repetições por lado; conclua ambos os lados antes de iniciar o descanso.' else null end);
      end loop;
    end loop;
  end loop;
end $$;

create unique index if not exists uq_active_workout_letter_per_user
  on workouts(user_id, letter) where is_archived = false;

-- Rollback seguro: apenas arquive a v3 e reative a ficha pelo snapshot
-- pre-rotina-v3. Nunca remova workout_sessions nem set_logs.
