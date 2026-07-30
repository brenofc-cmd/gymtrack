-- Divisão DUP pública associada a David Laid, conforme publicada pela Gymshark.
-- A migration preserva sessões/set_logs e não contém percentuais proprietários.

alter table public.exercises
  add column if not exists slug text,
  add column if not exists load_unit text,
  add column if not exists is_unilateral boolean not null default false,
  add column if not exists technical_warnings text[] not null default '{}',
  add column if not exists default_rest_seconds integer,
  add column if not exists min_increment_kg numeric(6,2);
create unique index if not exists exercises_slug_unique on public.exercises(slug) where slug is not null;

alter table public.exercises drop constraint if exists exercises_movement_pattern_check;
alter table public.exercises add constraint exercises_movement_pattern_check check (
  movement_pattern is null or movement_pattern in (
    'horizontal_push','incline_push','vertical_push','vertical_pull','horizontal_pull',
    'squat','hip_hinge','unilateral_leg','knee_flexion','hip_extension','calf_raise',
    'lateral_delt','rear_delt','elbow_flexion','elbow_extension','trunk_flexion',
    'pelvic_curl','anti_extension','anti_rotation','flexao_tronco',
    'retroversao_pelvica','anti_extensao'
  )
);

alter table public.workout_exercises
  add column if not exists prescription_type text not null default 'fixed_reps',
  add column if not exists fixed_reps integer,
  add column if not exists rep_max_target integer,
  add column if not exists prescription_locked boolean not null default false,
  add column if not exists default_set_role text not null default 'standard';

update public.workout_exercises
set prescription_type = case when target_reps_min = target_reps_max then 'fixed_reps' else 'rep_range' end,
    fixed_reps = case when target_reps_min = target_reps_max then target_reps_min else null end,
    rep_max_target = null
where prescription_locked = false;

alter table public.workout_exercises drop constraint if exists workout_exercises_prescription_check;
alter table public.workout_exercises add constraint workout_exercises_prescription_check check (
  (prescription_type = 'fixed_reps' and fixed_reps = target_reps_min and target_reps_min = target_reps_max and rep_max_target is null)
  or (prescription_type = 'rep_range' and fixed_reps is null and target_reps_min < target_reps_max and rep_max_target is null)
  or (prescription_type = 'rep_max_effort' and fixed_reps is null and target_reps_min = rep_max_target and target_reps_max = rep_max_target and rep_max_target in (1,3,5))
);
alter table public.workout_exercises drop constraint if exists workout_exercises_default_set_role_check;
alter table public.workout_exercises add constraint workout_exercises_default_set_role_check
  check (default_set_role in ('standard','backoff'));

alter table public.workouts drop constraint if exists workouts_session_focus_check;
alter table public.workouts add constraint workouts_session_focus_check check (
  session_focus in ('strength_technique','hypertrophy','recovery','strength_hypertrophy','strength','max_strength_hypertrophy','rest')
);

-- Catálogo completo e estável. Nunca há fallback "geral/barra".
insert into public.exercises (
  slug,name_pt,name_en,muscle_group,secondary_muscles,exercise_type,equipment,
  movement_pattern,load_unit,is_unilateral,instructions,technical_warnings,gif_url,
  risk_level,difficulty_level,default_rest_seconds,min_increment_kg,training_objective
) values
('back-squat','Agachamento livre','Barbell back squat','quadríceps',array['glúteos','isquiotibiais','core'],'composto','barra e rack','squat','barbell_total_kg',false,array['Ajuste o rack, crie brace e desça com controle.'],array['Use travas de segurança adequadamente posicionadas.'],'/exercises/Barbell_Full_Squat.jpg','high','intermediate',180,2.5,'Força e hipertrofia de pernas'),
('romanian-deadlift','Levantamento terra romeno','Romanian deadlift','isquiotibiais',array['glúteos','eretores da coluna'],'composto','barra','hip_hinge','barbell_total_kg',false,array['Leve o quadril para trás mantendo a barra próxima.'],array['Interrompa com dor ou perda da posição lombar.'],'/exercises/Romanian_Deadlift.jpg','high','intermediate',180,2.5,'Cadeia posterior'),
('walking-lunge','Afundo caminhando','Walking lunge','quadríceps',array['glúteos','adutores'],'composto','halteres','unilateral_leg','dumbbell_each_kg',true,array['Registre as repetições por perna e mantenha o joelho alinhado.'],array['Não some novamente as repetições das duas pernas.'],'/exercises/Split_Squat_with_Dumbbells.jpg','moderate','intermediate',120,1,'Hipertrofia unilateral'),
('glute-ham-raise','Glute-ham raise','Glute ham raise','isquiotibiais',array['glúteos'],'isolador','banco GHD','knee_flexion','added_load_kg',false,array['Controle a descida e mantenha o quadril estendido.'],array['Use assistência se perder o controle.'],'/exercises/Lying_Leg_Curls.jpg','moderate','intermediate',90,1,'Flexão de joelho'),
('reverse-hyper','Reverse hyper','Reverse hyperextension','glúteos',array['isquiotibiais','eretores da coluna'],'isolador','máquina reverse hyper','hip_extension','added_load_kg',false,array['Eleve as pernas sem hiperestender a lombar.'],array['Interrompa se houver dor lombar.'],'/exercises/Barbell_Hip_Thrust.jpg','moderate','intermediate',90,2.5,'Extensão de quadril'),
('barbell-bench-press','Supino reto com barra','Barbell bench press','peito',array['tríceps','deltoide anterior'],'composto','barra e banco','horizontal_push','barbell_total_kg',false,array['Mantenha escápulas estáveis e pés firmes.'],array['Use travas e spotter no esforço pesado.'],'/exercises/Barbell_Bench_Press_-_Medium_Grip.jpg','high','intermediate',180,2,'Força de empurrar'),
('push-press','Push press','Push press','ombros',array['tríceps','quadríceps','core'],'composto','barra','vertical_push','barbell_total_kg',false,array['Use a impulsão de pernas e finalize com os braços.'],array['Não hiperestenda a lombar.'],'/exercises/Machine_Shoulder_Military_Press.jpg','high','intermediate',180,2,'Potência acima da cabeça'),
('weighted-dip','Paralelas com carga','Weighted dip','peito',array['tríceps','deltoide anterior'],'composto','paralelas e cinto de carga','vertical_push','added_load_kg',false,array['Registre somente a carga adicional; controle a profundidade.'],array['Evite amplitude dolorosa no ombro.'],'/exercises/Knee_Hip_Raise_On_Parallel_Bars.jpg','high','intermediate',120,1,'Peito e tríceps'),
('dumbbell-fly','Crucifixo com halteres','Dumbbell fly','peito',array['deltoide anterior'],'isolador','halteres e banco','horizontal_push','dumbbell_each_kg',false,array['Mantenha cotovelos levemente flexionados.'],array['Não force amplitude dolorosa.'],'/exercises/Incline_Dumbbell_Flyes.jpg','moderate','intermediate',90,1,'Hipertrofia de peito'),
('pec-deck','Peck deck','Pec deck fly','peito',array['deltoide anterior'],'isolador','máquina peck deck','horizontal_push','added_load_kg',false,array['Mantenha as escápulas apoiadas.'],array['Ajuste o banco para o ombro ficar confortável.'],'/exercises/Reverse_Machine_Flyes.jpg','low','beginner',90,2,'Hipertrofia de peito'),
('dumbbell-lateral-raise','Elevação lateral com halteres','Dumbbell lateral raise','deltoide lateral','{}','isolador','halteres','lateral_delt','dumbbell_each_kg',false,array['Eleve sem balanço e controle a descida.'],array['Não transforme impulso em progressão.'],'/exercises/Side_Lateral_Raise.jpg','low','beginner',90,1,'Deltoide lateral'),
('skull-crusher','Tríceps testa','Skull crusher','tríceps','{}','isolador','barra W e banco','elbow_extension','barbell_total_kg',false,array['Mantenha os cotovelos estáveis.'],array['Reduza a carga se houver desconforto no cotovelo.'],'/exercises/EZ-Bar_Skullcrusher.jpg','moderate','intermediate',90,1,'Hipertrofia de tríceps'),
('dumbbell-triceps-extension','Extensão de tríceps com halter','Dumbbell triceps extension','tríceps','{}','isolador','halter','elbow_extension','added_load_kg',false,array['Controle o alongamento acima da cabeça.'],array['Evite abrir excessivamente os cotovelos.'],'/exercises/Cable_Rope_Overhead_Triceps_Extension.jpg','moderate','beginner',90,1,'Hipertrofia de tríceps'),
('conventional-deadlift','Levantamento terra convencional','Conventional deadlift','cadeia posterior',array['glúteos','isquiotibiais','costas','core'],'composto','barra','hip_hinge','barbell_total_kg',false,array['Crie tensão antes de tirar a barra do chão.'],array['Interrompa com dor ou perda importante da posição lombar.'],'/exercises/Romanian_Deadlift.jpg','high','advanced',180,2.5,'Força de puxar'),
('stiff-leg-deadlift','Stiff-leg deadlift','Stiff-leg deadlift','isquiotibiais',array['glúteos','eretores da coluna'],'composto','barra','hip_hinge','barbell_total_kg',false,array['Mantenha joelhos quase estendidos e quadril para trás.'],array['Use amplitude compatível com mobilidade e coluna neutra.'],'/exercises/Romanian_Deadlift.jpg','high','intermediate',180,2.5,'Cadeia posterior'),
('deficit-stiff-leg-deadlift','Stiff-leg deadlift em déficit','Deficit stiff-leg deadlift','isquiotibiais',array['glúteos','eretores da coluna'],'composto','barra e plataforma de 5–7,5 cm','hip_hinge','barbell_total_kg',false,array['Use déficit de aproximadamente 5–7,5 cm e amplitude controlada.'],array['Retire o déficit se perder a posição lombar.'],'/exercises/Romanian_Deadlift.jpg','high','advanced',180,2.5,'Cadeia posterior em amplitude aumentada'),
('pull-up','Barra fixa','Pull-up','costas',array['bíceps','antebraços'],'composto','barra fixa, cinto ou assistência','vertical_pull','bodyweight_or_assistance_kg',false,array['Registre peso corporal, assistência ou carga adicional.'],array['Repetições parciais ou com balanço não validam progressão.'],'/exercises/Band_Assisted_Pull-Up.jpg','moderate','intermediate',150,1,'Puxada vertical'),
('yates-row','Yates row','Yates row','costas',array['bíceps','deltoide posterior'],'composto','barra','horizontal_pull','barbell_total_kg',false,array['Incline levemente o tronco e puxe em direção ao abdômen.'],array['Evite usar impulso lombar.'],'/exercises/Bent_Over_Barbell_Row.jpg','high','intermediate',150,2,'Puxada horizontal'),
('barbell-shrug','Encolhimento','Barbell shrug','trapézio',array['antebraços'],'isolador','barra','horizontal_pull','barbell_total_kg',false,array['Eleve os ombros verticalmente e pause no topo.'],array['Não gire os ombros.'],'/exercises/Bent_Over_Barbell_Row.jpg','low','beginner',90,2.5,'Trapézio'),
('barbell-curl','Rosca direta com barra','Barbell curl','bíceps',array['braquial','antebraços'],'isolador','barra','elbow_flexion','barbell_total_kg',false,array['Mantenha os cotovelos estáveis.'],array['Não use extensão lombar para completar repetições.'],'/exercises/EZ-Bar_Curl.jpg','moderate','beginner',90,1,'Bíceps'),
('seated-hammer-curl','Rosca martelo sentada','Seated hammer curl','bíceps',array['braquial','antebraços'],'isolador','halteres e banco','elbow_flexion','dumbbell_each_kg',false,array['Mantenha pegada neutra e tronco apoiado.'],array['Evite balanço.'],'/exercises/Hammer_Curls.jpg','low','beginner',90,1,'Bíceps e braquial'),
('barbell-overhead-press','Desenvolvimento militar com barra','Barbell overhead press','ombros',array['tríceps','core'],'composto','barra e rack','vertical_push','barbell_total_kg',false,array['Contraia glúteos e mantenha costelas controladas.'],array['Não hiperestenda a lombar.'],'/exercises/Machine_Shoulder_Military_Press.jpg','high','intermediate',180,2,'Força acima da cabeça'),
('incline-barbell-bench-press','Supino inclinado com barra','Incline barbell bench press','peito',array['tríceps','deltoide anterior'],'composto','barra e banco inclinado','incline_push','barbell_total_kg',false,array['Mantenha escápulas apoiadas e controle a descida.'],array['Use travas e spotter quando necessário.'],'/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip.jpg','high','intermediate',150,2,'Peitoral superior')
on conflict (slug) where slug is not null do update set
  name_pt=excluded.name_pt,name_en=excluded.name_en,muscle_group=excluded.muscle_group,
  secondary_muscles=excluded.secondary_muscles,exercise_type=excluded.exercise_type,
  equipment=excluded.equipment,movement_pattern=excluded.movement_pattern,
  load_unit=excluded.load_unit,is_unilateral=excluded.is_unilateral,
  instructions=excluded.instructions,technical_warnings=excluded.technical_warnings,
  gif_url=excluded.gif_url,risk_level=excluded.risk_level,
  difficulty_level=excluded.difficulty_level,default_rest_seconds=excluded.default_rest_seconds,
  min_increment_kg=excluded.min_increment_kg,training_objective=excluded.training_objective;

create or replace function public.provision_david_laid_public_dup_v5(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day jsonb;
  v_item jsonb;
  v_sub_slug text;
  v_workout_id uuid;
  v_exercise_id uuid;
  v_workout_exercise_id uuid;
  v_substitution_exercise_id uuid;
  v_days integer;
  v_exercises integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select count(*) into v_days from public.workouts
  where user_id=p_user_id and routine_version=5 and is_archived=false and is_daily=false;
  if v_days = 6 then
    return jsonb_build_object('created',false,'routine_version',5,'days',6);
  elsif v_days <> 0 then
    update public.workouts set is_archived=true
    where user_id=p_user_id and routine_version=5 and is_archived=false and is_daily=false;
  end if;

  if exists (select 1 from public.workouts where user_id=p_user_id and is_archived=false and is_daily=false) then
    insert into public.routine_backups(user_id,label,payload)
    select p_user_id,'pre-david-laid-public-dup-v5-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISS'),
      jsonb_agg(jsonb_build_object(
        'workout',to_jsonb(w),
        'exercises',(select coalesce(jsonb_agg(to_jsonb(we) order by we.order_index),'[]'::jsonb) from public.workout_exercises we where we.workout_id=w.id)
      ) order by w.order_index)
    from public.workouts w where w.user_id=p_user_id and w.is_archived=false and w.is_daily=false;

    update public.workouts set is_archived=true
    where user_id=p_user_id and is_archived=false and is_daily=false;
  end if;

  for v_day in select value from jsonb_array_elements($routine$
  [
    {"letter":"A","day":1,"name":"Legs 1","focus":"strength_hypertrophy","objective":"Força no agachamento + hipertrofia de pernas","items":[["back-squat",1,5,5,"rep_max_effort",5,300,"standard"],["back-squat",4,12,12,"fixed_reps",null,180,"backoff"],["romanian-deadlift",3,10,10,"fixed_reps",null,180,"standard"],["walking-lunge",3,10,10,"fixed_reps",null,120,"standard"],["glute-ham-raise",3,10,10,"fixed_reps",null,90,"standard","reverse-hyper"]]},
    {"letter":"B","day":2,"name":"Push 1","focus":"max_strength_hypertrophy","objective":"Força máxima no supino + hipertrofia de peito, ombros e tríceps","items":[["barbell-bench-press",1,1,1,"rep_max_effort",1,300,"standard"],["barbell-bench-press",4,4,4,"fixed_reps",null,180,"backoff"],["push-press",3,4,4,"fixed_reps",null,180,"standard"],["weighted-dip",3,10,10,"fixed_reps",null,120,"standard"],["dumbbell-fly",3,10,10,"fixed_reps",null,90,"standard","pec-deck"],["dumbbell-lateral-raise",3,10,10,"fixed_reps",null,90,"standard"],["skull-crusher",3,10,10,"fixed_reps",null,90,"standard"],["dumbbell-triceps-extension",3,10,10,"fixed_reps",null,90,"standard"]]},
    {"letter":"C","day":3,"name":"Pull 1","focus":"strength_hypertrophy","objective":"Força no levantamento terra + hipertrofia de costas e bíceps","items":[["conventional-deadlift",1,3,3,"rep_max_effort",3,300,"standard"],["conventional-deadlift",4,6,6,"fixed_reps",null,180,"backoff"],["stiff-leg-deadlift",3,10,10,"fixed_reps",null,180,"standard"],["pull-up",3,8,10,"rep_range",null,150,"standard"],["yates-row",3,10,10,"fixed_reps",null,150,"standard"],["barbell-shrug",3,10,10,"fixed_reps",null,90,"standard"],["barbell-curl",3,10,10,"fixed_reps",null,90,"standard"],["seated-hammer-curl",3,10,10,"fixed_reps",null,90,"standard"]]},
    {"letter":"D","day":4,"name":"Legs 2","focus":"strength_hypertrophy","objective":"Força moderada no agachamento + hipertrofia de pernas","items":[["back-squat",1,3,3,"rep_max_effort",3,300,"standard"],["back-squat",4,8,8,"fixed_reps",null,180,"backoff"],["romanian-deadlift",3,10,10,"fixed_reps",null,180,"standard"],["walking-lunge",3,10,10,"fixed_reps",null,120,"standard"],["glute-ham-raise",3,10,10,"fixed_reps",null,90,"standard","reverse-hyper"]]},
    {"letter":"E","day":5,"name":"Push 2","focus":"strength_hypertrophy","objective":"Força no desenvolvimento + hipertrofia de ombros e tríceps","items":[["barbell-overhead-press",1,5,5,"rep_max_effort",5,300,"standard"],["barbell-overhead-press",4,12,12,"fixed_reps",null,180,"backoff"],["incline-barbell-bench-press",3,12,12,"fixed_reps",null,150,"standard"],["dumbbell-lateral-raise",3,10,10,"fixed_reps",null,90,"standard"],["weighted-dip",3,10,10,"fixed_reps",null,120,"standard"],["dumbbell-triceps-extension",3,10,10,"fixed_reps",null,90,"standard"],["skull-crusher",3,10,10,"fixed_reps",null,90,"standard"]]},
    {"letter":"F","day":6,"name":"Pull 2","focus":"max_strength_hypertrophy","objective":"Força máxima no levantamento terra + hipertrofia de costas e bíceps","items":[["conventional-deadlift",1,1,1,"rep_max_effort",1,300,"standard"],["conventional-deadlift",4,2,2,"fixed_reps",null,180,"backoff"],["deficit-stiff-leg-deadlift",3,10,10,"fixed_reps",null,180,"standard"],["pull-up",3,8,10,"rep_range",null,150,"standard"],["yates-row",3,10,10,"fixed_reps",null,150,"standard"],["barbell-shrug",3,10,10,"fixed_reps",null,90,"standard"],["barbell-curl",3,10,10,"fixed_reps",null,90,"standard"],["seated-hammer-curl",3,10,10,"fixed_reps",null,90,"standard"]]}
  ]$routine$::jsonb) loop
    insert into public.workouts(user_id,letter,name,order_index,day_of_week,objective,warmup_note,routine_version,session_focus,is_archived,is_daily)
    values(p_user_id,v_day->>'letter',v_day->>'name',(v_day->>'day')::integer-1,(v_day->>'day')::integer,v_day->>'objective',
      'Aquecimento progressivo do GymTrack; não conta como série principal.',5,v_day->>'focus',false,false)
    returning id into v_workout_id;

    for v_item in select value from jsonb_array_elements(v_day->'items') loop
      select id into v_exercise_id from public.exercises where slug=v_item->>0;
      if v_exercise_id is null then
        raise exception 'required exercise missing: %',v_item->>0;
      end if;

      insert into public.workout_exercises(
        workout_id,exercise_id,order_index,target_sets,target_reps_min,target_reps_max,
        rest_seconds,rir_min,rir_max,progression_type,failure_allowed,failure_risk_level,
        technique_notes,prescription_type,fixed_reps,rep_max_target,prescription_locked,default_set_role
      ) values(
        v_workout_id,v_exercise_id,
        (select count(*) from public.workout_exercises where workout_id=v_workout_id),
        (v_item->>1)::integer,(v_item->>2)::integer,(v_item->>3)::integer,(v_item->>6)::integer,
        case when v_item->>4='rep_max_effort' then 0 else 1 end,
        case when v_item->>4='rep_max_effort' then 1 else 2 end,
        case when v_item->>4='rep_range' then 'bodyweight_control' when v_item->>4='rep_max_effort' then 'range_control' else 'double_progression' end,
        false,(select risk_level from public.exercises where id=v_exercise_id),
        (select instructions from public.exercises where id=v_exercise_id),
        v_item->>4,
        case when v_item->>4='fixed_reps' then (v_item->>2)::integer end,
        case when v_item->>5 <> 'null' then (v_item->>5)::integer end,
        true,v_item->>7
      ) returning id into v_workout_exercise_id;

      v_sub_slug := v_item->>8;
      if v_sub_slug is not null then
        select id into v_substitution_exercise_id from public.exercises where slug=v_sub_slug;
        if v_substitution_exercise_id is null then raise exception 'required substitution missing: %',v_sub_slug; end if;
        insert into public.workout_exercise_substitutions(workout_exercise_id,exercise_id,order_index)
        values(v_workout_exercise_id,v_substitution_exercise_id,0)
        on conflict(workout_exercise_id,exercise_id) do nothing;
      end if;
    end loop;
  end loop;

  select count(*),coalesce(sum(x.exercise_count),0) into v_days,v_exercises
  from public.workouts w
  cross join lateral (select count(*)::integer exercise_count from public.workout_exercises we where we.workout_id=w.id) x
  where w.user_id=p_user_id and w.routine_version=5 and w.is_archived=false and w.is_daily=false;
  if v_days <> 6 or v_exercises <> 41 then
    raise exception 'routine validation failed: % days, % exercises',v_days,v_exercises;
  end if;
  return jsonb_build_object('created',true,'routine_version',5,'days',v_days,'exercises',v_exercises);
end $$;

revoke all on function public.provision_david_laid_public_dup_v5(uuid) from public,anon;
grant execute on function public.provision_david_laid_public_dup_v5(uuid) to authenticated;

-- Corrige duplicações legadas antes do índice. Arquivar não quebra históricos.
with ranked as (
  select id,row_number() over(partition by user_id,routine_version,letter order by created_at desc,id desc) n
  from public.workouts where routine_version=5 and is_archived=false and is_daily=false
)
update public.workouts w set is_archived=true from ranked r where w.id=r.id and r.n>1;
create unique index if not exists workouts_one_active_version_letter_idx
  on public.workouts(user_id,routine_version,letter)
  where is_archived=false and is_daily=false;

-- Migração de usuários existentes; contas sem ficha serão provisionadas no onboarding/dashboard.
do $$
declare v_user_id uuid;
begin
  for v_user_id in select distinct user_id from public.workouts where is_archived=false and is_daily=false and routine_version<5 loop
    perform set_config('request.jwt.claim.sub',v_user_id::text,true);
    perform public.provision_david_laid_public_dup_v5(v_user_id);
  end loop;
end $$;

-- Rollback seguro: arquivar a v5 e reativar manualmente os IDs do último
-- routine_backups. Nunca remover workout_sessions ou set_logs.
