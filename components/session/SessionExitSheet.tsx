'use client'

import { useState } from 'react'
import { Loader2, Pause, Save, Trash2 } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'

interface SessionExitSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExit: (pause: boolean) => void
  onCancelWorkout: () => Promise<void>
}

export function SessionExitSheet({
  open,
  onOpenChange,
  onExit,
  onCancelWorkout,
}: SessionExitSheetProps) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmCancel(false)
        onOpenChange(next)
      }}
      title="Sair do modo de treino?"
      description="As séries registradas já estão guardadas. Você poderá voltar a esta sessão."
    >
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onExit(false)}
          className="flex min-h-14 w-full items-center gap-3 rounded-xl bg-primary px-4 text-left text-sm font-extrabold text-primary-foreground"
        >
          <Save className="size-5" />
          <span><span className="block">Salvar e sair</span><span className="block text-[10px] font-medium opacity-75">O tempo continua correndo</span></span>
        </button>
        <button
          type="button"
          onClick={() => onExit(true)}
          className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-input bg-secondary/35 px-4 text-left text-sm font-bold"
        >
          <Pause className="size-5 text-primary" />
          <span><span className="block">Pausar e sair</span><span className="block text-[10px] font-medium text-muted-foreground">O tempo pausado não entra na duração</span></span>
        </button>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="min-h-12 w-full rounded-xl text-sm font-semibold text-muted-foreground"
        >
          Continuar treino
        </button>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        {!confirmCancel ? (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-destructive"
          >
            <Trash2 className="size-4" /> Cancelar este treino
          </button>
        ) : (
          <div className="rounded-xl bg-destructive/10 p-3">
            <p className="text-xs leading-relaxed text-destructive">
              Isso apaga esta sessão e as séries registradas nela. Seu histórico anterior não será alterado.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                disabled={cancelling}
                className="min-h-11 rounded-xl border border-input text-xs font-bold"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={async () => {
                  setCancelling(true)
                  setCancelError(null)
                  try {
                    await onCancelWorkout()
                  } catch {
                    setCancelError('Não foi possível cancelar agora. A sessão continua salva.')
                    setCancelling(false)
                  }
                }}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-destructive text-xs font-bold text-white disabled:opacity-60"
              >
                {cancelling && <Loader2 className="size-4 animate-spin" />}
                Apagar treino
              </button>
            </div>
            {cancelError && <p role="alert" className="mt-2 text-xs text-destructive">{cancelError}</p>}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
