import { BatteryLow } from 'lucide-react'
import type { RecoveryAlert } from '@/lib/progression/recovery'

/** Alerta discreto de recuperação — sem diagnóstico, apenas sugestões. */
export function RecoveryAlertCard({ alert }: { alert: RecoveryAlert }) {
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <BatteryLow className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-sm font-semibold text-amber-500">Sinal de fadiga</p>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>
      <ul className="space-y-1">
        {alert.suggestions.map((s, i) => (
          <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
            <span className="text-amber-500 shrink-0">·</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}
