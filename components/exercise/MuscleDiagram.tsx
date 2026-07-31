import { cn } from '@/lib/utils'
import {
  computeMuscleHighlight,
  MUSCLE_REGION_LABEL,
  type MuscleRegion,
} from '@/lib/training/muscle-map'

interface MuscleDiagramProps {
  primaryMuscle: string | null | undefined
  secondaryMuscles?: string[] | null
  className?: string
}

const SILHOUETTE = '#3a3f47'
const PRIMARY_FILL = '#e5484d'
const SECONDARY_FILL = '#e5484d80'

/** Path de retângulo arredondado (evita arcos inválidos escritos à mão). */
function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const rx = Math.min(r, w / 2, h / 2)
  return [
    `M${x + rx},${y}`,
    `H${x + w - rx}`,
    `A${rx},${rx} 0 0 1 ${x + w},${y + rx}`,
    `V${y + h - rx}`,
    `A${rx},${rx} 0 0 1 ${x + w - rx},${y + h}`,
    `H${x + rx}`,
    `A${rx},${rx} 0 0 1 ${x},${y + h - rx}`,
    `V${y + rx}`,
    `A${rx},${rx} 0 0 1 ${x + rx},${y}`,
    'Z',
  ].join(' ')
}

/** Path de círculo (usado para cabeça, ombros e cotovelos). */
function circlePath(cx: number, cy: number, r: number): string {
  return `M${cx - r},${cy} a${r},${r} 0 1 1 ${2 * r},0 a${r},${r} 0 1 1 -${2 * r},0 Z`
}

function regionFill(region: MuscleRegion, primary: MuscleRegion[], secondary: MuscleRegion[]) {
  if (primary.includes(region)) return PRIMARY_FILL
  if (secondary.includes(region)) return SECONDARY_FILL
  return SILHOUETTE
}

function Region({
  region,
  primary,
  secondary,
  d,
}: {
  region: MuscleRegion
  primary: MuscleRegion[]
  secondary: MuscleRegion[]
  d: string
}) {
  const fill = regionFill(region, primary, secondary)
  const active = fill !== SILHOUETTE
  return (
    <path d={d} fill={fill} role={active ? 'img' : undefined}>
      {active && <title>{MUSCLE_REGION_LABEL[region]}</title>}
    </path>
  )
}

function FrontBody({ primary, secondary }: { primary: MuscleRegion[]; secondary: MuscleRegion[] }) {
  return (
    <svg viewBox="0 0 160 320" className="h-full w-full">
      <title>Vista frontal</title>
      {/* Silhueta base decorativa (cabeça, pescoço, quadril, pernas, mãos, pés, cotovelos) */}
      <path d={circlePath(80, 22, 16)} fill={SILHOUETTE} />
      <path d={roundedRect(72, 36, 16, 12, 4)} fill={SILHOUETTE} />
      <path d={roundedRect(56, 136, 48, 26, 10)} fill={SILHOUETTE} />
      <path d={roundedRect(56, 234, 18, 58, 8)} fill={SILHOUETTE} />
      <path d={roundedRect(86, 234, 18, 58, 8)} fill={SILHOUETTE} />
      <path d={roundedRect(54, 296, 22, 14, 6)} fill={SILHOUETTE} />
      <path d={roundedRect(84, 296, 22, 14, 6)} fill={SILHOUETTE} />
      <path d={circlePath(26, 152, 8)} fill={SILHOUETTE} />
      <path d={circlePath(134, 152, 8)} fill={SILHOUETTE} />

      {/* Regiões destacáveis */}
      <Region region="shoulders_front" primary={primary} secondary={secondary} d={`${circlePath(48, 46, 14)} ${circlePath(112, 46, 14)}`} />
      <Region region="chest" primary={primary} secondary={secondary} d={roundedRect(54, 50, 52, 28, 14)} />
      <Region region="biceps" primary={primary} secondary={secondary} d={`${roundedRect(30, 60, 16, 50, 8)} ${roundedRect(114, 60, 16, 50, 8)}`} />
      <Region region="forearms" primary={primary} secondary={secondary} d={`${roundedRect(22, 112, 14, 40, 7)} ${roundedRect(124, 112, 14, 40, 7)}`} />
      <Region region="abs" primary={primary} secondary={secondary} d={roundedRect(62, 90, 36, 44, 8)} />
      <Region region="obliques" primary={primary} secondary={secondary} d={`${roundedRect(48, 92, 10, 42, 4)} ${roundedRect(102, 92, 10, 42, 4)}`} />
      <Region region="quads" primary={primary} secondary={secondary} d={`${roundedRect(54, 162, 20, 66, 8)} ${roundedRect(86, 162, 20, 66, 8)}`} />
      <Region region="adductors" primary={primary} secondary={secondary} d={roundedRect(74, 168, 12, 56, 5)} />
    </svg>
  )
}

function BackBody({ primary, secondary }: { primary: MuscleRegion[]; secondary: MuscleRegion[] }) {
  return (
    <svg viewBox="0 0 160 320" className="h-full w-full">
      <title>Vista de costas</title>
      <path d={circlePath(80, 22, 16)} fill={SILHOUETTE} />
      <path d={roundedRect(72, 36, 16, 12, 4)} fill={SILHOUETTE} />
      <path d={roundedRect(54, 296, 22, 14, 6)} fill={SILHOUETTE} />
      <path d={roundedRect(84, 296, 22, 14, 6)} fill={SILHOUETTE} />
      <path d={circlePath(26, 152, 8)} fill={SILHOUETTE} />
      <path d={circlePath(134, 152, 8)} fill={SILHOUETTE} />

      <Region region="traps" primary={primary} secondary={secondary} d={roundedRect(60, 42, 40, 26, 8)} />
      <Region region="shoulders_back" primary={primary} secondary={secondary} d={`${circlePath(48, 46, 14)} ${circlePath(112, 46, 14)}`} />
      <Region region="upper_back" primary={primary} secondary={secondary} d={roundedRect(52, 68, 56, 40, 12)} />
      <Region region="triceps" primary={primary} secondary={secondary} d={`${roundedRect(30, 60, 16, 50, 8)} ${roundedRect(114, 60, 16, 50, 8)}`} />
      <Region region="forearms" primary={primary} secondary={secondary} d={`${roundedRect(22, 112, 14, 40, 7)} ${roundedRect(124, 112, 14, 40, 7)}`} />
      <Region region="lower_back" primary={primary} secondary={secondary} d={roundedRect(64, 118, 32, 22, 8)} />
      <Region region="glutes" primary={primary} secondary={secondary} d={roundedRect(54, 140, 52, 30, 14)} />
      <Region region="hamstrings" primary={primary} secondary={secondary} d={`${roundedRect(54, 170, 20, 62, 8)} ${roundedRect(86, 170, 20, 62, 8)}`} />
      <Region region="calves" primary={primary} secondary={secondary} d={`${roundedRect(56, 234, 18, 58, 8)} ${roundedRect(86, 234, 18, 58, 8)}`} />
    </svg>
  )
}

export function MuscleDiagram({ primaryMuscle, secondaryMuscles, className }: MuscleDiagramProps) {
  const { primary, secondary, showFront, showBack } = computeMuscleHighlight(primaryMuscle, secondaryMuscles)
  const primaryLabels = primary.map((region) => MUSCLE_REGION_LABEL[region])
  const secondaryLabels = secondary.map((region) => MUSCLE_REGION_LABEL[region])

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-2 gap-3">
        {showFront && (
          <figure className="rounded-2xl border border-border bg-secondary/20 p-3">
            <div className="aspect-[1/2]">
              <FrontBody primary={primary} secondary={secondary} />
            </div>
            <figcaption className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Frente</figcaption>
          </figure>
        )}
        {showBack && (
          <figure className="rounded-2xl border border-border bg-secondary/20 p-3">
            <div className="aspect-[1/2]">
              <BackBody primary={primary} secondary={secondary} />
            </div>
            <figcaption className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Costas</figcaption>
          </figure>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: PRIMARY_FILL }} />
          <span className="text-foreground">Principal: {primaryLabels.join(', ') || '—'}</span>
        </span>
        {secondaryLabels.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: SECONDARY_FILL }} />
            <span className="text-muted-foreground">Secundário: {secondaryLabels.join(', ')}</span>
          </span>
        )}
      </div>
    </div>
  )
}
