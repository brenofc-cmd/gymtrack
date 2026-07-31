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
        Em vermelho forte o músculo principal, em vermelho claro os secundários. Diagrama anatômico
        adaptado de{' '}
        <a className="underline" href="https://github.com/giavinh79/react-body-highlighter" target="_blank" rel="noreferrer">
          react-body-highlighter
        </a>{' '}
        (MIT License).
      </p>
    </BottomSheet>
  )
}
