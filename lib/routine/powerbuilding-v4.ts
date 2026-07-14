export type WorkoutLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type TrainingFocus = 'strength_technique' | 'hypertrophy' | 'recovery'
export type ExerciseKind = 'composto' | 'isolador' | 'abdominal'
export type MovementPattern =
  | 'horizontal_push' | 'incline_push' | 'vertical_push'
  | 'vertical_pull' | 'horizontal_pull' | 'squat' | 'hip_hinge'
  | 'unilateral_leg' | 'knee_flexion' | 'calf_raise'
  | 'lateral_delt' | 'rear_delt' | 'elbow_flexion' | 'elbow_extension'
  | 'trunk_flexion' | 'pelvic_curl' | 'anti_extension' | 'anti_rotation'
export type ProgressionType =
  | 'double_progression' | 'top_set_backoff' | 'bodyweight_control' | 'range_control'
export type FailureRiskLevel = 'low' | 'moderate' | 'high'

export interface RoutineExerciseDef {
  name: string
  kind: ExerciseKind
  primaryMuscle: string
  secondaryMuscles: string[]
  movementPattern: MovementPattern
  equipment: string
  sets: number
  repsMin: number
  repsMax: number
  rirMin: number
  rirMax: number
  restSeconds: number
  progressionType: ProgressionType
  failureAllowed: boolean
  riskLevel: FailureRiskLevel
  aestheticFunction: string
  topSetEnabled?: boolean
  backoffPercentage?: number
  guidance: string[]
  substitutions: string[]
  perSide?: boolean
}

export interface RoutineDayDef {
  letter: WorkoutLetter
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  focus: TrainingFocus
  objective: string
  warmupNote: string
  exercises: RoutineExerciseDef[]
}

export const ROUTINE_VERSION = 4

const WARMUP =
  '5–10 min de movimento leve. No primeiro composto, faça séries progressivas sem fadiga. Nos dias de pernas, inclua preparação breve de core e bracing.'

const safeIsolation = (overrides: Omit<RoutineExerciseDef, 'failureAllowed' | 'riskLevel'>): RoutineExerciseDef => ({
  ...overrides,
  failureAllowed: true,
  riskLevel: 'low',
})

export const POWERBUILDING_V4: RoutineDayDef[] = [
  {
    letter: 'A', dayOfWeek: 1, name: 'Push A', focus: 'strength_technique',
    objective: 'Força técnica no peitoral superior, ombros e tríceps; sem teste máximo.', warmupNote: WARMUP,
    exercises: [
      {
        name: 'Supino inclinado com halteres', kind: 'composto', primaryMuscle: 'peito',
        secondaryMuscles: ['deltoide anterior', 'tríceps'], movementPattern: 'incline_push', equipment: 'halter',
        sets: 3, repsMin: 6, repsMax: 10, rirMin: 2, rirMax: 2, restSeconds: 180,
        progressionType: 'top_set_backoff', failureAllowed: false, riskLevel: 'high', topSetEnabled: true,
        backoffPercentage: 7.5, aestheticFunction: 'Peitoral superior e força de empurrar',
        guidance: ['Top set submáximo de 6–8; back-offs de 8–10 com 5–10% menos carga.', 'Escápulas estáveis, pés firmes e amplitude confortável.'],
        substitutions: ['Supino inclinado na máquina', 'Supino inclinado (barra)'],
      },
      {
        name: 'Chest press convergente', kind: 'composto', primaryMuscle: 'peito', secondaryMuscles: ['tríceps'],
        movementPattern: 'horizontal_push', equipment: 'máquina', sets: 2, repsMin: 8, repsMax: 12,
        rirMin: 2, rirMax: 2, restSeconds: 120, progressionType: 'double_progression', failureAllowed: false,
        riskLevel: 'moderate', aestheticFunction: 'Volume de peitoral', guidance: ['Controle a volta e mantenha as escápulas apoiadas.'],
        substitutions: ['Supino reto com halteres (chest press)', 'Supino em máquina'],
      },
      {
        name: 'Desenvolvimento sentado na máquina', kind: 'composto', primaryMuscle: 'ombros', secondaryMuscles: ['tríceps'],
        movementPattern: 'vertical_push', equipment: 'máquina', sets: 2, repsMin: 6, repsMax: 10,
        rirMin: 2, rirMax: 3, restSeconds: 150, progressionType: 'double_progression', failureAllowed: false,
        riskLevel: 'moderate', aestheticFunction: 'Força e massa dos ombros', guidance: ['Tronco apoiado; evite hiperextensão lombar.'], substitutions: [],
      },
      safeIsolation({
        name: 'Elevação lateral unilateral no cabo', kind: 'isolador', primaryMuscle: 'deltoide lateral', secondaryMuscles: [],
        movementPattern: 'lateral_delt', equipment: 'cabo', sets: 4, repsMin: 12, repsMax: 20,
        rirMin: 1, rirMax: 2, restSeconds: 75, progressionType: 'double_progression', aestheticFunction: 'Largura dos ombros',
        guidance: ['Tensão contínua, sem balanço ou encolhimento.'], substitutions: [], perSide: true,
      }),
      safeIsolation({
        name: 'Tríceps na corda', kind: 'isolador', primaryMuscle: 'tríceps', secondaryMuscles: [], movementPattern: 'elbow_extension',
        equipment: 'cabo', sets: 3, repsMin: 10, repsMax: 15, rirMin: 1, rirMax: 2, restSeconds: 75,
        progressionType: 'double_progression', aestheticFunction: 'Massa de tríceps', guidance: ['Cotovelos estáveis; abra a corda no final.'], substitutions: [],
      }),
      safeIsolation({
        name: 'Tríceps overhead no cabo', kind: 'isolador', primaryMuscle: 'tríceps', secondaryMuscles: [], movementPattern: 'elbow_extension',
        equipment: 'cabo', sets: 2, repsMin: 10, repsMax: 15, rirMin: 1, rirMax: 2, restSeconds: 90,
        progressionType: 'double_progression', aestheticFunction: 'Cabeça longa do tríceps', guidance: ['Cotovelos estáveis e alongamento controlado.'], substitutions: [],
      }),
      safeIsolation({
        name: 'Cable crunch', kind: 'abdominal', primaryMuscle: 'abdômen', secondaryMuscles: [], movementPattern: 'trunk_flexion',
        equipment: 'cabo', sets: 3, repsMin: 8, repsMax: 15, rirMin: 1, rirMax: 2, restSeconds: 90,
        progressionType: 'double_progression', aestheticFunction: 'Flexão carregada do core', guidance: ['Aproxime costelas e pelve; não puxe apenas com os braços.'],
        substitutions: ['Abdominal na máquina (com carga)', 'Crunch com anilha (resistência)'],
      }),
    ],
  },
  {
    letter: 'B', dayOfWeek: 2, name: 'Pull A', focus: 'strength_technique',
    objective: 'Força técnica de puxar, largura de costas, deltoide posterior e bíceps.', warmupNote: WARMUP,
    exercises: [
      {
        name: 'Puxada alta pronada média', kind: 'composto', primaryMuscle: 'costas', secondaryMuscles: ['bíceps'],
        movementPattern: 'vertical_pull', equipment: 'cabo', sets: 3, repsMin: 6, repsMax: 10, rirMin: 2, rirMax: 3,
        restSeconds: 150, progressionType: 'double_progression', failureAllowed: false, riskLevel: 'moderate',
        aestheticFunction: 'Largura das dorsais', guidance: ['Cotovelos para baixo; evite jogar o tronco para trás.'],
        substitutions: ['Pulldown pegada neutra', 'Barra fixa assistida (ou puxada neutra)'],
      },
      {
        name: 'Remada com apoio no peito', kind: 'composto', primaryMuscle: 'costas', secondaryMuscles: ['bíceps', 'deltoide posterior'],
        movementPattern: 'horizontal_pull', equipment: 'máquina', sets: 3, repsMin: 6, repsMax: 10, rirMin: 2, rirMax: 3,
        restSeconds: 150, progressionType: 'double_progression', failureAllowed: false, riskLevel: 'moderate',
        aestheticFunction: 'Espessura das costas', guidance: ['Peito apoiado e sem impulso.'], substitutions: ['Remada em máquina com apoio', 'Remada T (ou máquina com apoio)'],
      },
      safeIsolation({name: 'Straight-arm pulldown', kind: 'isolador', primaryMuscle: 'costas', secondaryMuscles: [], movementPattern: 'vertical_pull', equipment: 'cabo', sets: 2, repsMin: 12, repsMax: 15, rirMin: 1, rirMax: 2, restSeconds: 75, progressionType: 'double_progression', aestheticFunction: 'Dorsais em posição alongada', guidance: ['Braços quase estendidos e tronco estável.'], substitutions: []}),
      safeIsolation({name: 'Crucifixo inverso na máquina', kind: 'isolador', primaryMuscle: 'deltoide posterior', secondaryMuscles: [], movementPattern: 'rear_delt', equipment: 'máquina', sets: 3, repsMin: 12, repsMax: 20, rirMin: 1, rirMax: 2, restSeconds: 75, progressionType: 'double_progression', aestheticFunction: 'Ombro posterior', guidance: ['Abra com controle, sem impulso.'], substitutions: []}),
      safeIsolation({name: 'Rosca direta com barra W', kind: 'isolador', primaryMuscle: 'bíceps', secondaryMuscles: [], movementPattern: 'elbow_flexion', equipment: 'barra W', sets: 3, repsMin: 8, repsMax: 12, rirMin: 1, rirMax: 2, restSeconds: 90, progressionType: 'double_progression', aestheticFunction: 'Massa de bíceps', guidance: ['Cotovelos estáveis.'], substitutions: []}),
      safeIsolation({name: 'Rosca martelo', kind: 'isolador', primaryMuscle: 'bíceps', secondaryMuscles: ['braquial'], movementPattern: 'elbow_flexion', equipment: 'halter', sets: 2, repsMin: 10, repsMax: 15, rirMin: 1, rirMax: 2, restSeconds: 75, progressionType: 'double_progression', aestheticFunction: 'Braquial e antebraço', guidance: ['Punhos neutros e sem balanço.'], substitutions: []}),
    ],
  },
  {
    letter: 'C', dayOfWeek: 3, name: 'Legs A', focus: 'strength_technique',
    objective: 'Força técnica de agachamento, cadeia posterior, panturrilhas e core.', warmupNote: WARMUP,
    exercises: [
      {
        name: 'Hack squat', kind: 'composto', primaryMuscle: 'quadríceps', secondaryMuscles: ['glúteos'], movementPattern: 'squat', equipment: 'máquina',
        sets: 3, repsMin: 5, repsMax: 10, rirMin: 2, rirMax: 3, restSeconds: 180, progressionType: 'top_set_backoff',
        failureAllowed: false, riskLevel: 'high', topSetEnabled: true, backoffPercentage: 7.5, aestheticFunction: 'Força técnica e quadríceps',
        guidance: ['Top set de 5–8 e dois back-offs de 8–10, sempre submáximos.', 'Brace antes de descer; amplitude segura e consistente.'],
        substitutions: ['Agachamento livre', 'Agachamento no Smith'],
      },
      {
        name: 'Leg press', kind: 'composto', primaryMuscle: 'quadríceps', secondaryMuscles: ['glúteos'], movementPattern: 'squat', equipment: 'máquina',
        sets: 3, repsMin: 10, repsMax: 15, rirMin: 2, rirMax: 2, restSeconds: 180, progressionType: 'double_progression', failureAllowed: false,
        riskLevel: 'moderate', aestheticFunction: 'Volume de quadríceps', guidance: ['Lombar apoiada e profundidade controlada.'], substitutions: [],
      },
      {
        name: 'Terra romeno / stiff', kind: 'composto', primaryMuscle: 'isquiotibiais', secondaryMuscles: ['glúteos'], movementPattern: 'hip_hinge', equipment: 'barra',
        sets: 3, repsMin: 6, repsMax: 10, rirMin: 2, rirMax: 3, restSeconds: 180, progressionType: 'double_progression', failureAllowed: false,
        riskLevel: 'high', aestheticFunction: 'Cadeia posterior', guidance: ['Quadril para trás, coluna neutra e barra próxima ao corpo.'], substitutions: [],
      },
      safeIsolation({name: 'Flexora sentada', kind: 'isolador', primaryMuscle: 'isquiotibiais', secondaryMuscles: [], movementPattern: 'knee_flexion', equipment: 'máquina', sets: 3, repsMin: 10, repsMax: 15, rirMin: 1, rirMax: 2, restSeconds: 120, progressionType: 'double_progression', aestheticFunction: 'Flexores do joelho', guidance: ['Controle a volta.'], substitutions: ['Mesa flexora', 'Flexora unilateral']}),
      safeIsolation({name: 'Panturrilha em pé', kind: 'isolador', primaryMuscle: 'panturrilha', secondaryMuscles: [], movementPattern: 'calf_raise', equipment: 'máquina', sets: 3, repsMin: 10, repsMax: 15, rirMin: 1, rirMax: 2, restSeconds: 90, progressionType: 'double_progression', aestheticFunction: 'Panturrilha', guidance: ['Pausa no alongamento e no topo.'], substitutions: []}),
      safeIsolation({name: 'Reverse crunch no banco', kind: 'abdominal', primaryMuscle: 'abdômen', secondaryMuscles: [], movementPattern: 'pelvic_curl', equipment: 'corpo', sets: 3, repsMin: 8, repsMax: 15, rirMin: 1, rirMax: 2, restSeconds: 90, progressionType: 'bodyweight_control', aestheticFunction: 'Flexão inferior e controle pélvico', guidance: ['Enrole a pelve; evite balanço.'], substitutions: ['Capitão (elevação de joelhos)', 'Elevação de joelhos pendurado']}),
    ],
  },
  {
    letter: 'D', dayOfWeek: 4, name: 'Push B', focus: 'hypertrophy',
    objective: 'Hipertrofia de peitoral, ombros e tríceps com volume controlado.', warmupNote: WARMUP,
    exercises: [
      {name: 'Supino reto com barra', kind: 'composto', primaryMuscle: 'peito', secondaryMuscles: ['tríceps'], movementPattern: 'horizontal_push', equipment: 'barra', sets: 3, repsMin: 8, repsMax: 12, rirMin: 2, rirMax: 2, restSeconds: 150, progressionType: 'double_progression', failureAllowed: false, riskLevel: 'high', aestheticFunction: 'Massa de peitoral', guidance: ['Sem falha; use travas ou spotter quando disponível.'], substitutions: ['Supino em máquina']},
      {name: 'Supino inclinado na máquina', kind: 'composto', primaryMuscle: 'peito', secondaryMuscles: ['tríceps'], movementPattern: 'incline_push', equipment: 'máquina', sets: 3, repsMin: 8, repsMax: 12, rirMin: 2, rirMax: 2, restSeconds: 120, progressionType: 'double_progression', failureAllowed: false, riskLevel: 'moderate', aestheticFunction: 'Peitoral superior', guidance: ['Controle a descida.'], substitutions: ['Supino inclinado com halteres']},
      safeIsolation({name: 'Crossover baixo para cima', kind: 'isolador', primaryMuscle: 'peito', secondaryMuscles: [], movementPattern: 'incline_push', equipment: 'cabo', sets: 2, repsMin: 12, repsMax: 20, rirMin: 1, rirMax: 2, restSeconds: 75, progressionType: 'double_progression', aestheticFunction: 'Peitoral superior', guidance: ['Cruze para cima sem perder controle.'], substitutions: []}),
      safeIsolation({name: 'Elevação lateral com halteres', kind: 'isolador', primaryMuscle: 'deltoide lateral', secondaryMuscles: [], movementPattern: 'lateral_delt', equipment: 'halter', sets: 4, repsMin: 12, repsMax: 20, rirMin: 1, rirMax: 2, restSeconds: 75, progressionType: 'double_progression', aestheticFunction: 'Largura dos ombros', guidance: ['Sem balanço.'], substitutions: ['Elevação lateral unilateral no cabo']}),
      safeIsolation({name: 'Tríceps testa no cabo', kind: 'isolador', primaryMuscle: 'tríceps', secondaryMuscles: [], movementPattern: 'elbow_extension', equipment: 'cabo', sets: 3, repsMin: 8, repsMax: 12, rirMin: 1, rirMax: 2, restSeconds: 90, progressionType: 'double_progression', aestheticFunction: 'Massa de tríceps', guidance: ['Cotovelos apontados para a frente.'], substitutions: []}),
      safeIsolation({name: 'Tríceps unilateral no cabo', kind: 'isolador', primaryMuscle: 'tríceps', secondaryMuscles: [], movementPattern: 'elbow_extension', equipment: 'cabo', sets: 2, repsMin: 12, repsMax: 20, rirMin: 1, rirMax: 2, restSeconds: 75, progressionType: 'double_progression', aestheticFunction: 'Simetria de tríceps', guidance: ['Controle por lado.'], substitutions: [], perSide: true}),
    ],
  },
  {
    letter: 'E', dayOfWeek: 5, name: 'Pull B', focus: 'hypertrophy',
    objective: 'Hipertrofia de dorsais, espessura de costas, ombro posterior e bíceps.', warmupNote: WARMUP,
    exercises: [
      {name: 'Barra fixa assistida com pegada neutra', kind: 'composto', primaryMuscle: 'costas', secondaryMuscles: ['bíceps'], movementPattern: 'vertical_pull', equipment: 'máquina assistida', sets: 3, repsMin: 8, repsMax: 12, rirMin: 2, rirMax: 2, restSeconds: 150, progressionType: 'bodyweight_control', failureAllowed: false, riskLevel: 'moderate', aestheticFunction: 'Largura das dorsais', guidance: ['Amplitude controlada e sem balanço.'], substitutions: ['Puxada neutra']},
      {name: 'Remada unilateral no cabo', kind: 'composto', primaryMuscle: 'costas', secondaryMuscles: ['bíceps'], movementPattern: 'horizontal_pull', equipment: 'cabo', sets: 2, repsMin: 8, repsMax: 12, rirMin: 2, rirMax: 2, restSeconds: 120, progressionType: 'double_progression', failureAllowed: false, riskLevel: 'moderate', aestheticFunction: 'Dorsal por lado', guidance: ['Puxe o cotovelo em direção ao quadril.'], substitutions: [], perSide: true},
      {name: 'Remada T (ou máquina com apoio)', kind: 'composto', primaryMuscle: 'costas', secondaryMuscles: ['bíceps', 'deltoide posterior'], movementPattern: 'horizontal_pull', equipment: 'máquina', sets: 2, repsMin: 8, repsMax: 12, rirMin: 2, rirMax: 2, restSeconds: 120, progressionType: 'double_progression', failureAllowed: false, riskLevel: 'moderate', aestheticFunction: 'Espessura das costas', guidance: ['Peito apoiado e sem impulso.'], substitutions: ['Remada com apoio no peito']},
      safeIsolation({name: 'Crucifixo inverso no cabo', kind: 'isolador', primaryMuscle: 'deltoide posterior', secondaryMuscles: [], movementPattern: 'rear_delt', equipment: 'cabo', sets: 3, repsMin: 12, repsMax: 20, rirMin: 1, rirMax: 2, restSeconds: 75, progressionType: 'double_progression', aestheticFunction: 'Ombro posterior', guidance: ['Controle o retorno.'], substitutions: []}),
      safeIsolation({name: 'Rosca alternada no banco inclinado', kind: 'isolador', primaryMuscle: 'bíceps', secondaryMuscles: [], movementPattern: 'elbow_flexion', equipment: 'halter', sets: 3, repsMin: 8, repsMax: 12, rirMin: 1, rirMax: 2, restSeconds: 90, progressionType: 'double_progression', aestheticFunction: 'Bíceps em posição alongada', guidance: ['Ombros para trás e sem balanço.'], substitutions: []}),
      safeIsolation({name: 'Rosca direta no cabo', kind: 'isolador', primaryMuscle: 'bíceps', secondaryMuscles: [], movementPattern: 'elbow_flexion', equipment: 'cabo', sets: 2, repsMin: 12, repsMax: 15, rirMin: 1, rirMax: 2, restSeconds: 75, progressionType: 'double_progression', aestheticFunction: 'Tensão contínua no bíceps', guidance: ['Cotovelos estáveis.'], substitutions: []}),
    ],
  },
  {
    letter: 'F', dayOfWeek: 6, name: 'Legs B', focus: 'hypertrophy',
    objective: 'Hipertrofia de pernas, glúteos, estabilidade e core anti-extensão/anti-rotação.', warmupNote: WARMUP,
    exercises: [
      {name: 'Agachamento búlgaro', kind: 'composto', primaryMuscle: 'quadríceps', secondaryMuscles: ['glúteos'], movementPattern: 'unilateral_leg', equipment: 'halter', sets: 3, repsMin: 8, repsMax: 12, rirMin: 2, rirMax: 2, restSeconds: 150, progressionType: 'double_progression', failureAllowed: false, riskLevel: 'moderate', aestheticFunction: 'Quadríceps e estabilidade unilateral', guidance: ['Repetições por perna; mantenha o pé dianteiro estável.'], substitutions: [], perSide: true},
      {name: 'Hip thrust', kind: 'composto', primaryMuscle: 'glúteos', secondaryMuscles: ['isquiotibiais'], movementPattern: 'hip_hinge', equipment: 'barra', sets: 3, repsMin: 8, repsMax: 12, rirMin: 2, rirMax: 2, restSeconds: 150, progressionType: 'double_progression', failureAllowed: false, riskLevel: 'moderate', aestheticFunction: 'Glúteos e extensão de quadril', guidance: ['Queixo recolhido; termine com glúteos, sem hiperestender a lombar.'], substitutions: []},
      safeIsolation({name: 'Cadeira extensora', kind: 'isolador', primaryMuscle: 'quadríceps', secondaryMuscles: [], movementPattern: 'squat', equipment: 'máquina', sets: 3, repsMin: 12, repsMax: 15, rirMin: 1, rirMax: 2, restSeconds: 90, progressionType: 'double_progression', aestheticFunction: 'Quadríceps', guidance: ['Subida controlada, sem tirar o quadril do banco.'], substitutions: []}),
      safeIsolation({name: 'Flexora deitada', kind: 'isolador', primaryMuscle: 'isquiotibiais', secondaryMuscles: [], movementPattern: 'knee_flexion', equipment: 'máquina', sets: 3, repsMin: 10, repsMax: 15, rirMin: 1, rirMax: 2, restSeconds: 120, progressionType: 'double_progression', aestheticFunction: 'Posteriores de coxa', guidance: ['Não levante o quadril.'], substitutions: ['Flexora sentada']}),
      safeIsolation({name: 'Panturrilha sentada', kind: 'isolador', primaryMuscle: 'panturrilha', secondaryMuscles: [], movementPattern: 'calf_raise', equipment: 'máquina', sets: 3, repsMin: 12, repsMax: 20, rirMin: 1, rirMax: 2, restSeconds: 90, progressionType: 'double_progression', aestheticFunction: 'Panturrilha', guidance: ['Amplitude completa.'], substitutions: []}),
      safeIsolation({name: 'Ab wheel ajoelhado', kind: 'abdominal', primaryMuscle: 'abdômen', secondaryMuscles: [], movementPattern: 'anti_extension', equipment: 'roda abdominal', sets: 3, repsMin: 6, repsMax: 12, rirMin: 1, rirMax: 2, restSeconds: 90, progressionType: 'range_control', aestheticFunction: 'Anti-extensão do core', guidance: ['Pare antes de perder a posição lombar.'], substitutions: ['Rollout com barra', 'Body saw', 'Prancha com alavanca progressiva']}),
      safeIsolation({name: 'Pallof press', kind: 'abdominal', primaryMuscle: 'abdômen', secondaryMuscles: ['oblíquos'], movementPattern: 'anti_rotation', equipment: 'cabo', sets: 2, repsMin: 10, repsMax: 15, rirMin: 2, rirMax: 3, restSeconds: 75, progressionType: 'range_control', aestheticFunction: 'Anti-rotação e estabilidade', guidance: ['Resista à rotação e mantenha costelas sobre a pelve.'], substitutions: [], perSide: true}),
    ],
  },
]

export function directVolumeByMuscle(routine: RoutineDayDef[] = POWERBUILDING_V4): Record<string, number> {
  return routine.flatMap((day) => day.exercises).reduce<Record<string, number>>((volume, exercise) => {
    volume[exercise.primaryMuscle] = (volume[exercise.primaryMuscle] ?? 0) + exercise.sets
    return volume
  }, {})
}

export function secondaryVolumeByMuscle(routine: RoutineDayDef[] = POWERBUILDING_V4): Record<string, number> {
  return routine.flatMap((day) => day.exercises).reduce<Record<string, number>>((volume, exercise) => {
    for (const muscle of exercise.secondaryMuscles) {
      volume[muscle] = (volume[muscle] ?? 0) + exercise.sets * 0.5
    }
    return volume
  }, {})
}

export const VOLUME_SEMANAL_ALVO = directVolumeByMuscle()
export const DIA_LABEL: Record<number, string> = {1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado', 7: 'Domingo'}
export const TRAINING_FOCUS_LABEL: Record<TrainingFocus, string> = {strength_technique: 'Força técnica', hypertrophy: 'Hipertrofia', recovery: 'Recuperação'}
export const MOVEMENT_PATTERN_LABEL: Record<MovementPattern, string> = {
  horizontal_push: 'Empurrar horizontal', incline_push: 'Empurrar inclinado', vertical_push: 'Empurrar vertical',
  vertical_pull: 'Puxar vertical', horizontal_pull: 'Puxar horizontal', squat: 'Agachar', hip_hinge: 'Hinge de quadril',
  unilateral_leg: 'Unilateral de pernas', knee_flexion: 'Flexão de joelho', calf_raise: 'Panturrilha',
  lateral_delt: 'Deltoide lateral', rear_delt: 'Deltoide posterior', elbow_flexion: 'Flexão de cotovelo', elbow_extension: 'Extensão de cotovelo',
  trunk_flexion: 'Flexão do tronco', pelvic_curl: 'Retroversão pélvica', anti_extension: 'Anti-extensão', anti_rotation: 'Anti-rotação',
}
export const AVISO_ABDOMEN = 'O treino desenvolve o abdômen, mas a definição visual também depende de gordura corporal, alimentação, genética, sono e consistência. Exercício localizado não elimina gordura de uma região específica.'
export const AVISO_GERAL = 'Powerbuilding estético inspirado em princípios públicos, não um programa oficial. Use referências como inspiração; genética, estrutura, tempo, alimentação e consistência tornam cada progresso individual. Interrompa movimentos com dor moderada, forte ou progressiva.'
