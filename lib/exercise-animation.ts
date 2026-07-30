export type ExerciseMotion =
  | 'squat'
  | 'lunge'
  | 'hip_hinge'
  | 'knee_flexion'
  | 'hip_extension'
  | 'horizontal_push'
  | 'incline_push'
  | 'vertical_push'
  | 'vertical_pull'
  | 'horizontal_pull'
  | 'lateral_raise'
  | 'elbow_flexion'
  | 'elbow_extension'
  | 'calf_raise'
  | 'rear_delt'
  | 'trunk_flexion'
  | 'pelvic_curl'
  | 'anti_extension'
  | 'anti_rotation'
  | 'cardio'
  | 'full_body'

export type MuscleHighlight =
  | 'chest'
  | 'shoulders'
  | 'triceps'
  | 'biceps'
  | 'back'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'traps'
  | 'full_body'

const MOTION_BY_PATTERN: Record<string, ExerciseMotion> = {
  squat: 'squat',
  unilateral_leg: 'lunge',
  hip_hinge: 'hip_hinge',
  knee_flexion: 'knee_flexion',
  hip_extension: 'hip_extension',
  horizontal_push: 'horizontal_push',
  incline_push: 'incline_push',
  vertical_push: 'vertical_push',
  vertical_pull: 'vertical_pull',
  horizontal_pull: 'horizontal_pull',
  lateral_delt: 'lateral_raise',
  elbow_flexion: 'elbow_flexion',
  elbow_extension: 'elbow_extension',
  calf_raise: 'calf_raise',
  rear_delt: 'rear_delt',
  trunk_flexion: 'trunk_flexion',
  flexao_tronco: 'trunk_flexion',
  pelvic_curl: 'pelvic_curl',
  retroversao_pelvica: 'pelvic_curl',
  anti_extension: 'anti_extension',
  anti_extensao: 'anti_extension',
  anti_rotation: 'anti_rotation',
}

function normalized(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function inferExerciseMotion(
  name: string,
  movementPattern?: string | null
): ExerciseMotion {
  const pattern = normalized(movementPattern).replace(/[\s-]+/g, '_')
  if (MOTION_BY_PATTERN[pattern]) return MOTION_BY_PATTERN[pattern]

  const value = normalized(name)
  if (/esteira|bicicleta|air bike|caminhada|corrida/.test(value)) return 'cardio'
  if (/afundo|lunge|bulgar/.test(value)) return 'lunge'
  if (/agachamento|squat|leg press|extensora/.test(value)) return 'squat'
  if (/flexora|leg curl|glute.ham/.test(value)) return 'knee_flexion'
  if (/hip thrust|reverse hyper|ponte/.test(value)) return 'hip_extension'
  if (/terra|deadlift|stiff|romeno|hiperextens/.test(value)) return 'hip_hinge'
  if (/crucifixo inverso|reverse fly|face pull/.test(value)) return 'rear_delt'
  if (/elevacao lateral|lateral raise/.test(value)) return 'lateral_raise'
  if (/desenvolvimento|overhead press|push press|militar/.test(value)) return 'vertical_push'
  if (/barra fixa|pull.up|pulldown|puxada|pullover|straight.arm/.test(value)) return 'vertical_pull'
  if (/remada|row/.test(value)) return 'horizontal_pull'
  if (/encolhimento|shrug/.test(value)) return 'horizontal_pull'
  if (/supino inclinado|incline press|low.to.high/.test(value)) return 'incline_push'
  if (/supino|bench press|chest press|paralelas|dips|crucifixo|fly|peck|pec deck|crossover/.test(value)) {
    return 'horizontal_push'
  }
  if (/triceps|skull|testa|extensao de cotovelo/.test(value)) return 'elbow_extension'
  if (/rosca|biceps|hammer curl|barbell curl/.test(value)) return 'elbow_flexion'
  if (/panturrilha|calf/.test(value)) return 'calf_raise'
  if (/reverse crunch|elevacao de joelho|elevacao de perna|leg raise|capitao/.test(value)) return 'pelvic_curl'
  if (/ab wheel|rollout|prancha|plank|body saw|hollow|dead bug|walkout/.test(value)) return 'anti_extension'
  if (/pallof|wood.?chop|obliquo/.test(value)) return 'anti_rotation'
  if (/crunch|abdominal/.test(value)) return 'trunk_flexion'
  return 'full_body'
}

export function inferMuscleHighlight(muscle: string | null | undefined): MuscleHighlight {
  const value = normalized(muscle)
  if (/peito|peitoral|chest/.test(value)) return 'chest'
  if (/ombro|deltoide|shoulder/.test(value)) return 'shoulders'
  if (/triceps/.test(value)) return 'triceps'
  if (/biceps/.test(value)) return 'biceps'
  if (/costa|lat|dorsal|back/.test(value)) return 'back'
  if (/quadriceps|coxa anterior/.test(value)) return 'quads'
  if (/isquio|posterior|hamstring/.test(value)) return 'hamstrings'
  if (/glute/.test(value)) return 'glutes'
  if (/panturrilha|calf/.test(value)) return 'calves'
  if (/abd|core|obliquo/.test(value)) return 'core'
  if (/trapezio|trap/.test(value)) return 'traps'
  if (/cadeia posterior/.test(value)) return 'hamstrings'
  return 'full_body'
}

export const MOTION_LABEL: Record<ExerciseMotion, string> = {
  squat: 'Agachar',
  lunge: 'Passada unilateral',
  hip_hinge: 'Dobradiça de quadril',
  knee_flexion: 'Flexão de joelho',
  hip_extension: 'Extensão de quadril',
  horizontal_push: 'Empurrar horizontal',
  incline_push: 'Empurrar inclinado',
  vertical_push: 'Empurrar vertical',
  vertical_pull: 'Puxar vertical',
  horizontal_pull: 'Puxar horizontal',
  lateral_raise: 'Elevação lateral',
  elbow_flexion: 'Flexão de cotovelo',
  elbow_extension: 'Extensão de cotovelo',
  calf_raise: 'Elevação da panturrilha',
  rear_delt: 'Abertura posterior',
  trunk_flexion: 'Flexão do tronco',
  pelvic_curl: 'Retroversão pélvica',
  anti_extension: 'Anti-extensão',
  anti_rotation: 'Anti-rotação',
  cardio: 'Caminhada',
  full_body: 'Movimento controlado',
}
