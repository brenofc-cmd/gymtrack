import { cn } from '@/lib/utils'
import {
  inferExerciseMotion,
  inferMuscleHighlight,
  MOTION_LABEL,
  type ExerciseMotion,
  type MuscleHighlight,
} from '@/lib/exercise-animation'

type ExerciseAnimationProps = {
  name: string
  primaryMuscle?: string | null
  movementPattern?: string | null
  className?: string
  compact?: boolean
}

function MotionTransform({ motion }: { motion: ExerciseMotion }) {
  if (motion === 'squat') {
    return <animateTransform attributeName="transform" type="translate" values="0 0;0 26;0 0" dur="2.4s" repeatCount="indefinite" />
  }
  if (motion === 'lunge') {
    return <animateTransform attributeName="transform" type="translate" values="-8 0;10 18;-8 0" dur="2.8s" repeatCount="indefinite" />
  }
  if (motion === 'calf_raise') {
    return <animateTransform attributeName="transform" type="translate" values="0 5;0 -7;0 5" dur="1.8s" repeatCount="indefinite" />
  }
  if (motion === 'cardio') {
    return <animateTransform attributeName="transform" type="translate" values="-8 0;8 0;-8 0" dur="1.4s" repeatCount="indefinite" />
  }
  if (motion === 'trunk_flexion' || motion === 'pelvic_curl') {
    return <animateTransform attributeName="transform" type="rotate" values="0 120 112;-14 120 112;0 120 112" dur="2.2s" repeatCount="indefinite" />
  }
  if (motion === 'hip_hinge') {
    return <animateTransform attributeName="transform" type="rotate" values="0 120 104;22 120 104;0 120 104" dur="2.7s" repeatCount="indefinite" />
  }
  return <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="2.4s" repeatCount="indefinite" />
}

function LimbMotion({ motion, side }: { motion: ExerciseMotion; side: 'left' | 'right' }) {
  const direction = side === 'left' ? -1 : 1
  if (motion === 'vertical_push') {
    return <animateTransform attributeName="transform" type="rotate" values={`0 120 70;${direction * 48} 120 70;0 120 70`} dur="2.1s" repeatCount="indefinite" />
  }
  if (motion === 'vertical_pull') {
    return <animateTransform attributeName="transform" type="rotate" values={`${direction * 48} 120 70;0 120 70;${direction * 48} 120 70`} dur="2.1s" repeatCount="indefinite" />
  }
  if (motion === 'lateral_raise' || motion === 'rear_delt') {
    return <animateTransform attributeName="transform" type="rotate" values={`0 120 70;${direction * 58} 120 70;0 120 70`} dur="2.2s" repeatCount="indefinite" />
  }
  if (motion === 'horizontal_push' || motion === 'incline_push') {
    return <animateTransform attributeName="transform" type="translate" values={`0 0;${direction * 13} -8;0 0`} dur="2s" repeatCount="indefinite" />
  }
  if (motion === 'horizontal_pull') {
    return <animateTransform attributeName="transform" type="translate" values={`${direction * 12} -5;0 4;${direction * 12} -5`} dur="2.1s" repeatCount="indefinite" />
  }
  if (motion === 'elbow_flexion') {
    return <animateTransform attributeName="transform" type="rotate" values={`0 120 76;${direction * 34} 120 76;0 120 76`} dur="1.9s" repeatCount="indefinite" />
  }
  if (motion === 'elbow_extension') {
    return <animateTransform attributeName="transform" type="rotate" values={`${direction * 32} 120 76;0 120 76;${direction * 32} 120 76`} dur="2s" repeatCount="indefinite" />
  }
  if (motion === 'anti_rotation') {
    return <animateTransform attributeName="transform" type="rotate" values={`-10 120 82;10 120 82;-10 120 82`} dur="2.5s" repeatCount="indefinite" />
  }
  return null
}

function TargetMuscles({ muscle }: { muscle: MuscleHighlight }) {
  const red = '#ef3340'
  return (
    <g fill={red} stroke={red} strokeLinecap="round">
      {(muscle === 'chest' || muscle === 'full_body') && (
        <>
          <ellipse cx="111" cy="78" rx="8" ry="6" />
          <ellipse cx="129" cy="78" rx="8" ry="6" />
        </>
      )}
      {(muscle === 'shoulders' || muscle === 'full_body') && (
        <>
          <circle cx="94" cy="73" r="6" />
          <circle cx="146" cy="73" r="6" />
        </>
      )}
      {muscle === 'triceps' && (
        <>
          <line x1="88" y1="78" x2="77" y2="99" strokeWidth="7" />
          <line x1="152" y1="78" x2="163" y2="99" strokeWidth="7" />
        </>
      )}
      {muscle === 'biceps' && (
        <>
          <line x1="91" y1="77" x2="81" y2="97" strokeWidth="7" />
          <line x1="149" y1="77" x2="159" y2="97" strokeWidth="7" />
        </>
      )}
      {(muscle === 'back' || muscle === 'traps' || muscle === 'full_body') && (
        <path d="M107 70h26l-4 30h-18z" opacity={muscle === 'traps' ? 0.8 : 1} />
      )}
      {(muscle === 'core' || muscle === 'full_body') && (
        <rect x="111" y="88" width="18" height="22" rx="7" />
      )}
      {(muscle === 'glutes' || muscle === 'full_body') && (
        <ellipse cx="120" cy="112" rx="17" ry="8" />
      )}
      {(muscle === 'quads' || muscle === 'full_body') && (
        <>
          <line x1="110" y1="118" x2="101" y2="143" strokeWidth="9" />
          <line x1="130" y1="118" x2="139" y2="143" strokeWidth="9" />
        </>
      )}
      {muscle === 'hamstrings' && (
        <>
          <line x1="110" y1="119" x2="103" y2="143" strokeWidth="9" />
          <line x1="130" y1="119" x2="137" y2="143" strokeWidth="9" />
        </>
      )}
      {muscle === 'calves' && (
        <>
          <line x1="101" y1="147" x2="98" y2="166" strokeWidth="8" />
          <line x1="139" y1="147" x2="142" y2="166" strokeWidth="8" />
        </>
      )}
    </g>
  )
}

export function ExerciseAnimation({
  name,
  primaryMuscle,
  movementPattern,
  className,
  compact = false,
}: ExerciseAnimationProps) {
  const motion = inferExerciseMotion(name, movementPattern)
  const muscle = inferMuscleHighlight(primaryMuscle)
  const hasBarbell =
    !/barra fixa/i.test(name) &&
    /barra|barbell|agachamento|supino|terra|deadlift|stiff|yates/i.test(name)

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden bg-[#0f151c]', className)}
      role="img"
      aria-label={`Animação anatômica de ${name}; ${primaryMuscle ?? 'músculos trabalhados'} em vermelho`}
    >
      <svg viewBox="0 0 240 190" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
        <rect width="240" height="190" fill="#0f151c" />
        <circle cx="120" cy="88" r="68" fill="#18212a" opacity="0.65" />
        <path d="M32 174h176" stroke="#34414e" strokeWidth="2" strokeLinecap="round" />

        {hasBarbell && (
          <g stroke="#8d99a6" strokeWidth="4" strokeLinecap="round">
            <path d="M67 65h106" />
            <path d="M75 54v22M165 54v22" strokeWidth="7" />
          </g>
        )}

        {motion === 'vertical_pull' && (
          <g stroke="#8d99a6" strokeLinecap="round">
            <path d="M70 34h100" strokeWidth="5" />
            <path d="M80 30v10M160 30v10" strokeWidth="3" />
          </g>
        )}

        {motion === 'cardio' && (
          <g>
            <path d="M54 168h134l13 8H43z" fill="#485767" />
            <path d="M171 83l21 85" stroke="#667687" strokeWidth="5" />
            <rect x="161" y="77" width="27" height="13" rx="4" fill="#a3e635" />
          </g>
        )}

        <g>
          <MotionTransform motion={motion} />
          <g fill="none" stroke="#f4f7fa" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="120" cy="48" r="13" fill="#f4f7fa" strokeWidth="2" />
            <path d="M103 68Q120 59 137 68l-3 45q-14 9-28 0z" fill="#f4f7fa" strokeWidth="2" />

            <g>
              <LimbMotion motion={motion} side="left" />
              <path d="M101 72L82 101L70 124" strokeWidth="12" />
              <circle cx="69" cy="126" r="7" fill="#f4f7fa" strokeWidth="2" />
            </g>
            <g>
              <LimbMotion motion={motion} side="right" />
              <path d="M139 72L158 101L170 124" strokeWidth="12" />
              <circle cx="171" cy="126" r="7" fill="#f4f7fa" strokeWidth="2" />
            </g>

            <path d="M110 113L101 145L97 169" strokeWidth="14" />
            <path d="M130 113L139 145L143 169" strokeWidth="14" />
            <path d="M87 172h17M136 172h17" strokeWidth="8" />
          </g>

          <TargetMuscles muscle={muscle} />
        </g>

        {!compact && (
          <g>
            <rect x="12" y="12" width="82" height="21" rx="10.5" fill="#ef3340" opacity="0.16" />
            <circle cx="25" cy="22.5" r="4" fill="#ef3340" />
            <text x="35" y="26" fill="#ff838b" fontSize="9" fontWeight="700">MÚSCULO-ALVO</text>
            <text x="228" y="181" textAnchor="end" fill="#98a3b3" fontSize="9" fontWeight="600">
              {MOTION_LABEL[motion]}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
