'use client'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { whyThisWeight, type WhyThisWeightInput } from '@/lib/training/prescription'

interface WhyThisWeightSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  input: WhyThisWeightInput | null
}

export function WhyThisWeightSheet({ open, onOpenChange, input }: WhyThisWeightSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Por que este peso?" description="Como o GymTrack chegou nesta recomendação">
      <p className="text-sm leading-relaxed text-foreground">
        {input ? whyThisWeight(input) : 'Ainda não há dados suficientes para explicar esta carga — escolha manualmente e registre a série normalmente.'}
      </p>
    </BottomSheet>
  )
}
