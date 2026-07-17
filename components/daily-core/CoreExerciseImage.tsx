import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CoreExerciseImageProps {
  src: string
  alt: string
  priority?: boolean
  className?: string
  sizes?: string
}

export function CoreExerciseImage({
  src,
  alt,
  priority = false,
  className,
  sizes = '(max-width: 520px) 92vw, 480px',
}: CoreExerciseImageProps) {
  return (
    <div className={cn('relative overflow-hidden bg-[#17191d]', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/[0.03]" />
    </div>
  )
}
