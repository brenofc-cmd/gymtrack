import { cn } from '@/lib/utils'
import { BACK_BODY, FRONT_BODY, type BodyViewData } from '@/lib/training/body-model-data'
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

const SILHOUETTE = '#4b515c'
const PRIMARY_FILL = '#e5484d'
const SECONDARY_FILL = '#f2909380'

function regionFill(region: MuscleRegion, primary: MuscleRegion[], secondary: MuscleRegion[]) {
  if (primary.includes(region)) return PRIMARY_FILL
  if (secondary.includes(region)) return SECONDARY_FILL
  return SILHOUETTE
}

function BodySvg({
  body,
  primary,
  secondary,
  title,
}: {
  body: BodyViewData
  primary: MuscleRegion[]
  secondary: MuscleRegion[]
  title: string
}) {
  return (
    <svg viewBox="0 0 100 200" className="h-full w-full">
      <title>{title}</title>
      {body.decorative.map((points, index) => (
        <polygon key={`decorative-${index}`} points={points} fill={SILHOUETTE} />
      ))}
      {(Object.entries(body.regions) as Array<[MuscleRegion, string[]]>).map(([region, polygons]) => {
        const fill = regionFill(region, primary, secondary)
        const active = fill !== SILHOUETTE
        return polygons.map((points, index) => (
          <polygon key={`${region}-${index}`} points={points} fill={fill}>
            {active && <title>{MUSCLE_REGION_LABEL[region]}</title>}
          </polygon>
        ))
      })}
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
              <BodySvg body={FRONT_BODY} primary={primary} secondary={secondary} title="Vista frontal" />
            </div>
            <figcaption className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Frente</figcaption>
          </figure>
        )}
        {showBack && (
          <figure className="rounded-2xl border border-border bg-secondary/20 p-3">
            <div className="aspect-[1/2]">
              <BodySvg body={BACK_BODY} primary={primary} secondary={secondary} title="Vista de costas" />
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
