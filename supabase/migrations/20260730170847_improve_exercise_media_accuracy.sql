-- Troca associações aproximadas ou incorretas por demonstrações exatas do
-- Free Exercise DB (Unlicense). Os vídeos reais são escolhidos no cliente
-- sem remover estas fotos, que continuam servindo como capa e fallback.
update public.exercises
set gif_url = case slug
  when 'walking-lunge' then '/exercises/Dumbbell_Lunges.jpg'
  when 'glute-ham-raise' then '/exercises/Glute_Ham_Raise.jpg'
  when 'reverse-hyper' then '/exercises/Reverse_Hyperextension.jpg'
  when 'push-press' then '/exercises/Push_Press.jpg'
  when 'weighted-dip' then '/exercises/Parallel_Bar_Dip.jpg'
  when 'pec-deck' then '/exercises/Butterfly.jpg'
  when 'dumbbell-triceps-extension' then '/exercises/Standing_Dumbbell_Triceps_Extension.jpg'
  when 'conventional-deadlift' then '/exercises/Barbell_Deadlift.jpg'
  when 'stiff-leg-deadlift' then '/exercises/Stiff-Legged_Barbell_Deadlift.jpg'
  when 'deficit-stiff-leg-deadlift' then '/exercises/Romanian_Deadlift_from_Deficit.jpg'
  when 'pull-up' then '/exercises/Pullups.jpg'
  when 'barbell-shrug' then '/exercises/Barbell_Shrug.jpg'
  when 'barbell-overhead-press' then '/exercises/Standing_Military_Press.jpg'
  else gif_url
end
where slug in (
  'walking-lunge',
  'glute-ham-raise',
  'reverse-hyper',
  'push-press',
  'weighted-dip',
  'pec-deck',
  'dumbbell-triceps-extension',
  'conventional-deadlift',
  'stiff-leg-deadlift',
  'deficit-stiff-leg-deadlift',
  'pull-up',
  'barbell-shrug',
  'barbell-overhead-press'
);

update public.exercises
set gif_url = case
  when name_pt = 'Hiperextensão (banco 45° ou romano)' then '/exercises/Hyperextensions_Back_Extensions.jpg'
  when name_pt = 'Pallof press' then '/exercises/Pallof_Press.jpg'
  when name_pt = 'Paralelas (dips)' then '/exercises/Parallel_Bar_Dip.jpg'
  when name_pt = 'Paralelas assistidas (dips na máquina)' then '/exercises/Dip_Machine.jpg'
  when name_pt = 'Puxada neutra' then '/exercises/V-Bar_Pulldown.jpg'
  else gif_url
end
where name_pt in (
  'Hiperextensão (banco 45° ou romano)',
  'Pallof press',
  'Paralelas (dips)',
  'Paralelas assistidas (dips na máquina)',
  'Puxada neutra'
);
