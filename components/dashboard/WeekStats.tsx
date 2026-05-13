import { formatDurationLong } from '@/lib/utils/time'
import { formatVolume } from '@/lib/utils/volume'

interface WeekStatsProps {
  sessionCount: number
  totalSeconds: number
  totalVolumeKg: number
}

export function WeekStats({ sessionCount, totalSeconds, totalVolumeKg }: WeekStatsProps) {
  if (sessionCount === 0) return null

  return (
    <p className="text-sm text-muted-foreground text-center">
      <span className="text-foreground font-medium">{sessionCount}</span>{' '}
      {sessionCount === 1 ? 'treino' : 'treinos'} esta semana
      {totalSeconds > 0 && (
        <>
          {' '}·{' '}
          <span className="text-foreground font-medium">
            {formatDurationLong(totalSeconds)}
          </span>
        </>
      )}
      {totalVolumeKg > 0 && (
        <>
          {' '}·{' '}
          <span className="text-foreground font-medium">
            {formatVolume(totalVolumeKg)}
          </span>{' '}
          de volume
        </>
      )}
    </p>
  )
}
