-- Abdômen Diário v2 — orientação visual e variações autocontidas.
-- Os arquivos são estáticos e versionados com a aplicação; o banco guarda
-- somente caminhos públicos e metadados de execução.

alter table public.daily_core_exercises
  add column if not exists image_url text not null default '/exercises/core/front-plank.png',
  add column if not exists image_alt text not null default 'Demonstração do exercício abdominal',
  add column if not exists common_mistakes text[] not null default '{}';

alter table public.daily_core_variations
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists short_cue text,
  add column if not exists instructions text[],
  add column if not exists common_mistakes text[],
  add column if not exists measure_type text,
  add column if not exists target_reps_min smallint,
  add column if not exists target_reps_max smallint,
  add column if not exists target_seconds_min smallint,
  add column if not exists target_seconds_max smallint,
  add column if not exists per_side boolean,
  add column if not exists rest_seconds_min smallint,
  add column if not exists rest_seconds_max smallint;

alter table public.daily_core_variations
  drop constraint if exists daily_core_variations_measure_type_check,
  add constraint daily_core_variations_measure_type_check
    check (measure_type is null or measure_type in ('repeticoes', 'tempo', 'respiracoes')),
  drop constraint if exists daily_core_variations_target_reps_check,
  add constraint daily_core_variations_target_reps_check
    check (
      target_reps_min is null
      or (target_reps_min between 1 and 100 and target_reps_max between target_reps_min and 100)
    ),
  drop constraint if exists daily_core_variations_target_seconds_check,
  add constraint daily_core_variations_target_seconds_check
    check (
      target_seconds_min is null
      or (target_seconds_min between 5 and 300 and target_seconds_max between target_seconds_min and 300)
    ),
  drop constraint if exists daily_core_variations_rest_check,
  add constraint daily_core_variations_rest_check
    check (
      rest_seconds_min is null
      or (rest_seconds_min between 0 and 180 and rest_seconds_max between rest_seconds_min and 180)
    );

update public.daily_core_exercises
set
  image_url = case slug
    when 'crunch-carga' then '/exercises/core/crunch.png'
    when 'dead-bug-terca' then '/exercises/core/dead-bug.png'
    when 'prancha-lateral' then '/exercises/core/side-plank.png'
    when 'reverse-crunch' then '/exercises/core/reverse-crunch.png'
    when 'bird-dog' then '/exercises/core/bird-dog.png'
    when 'pallof-press' then '/exercises/core/pallof-press.png'
    when 'ab-wheel' then '/exercises/core/ab-wheel.png'
    when 'prancha-longa' then '/exercises/core/front-plank.png'
    when 'dead-bug-sabado' then '/exercises/core/dead-bug.png'
    when 'prancha-frontal' then '/exercises/core/front-plank.png'
    when 'respiracao-abdominal' then '/exercises/core/breathing.png'
    else image_url
  end,
  image_alt = case slug
    when 'crunch-carga' then 'Pessoa executando crunch controlado com carga sobre o peito'
    when 'dead-bug-terca' then 'Pessoa executando dead bug com braço e perna opostos estendidos'
    when 'prancha-lateral' then 'Pessoa mantendo prancha lateral alinhada sobre o antebraço'
    when 'reverse-crunch' then 'Pessoa executando reverse crunch com elevação controlada da pelve'
    when 'bird-dog' then 'Pessoa executando bird dog com quadril estável'
    when 'pallof-press' then 'Pessoa executando Pallof press em pé com elástico'
    when 'ab-wheel' then 'Pessoa executando ab wheel ajoelhado com lombar neutra'
    when 'prancha-longa' then 'Pessoa mantendo prancha de alavanca longa com abdômen firme'
    when 'dead-bug-sabado' then 'Pessoa executando dead bug de forma lenta e controlada'
    when 'prancha-frontal' then 'Pessoa mantendo prancha frontal alinhada sobre os antebraços'
    when 'respiracao-abdominal' then 'Pessoa deitada praticando respiração diafragmática com as mãos nas costelas e abdômen'
    else image_alt
  end,
  common_mistakes = case slug
    when 'crunch-carga' then array['Puxar o pescoço para ganhar amplitude.', 'Usar impulso em vez de aproximar costelas e pelve.']
    when 'dead-bug-terca' then array['Arquear a lombar ao estender a perna.', 'Mover rápido demais e perder a respiração.']
    when 'prancha-lateral' then array['Deixar o quadril cair.', 'Apoiar o cotovelo longe da linha do ombro.']
    when 'reverse-crunch' then array['Balançar as pernas sem enrolar a pelve.', 'Despencar o quadril na descida.']
    when 'bird-dog' then array['Girar o quadril para ganhar alcance.', 'Arquear a lombar e elevar demais a perna.']
    when 'pallof-press' then array['Deixar o tronco girar em direção ao elástico.', 'Usar resistência que impede manter costelas e quadril alinhados.']
    when 'ab-wheel' then array['Buscar amplitude além do controle lombar.', 'Relaxar glúteos e abdômen na extensão.']
    when 'prancha-longa' then array['Deixar a lombar afundar.', 'Avançar os cotovelos além da amplitude controlável.']
    when 'dead-bug-sabado' then array['Prender a respiração.', 'Aumentar a amplitude quando a lombar começa a arquear.']
    when 'prancha-frontal' then array['Elevar ou deixar cair o quadril.', 'Prender a respiração para sustentar a posição.']
    when 'respiracao-abdominal' then array['Elevar os ombros a cada inspiração.', 'Prender o ar ou forçar uma contração máxima.']
    else common_mistakes
  end;

-- Variações visuais. Campos nulos continuam herdando a prescrição do exercício-base.
update public.daily_core_variations v
set
  image_url = e.image_url,
  image_alt = e.image_alt,
  short_cue = e.short_cue,
  instructions = e.instructions,
  common_mistakes = e.common_mistakes
from public.daily_core_exercises e
where e.id = v.exercise_id;

update public.daily_core_variations v
set image_url = '/exercises/core/crunch.png',
    image_alt = 'Pessoa executando crunch no chão de forma controlada'
from public.daily_core_exercises e
where e.id = v.exercise_id and e.slug = 'crunch-carga';

update public.daily_core_variations v
set image_url = '/exercises/Cable_Crunch.jpg',
    image_alt = 'Pessoa executando cable crunch ajoelhado na polia',
    short_cue = 'Flexione o tronco aproximando costelas e pelve; não apenas abaixe os braços.',
    instructions = array['Ajoelhe-se com a corda próxima à cabeça.', 'Expire e flexione o tronco sem sentar sobre os calcanhares.', 'Retorne lentamente mantendo o quadril estável.'],
    common_mistakes = array['Puxar a corda apenas com os braços.', 'Transformar o movimento em flexão do quadril.']
from public.daily_core_exercises e
where e.id = v.exercise_id and e.slug = 'crunch-carga' and v.name = 'Cable crunch na academia';

update public.daily_core_variations v
set image_url = case
      when v.name like 'Elevação de joelhos%' or v.name like 'Elevação de pernas%' then '/exercises/Hanging_Leg_Raise.jpg'
      else '/exercises/core/reverse-crunch.png'
    end,
    image_alt = case
      when v.name like 'Elevação de joelhos%' then 'Pessoa elevando os joelhos de forma controlada enquanto permanece pendurada'
      when v.name like 'Elevação de pernas%' then 'Pessoa elevando as pernas de forma controlada enquanto permanece pendurada'
      else 'Pessoa executando reverse crunch com elevação controlada da pelve'
    end
from public.daily_core_exercises e
where e.id = v.exercise_id and e.slug = 'reverse-crunch';

update public.daily_core_variations v
set image_url = '/exercises/core/ab-wheel.png',
    image_alt = 'Pessoa executando ab wheel ajoelhado dentro da amplitude controlada'
from public.daily_core_exercises e
where e.id = v.exercise_id and e.slug = 'ab-wheel';

update public.daily_core_variations v
set image_url = '/exercises/core/front-plank.png',
    image_alt = 'Pessoa mantendo prancha de alavanca longa com abdômen firme'
from public.daily_core_exercises e
where e.id = v.exercise_id and e.slug = 'prancha-longa';

-- As alternativas do Pallof são movimentos diferentes e, por isso, recebem
-- prescrição, imagem e técnica próprias.
update public.daily_core_variations v
set image_url = '/exercises/core/pallof-press.png',
    image_alt = 'Pessoa executando Pallof press em pé com elástico',
    short_cue = 'Pressione à frente sem deixar o tronco girar.',
    instructions = array['Fique de lado para o ponto de fixação.', 'Mantenha quadril e costelas alinhados.', 'Estenda e recolha os braços sem girar o tronco.'],
    common_mistakes = array['Rodar o tronco em direção ao elástico.', 'Usar resistência maior do que consegue controlar.'],
    measure_type = 'repeticoes', target_reps_min = 10, target_reps_max = 15,
    target_seconds_min = null, target_seconds_max = null, per_side = true,
    rest_seconds_min = 30, rest_seconds_max = 45
from public.daily_core_exercises e
where e.id = v.exercise_id and e.slug = 'pallof-press' and v.name = 'Pallof press com elástico';

update public.daily_core_variations v
set image_url = '/exercises/core/dead-bug.png',
    image_alt = 'Pessoa executando dead bug com braço e perna opostos estendidos',
    short_cue = 'Mantenha a lombar controlada e alongue braço e perna opostos.',
    instructions = array['Comece com braços para cima e quadris e joelhos a 90 graus.', 'Expire enquanto estende braço e perna opostos.', 'Reduza a amplitude se a lombar começar a arquear.'],
    common_mistakes = array['Arquear a lombar ao estender a perna.', 'Mover rápido e perder o controle da respiração.'],
    measure_type = 'repeticoes', target_reps_min = 8, target_reps_max = 12,
    target_seconds_min = null, target_seconds_max = null, per_side = true,
    rest_seconds_min = 30, rest_seconds_max = 45
from public.daily_core_exercises e
where e.id = v.exercise_id and e.slug = 'pallof-press' and v.name = 'Dead bug sem elástico';

update public.daily_core_variations v
set image_url = '/exercises/core/side-plank.png',
    image_alt = 'Pessoa mantendo prancha lateral alinhada sobre o antebraço',
    short_cue = 'Forme uma linha reta da cabeça aos pés e mantenha o quadril elevado.',
    instructions = array['Apoie o cotovelo abaixo do ombro.', 'Empilhe os pés ou use um à frente do outro.', 'Mantenha cabeça, tronco e quadril alinhados.'],
    common_mistakes = array['Deixar o quadril cair.', 'Apoiar o cotovelo muito longe do ombro.'],
    measure_type = 'tempo', target_reps_min = null, target_reps_max = null,
    target_seconds_min = 20, target_seconds_max = 40, per_side = true,
    rest_seconds_min = 30, rest_seconds_max = 45
from public.daily_core_exercises e
where e.id = v.exercise_id and e.slug = 'pallof-press' and v.name = 'Prancha lateral sem elástico';
