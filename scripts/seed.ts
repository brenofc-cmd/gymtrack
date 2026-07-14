/**
 * Seed script — popula exercises, workouts e workout_exercises para o Brendon.
 *
 * Uso: SEED_USER_ID=<seu-user-id> npm run seed
 *
 * Pré-requisito: .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

/**
 * This seed predates routine v3 and rewrites workout_exercises. It is kept
 * only as a recoverable legacy artifact; running it against a real account
 * would conflict with the versioned, history-preserving migration flow.
 */
if (process.env.ALLOW_LEGACY_SEED !== 'true') {
  console.error(
    'Seed legado bloqueado. Aplique as migrations do Supabase; não use este script para criar a rotina v3.'
  )
  process.exit(1)
}

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const USER_ID = process.env.SEED_USER_ID
if (!USER_ID) {
  console.error('❌  Defina SEED_USER_ID no .env.local ou como variável de ambiente.')
  process.exit(1)
}

// ============================================================
// Catálogo de exercícios com GIF URLs pré-mapeados
// GIFs de: https://exercisedb.dev (acesso público)
// ============================================================
const EXERCISES = [
  // --- Treino A: Peito, Ombro, Tríceps ---
  {
    name_pt: 'Supino inclinado (barra)',
    name_en: 'barbell incline bench press',
    exercisedb_id: '0025',
    gif_url: 'https://v2.exercisedb.io/image/HXoZoLQKFXHHQB',
    muscle_group: 'peito',
    equipment: 'barra',
    instructions: [
      'Deite-se no banco inclinado a 30-45°',
      'Segure a barra com pegada um pouco mais larga que os ombros',
      'Desça a barra controladamente até o peitoral superior',
      'Empurre de volta à posição inicial contraindo o peitoral',
    ],
  },
  {
    name_pt: 'Supino inclinado com halteres',
    name_en: 'dumbbell incline bench press',
    exercisedb_id: '0301',
    gif_url: 'https://v2.exercisedb.io/image/fPk2VvTJk5Opn2',
    muscle_group: 'peito',
    equipment: 'halter',
    instructions: [
      'Deite-se no banco inclinado segurando um halter em cada mão',
      'Mantenha os halteres na altura do peitoral',
      'Empurre para cima até os braços estenderem completamente',
      'Desça controladamente até sentir o alongamento no peitoral',
    ],
  },
  {
    name_pt: 'Crossover alto (peito superior)',
    name_en: 'cable crossover high',
    exercisedb_id: '1368',
    gif_url: 'https://v2.exercisedb.io/image/xhMv4-hhNJPHiT',
    muscle_group: 'peito',
    equipment: 'cabo',
    instructions: [
      'Posicione os cabos na parte alta da máquina',
      'Fique no centro com um passo à frente',
      'Puxe os cabos para baixo e para o centro, cruzando as mãos',
      'Mantenha leve flexão nos cotovelos durante o movimento',
    ],
  },
  {
    name_pt: 'Desenvolvimento com halteres',
    name_en: 'dumbbell shoulder press',
    exercisedb_id: '0318',
    gif_url: 'https://v2.exercisedb.io/image/VgQtMF4QJsFe-e',
    muscle_group: 'ombro',
    equipment: 'halter',
    instructions: [
      'Sente-se no banco com encosto reto',
      'Segure um halter em cada mão na altura dos ombros',
      'Empurre os halteres para cima até os braços ficarem estendidos',
      'Desça controladamente até a posição inicial',
    ],
  },
  {
    name_pt: 'Elevação lateral (cabo)',
    name_en: 'cable lateral raise',
    exercisedb_id: '0266',
    gif_url: 'https://v2.exercisedb.io/image/6yfbwUdM1nENHd',
    muscle_group: 'ombro',
    equipment: 'cabo',
    instructions: [
      'Fique de lado à máquina de cabo com o cabo na mão oposta',
      'Eleve o braço lateralmente até a altura do ombro',
      'Mantenha leve flexão no cotovelo',
      'Retorne controladamente à posição inicial',
    ],
  },
  {
    name_pt: 'Elevação lateral inclinada (haltere)',
    name_en: 'dumbbell lateral raise incline',
    exercisedb_id: '0328',
    gif_url: 'https://v2.exercisedb.io/image/bV8AkuXzNOfvqj',
    muscle_group: 'ombro',
    equipment: 'halter',
    instructions: [
      'Deite-se de lado no banco inclinado segurando um halter',
      'Eleve o braço lateralmente com leve flexão no cotovelo',
      'O ângulo inclinado aumenta a tensão no deltóide médio',
      'Desça controladamente',
    ],
  },
  {
    name_pt: 'Tríceps corda',
    name_en: 'cable triceps pushdown rope',
    exercisedb_id: '0050',
    gif_url: 'https://v2.exercisedb.io/image/y2WmHF63Lr-Vvz',
    muscle_group: 'tríceps',
    equipment: 'cabo',
    instructions: [
      'Fique de frente ao cabo com corda no alto',
      'Puxe a corda para baixo até os braços ficarem estendidos',
      'No final do movimento, gire os pulsos para fora (supinação)',
      'Retorne controladamente com controle total',
    ],
  },
  {
    name_pt: 'Tríceps testa com halteres',
    name_en: 'dumbbell skull crusher',
    exercisedb_id: '0346',
    gif_url: 'https://v2.exercisedb.io/image/A0G0yJzNXMSd-U',
    muscle_group: 'tríceps',
    equipment: 'halter',
    instructions: [
      'Deite-se no banco segurando halteres acima do peito',
      'Flexione os cotovelos abaixando os halteres em direção à testa',
      'Mantenha os cotovelos apontados para cima',
      'Estenda os braços voltando à posição inicial',
    ],
  },
  {
    name_pt: 'Cable crunch',
    name_en: 'cable crunch',
    exercisedb_id: '0135',
    gif_url: 'https://v2.exercisedb.io/image/jKBBP3Br7ZB8gT',
    muscle_group: 'abdômen',
    equipment: 'cabo',
    instructions: [
      'Ajoelhe-se em frente ao cabo com corda na altura alta',
      'Puxe a corda para baixo enquanto flete o tronco',
      'Contraia o abdômen no ponto de maior flexão',
      'Retorne controladamente sem usar o peso para subir',
    ],
  },
  // --- Treino B: Pernas ---
  {
    name_pt: 'Agachamento livre',
    name_en: 'barbell squat',
    exercisedb_id: '0010',
    gif_url: 'https://v2.exercisedb.io/image/A0Bj8K1nYkZwA0',
    muscle_group: 'quadríceps',
    equipment: 'barra',
    instructions: [
      'Posicione a barra nos trapézios superiores',
      'Pés na largura dos ombros levemente abertos',
      'Desça controladamente até as coxas ficarem paralelas ao chão',
      'Empurre pelos calcanhares para voltar à posição inicial',
    ],
  },
  {
    name_pt: 'Leg press (pés altos e fechados)',
    name_en: 'leg press',
    exercisedb_id: '0406',
    gif_url: 'https://v2.exercisedb.io/image/vJVBdNj7xPQlXd',
    muscle_group: 'quadríceps',
    equipment: 'máquina',
    instructions: [
      'Sente-se na cadeira do leg press com costas apoiadas',
      'Posicione os pés altos na plataforma e mais fechados que a largura dos ombros',
      'Desça controladamente até 90° de flexão no joelho',
      'Empurre de volta sem travar os joelhos',
    ],
  },
  {
    name_pt: 'Cadeira extensora',
    name_en: 'leg extension',
    exercisedb_id: '0399',
    gif_url: 'https://v2.exercisedb.io/image/XY7iQanBgMuM3Q',
    muscle_group: 'quadríceps',
    equipment: 'máquina',
    instructions: [
      'Sente-se na cadeira extensora com joelhos alinhados ao pivô',
      'Estenda as pernas até ficarem paralelas ao chão',
      'Contraia os quadríceps no topo do movimento',
      'Desça controladamente',
    ],
  },
  {
    name_pt: 'Mesa flexora',
    name_en: 'lying leg curl',
    exercisedb_id: '0390',
    gif_url: 'https://v2.exercisedb.io/image/lNlQoYdSxGW9yz',
    muscle_group: 'isquiotibiais',
    equipment: 'máquina',
    instructions: [
      'Deite-se de bruços na mesa flexora',
      'Posicione o tornozelo sob o apoio com joelhos alinhados ao pivô',
      'Flexione os joelhos puxando os calcanhares em direção ao glúteo',
      'Retorne controladamente',
    ],
  },
  {
    name_pt: 'Stiff (barra ou halteres)',
    name_en: 'romanian deadlift',
    exercisedb_id: '0040',
    gif_url: 'https://v2.exercisedb.io/image/c1EjvxZ1bKCFkG',
    muscle_group: 'isquiotibiais',
    equipment: 'barra',
    instructions: [
      'Fique em pé segurando a barra ou halteres na frente das coxas',
      'Desça o peso deslizando pelas pernas mantendo as costas retas',
      'Sinta o alongamento nos isquiotibiais',
      'Retorne contraindo o glúteo e os isquiotibiais',
    ],
  },
  {
    name_pt: 'Panturrilha em pé (unilateral)',
    name_en: 'standing calf raise single leg',
    exercisedb_id: '1384',
    gif_url: 'https://v2.exercisedb.io/image/1JRdxR3CMJh-GN',
    muscle_group: 'panturrilha',
    equipment: 'corpo',
    instructions: [
      'Fique em pé em uma perna no borda de um degrau',
      'Deixe o calcanhar descer abaixo do degrau para alongar',
      'Eleve na ponta do pé ao máximo',
      'Execute lentamente para máxima contração',
    ],
  },
  {
    name_pt: 'Capitão (elevação de joelhos)',
    name_en: 'captain chair knee raise',
    exercisedb_id: '0157',
    gif_url: 'https://v2.exercisedb.io/image/OQnZf4vWgXuTRH',
    muscle_group: 'abdômen',
    equipment: 'corpo',
    instructions: [
      'Apoie os antebraços no captain chair e eleve o corpo',
      'Eleve os joelhos em direção ao peito controladamente',
      'Contraia o abdômen no topo sem usar impulso',
      'Desça devagar, sem balanço',
    ],
  },
  // --- Treino C: Costas, Bíceps, Ombro ---
  {
    name_pt: 'Straight arm pulldown (ativação lat)',
    name_en: 'straight arm cable pulldown',
    exercisedb_id: '0046',
    gif_url: 'https://v2.exercisedb.io/image/3-5XrXuG9l4wKL',
    muscle_group: 'costas',
    equipment: 'cabo',
    instructions: [
      'Fique de frente ao cabo com barra reta no alto',
      'Com braços estendidos, puxe a barra para baixo até as coxas',
      'Mantenha os braços retos durante todo o movimento',
      'Foque na contração do grande dorsal',
    ],
  },
  {
    name_pt: 'Barra fixa pronada (pull-up)',
    name_en: 'pull-up',
    exercisedb_id: '0052',
    gif_url: 'https://v2.exercisedb.io/image/TRNhFk9tqz7FKB',
    muscle_group: 'costas',
    equipment: 'corpo',
    instructions: [
      'Segure a barra com pegada pronada mais larga que os ombros',
      'Puxe o corpo para cima até o queixo passar a barra',
      'Contraia as escápulas e o grande dorsal no topo',
      'Desça completamente para alongar o lat',
    ],
  },
  {
    name_pt: 'Remada curvada (barra)',
    name_en: 'barbell bent over row',
    exercisedb_id: '0057',
    gif_url: 'https://v2.exercisedb.io/image/UmRCe8fFLkXqeD',
    muscle_group: 'costas',
    equipment: 'barra',
    instructions: [
      'Fique curvado a 45° com a barra suspensa',
      'Puxe a barra em direção ao abdômen/umbigo',
      'Retraia as escápulas no pico do movimento',
      'Desça controladamente mantendo as costas retas',
    ],
  },
  {
    name_pt: 'Pulldown pegada neutra',
    name_en: 'cable lat pulldown neutral grip',
    exercisedb_id: '0277',
    gif_url: 'https://v2.exercisedb.io/image/fhGbXuHZGRW-Vb',
    muscle_group: 'costas',
    equipment: 'cabo',
    instructions: [
      'Sente-se na polia alta com pegada neutra (palmas voltadas uma para a outra)',
      'Puxe a barra para o peitoral superior',
      'Foque na contração do grande dorsal',
      'Retorne controladamente com o lat alongado',
    ],
  },
  {
    name_pt: 'Remada unilateral (haltere)',
    name_en: 'dumbbell one arm row',
    exercisedb_id: '0307',
    gif_url: 'https://v2.exercisedb.io/image/LmyEYMPbMH6WP2',
    muscle_group: 'costas',
    equipment: 'halter',
    instructions: [
      'Apoie um joelho e mão no banco, costas retas',
      'Puxe o halter em direção ao quadril lateral',
      'Retraia a escápula no topo do movimento',
      'Desça completamente para alongar',
    ],
  },
  {
    name_pt: 'Rosca direta (barra)',
    name_en: 'barbell curl',
    exercisedb_id: '0029',
    gif_url: 'https://v2.exercisedb.io/image/VcJdXalVr0AEH1',
    muscle_group: 'bíceps',
    equipment: 'barra',
    instructions: [
      'Fique em pé segurando a barra com pegada supinada',
      'Flexione os cotovelos levantando a barra até os ombros',
      'Mantenha os cotovelos fixos ao lado do corpo',
      'Desça controladamente até o alongamento completo',
    ],
  },
  {
    name_pt: 'Rosca martelo (haltere)',
    name_en: 'dumbbell hammer curl',
    exercisedb_id: '0299',
    gif_url: 'https://v2.exercisedb.io/image/FN0AoAGJn-zLW-',
    muscle_group: 'bíceps',
    equipment: 'halter',
    instructions: [
      'Segure os halteres com pegada neutra (como um martelo)',
      'Flexione os cotovelos levantando os halteres',
      'Mantenha os punhos retos durante o movimento',
      'Ativação maior do braquial e braquiorradial',
    ],
  },
  {
    name_pt: 'Oblíquo no cabo (woodchop)',
    name_en: 'cable wood chop',
    exercisedb_id: '1369',
    gif_url: 'https://v2.exercisedb.io/image/nInuHlQbJ-Iyz9',
    muscle_group: 'abdômen',
    equipment: 'cabo',
    instructions: [
      'Posicione o cabo na altura alta com alça',
      'Puxe o cabo diagonalmente de cima para baixo cruzando o corpo',
      'Foque na rotação do tronco, não apenas nos braços',
      'Execute o mesmo número de repetições para cada lado',
    ],
  },
  {
    name_pt: 'Ab wheel',
    name_en: 'ab wheel rollout',
    exercisedb_id: '0657',
    gif_url: 'https://v2.exercisedb.io/image/Bxv8cGj2RaVGxk',
    muscle_group: 'abdômen',
    equipment: 'corpo',
    instructions: [
      'Ajoelhe-se segurando o ab wheel à frente',
      'Role para frente lentamente mantendo o core contraído',
      'Vá até onde conseguir sem a lombar ceder',
      'Puxe de volta contraindo o core e os lats',
    ],
  },
]

// ============================================================
// Treinos
// ============================================================
const WORKOUTS = [
  {
    letter: 'A' as const,
    name: 'Peito, Ombro, Tríceps',
    notes:
      'Elevação lateral em cabo + haltere inclinado = maior tensão no deltóide médio em toda a amplitude. Crossover alto imita a linha de força do peito superior.',
    order_index: 0,
    exercises: [
      {
        name_pt: 'Supino inclinado (barra)',
        target_sets: 4,
        target_reps_min: 6,
        target_reps_max: 8,
        rest_seconds: 120,
        notes: null,
      },
      {
        name_pt: 'Supino inclinado com halteres',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 12,
        rest_seconds: 90,
        notes: null,
      },
      {
        name_pt: 'Crossover alto (peito superior)',
        target_sets: 3,
        target_reps_min: 12,
        target_reps_max: 15,
        rest_seconds: 60,
        notes: 'Imita a linha de força do peito superior',
      },
      {
        name_pt: 'Desenvolvimento com halteres',
        target_sets: 4,
        target_reps_min: 8,
        target_reps_max: 10,
        rest_seconds: 90,
        notes: null,
      },
      {
        name_pt: 'Elevação lateral (cabo)',
        target_sets: 5,
        target_reps_min: 12,
        target_reps_max: 15,
        rest_seconds: 45,
        notes: null,
      },
      {
        name_pt: 'Elevação lateral inclinada (haltere)',
        target_sets: 3,
        target_reps_min: 12,
        target_reps_max: 15,
        rest_seconds: 45,
        notes: null,
      },
      {
        name_pt: 'Tríceps corda',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 12,
        rest_seconds: 60,
        notes: 'Supinação no final do movimento',
      },
      {
        name_pt: 'Tríceps testa com halteres',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 12,
        rest_seconds: 60,
        notes: null,
      },
      {
        name_pt: 'Cable crunch',
        target_sets: 3,
        target_reps_min: 15,
        target_reps_max: 20,
        rest_seconds: 45,
        notes: null,
      },
    ],
  },
  {
    letter: 'B' as const,
    name: 'Pernas',
    notes:
      'Stiff no lugar de glúteo — foco em isquiotibiais e postura atlética. Capitão com controle total, sem balanço.',
    order_index: 1,
    exercises: [
      {
        name_pt: 'Agachamento livre',
        target_sets: 4,
        target_reps_min: 6,
        target_reps_max: 8,
        rest_seconds: 120,
        notes: null,
      },
      {
        name_pt: 'Leg press (pés altos e fechados)',
        target_sets: 4,
        target_reps_min: 10,
        target_reps_max: 12,
        rest_seconds: 90,
        notes: null,
      },
      {
        name_pt: 'Cadeira extensora',
        target_sets: 3,
        target_reps_min: 12,
        target_reps_max: 15,
        rest_seconds: 60,
        notes: null,
      },
      {
        name_pt: 'Mesa flexora',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 12,
        rest_seconds: 60,
        notes: null,
      },
      {
        name_pt: 'Stiff (barra ou halteres)',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 12,
        rest_seconds: 90,
        notes: 'Foco em isquiotibiais, costas retas',
      },
      {
        name_pt: 'Panturrilha em pé (unilateral)',
        target_sets: 4,
        target_reps_min: 15,
        target_reps_max: 20,
        rest_seconds: 45,
        notes: null,
      },
      {
        name_pt: 'Capitão (elevação de joelhos)',
        target_sets: 4,
        target_reps_min: 15,
        target_reps_max: 20,
        rest_seconds: 45,
        notes: 'Controle total, sem balanço',
      },
    ],
  },
  {
    letter: 'C' as const,
    name: 'Costas, Bíceps, Ombro',
    notes:
      'Straight arm pulldown antes da barra fixa para pré-ativar o lat. 5 séries na barra fixa — é o exercício mais importante pro V da costas.',
    order_index: 2,
    exercises: [
      {
        name_pt: 'Straight arm pulldown (ativação lat)',
        target_sets: 3,
        target_reps_min: 12,
        target_reps_max: 15,
        rest_seconds: 45,
        notes: 'Pré-ativação do lat antes da barra fixa',
      },
      {
        name_pt: 'Barra fixa pronada (pull-up)',
        target_sets: 5,
        target_reps_min: 6,
        target_reps_max: 10,
        rest_seconds: 120,
        notes: '5 séries — exercício mais importante pro V',
      },
      {
        name_pt: 'Remada curvada (barra)',
        target_sets: 4,
        target_reps_min: 8,
        target_reps_max: 10,
        rest_seconds: 90,
        notes: null,
      },
      {
        name_pt: 'Pulldown pegada neutra',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 12,
        rest_seconds: 75,
        notes: null,
      },
      {
        name_pt: 'Remada unilateral (haltere)',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 12,
        rest_seconds: 75,
        notes: null,
      },
      {
        name_pt: 'Rosca direta (barra)',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 10,
        rest_seconds: 60,
        notes: null,
      },
      {
        name_pt: 'Rosca martelo (haltere)',
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 12,
        rest_seconds: 60,
        notes: null,
      },
      {
        name_pt: 'Elevação lateral (cabo)',
        target_sets: 4,
        target_reps_min: 12,
        target_reps_max: 15,
        rest_seconds: 45,
        notes: null,
      },
      {
        name_pt: 'Oblíquo no cabo (woodchop)',
        target_sets: 3,
        target_reps_min: 12,
        target_reps_max: 12,
        rest_seconds: 45,
        notes: '12 repetições cada lado',
      },
      {
        name_pt: 'Ab wheel',
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 60,
        notes: null,
      },
    ],
  },
]

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('🌱 Iniciando seed do GymTrack...\n')

  // 1. Upsert exercises
  console.log(`📦 Inserindo ${EXERCISES.length} exercícios...`)
  const { data: exercisesData, error: exercisesError } = await supabase
    .from('exercises')
    .insert(EXERCISES)
    .select()

  if (exercisesError) {
    console.error('❌ Erro ao inserir exercícios:', exercisesError.message)
    process.exit(1)
  }

  const exerciseMap = new Map(exercisesData!.map((e) => [e.name_pt, e.id]))
  console.log(`✅ ${exercisesData!.length} exercícios inseridos\n`)

  // 2. Upsert workouts + workout_exercises
  for (const workout of WORKOUTS) {
    const { exercises: wExercises, ...workoutData } = workout

    console.log(`🏋️  Treino ${workout.letter} — ${workout.name}`)

    // Check if workout already exists
    const { data: existing } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', USER_ID)
      .eq('letter', workout.letter)
      .single()

    let workoutId: string

    if (existing) {
      workoutId = existing.id
      console.log(`   ↩️  Já existe, reutilizando ID: ${workoutId}`)
    } else {
      const { data: newWorkout, error: workoutError } = await supabase
        .from('workouts')
        .insert({ ...workoutData, user_id: USER_ID })
        .select()
        .single()

      if (workoutError) {
        console.error(`❌ Erro ao criar Treino ${workout.letter}:`, workoutError.message)
        process.exit(1)
      }
      workoutId = newWorkout!.id
    }

    // Delete existing workout_exercises to re-seed order
    await supabase
      .from('workout_exercises')
      .delete()
      .eq('workout_id', workoutId)

    // Insert workout_exercises
    const weInserts = wExercises.map((ex, i) => {
      const exerciseId = exerciseMap.get(ex.name_pt)
      if (!exerciseId) {
        console.error(`❌ Exercício não encontrado no mapa: "${ex.name_pt}"`)
        process.exit(1)
      }
      return {
        workout_id: workoutId,
        exercise_id: exerciseId,
        order_index: i,
        target_sets: ex.target_sets,
        target_reps_min: ex.target_reps_min,
        target_reps_max: ex.target_reps_max,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
      }
    })

    const { error: weError } = await supabase
      .from('workout_exercises')
      .insert(weInserts)

    if (weError) {
      console.error(`❌ Erro ao inserir exercícios do Treino ${workout.letter}:`, weError.message)
      process.exit(1)
    }

    console.log(`   ✅ ${wExercises.length} exercícios configurados\n`)
  }

  console.log('🎉 Seed concluído com sucesso!')
  console.log(`   👤 User ID: ${USER_ID}`)
  console.log(`   💪 3 treinos criados: A, B, C`)
  console.log(`   📦 ${EXERCISES.length} exercícios no catálogo\n`)
}

main().catch((err) => {
  console.error('❌ Erro inesperado:', err)
  process.exit(1)
})
