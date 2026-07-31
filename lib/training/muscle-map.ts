/**
 * Mapeia os nomes de músculo já usados no catálogo (muscle_group e
 * secondary_muscles) para regiões de um diagrama corporal front/costas.
 * Não depende de imagem externa: o diagrama é desenhado em SVG próprio,
 * então não há questão de licenciamento de foto de terceiros.
 */
export type MuscleRegion =
  | 'chest'
  | 'shoulders_front'
  | 'shoulders_back'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'adductors'
  | 'traps'
  | 'upper_back'
  | 'lower_back'
  | 'glutes'
  | 'hamstrings'
  | 'calves'

export const MUSCLE_REGION_LABEL: Record<MuscleRegion, string> = {
  chest: 'Peito',
  shoulders_front: 'Ombro (frente)',
  shoulders_back: 'Ombro (trás)',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraços',
  abs: 'Abdômen',
  obliques: 'Oblíquos',
  quads: 'Quadríceps',
  adductors: 'Adutores',
  traps: 'Trapézio',
  upper_back: 'Costas',
  lower_back: 'Lombar',
  glutes: 'Glúteos',
  hamstrings: 'Isquiotibiais',
  calves: 'Panturrilha',
}

export const FRONT_REGIONS: ReadonlySet<MuscleRegion> = new Set([
  'chest', 'shoulders_front', 'biceps', 'forearms', 'abs', 'obliques', 'quads', 'adductors',
])

export const BACK_REGIONS: ReadonlySet<MuscleRegion> = new Set([
  'traps', 'upper_back', 'shoulders_back', 'triceps', 'lower_back', 'glutes', 'hamstrings', 'calves',
])

const MUSCLE_NAME_TO_REGIONS: Record<string, MuscleRegion[]> = {
  'peito': ['chest'],
  'ombro': ['shoulders_front', 'shoulders_back'],
  'ombros': ['shoulders_front', 'shoulders_back'],
  'deltoide lateral': ['shoulders_front', 'shoulders_back'],
  'deltoide anterior': ['shoulders_front'],
  'deltoide posterior': ['shoulders_back'],
  'bíceps': ['biceps'],
  'braquial': ['biceps'],
  'tríceps': ['triceps'],
  'antebraços': ['forearms'],
  'braquiorradial': ['forearms'],
  'abdômen': ['abs'],
  'core': ['abs'],
  'oblíquos': ['obliques'],
  'estabilizadores': ['abs'],
  'quadríceps': ['quads'],
  'adutores': ['adductors'],
  'isquiotibiais': ['hamstrings'],
  'glúteos': ['glutes'],
  'panturrilha': ['calves'],
  'costas': ['upper_back'],
  'parte superior das costas': ['upper_back'],
  'trapézio': ['traps'],
  'eretores da coluna': ['lower_back'],
  'lombar': ['lower_back'],
  'cadeia posterior': ['lower_back', 'glutes', 'hamstrings'],
}

export function musclesToRegions(muscleName: string | null | undefined): MuscleRegion[] {
  if (!muscleName) return []
  return MUSCLE_NAME_TO_REGIONS[muscleName.trim().toLowerCase()] ?? []
}

export interface MuscleHighlight {
  primary: MuscleRegion[]
  secondary: MuscleRegion[]
  showFront: boolean
  showBack: boolean
}

export function computeMuscleHighlight(
  primaryMuscle: string | null | undefined,
  secondaryMuscles: string[] | null | undefined
): MuscleHighlight {
  const primary = musclesToRegions(primaryMuscle)
  const primarySet = new Set(primary)
  const secondary = Array.from(
    new Set((secondaryMuscles ?? []).flatMap(musclesToRegions).filter((region) => !primarySet.has(region)))
  )
  const all = [...primary, ...secondary]
  return {
    primary,
    secondary,
    showFront: all.some((region) => FRONT_REGIONS.has(region)),
    showBack: all.some((region) => BACK_REGIONS.has(region)),
  }
}
