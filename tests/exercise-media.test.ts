import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  getExerciseFinishImage,
  getExerciseVideo,
  getExerciseVideoCatalog,
} from '@/lib/exercise-media'
import {
  DAVID_LAID_EXERCISE_CATALOG_V5,
  DAVID_LAID_PUBLIC_DUP_V5,
} from '@/lib/routine/david-laid-public-dup-v5'

function publicFile(url: string) {
  return join(process.cwd(), 'public', url.replace(/^\//, ''))
}

describe('mídias reais dos exercícios', () => {
  it('mantém duas fotos locais para todo exercício e substituição do DUP público', () => {
    const slugs = new Set(
      DAVID_LAID_PUBLIC_DUP_V5.flatMap((day) =>
        day.exercises.flatMap((exercise) => [exercise.exerciseSlug, ...exercise.substitutions])
      )
    )

    for (const slug of slugs) {
      const exercise = DAVID_LAID_EXERCISE_CATALOG_V5[slug]
      const finishImage = getExerciseFinishImage(exercise.imageUrl)
      expect(existsSync(publicFile(exercise.imageUrl)), `${slug}: início`).toBe(true)
      expect(finishImage, `${slug}: URL final`).not.toBeNull()
      expect(existsSync(publicFile(finishImage!)), `${slug}: final`).toBe(true)
    }
  })

  it('usa vídeo somente para correspondências conhecidas e licenciadas', () => {
    expect(getExerciseVideo('Supino reto com barra')?.url).toContain('wger-73-')
    expect(getExerciseVideo('Barra fixa')?.url).toContain('wger-475-')
    expect(getExerciseVideo('Levantamento terra romeno')?.license).toBe('CC BY-SA 4.0')
    expect(getExerciseVideo('Paralelas')?.license).toBe('CC BY-SA 4.0')
    expect(getExerciseVideo('Leg press')?.license).toBe('CC BY-SA 4.0')
    expect(getExerciseVideo('Elevação lateral unilateral no cabo')?.url).toContain('wger-349-')
    expect(getExerciseVideo('Crucifixo inverso (reverse fly)')?.url).toContain('wger-82-')
    expect(getExerciseVideo('Levantamento terra convencional')).toBeNull()
    expect(getExerciseVideo('Push press')).toBeNull()
  })

  it('atribui cada vídeo pelo objeto de mídia da wger', () => {
    for (const video of getExerciseVideoCatalog()) {
      expect(video.author).toBe('Goulart')
      expect(video.provider).toBe('wger')
      expect(video.license).toBe('CC BY-SA 4.0')
      expect(video.licenseUrl).toBe('https://creativecommons.org/licenses/by-sa/4.0/')
      expect(video.sourceUrl).toMatch(/^https:\/\/wger\.de\/api\/v2\/exerciseinfo\/\d+\/$/)
    }
  })

  it('tem no disco todos os vídeos selecionados para o DUP público', () => {
    const names = new Set(
      DAVID_LAID_PUBLIC_DUP_V5.flatMap((day) =>
        day.exercises.map((exercise) => exercise.name)
      )
    )

    for (const name of names) {
      const video = getExerciseVideo(name)
      if (video) expect(existsSync(publicFile(video.url)), name).toBe(true)
    }
  })
})
