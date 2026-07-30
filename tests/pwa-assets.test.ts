import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, statSync } from 'fs'
import path from 'path'
import manifest from '@/app/manifest'

/**
 * REGRESSÃO (bug P0 da auditoria 10/10): o manifest referenciava
 * /icons/icon-192.png e /icons/icon-512.png, mas public/icons/ não existia —
 * a PWA instalava sem ícone e as URLs davam 404. Este teste falha sempre que
 * um asset declarado não estiver no disco.
 */

const PUBLIC_DIR = path.resolve(__dirname, '../public')

function publicFile(url: string): string {
  return path.join(PUBLIC_DIR, url.replace(/^\//, ''))
}

/** Lê largura e altura do cabeçalho IHDR de um PNG. */
function pngSize(file: string): { width: number; height: number } {
  const buffer = readFileSync(file)
  expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

describe('assets do manifest existem de verdade', () => {
  const icons = manifest().icons ?? []

  it('o manifest declara pelo menos um ícone', () => {
    expect(icons.length).toBeGreaterThan(0)
  })

  it.each(icons.map((icon) => [icon.src, icon.sizes, icon.purpose] as const))(
    'o arquivo %s existe, é PNG e tem exatamente %s',
    (src, sizes) => {
      const file = publicFile(src as string)
      expect(existsSync(file), `${src} não existe em public/`).toBe(true)
      expect(statSync(file).size).toBeGreaterThan(0)

      const [expectedWidth, expectedHeight] = (sizes as string).split('x').map(Number)
      const actual = pngSize(file)
      expect(actual.width).toBe(expectedWidth)
      expect(actual.height).toBe(expectedHeight)
    }
  )

  it('apple-touch-icon existe e está declarado no layout', () => {
    const file = publicFile('/icons/apple-touch-icon.png')
    expect(existsSync(file)).toBe(true)
    expect(pngSize(file)).toEqual({ width: 180, height: 180 })

    const layout = readFileSync(path.resolve(__dirname, '../app/layout.tsx'), 'utf-8')
    expect(layout).toContain('/icons/apple-touch-icon.png')
  })
})

describe('metadados do manifest', () => {
  const value = manifest()

  it('tem identidade completa para instalação', () => {
    expect(value.name).toBeTruthy()
    expect(value.short_name).toBeTruthy()
    expect((value.short_name as string).length).toBeLessThanOrEqual(12)
    expect(value.description).toBeTruthy()
    expect(value.start_url).toBe('/')
    expect(value.scope).toBe('/')
    expect(value.display).toBe('standalone')
    expect(value.lang).toBe('pt-BR')
  })

  it('cores de tema e fundo batem com os tokens do app', () => {
    const css = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf-8')
    expect(value.theme_color).toBe('#09090b')
    expect(value.background_color).toBe('#09090b')
    expect(css).toContain('#a3e635') // primária usada nos ícones
  })

  it('declara `any` e `maskable` em ícones SEPARADOS', () => {
    const icons = value.icons ?? []
    const any = icons.filter((icon) => icon.purpose === 'any')
    const maskable = icons.filter((icon) => icon.purpose === 'maskable')
    expect(any.length).toBeGreaterThanOrEqual(2)
    expect(maskable.length).toBeGreaterThanOrEqual(2)
    // Nenhum ícone acumula os dois propósitos (o recorte cortaria o desenho)
    for (const icon of icons) {
      expect(icon.purpose).not.toContain(' ')
    }
  })

  it('cobre 192 e 512 nos dois propósitos', () => {
    const icons = value.icons ?? []
    for (const purpose of ['any', 'maskable']) {
      const sizes = icons.filter((i) => i.purpose === purpose).map((i) => i.sizes)
      expect(sizes, purpose).toContain('192x192')
      expect(sizes, purpose).toContain('512x512')
    }
  })
})

describe('gerador de ícones é reprodutível', () => {
  it('o script está versionado e não depende de biblioteca externa', () => {
    const script = readFileSync(
      path.resolve(__dirname, '../scripts/generate-pwa-icons.mjs'),
      'utf-8'
    )
    expect(script).toContain("from 'node:zlib'")
    expect(script).not.toMatch(/from '(sharp|canvas|jimp)'/)
  })
})
