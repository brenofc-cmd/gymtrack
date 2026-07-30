import {
  classifyExerciseStimulus,
  TRAINING_STIMULUS_LABEL,
} from '@/lib/training/stimulus'
import { cn } from '@/lib/utils'

export function TrainingStimulusBadge({
  exercise,
}: {
  exercise: {
    prescription_type?: string | null
    target_reps_min: number
    target_reps_max: number
    exercise_type?: string | null
  }
}) {
  const stimulus = classifyExerciseStimulus(exercise)
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
        stimulus === 'strength' && 'border-[#5ba8ff]/30 bg-[#5ba8ff]/10 text-[#8dc5ff]',
        stimulus === 'mixed' && 'border-[#c58bff]/30 bg-[#c58bff]/10 text-[#d5adff]',
        stimulus === 'hypertrophy' && 'border-primary/25 bg-primary/10 text-primary'
      )}
    >
      {TRAINING_STIMULUS_LABEL[stimulus]}
    </span>
  )
}
