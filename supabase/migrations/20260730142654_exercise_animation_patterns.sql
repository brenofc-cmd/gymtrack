-- Normaliza o catálogo legado para a animação anatômica própria do GymTrack.
-- Nenhuma foto ou vídeo de terceiro é baixado/redistribuído.
update public.exercises
set movement_pattern = case
  when movement_pattern in ('anti_extensao', 'anti-extensao') then 'anti_extension'
  when movement_pattern in ('retroversao_pelvica', 'retroversao-pelvica') then 'pelvic_curl'
  when movement_pattern in ('flexao_tronco', 'flexao-tronco') then 'trunk_flexion'
  when movement_pattern is not null and btrim(movement_pattern) <> '' then movement_pattern

  when lower(name_pt) ~ '(bicicleta|air bike)' then 'trunk_flexion'
  when lower(name_pt) ~ '(afundo|lunge|bulgar|búlgar)' then 'unilateral_leg'
  when lower(name_pt) ~ '(agachamento|squat|leg press|extensora)' then 'squat'
  when lower(name_pt) ~ '(flexora|leg curl|glute.ham)' then 'knee_flexion'
  when lower(name_pt) ~ '(hip thrust|reverse hyper|ponte)' then 'hip_extension'
  when lower(name_pt) ~ '(terra|deadlift|stiff|romeno|hiperextens)' then 'hip_hinge'
  when lower(name_pt) ~ '(crucifixo inverso|reverse fly|face pull)' then 'rear_delt'
  when lower(name_pt) ~ '(elevacao lateral|elevação lateral|lateral raise)' then 'lateral_delt'
  when lower(name_pt) ~ '(desenvolvimento|overhead press|push press|militar)' then 'vertical_push'
  when lower(name_pt) ~ '(barra fixa|pull.up|pulldown|puxada|pullover|straight.arm)' then 'vertical_pull'
  when lower(name_pt) ~ '(remada|row|encolhimento|shrug)' then 'horizontal_pull'
  when lower(name_pt) ~ '(supino inclinado|incline press|low.to.high)' then 'incline_push'
  when lower(name_pt) ~ '(supino|bench press|chest press|paralelas|dips|crucifixo|fly|peck|pec deck|crossover)' then 'horizontal_push'
  when lower(name_pt) ~ '(triceps|tríceps|skull|testa|extensao de cotovelo|extensão de cotovelo)' then 'elbow_extension'
  when lower(name_pt) ~ '(rosca|biceps|bíceps|hammer curl|barbell curl)' then 'elbow_flexion'
  when lower(name_pt) ~ '(panturrilha|calf)' then 'calf_raise'
  when lower(name_pt) ~ '(reverse crunch|elevacao de joelho|elevação de joelho|elevacao de perna|elevação de perna|leg raise|capitao|capitão)' then 'pelvic_curl'
  when lower(name_pt) ~ '(ab wheel|rollout|prancha|plank|body saw|hollow|dead bug|walkout)' then 'anti_extension'
  when lower(name_pt) ~ '(pallof|wood.?chop|obliquo|oblíquo)' then 'anti_rotation'
  when lower(name_pt) ~ '(crunch|abdominal)' then 'trunk_flexion'

  when lower(muscle_group) ~ '(peito|peitoral)' then 'horizontal_push'
  when lower(muscle_group) ~ '(ombro|deltoide)' then 'vertical_push'
  when lower(muscle_group) ~ '(costas|dorsal)' then 'horizontal_pull'
  when lower(muscle_group) ~ '(quadriceps|quadríceps)' then 'squat'
  when lower(muscle_group) ~ '(isquio|isquío|posterior)' then 'hip_hinge'
  when lower(muscle_group) ~ '(abdomen|abdômen|core|obliquo|oblíquo)' then 'anti_extension'
  else 'anti_extension'
end
where movement_pattern is null
   or btrim(movement_pattern) = ''
   or movement_pattern in (
     'anti_extensao', 'anti-extensao',
     'retroversao_pelvica', 'retroversao-pelvica',
     'flexao_tronco', 'flexao-tronco'
   );
