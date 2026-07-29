import { Flame, Trophy } from 'lucide-react'

interface StreakCardProps {
  streak: number
  longestStreak: number
}

const MESSAGES: Record<number, string> = {
  0: 'Hoje é um bom dia para treinar.',
  1: 'Boa, primeiro dia! Mantém o ritmo.',
  2: 'Dois dias seguidos. Está ficando sério.',
  3: 'Três dias! O hábito está se formando.',
  5: 'Uma semana de fogo. Imparável.',
  7: 'Sete dias seguidos. Disciplina total.',
  10: 'Dez dias! Você é uma máquina.',
  14: 'Duas semanas seguidas. Nível elite.',
  21: 'Três semanas. Isso já é estilo de vida.',
  30: 'Um mês inteiro. Lendário.',
}

function getMessage(streak: number): string {
  const keys = Object.keys(MESSAGES)
    .map(Number)
    .sort((a, b) => b - a)
  const key = keys.find((k) => streak >= k) ?? 0
  return MESSAGES[key]
}

export function StreakCard({ streak, longestStreak }: StreakCardProps) {
  const isRecord = streak > 0 && streak >= longestStreak

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
          <Flame
            className={
              streak > 0
                ? 'w-7 h-7 text-primary'
                : 'w-7 h-7 text-muted-foreground'
            }
            fill={streak > 0 ? 'currentColor' : 'none'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black tabular-nums text-foreground">
              {streak}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {streak === 1 ? 'dia seguido' : 'dias seguidos'}
            </span>
            {isRecord && (
              <span className="ml-1 flex items-center gap-0.5 text-xs font-semibold text-amber-500">
                <Trophy className="w-3 h-3" />
                recorde!
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {getMessage(streak)}
          </p>
        </div>
      </div>

      {longestStreak > 0 && !isRecord && (
        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Trophy className="w-3.5 h-3.5 text-amber-500/70" />
          <span>Maior sequência: <span className="text-foreground font-semibold">{longestStreak} {longestStreak === 1 ? 'dia' : 'dias'}</span></span>
        </div>
      )}

      {streak > 0 && (
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-primary/5 blur-2xl" />
      )}
    </div>
  )
}
