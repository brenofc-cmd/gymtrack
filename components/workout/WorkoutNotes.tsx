'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkoutNotesProps {
  notes: string
}

export function WorkoutNotes({ notes }: WorkoutNotesProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left text-sm font-medium"
      >
        <span className="text-muted-foreground">Notas do treino</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
          {notes}
        </div>
      )}
    </div>
  )
}
