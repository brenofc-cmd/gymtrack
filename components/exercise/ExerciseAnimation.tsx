import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  DEFAULT_EXERCISE_IMAGE,
  getExerciseFinishImage,
  getExerciseImage,
  getExerciseVideo,
} from '@/lib/exercise-media'

type ExerciseAnimationProps = {
  name: string
  primaryMuscle?: string | null
  movementPattern?: string | null
  mediaUrl?: string | null
  className?: string
  compact?: boolean
}

export function ExerciseAnimation({
  name,
  primaryMuscle,
  mediaUrl,
  className,
  compact = false,
}: ExerciseAnimationProps) {
  const imageUrl = getExerciseImage(mediaUrl)
  const finishImageUrl = getExerciseFinishImage(imageUrl)
  const video = compact ? null : getExerciseVideo(name)
  const description = `${name}; foco em ${primaryMuscle ?? 'músculos trabalhados'}`

  if (video) {
    return (
      <figure className={cn('relative h-full w-full overflow-hidden bg-black', className)}>
        <video
          className="h-full w-full object-contain"
          autoPlay
          controls
          loop
          muted
          playsInline
          preload="metadata"
          poster={imageUrl === DEFAULT_EXERCISE_IMAGE ? undefined : imageUrl}
          aria-label={`Vídeo real de execução: ${description}`}
        >
          <source src={video.url} type="video/mp4" />
          Seu navegador não conseguiu reproduzir o vídeo de {name}.
        </video>
        <figcaption className="absolute inset-x-0 top-0 bg-black/75 px-2 py-1 text-center text-[8px] font-medium text-white/80">
          Goulart /{' '}
          <a className="underline" href={video.sourceUrl} target="_blank" rel="noreferrer">
            {video.provider}
          </a>
          {' · '}
          <a className="underline" href={video.licenseUrl} target="_blank" rel="noreferrer">
            {video.license}
          </a>
        </figcaption>
      </figure>
    )
  }

  if (compact || !finishImageUrl || imageUrl === DEFAULT_EXERCISE_IMAGE) {
    return (
      <div
        className={cn('relative h-full w-full overflow-hidden bg-zinc-950', className)}
        role="img"
        aria-label={`Foto de execução: ${description}`}
      >
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={compact ? '96px' : '(max-width: 640px) 100vw, 512px'}
          className="object-cover"
        />
      </div>
    )
  }

  return (
    <figure
      className={cn('grid h-full w-full grid-cols-2 overflow-hidden bg-zinc-950', className)}
      aria-label={`Fotos reais de início e fim: ${description}`}
    >
      <div className="relative min-w-0 border-r border-white/10">
        <Image
          src={imageUrl}
          alt={`Posição inicial de ${name}`}
          fill
          sizes="(max-width: 640px) 50vw, 256px"
          className="object-contain"
        />
        <span className="absolute bottom-2 left-2 rounded-full bg-black/75 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
          Início
        </span>
      </div>
      <div className="relative min-w-0">
        <Image
          src={finishImageUrl}
          alt={`Posição final de ${name}`}
          fill
          sizes="(max-width: 640px) 50vw, 256px"
          className="object-contain"
        />
        <span className="absolute bottom-2 right-2 rounded-full bg-black/75 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
          Final
        </span>
      </div>
    </figure>
  )
}
