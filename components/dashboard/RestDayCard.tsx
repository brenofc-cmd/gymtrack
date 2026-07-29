import { Moon } from 'lucide-react'

/** Card exibido no domingo — dia de descanso da rotina. */
export function RestDayCard() {
  return (
    <div className="relative rounded-2xl bg-card border border-border overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-7 -right-3 text-[160px] font-black leading-none text-primary/[0.05] pointer-events-none select-none"
      >
        Zz
      </div>
      <div className="relative p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
            Domingo
          </span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 border border-primary/20">
            <Moon className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-[24px] font-bold leading-tight tracking-tight">
            Dia de descanso
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          A recuperação faz parte do treino: é hoje que o corpo constrói o que você
          estimulou na semana. Priorize sono e alimentação — o Push A te espera amanhã.
        </p>
      </div>
    </div>
  )
}
