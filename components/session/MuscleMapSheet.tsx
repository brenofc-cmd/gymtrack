'use client'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { MuscleDiagram } from '@/components/exercise/MuscleDiagram'
import type { Exercise } from '@/types/database'

interface MuscleMapSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: Exercise
}

export function MuscleMapSheet({ open, onOpenChange, exercise }: MuscleMapSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Músculos trabalhados"
      description={exercise.name_pt}
    >
      <MuscleDiagram
        primaryMuscle={exercise.muscle_group}
        secondaryMuscles={exercise.secondary_muscles}
      />
      <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
        Diagrama ilustrativo do GymTrack — em vermelho forte o músculo principal, em vermelho claro os secundários.
      </p>
    </BottomSheet>
  )
}
