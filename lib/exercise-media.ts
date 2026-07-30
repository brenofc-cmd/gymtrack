export const DEFAULT_EXERCISE_IMAGE = '/exercises/placeholder.svg'

export type ExerciseVideoSource = {
  url: string
  author: string
  provider: string
  sourceUrl: string
  license: 'CC0' | 'CC BY-SA 3.0' | 'CC BY-SA 4.0'
  licenseUrl: string
}

type VideoRule = ExerciseVideoSource & {
  names: string[]
}

const CC_BY_SA_4_URL = 'https://creativecommons.org/licenses/by-sa/4.0/'

function wgerVideo(id: number, file: string, names: string[]): VideoRule {
  return {
    names,
    url: `/exercises/videos/${file}`,
    author: 'Goulart',
    provider: 'wger',
    sourceUrl: `https://wger.de/api/v2/exerciseinfo/${id}/`,
    // A licença deve ser a do objeto de vídeo, não a do exercício-base.
    // Todos os vídeos locais deste catálogo retornam license=2 na API wger.
    license: 'CC BY-SA 4.0',
    licenseUrl: CC_BY_SA_4_URL,
  }
}

const VIDEO_RULES: VideoRule[] = [
  wgerVideo(206, 'wger-206-dumbbell-walking-lunge.m4v', ['afundo caminhando']),
  wgerVideo(222, 'wger-222-face-pull.m4v', ['face pull']),
  wgerVideo(294, 'wger-294-hip-thrust.m4v', ['hip thrust']),
  wgerVideo(75, 'wger-75-dumbbell-bench-press.m4v', ['supino reto com halteres']),
  wgerVideo(91, 'wger-91-barbell-curl.m4v', ['rosca direta barra w', 'rosca direta com barra']),
  wgerVideo(73, 'wger-73-barbell-bench-press.m4v', ['supino reto com barra']),
  wgerVideo(194, 'wger-194-dips.m4v', ['paralelas']),
  wgerVideo(95, 'wger-95-cable-curl.m4v', ['rosca direta no cabo']),
  wgerVideo(211, 'wger-211-dumbbell-triceps-extension.m4v', ['extensao de triceps com halter']),
  wgerVideo(272, 'wger-272-hammer-curl.m4v', ['rosca martelo']),
  wgerVideo(246, 'wger-246-skull-crusher.m4v', ['triceps testa', 'skull crusher']),
  wgerVideo(365, 'wger-365-lying-leg-curl.m4v', ['cadeira flexora leg curl', 'flexora deitada', 'mesa flexora']),
  wgerVideo(366, 'wger-366-seated-leg-curl.m4v', ['flexora sentada']),
  wgerVideo(348, 'wger-348-lateral-raise.m4v', ['elevacao lateral com halteres']),
  wgerVideo(349, 'wger-349-one-arm-cable-lateral-raise.m4v', ['elevacao lateral unilateral no cabo']),
  wgerVideo(82, 'wger-82-bent-over-rear-delt-raise.m4v', ['crucifixo inverso reverse fly']),
  wgerVideo(341, 'wger-341-smith-squat.m4v', ['agachamento no smith']),
  wgerVideo(803, 'wger-803-one-arm-cable-triceps.m4v', ['triceps unilateral no cabo']),
  wgerVideo(367, 'wger-367-standing-leg-curl.m4v', ['flexora unilateral']),
  wgerVideo(375, 'wger-375-hack-squat.m4v', ['hack squat']),
  wgerVideo(477, 'wger-477-assisted-pull-up.m4v', ['barra fixa assistida']),
  wgerVideo(475, 'wger-475-pull-up.m4v', ['barra fixa', 'pull up']),
  wgerVideo(512, 'wger-512-seated-row.m4v', ['remada em maquina com apoio']),
  wgerVideo(543, 'wger-543-machine-shoulder-press.m4v', [
    'desenvolvimento sentado na maquina',
    'desenvolvimento sentado maquina ou halteres',
  ]),
  wgerVideo(538, 'wger-538-incline-barbell-bench-press.m4v', ['supino inclinado barra', 'supino inclinado com barra']),
  wgerVideo(567, 'wger-567-dumbbell-shoulder-press.m4v', ['desenvolvimento militar com halteres']),
  wgerVideo(590, 'wger-590-seated-calf-raise.m4v', ['panturrilha sentada']),
  wgerVideo(570, 'wger-570-shrug.m4v', ['encolhimento']),
  wgerVideo(622, 'wger-622-standing-calf-raise.m4v', ['panturrilha em pe']),
  wgerVideo(371, 'wger-371-leg-press.m4v', ['leg press']),
  wgerVideo(507, 'wger-507-romanian-deadlift.m4v', [
    'levantamento terra romeno',
    'terra romeno stiff',
    'stiff terra romeno',
  ]),
  wgerVideo(537, 'wger-537-incline-dumbbell-bench-press.m4v', ['supino inclinado com halteres']),
  wgerVideo(659, 'wger-659-cable-triceps-extension.m4v', ['triceps na corda', 'triceps pulldown']),
]

export function normalizeExerciseName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function getExerciseImage(imageUrl: string | null | undefined) {
  return imageUrl?.trim() || DEFAULT_EXERCISE_IMAGE
}

export function getExerciseFinishImage(imageUrl: string | null | undefined) {
  const source = imageUrl?.trim()
  if (!source || !source.startsWith('/exercises/') || !source.toLowerCase().endsWith('.jpg')) {
    return null
  }
  return source.replace(/\.jpg$/i, '_2.jpg')
}

export function getExerciseVideo(name: string): ExerciseVideoSource | null {
  const normalizedName = normalizeExerciseName(name)
  const rule = VIDEO_RULES.find((candidate) =>
    candidate.names.some((candidateName) => normalizedName.includes(candidateName))
  )
  if (!rule) return null
  return {
    url: rule.url,
    author: rule.author,
    provider: rule.provider,
    sourceUrl: rule.sourceUrl,
    license: rule.license,
    licenseUrl: rule.licenseUrl,
  }
}

export function getExerciseVideoCatalog(): ExerciseVideoSource[] {
  return VIDEO_RULES.map(({ names: _names, ...source }) => ({ ...source }))
}
