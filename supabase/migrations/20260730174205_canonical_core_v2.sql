-- Rotina canônica de core v2
--
-- Mantém o histórico v1 intacto, arquiva logicamente os templates antigos e
-- ativa quatro módulos independentes da musculação principal:
-- terça/sexta em casa e quarta/sábado como finalizadores na academia.
--
-- Rollback de configuração (não toca em sessões nem séries): reativar
-- routine_version = 1 e desativar routine_version = 2 em uma nova migration.

alter table public.daily_core_days
  add column if not exists location text not null default 'casa';

alter table public.daily_core_days
  drop constraint if exists daily_core_days_location_check,
  add constraint daily_core_days_location_check
    check (location in ('casa', 'academia', 'descanso'));

alter table public.daily_core_exercises
  add column if not exists is_active boolean not null default true,
  add column if not exists routine_version integer not null default 1,
  add column if not exists catalog_exercise_id uuid references public.exercises(id) on delete set null;

alter table public.daily_core_sessions
  add column if not exists location text not null default 'casa',
  add column if not exists routine_version integer not null default 1,
  add column if not exists paused_at timestamptz,
  add column if not exists paused_seconds integer not null default 0;

alter table public.daily_core_sessions
  drop constraint if exists daily_core_sessions_location_check,
  add constraint daily_core_sessions_location_check
    check (location in ('casa', 'academia')),
  drop constraint if exists daily_core_sessions_paused_seconds_check,
  add constraint daily_core_sessions_paused_seconds_check
    check (paused_seconds >= 0),
  drop constraint if exists daily_core_sessions_completion_kind_check,
  add constraint daily_core_sessions_completion_kind_check
    check (completion_kind in (
      'treino',
      'recuperacao_completa',
      'descanso',
      'pausa_por_dor',
      'pulado'
    ));

create index if not exists daily_core_exercises_active_day_idx
  on public.daily_core_exercises(is_active, day_of_week, order_index);

create index if not exists daily_core_exercises_catalog_idx
  on public.daily_core_exercises(catalog_exercise_id)
  where catalog_exercise_id is not null;

-- Snapshot idempotente da configuração anterior. Sessões e séries continuam
-- nas tabelas originais e nunca são regravadas por esta migration.
insert into public.routine_backups (user_id, label, payload)
select
  u.id,
  'pre-canonical-core-v2',
  jsonb_build_object(
    'days', (
      select jsonb_agg(to_jsonb(d) order by d.day_of_week)
      from public.daily_core_days d
    ),
    'exercises', (
      select jsonb_agg(to_jsonb(e) order by e.day_of_week, e.order_index)
      from public.daily_core_exercises e
    )
  )
from auth.users u
where not exists (
  select 1
  from public.routine_backups b
  where b.user_id = u.id
    and b.label = 'pre-canonical-core-v2'
);

update public.daily_core_exercises
set is_active = false
where routine_version < 2;

insert into public.daily_core_days (
  day_of_week,
  name,
  objective,
  session_type,
  intensity,
  duration_min,
  duration_max,
  is_rest,
  educational_note,
  location
)
values
  (1, 'Sem sessão de core', 'Recuperar o core para a musculação principal.', 'descanso', 'descanso', 0, 0, true,
   'Não há sessão adicional de abdômen hoje.', 'descanso'),
  (2, 'Core Matinal A', 'Controle abdominal, estabilidade e postura com baixa fadiga.', 'estabilidade', 'leve', 8, 10, false,
   'Sessão em casa, leve e longe da falha. Não é um treino para perder gordura localizada.', 'casa'),
  (3, 'Finalizador abdominal A', 'Hipertrofia do reto abdominal depois do treino principal.', 'hipertrofia', 'moderada', 6, 8, false,
   'Faça apenas no final do treino da academia. Se o limite de 75 minutos estiver esgotado, registre como não realizado.', 'academia'),
  (4, 'Sem sessão de core', 'Recuperar o core para a musculação principal.', 'descanso', 'descanso', 0, 0, true,
   'Não há sessão adicional de abdômen hoje.', 'descanso'),
  (5, 'Core Matinal B', 'Controle abdominal, estabilidade e postura com baixa fadiga.', 'estabilidade', 'leve', 8, 10, false,
   'Sessão em casa, lenta e controlada. Não programe falha muscular.', 'casa'),
  (6, 'Finalizador abdominal B', 'Hipertrofia abdominal com retroversão pélvica depois do treino principal.', 'hipertrofia', 'moderada', 6, 8, false,
   'Faça apenas no final do treino da academia e interrompa em caso de dor lombar ou no quadril.', 'academia'),
  (7, 'Descanso completo', 'Recuperar o abdômen e o restante do corpo.', 'descanso', 'descanso', 0, 0, true,
   'Domingo continua sem treino.', 'descanso')
on conflict (day_of_week) do update set
  name = excluded.name,
  objective = excluded.objective,
  session_type = excluded.session_type,
  intensity = excluded.intensity,
  duration_min = excluded.duration_min,
  duration_max = excluded.duration_max,
  is_rest = excluded.is_rest,
  educational_note = excluded.educational_note,
  location = excluded.location;

insert into public.daily_core_exercises (
  slug,
  day_of_week,
  name,
  objective,
  exercise_type,
  measure_type,
  target_sets,
  target_reps_min,
  target_reps_max,
  target_seconds_min,
  target_seconds_max,
  per_side,
  rir_min,
  rir_max,
  rest_seconds_min,
  rest_seconds_max,
  primary_muscle,
  equipment,
  short_cue,
  instructions,
  common_mistakes,
  image_url,
  image_alt,
  progression_rule,
  order_index,
  is_active,
  routine_version,
  catalog_exercise_id
)
values
  (
    'core-v2-vacuum-a', 2, 'Vacuum abdominal', 'Consciência e controle do transverso.', 'respiracao', 'tempo',
    3, null, null, 15, 25, false, null, null, 30, 40, 'abdômen', null,
    'Expire, recolha suavemente o abdômen e mantenha sem forçar.',
    array['Expire de forma confortável.', 'Recolha suavemente o abdômen.', 'Pare se houver tontura ou desconforto.'],
    array['Prender o ar até sentir tontura.', 'Transformar a contração em esforço máximo.'],
    '/exercises/core/breathing.png', 'Pessoa praticando controle abdominal e respiração',
    'Mantenha 15–25 segundos. Não adicionar carga nem registrar RIR.', 0, true, 2, null
  ),
  (
    'core-v2-dead-bug-a', 2, 'Dead bug', 'Estabilidade lombopélvica com baixa fadiga.', 'estabilidade', 'repeticoes',
    2, 8, 10, null, null, true, 3, 5, 45, 45, 'abdômen', null,
    'Mova devagar e mantenha a pelve estável.',
    array['Comece com braços para cima e quadris e joelhos a 90 graus.', 'Estenda braço e perna opostos lentamente.', 'Pare a série se perder o controle da pelve.'],
    array['Arquear a lombar.', 'Acelerar para completar repetições.'],
    '/exercises/core/dead-bug.png', 'Pessoa executando dead bug com braço e perna opostos',
    'Progrida somente dentro de 8–10 repetições por lado e com RIR 3 ou mais.', 1, true, 2, null
  ),
  (
    'core-v2-side-plank-a', 2, 'Prancha lateral', 'Estabilidade lateral do tronco.', 'estabilidade', 'tempo',
    2, null, null, 20, 30, true, 3, 5, 30, 45, 'abdômen', null,
    'Mantenha cabeça, tronco e quadril alinhados.',
    array['Apoie o cotovelo abaixo do ombro.', 'Mantenha o quadril elevado.', 'Respire normalmente.'],
    array['Deixar o quadril cair.', 'Adicionar peso antes de dominar a postura.'],
    '/exercises/core/side-plank.png', 'Pessoa mantendo prancha lateral alinhada',
    'Aumente o tempo dentro da faixa, sem peso inicialmente e longe da falha.', 2, true, 2, null
  ),
  (
    'core-v2-cable-crunch', 3, 'Abdominal no cabo', 'Hipertrofia abdominal por flexão controlada do tronco.', 'hipertrofia', 'repeticoes',
    3, 10, 15, null, null, false, 1, 2, 60, 75, 'abdômen', 'cabo',
    'Aproxime costelas e pelve usando o abdômen.',
    array['Faça depois de todos os exercícios principais.', 'Flexione o tronco sem puxar apenas com os braços.', 'Mantenha o quadril estável e interrompa se houver dor lombar.'],
    array['Transformar o movimento em puxada de braços.', 'Compensar excessivamente com o quadril.', 'Reduzir amplitude para mover mais carga.'],
    '/exercises/Cable_Crunch.jpg', 'Pessoa executando abdominal no cabo ajoelhada',
    'Somente após 3×15, RIR 1–2, execução boa e sem dor: use o menor aumento disponível.', 0, true, 2,
    (select e.id from public.exercises e where e.name_pt ilike any(array['%cable crunch%', '%abdominal no cabo%']) order by e.created_at limit 1)
  ),
  (
    'core-v2-vacuum-b', 5, 'Vacuum abdominal', 'Consciência e controle do transverso.', 'respiracao', 'tempo',
    3, null, null, 15, 25, false, null, null, 30, 40, 'abdômen', null,
    'Expire, recolha suavemente o abdômen e mantenha sem forçar.',
    array['Expire de forma confortável.', 'Recolha suavemente o abdômen.', 'Pare se houver tontura ou desconforto.'],
    array['Prender o ar até sentir tontura.', 'Forçar uma contração máxima.'],
    '/exercises/core/breathing.png', 'Pessoa praticando controle abdominal e respiração',
    'Mantenha 15–25 segundos. Não adicionar carga nem registrar RIR.', 0, true, 2, null
  ),
  (
    'core-v2-bird-dog-b', 5, 'Bird-dog', 'Estabilidade do tronco e da pelve.', 'estabilidade', 'repeticoes',
    2, 8, 10, null, null, true, 3, 5, 45, 45, 'abdômen', null,
    'Mantenha tronco e pelve imóveis durante a extensão.',
    array['Estenda braço e perna opostos lentamente.', 'Evite elevar excessivamente os membros.', 'Pare se perder a posição do tronco.'],
    array['Girar o quadril.', 'Arquear a lombar.', 'Buscar altura em vez de controle.'],
    '/exercises/core/bird-dog.png', 'Pessoa executando bird-dog com quadril estável',
    'Progrida por controle dentro de 8–10 repetições por lado, mantendo RIR 3 ou mais.', 1, true, 2, null
  ),
  (
    'core-v2-front-plank-b', 5, 'Prancha frontal', 'Estabilidade anterior do tronco.', 'estabilidade', 'tempo',
    2, null, null, 25, 40, false, 3, 5, 45, 45, 'abdômen', null,
    'Ative glúteos e abdômen sem deixar a lombar afundar.',
    array['Apoie os cotovelos abaixo dos ombros.', 'Mantenha o corpo alinhado.', 'Respire sem perder a contração.'],
    array['Deixar a lombar afundar.', 'Elevar demais o quadril.', 'Adicionar carga inicialmente.'],
    '/exercises/core/front-plank.png', 'Pessoa mantendo prancha frontal alinhada',
    'Aumente o tempo dentro da faixa, sem carga e sem chegar à falha.', 2, true, 2, null
  ),
  (
    'core-v2-reverse-crunch', 6, 'Reverse crunch / elevação de pernas', 'Hipertrofia abdominal com retroversão pélvica.', 'hipertrofia', 'repeticoes',
    3, 8, 15, null, null, false, 1, 2, 60, 75, 'abdômen', 'peso corporal ou barra',
    'Enrole a pelve; não apenas balance as pernas.',
    array['Faça depois dos exercícios principais.', 'Priorize a retroversão da pelve.', 'Controle a descida e interrompa se houver dor lombar ou no quadril.'],
    array['Usar balanço e impulso.', 'Mover somente as pernas.', 'Avançar a variação com técnica inconsistente.'],
    '/exercises/core/reverse-crunch.png', 'Pessoa executando reverse crunch com elevação controlada da pelve',
    'Após 3×15 com execução boa, RIR 1–2 e sem dor: reverse crunch → joelhos → pernas estendidas → pequena carga.', 0, true, 2,
    (select e.id from public.exercises e where e.name_pt ilike any(array['%reverse crunch%', '%elevação de joelhos%', '%elevação de pernas%']) order by e.created_at limit 1)
  )
on conflict (slug) do update set
  day_of_week = excluded.day_of_week,
  name = excluded.name,
  objective = excluded.objective,
  exercise_type = excluded.exercise_type,
  measure_type = excluded.measure_type,
  target_sets = excluded.target_sets,
  target_reps_min = excluded.target_reps_min,
  target_reps_max = excluded.target_reps_max,
  target_seconds_min = excluded.target_seconds_min,
  target_seconds_max = excluded.target_seconds_max,
  per_side = excluded.per_side,
  rir_min = excluded.rir_min,
  rir_max = excluded.rir_max,
  rest_seconds_min = excluded.rest_seconds_min,
  rest_seconds_max = excluded.rest_seconds_max,
  equipment = excluded.equipment,
  short_cue = excluded.short_cue,
  instructions = excluded.instructions,
  common_mistakes = excluded.common_mistakes,
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  progression_rule = excluded.progression_rule,
  order_index = excluded.order_index,
  is_active = true,
  routine_version = 2,
  catalog_exercise_id = excluded.catalog_exercise_id;

insert into public.daily_core_variations (
  exercise_id,
  name,
  difficulty,
  equipment_required,
  is_default,
  is_equipment_fallback,
  order_index,
  image_url,
  image_alt,
  short_cue,
  instructions,
  common_mistakes,
  measure_type,
  target_reps_min,
  target_reps_max,
  target_seconds_min,
  target_seconds_max,
  per_side,
  rest_seconds_min,
  rest_seconds_max
)
select
  e.id,
  v.name,
  v.difficulty,
  v.equipment,
  v.is_default,
  false,
  v.order_index,
  v.image_url,
  v.image_alt,
  v.short_cue,
  v.instructions,
  v.mistakes,
  'repeticoes',
  8,
  15,
  null,
  null,
  false,
  60,
  75
from public.daily_core_exercises e
join (
  values
    ('Reverse crunch controlado', 1, null::text, true, 0, '/exercises/core/reverse-crunch.png',
      'Pessoa executando reverse crunch controlado',
      'Enrole a pelve e controle a descida.',
      array['Balançar as pernas.', 'Despencar o quadril na descida.'],
      array['Flexione os joelhos.', 'Enrole a pelve sem impulso.', 'Controle a descida.']),
    ('Elevação de joelhos', 2, 'barra', false, 1, '/exercises/Hanging_Leg_Raise.jpg',
      'Pessoa elevando os joelhos pendurada',
      'Eleve os joelhos iniciando pela retroversão da pelve.',
      array['Usar balanço.', 'Relaxar completamente na descida.'],
      array['Estabilize o corpo.', 'Eleve os joelhos enrolando a pelve.', 'Desça sem balanço.']),
    ('Elevação de pernas mais estendidas', 3, 'barra', false, 2, '/exercises/Hanging_Leg_Raise.jpg',
      'Pessoa elevando as pernas de forma controlada',
      'Mantenha as pernas mais estendidas sem perder a retroversão.',
      array['Buscar altura com impulso.', 'Perder o controle lombopélvico.'],
      array['Inicie sem balanço.', 'Eleve as pernas usando o abdômen.', 'Controle a descida.']),
    ('Elevação de pernas com pequena carga', 4, 'barra e carga leve', false, 3, '/exercises/Hanging_Leg_Raise.jpg',
      'Pessoa executando elevação de pernas com progressão',
      'Use carga somente após dominar as variações anteriores.',
      array['Adicionar carga cedo demais.', 'Reduzir amplitude ou usar impulso.'],
      array['Confirme domínio técnico.', 'Use a menor carga possível.', 'Interrompa ao perder a retroversão.'])
) as v(name, difficulty, equipment, is_default, order_index, image_url, image_alt, short_cue, mistakes, instructions)
  on e.slug = 'core-v2-reverse-crunch'
on conflict (exercise_id, name) do update set
  difficulty = excluded.difficulty,
  equipment_required = excluded.equipment_required,
  is_default = excluded.is_default,
  order_index = excluded.order_index,
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  short_cue = excluded.short_cue,
  instructions = excluded.instructions,
  common_mistakes = excluded.common_mistakes,
  measure_type = excluded.measure_type,
  target_reps_min = excluded.target_reps_min,
  target_reps_max = excluded.target_reps_max,
  target_seconds_min = excluded.target_seconds_min,
  target_seconds_max = excluded.target_seconds_max,
  per_side = excluded.per_side,
  rest_seconds_min = excluded.rest_seconds_min,
  rest_seconds_max = excluded.rest_seconds_max;
