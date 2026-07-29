/**
 * Volume planejado calculado do BANCO (workout_exercises ativos e visíveis),
 * não da definição estática da rotina — P0.4 da auditoria final.
 *
 * Motivo: a reconciliação do Abdômen Diário oculta (is_hidden) os exercícios
 * abdominais da ficha principal. A constante estática VOLUME_SEMANAL_ALVO
 * ainda conta essas séries (11 de abdômen), então ela não representa o que o
 * usuário realmente tem na ficha. O abdômen treinado nas sessões matinais é
 * exibido em seção separada, nunca somado a este painel.
 */

export type PlannedExerciseRow = {
  target_sets: number
  is_hidden: boolean
  muscle_group: string
  secondary_muscles: string[] | null
}

/** Séries diretas planejadas por músculo — ignora exercícios ocultos. */
export function aggregatePlannedVolume(rows: PlannedExerciseRow[]): Record<string, number> {
  const volume: Record<string, number> = {}
  for (const row of rows) {
    if (row.is_hidden) continue
    volume[row.muscle_group] = (volume[row.muscle_group] ?? 0) + row.target_sets
  }
  return volume
}

/** Contribuição indireta estimada (0,5/série) por músculo secundário — separada, nunca somada. */
export function aggregatePlannedIndirect(rows: PlannedExerciseRow[]): Record<string, number> {
  const volume: Record<string, number> = {}
  for (const row of rows) {
    if (row.is_hidden) continue
    for (const muscle of row.secondary_muscles ?? []) {
      volume[muscle] = (volume[muscle] ?? 0) + row.target_sets * 0.5
    }
  }
  return volume
}
