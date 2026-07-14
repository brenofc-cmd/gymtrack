/**
 * Rotina v2 — divisão semanal definitiva (PPL 6 dias).
 *
 * Fonte única da verdade da rotina de treino. É consumida por:
 *  - scripts/generate-rotina-v2-sql.ts (gera a migration de dados)
 *  - testes automatizados (lib/routine/rotina-v2.test.ts)
 *  - UI (volume planejado, padrões de movimento, RIR)
 *
 * Segunda: Push A · Terça: Pull A · Quarta: Legs A
 * Quinta: Push B · Sexta: Pull B · Sábado: Legs B · Domingo: descanso
 */

export type WorkoutLetterV2 = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type ExerciseKind = 'composto' | 'isolador' | 'abdominal'
export type MovementPattern =
  | 'flexao_tronco'
  | 'retroversao_pelvica'
  | 'anti_extensao'

export interface RoutineExerciseDef {
  /** name_pt no catálogo `exercises` (find-or-create por este nome) */
  name: string
  kind: ExerciseKind
  primaryMuscle: string
  secondaryMuscles: string[]
  /** Apenas exercícios abdominais têm padrão de movimento destacado */
  movementPattern?: MovementPattern
  equipment: string
  sets: number
  repsMin: number
  repsMax: number
  rirMin: number
  rirMax: number
  /** Quando a faixa de descanso é um intervalo, usa-se o maior valor como padrão */
  restSeconds: number
  guidance: string[]
  /** Substituições permitidas (name_pt no catálogo), em ordem de preferência */
  substitutions: string[]
  /** Repetições contadas por lado (unilateral) */
  perSide?: boolean
}

export interface RoutineDayDef {
  letter: WorkoutLetterV2
  /** 1 = segunda ... 6 = sábado (domingo é descanso, sem treino) */
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  objective: string
  warmupNote: string
  exercises: RoutineExerciseDef[]
}

/** Incremented only when a migration creates a new immutable active template. */
export const ROUTINE_VERSION = 3

const WARMUP_COMPOSTO =
  'Aquecimento geral leve (~5 min) e séries de aproximação no primeiro composto: ~40% × 8–12, ~60% × 5–6, ~75–80% × 2–4. Séries de aquecimento não contam no volume e não devem cansar.'

export const ROTINA_V2: RoutineDayDef[] = [
  {
    letter: 'A',
    dayOfWeek: 1,
    name: 'Push A',
    objective:
      'Peitoral superior, deltoide lateral, ombros, tríceps e primeiro estímulo direto de abdômen da semana.',
    warmupNote: WARMUP_COMPOSTO,
    exercises: [
      {
        name: 'Supino inclinado com halteres',
        kind: 'composto',
        primaryMuscle: 'peito',
        secondaryMuscles: ['deltoide anterior', 'tríceps'],
        equipment: 'halter',
        sets: 3,
        repsMin: 6,
        repsMax: 10,
        rirMin: 2,
        rirMax: 2,
        restSeconds: 180,
        guidance: [
          'Inclinação do banco em ~20–30°; não transformar em desenvolvimento',
          'Pés firmes e escápulas estáveis',
          'Controlar a descida, amplitude confortável e consistente',
          'Não bater os halteres nem encurtar a amplitude para usar mais carga',
        ],
        substitutions: ['Supino inclinado na máquina', 'Supino inclinado (barra)'],
      },
      {
        name: 'Chest press convergente',
        kind: 'composto',
        primaryMuscle: 'peito',
        secondaryMuscles: ['tríceps', 'deltoide anterior'],
        equipment: 'máquina',
        sets: 2,
        repsMin: 8,
        repsMax: 12,
        rirMin: 2,
        rirMax: 2,
        restSeconds: 120,
        guidance: ['Escápulas apoiadas no banco', 'Controle total na volta'],
        substitutions: ['Supino reto com halteres (chest press)', 'Supino em máquina'],
      },
      {
        name: 'Desenvolvimento sentado na máquina',
        kind: 'composto',
        primaryMuscle: 'ombros',
        secondaryMuscles: ['tríceps'],
        equipment: 'máquina',
        sets: 2,
        repsMin: 8,
        repsMax: 12,
        rirMin: 2,
        rirMax: 2,
        restSeconds: 150,
        guidance: [
          'Preferir máquina convergente estável; senão, halteres sentado',
          'Tronco apoiado, sem hiperextensão excessiva da lombar',
          'Controlar a fase de descida, sem impulso das pernas',
        ],
        substitutions: [],
      },
      {
        name: 'Elevação lateral unilateral no cabo',
        kind: 'isolador',
        primaryMuscle: 'deltoide lateral',
        secondaryMuscles: [],
        equipment: 'cabo',
        sets: 4,
        repsMin: 12,
        repsMax: 20,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 75,
        guidance: [
          'Tensão contínua; não virar encolhimento',
          'Não balançar o tronco nem elevar o ombro em direção à orelha',
          'Carga que permita controle',
        ],
        substitutions: [],
        perSide: true,
      },
      {
        name: 'Tríceps overhead no cabo',
        kind: 'isolador',
        primaryMuscle: 'tríceps',
        secondaryMuscles: [],
        equipment: 'cabo',
        sets: 2,
        repsMin: 10,
        repsMax: 15,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 90,
        guidance: ['Ênfase na cabeça longa; cotovelos estáveis'],
        substitutions: [],
      },
      {
        name: 'Tríceps na corda',
        kind: 'isolador',
        primaryMuscle: 'tríceps',
        secondaryMuscles: [],
        equipment: 'cabo',
        sets: 2,
        repsMin: 10,
        repsMax: 15,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 75,
        guidance: ['Cotovelos junto ao corpo, abrir a corda no final'],
        substitutions: [],
      },
      {
        name: 'Cable crunch',
        kind: 'abdominal',
        primaryMuscle: 'abdômen',
        secondaryMuscles: [],
        movementPattern: 'flexao_tronco',
        equipment: 'cabo',
        sets: 4,
        repsMin: 8,
        repsMax: 15,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 90,
        guidance: [
          'Flexionar a coluna contraindo o abdômen: aproximar costelas da pelve',
          'Não transformar em flexão de quadril nem puxar só com os braços',
          'Controlar o retorno; carga progressiva; sem repetições rápidas e curtas',
        ],
        substitutions: ['Abdominal na máquina (com carga)', 'Crunch com anilha (resistência)'],
      },
    ],
  },
  {
    letter: 'B',
    dayOfWeek: 2,
    name: 'Pull A',
    objective:
      'Largura das costas, parte média das costas, deltoide posterior e bíceps.',
    warmupNote: WARMUP_COMPOSTO,
    exercises: [
      {
        name: 'Puxada alta pronada média',
        kind: 'composto',
        primaryMuscle: 'costas',
        secondaryMuscles: ['bíceps', 'parte superior das costas'],
        equipment: 'cabo',
        sets: 3,
        repsMin: 6,
        repsMax: 10,
        rirMin: 2,
        rirMax: 2,
        restSeconds: 150,
        guidance: [
          'Iniciar estabilizando e abaixando as escápulas',
          'Levar os cotovelos para baixo; não puxar só com as mãos',
          'Não jogar o tronco para trás em excesso; amplitude consistente',
        ],
        substitutions: ['Pulldown pegada neutra', 'Barra fixa assistida (ou puxada neutra)'],
      },
      {
        name: 'Remada com apoio no peito',
        kind: 'composto',
        primaryMuscle: 'costas',
        secondaryMuscles: ['bíceps', 'deltoide posterior'],
        equipment: 'máquina',
        sets: 3,
        repsMin: 8,
        repsMax: 12,
        rirMin: 2,
        rirMax: 2,
        restSeconds: 120,
        guidance: ['Peito colado no apoio; puxar com as costas'],
        substitutions: ['Remada em máquina com apoio', 'Remada T (ou máquina com apoio)'],
      },
      {
        name: 'Straight-arm pulldown',
        kind: 'isolador',
        primaryMuscle: 'costas',
        secondaryMuscles: [],
        equipment: 'cabo',
        sets: 2,
        repsMin: 12,
        repsMax: 15,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 75,
        guidance: ['Braços estendidos; sentir o dorsal alongar e contrair'],
        substitutions: [],
      },
      {
        name: 'Crucifixo inverso na máquina',
        kind: 'isolador',
        primaryMuscle: 'deltoide posterior',
        secondaryMuscles: [],
        equipment: 'máquina',
        sets: 3,
        repsMin: 12,
        repsMax: 20,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 75,
        guidance: ['Abrir com controle, sem impulso'],
        substitutions: [],
      },
      {
        name: 'Rosca direta com barra W',
        kind: 'isolador',
        primaryMuscle: 'bíceps',
        secondaryMuscles: [],
        equipment: 'barra',
        sets: 2,
        repsMin: 8,
        repsMax: 12,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 90,
        guidance: ['Cotovelos fixos ao lado do corpo'],
        substitutions: [],
      },
      {
        name: 'Rosca martelo',
        kind: 'isolador',
        primaryMuscle: 'bíceps',
        secondaryMuscles: ['braquial', 'braquiorradial'],
        equipment: 'halter',
        sets: 2,
        repsMin: 10,
        repsMax: 15,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 75,
        guidance: ['Pegada neutra; punhos retos'],
        substitutions: [],
      },
    ],
  },
  {
    letter: 'C',
    dayOfWeek: 3,
    name: 'Legs A',
    objective:
      'Quadríceps, posteriores, panturrilhas e segundo estímulo direto de abdômen.',
    warmupNote: WARMUP_COMPOSTO,
    exercises: [
      {
        name: 'Hack squat',
        kind: 'composto',
        primaryMuscle: 'quadríceps',
        secondaryMuscles: ['glúteos', 'isquiotibiais'],
        equipment: 'máquina',
        sets: 3,
        repsMin: 6,
        repsMax: 10,
        rirMin: 2,
        rirMax: 3,
        restSeconds: 180,
        guidance: [
          'Escolha hack squat ou agachamento livre e mantenha a variação no histórico',
          'Amplitude segura e consistente; joelhos na direção dos pés',
          'Não sacrificar profundidade para aumentar carga',
          'Encerrar a série quando a técnica começar a se desfazer; sem falha sem estrutura segura',
        ],
        substitutions: ['Agachamento livre', 'Agachamento no Smith'],
      },
      {
        name: 'Leg press',
        kind: 'composto',
        primaryMuscle: 'quadríceps',
        secondaryMuscles: ['glúteos'],
        equipment: 'máquina',
        sets: 3,
        repsMin: 10,
        repsMax: 15,
        rirMin: 2,
        rirMax: 2,
        restSeconds: 180,
        guidance: ['Descer com controle até amplitude segura; não travar os joelhos'],
        substitutions: [],
      },
      {
        name: 'Cadeira extensora',
        kind: 'isolador',
        primaryMuscle: 'quadríceps',
        secondaryMuscles: [],
        equipment: 'máquina',
        sets: 2,
        repsMin: 12,
        repsMax: 15,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 90,
        guidance: ['Contrair no topo, descer devagar'],
        substitutions: [],
      },
      {
        name: 'Flexora sentada',
        kind: 'isolador',
        primaryMuscle: 'isquiotibiais',
        secondaryMuscles: [],
        equipment: 'máquina',
        sets: 3,
        repsMin: 10,
        repsMax: 15,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 120,
        guidance: ['Preferir a flexora sentada quando houver máquina adequada'],
        substitutions: ['Mesa flexora', 'Flexora unilateral'],
      },
      {
        name: 'Panturrilha em pé',
        kind: 'isolador',
        primaryMuscle: 'panturrilha',
        secondaryMuscles: [],
        equipment: 'máquina',
        sets: 4,
        repsMin: 8,
        repsMax: 15,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 90,
        guidance: [
          'Amplitude completa com pausa curta na posição alongada',
          'Subir completamente; evitar repetições rápidas e parciais',
        ],
        substitutions: [],
      },
      {
        name: 'Reverse crunch no banco',
        kind: 'abdominal',
        primaryMuscle: 'abdômen',
        secondaryMuscles: [],
        movementPattern: 'retroversao_pelvica',
        equipment: 'corpo',
        sets: 4,
        repsMin: 10,
        repsMax: 20,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 90,
        guidance: [
          'Iniciar enrolando a pelve em direção ao tronco (retroversão)',
          'Evitar apenas levantar e abaixar as pernas; sem balanço',
          'Controlar a descida; não arquear excessivamente a lombar',
          'Progredir por repetições, controle, amplitude ou resistência',
        ],
        substitutions: ['Capitão (elevação de joelhos)', 'Elevação de joelhos pendurado'],
      },
    ],
  },
  {
    letter: 'D',
    dayOfWeek: 4,
    name: 'Push B',
    objective: 'Peitoral completo, peitoral superior, deltoide lateral e tríceps.',
    warmupNote: WARMUP_COMPOSTO,
    exercises: [
      {
        name: 'Supino reto com barra',
        kind: 'composto',
        primaryMuscle: 'peito',
        secondaryMuscles: ['tríceps', 'deltoide anterior'],
        equipment: 'barra',
        sets: 3,
        repsMin: 6,
        repsMax: 10,
        rirMin: 2,
        rirMax: 2,
        restSeconds: 180,
        guidance: ['Barra ou máquina; não levar deliberadamente à falha no livre'],
        substitutions: [],
      },
      {
        name: 'Supino inclinado na máquina',
        kind: 'composto',
        primaryMuscle: 'peito',
        secondaryMuscles: ['tríceps', 'deltoide anterior'],
        equipment: 'máquina',
        sets: 2,
        repsMin: 8,
        repsMax: 12,
        rirMin: 2,
        rirMax: 2,
        restSeconds: 120,
        guidance: ['Foco no peitoral superior'],
        substitutions: [],
      },
      {
        name: 'Crossover baixo para cima',
        kind: 'isolador',
        primaryMuscle: 'peito',
        secondaryMuscles: [],
        equipment: 'cabo',
        sets: 2,
        repsMin: 12,
        repsMax: 20,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 75,
        guidance: ['Direcionamento para a região clavicular'],
        substitutions: [],
      },
      {
        name: 'Elevação lateral com halteres',
        kind: 'isolador',
        primaryMuscle: 'ombro',
        secondaryMuscles: [],
        equipment: 'halter',
        sets: 4,
        repsMin: 12,
        repsMax: 20,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 75,
        guidance: ['Sem balanço; não elevar o ombro em direção à orelha'],
        substitutions: [],
      },
      {
        name: 'Tríceps testa no cabo',
        kind: 'isolador',
        primaryMuscle: 'tríceps',
        secondaryMuscles: [],
        equipment: 'cabo',
        sets: 2,
        repsMin: 8,
        repsMax: 12,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 90,
        guidance: ['Preferência pelo cabo: tensão contínua e ajuste fácil'],
        substitutions: [],
      },
      {
        name: 'Tríceps unilateral no cabo',
        kind: 'isolador',
        primaryMuscle: 'tríceps',
        secondaryMuscles: [],
        equipment: 'cabo',
        sets: 2,
        repsMin: 12,
        repsMax: 20,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 75,
        guidance: ['12 a 20 repetições por braço'],
        substitutions: [],
        perSide: true,
      },
    ],
  },
  {
    letter: 'E',
    dayOfWeek: 5,
    name: 'Pull B',
    objective: 'Dorsal, espessura das costas, deltoide posterior e bíceps.',
    warmupNote: WARMUP_COMPOSTO,
    exercises: [
      {
        name: 'Barra fixa assistida com pegada neutra',
        kind: 'composto',
        primaryMuscle: 'costas',
        secondaryMuscles: ['bíceps'],
        equipment: 'máquina',
        sets: 3,
        repsMin: 6,
        repsMax: 10,
        rirMin: 2,
        rirMax: 2,
        restSeconds: 150,
        guidance: ['Amplitude completa com controle'],
        substitutions: ['Puxada neutra'],
      },
      {
        name: 'Remada unilateral no cabo',
        kind: 'composto',
        primaryMuscle: 'costas',
        secondaryMuscles: ['bíceps'],
        equipment: 'cabo',
        sets: 3,
        repsMin: 8,
        repsMax: 12,
        rirMin: 2,
        rirMax: 2,
        restSeconds: 120,
        guidance: [
          'Conduzir o cotovelo em direção ao quadril para maior participação da dorsal',
          'Controlar a posição alongada; não girar o tronco em excesso; sem impulso',
        ],
        substitutions: [],
        perSide: true,
      },
      {
        name: 'Crucifixo inverso no cabo',
        kind: 'isolador',
        primaryMuscle: 'deltoide posterior',
        secondaryMuscles: [],
        equipment: 'cabo',
        sets: 3,
        repsMin: 12,
        repsMax: 20,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 75,
        guidance: ['Movimento amplo e controlado'],
        substitutions: [],
      },
      {
        name: 'Rosca alternada no banco inclinado',
        kind: 'isolador',
        primaryMuscle: 'bíceps',
        secondaryMuscles: [],
        equipment: 'halter',
        sets: 2,
        repsMin: 8,
        repsMax: 12,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 90,
        guidance: ['Alongamento maior do bíceps no banco inclinado'],
        substitutions: [],
      },
      {
        name: 'Rosca direta no cabo',
        kind: 'isolador',
        primaryMuscle: 'bíceps',
        secondaryMuscles: [],
        equipment: 'cabo',
        sets: 2,
        repsMin: 12,
        repsMax: 15,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 75,
        guidance: ['Tensão contínua; sem balanço'],
        substitutions: [],
      },
    ],
  },
  {
    letter: 'F',
    dayOfWeek: 6,
    name: 'Legs B',
    objective:
      'Posteriores de coxa, glúteos, quadríceps, panturrilhas, deltoide lateral e anti-extensão abdominal.',
    warmupNote: WARMUP_COMPOSTO,
    exercises: [
      {
        name: 'Stiff / Terra romeno',
        kind: 'composto',
        primaryMuscle: 'isquiotibiais',
        secondaryMuscles: ['glúteos', 'eretores da coluna'],
        equipment: 'barra',
        sets: 3,
        repsMin: 6,
        repsMax: 10,
        rirMin: 2,
        rirMax: 3,
        restSeconds: 180,
        guidance: [
          'Coluna neutra; conduzir o quadril para trás',
          'Peso próximo ao corpo; parar a descida antes de perder a posição',
          'Não arredondar a lombar; amplitude compatível com a mobilidade',
          'Não levar deliberadamente à falha',
        ],
        substitutions: [],
      },
      {
        name: 'Agachamento búlgaro',
        kind: 'composto',
        primaryMuscle: 'quadríceps',
        secondaryMuscles: ['glúteos'],
        equipment: 'halter',
        sets: 3,
        repsMin: 8,
        repsMax: 12,
        rirMin: 2,
        rirMax: 2,
        restSeconds: 150,
        guidance: ['8 a 12 repetições por perna; tronco estável'],
        substitutions: [],
        perSide: true,
      },
      {
        name: 'Flexora deitada',
        kind: 'isolador',
        primaryMuscle: 'isquiotibiais',
        secondaryMuscles: [],
        equipment: 'máquina',
        sets: 3,
        repsMin: 10,
        repsMax: 15,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 120,
        guidance: ['Sentada ou deitada, conforme disponibilidade'],
        substitutions: ['Mesa flexora', 'Flexora unilateral'],
      },
      {
        name: 'Panturrilha sentada',
        kind: 'isolador',
        primaryMuscle: 'panturrilha',
        secondaryMuscles: [],
        equipment: 'máquina',
        sets: 4,
        repsMin: 12,
        repsMax: 20,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 90,
        guidance: ['Pausa na posição alongada; subida completa'],
        substitutions: [],
      },
      {
        name: 'Elevação lateral unilateral no cabo',
        kind: 'isolador',
        primaryMuscle: 'deltoide lateral',
        secondaryMuscles: [],
        equipment: 'cabo',
        sets: 2,
        repsMin: 15,
        repsMax: 25,
        rirMin: 2,
        rirMax: 2,
        restSeconds: 75,
        guidance: ['Séries técnicas e controladas; conduza pelo cotovelo sem buscar a falha.'],
        substitutions: [],
        perSide: true,
      },
      {
        name: 'Ab wheel ajoelhado',
        kind: 'abdominal',
        primaryMuscle: 'abdômen',
        secondaryMuscles: ['oblíquos', 'estabilizadores'],
        movementPattern: 'anti_extensao',
        equipment: 'corpo',
        sets: 4,
        repsMin: 6,
        repsMax: 12,
        rirMin: 1,
        rirMax: 2,
        restSeconds: 90,
        guidance: [
          'Contrair glúteos e manter leve retroversão pélvica',
          'Impedir que a lombar afunde; avançar só até manter o tronco estável',
          'Interromper a série se houver dor lombar',
          'Progressões: rollout curto ajoelhado → maior amplitude → completo',
        ],
        substitutions: ['Rollout com barra', 'Body saw', 'Prancha com alavanca progressiva'],
      },
    ],
  },
]

/** Volume semanal direto planejado (séries válidas), conforme a rotina. */
export const VOLUME_SEMANAL_ALVO: Record<string, number> = {
  peito: 12,
  costas: 14,
  'deltoide lateral': 10,
  'deltoide posterior': 6,
  bíceps: 8,
  tríceps: 8,
  quadríceps: 11,
  isquiotibiais: 9,
  panturrilha: 8,
  abdômen: 12,
}

/**
 * Grupos "diretos" para contagem de volume:
 * elevações laterais contam como deltoide lateral (não "ombro" genérico),
 * desenvolvimento conta como ombro (composto, não entra na contagem de
 * deltoide lateral direto).
 */
export function directVolumeByMuscle(routine: RoutineDayDef[] = ROTINA_V2): Record<string, number> {
  const acc: Record<string, number> = {}
  for (const day of routine) {
    for (const ex of day.exercises) {
      let muscle = ex.primaryMuscle
      if (muscle === 'ombro') {
        // Elevações laterais são o trabalho direto de deltoide lateral;
        // desenvolvimento (composto) não conta como série direta de lateral.
        muscle = ex.kind === 'isolador' ? 'deltoide lateral' : 'ombro (composto)'
      }
      acc[muscle] = (acc[muscle] ?? 0) + ex.sets
    }
  }
  return acc
}

/** Nome do dia da semana (pt-BR) para cada treino. */
export const DIA_LABEL: Record<number, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
  7: 'Domingo',
}

export const AVISO_ABDOMEN =
  'O treinamento fortalece e desenvolve o abdômen, mas sua visibilidade também depende do percentual de gordura, da alimentação, da genética, do sono e da consistência. Não é possível garantir que exercícios abdominais eliminem gordura apenas nessa região.'

export const AVISO_GERAL =
  'Este aplicativo apresenta orientações gerais de organização e acompanhamento. Ele não substitui avaliação de médico, nutricionista ou profissional de educação física. Interrompa exercícios que causem dor forte ou progressiva.'

export const MOVEMENT_PATTERN_LABEL: Record<MovementPattern, string> = {
  flexao_tronco: 'Flexão do tronco',
  retroversao_pelvica: 'Retroversão pélvica',
  anti_extensao: 'Anti-extensão',
}
