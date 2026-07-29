export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}min`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function formatDurationLong(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)

  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m}min`
}

export function secondsFromDates(start: string, end: string): number {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 1000
  )
}

/** Semanas (mínimo 1) desde uma data — avaliado no momento da requisição. */
export function weeksSince(dateStr: string): number {
  return Math.max(
    1,
    Math.round((Date.now() - new Date(dateStr).getTime()) / (7 * 24 * 60 * 60 * 1000))
  )
}

/** Segundos decorridos desde um timestamp ISO até agora. */
export function secondsSince(startedAt: string): number {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
}
