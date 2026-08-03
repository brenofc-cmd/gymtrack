'use client'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { barbellPlateBreakdown, type EquipmentProfile } from '@/lib/progression/plate-calculator'

interface PlateBreakdownSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalKg: number | null
  equipment: Pick<EquipmentProfile, 'barWeightKg' | 'smallestPlateKg'>
}

export function PlateBreakdownSheet({ open, onOpenChange, totalKg, equipment }: PlateBreakdownSheetProps) {
  const breakdown = totalKg != null && totalKg > 0 ? barbellPlateBreakdown(totalKg, equipment) : null

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Montagem da barra" description="Anilhas por lado, com o equipamento cadastrado">
      {breakdown ? (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Barra: <span className="font-semibold text-foreground">{breakdown.barWeightKg} kg</span>
            {' · '}Total montado: <span className="font-semibold text-foreground">{breakdown.achievedKg} kg</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {breakdown.platesPerSide.length === 0 && (
              <span className="text-muted-foreground">Sem anilhas — apenas a barra.</span>
            )}
            {breakdown.platesPerSide.map((plate, index) => (
              <span key={index} className="rounded-lg border border-input bg-secondary px-3 py-1.5 font-mono text-xs font-bold">
                {plate} kg
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Repita a mesma combinação do outro lado da barra.</p>
          {breakdown.achievedKg !== totalKg && (
            <p className="text-[11px] font-semibold text-[var(--warn-text)]">
              Carga arredondada para o executável mais próximo com as anilhas cadastradas ({totalKg} kg pedido → {breakdown.achievedKg} kg montado).
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Defina uma carga para ver a montagem da barra.</p>
      )}
    </BottomSheet>
  )
}
