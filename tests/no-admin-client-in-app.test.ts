import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import path from 'path'

// Guarda de segurança: o client com service role (ignora RLS) é restrito a
// scripts administrativos. Nenhum código de app/ ou components/ pode usá-lo —
// todo o acesso a dados do caminho principal passa pelo cliente SSR do
// usuário, protegido pelas políticas RLS.

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...listSourceFiles(full))
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full)
    }
  }
  return files
}

describe('Guarda: service role fora do caminho principal', () => {
  const roots = ['app', 'components'].map((dir) => path.resolve(__dirname, '..', dir))

  it('nenhum arquivo de app/ ou components/ usa createAdminClient', () => {
    const offenders: string[] = []
    for (const root of roots) {
      for (const file of listSourceFiles(root)) {
        const content = readFileSync(file, 'utf-8')
        if (content.includes('createAdminClient') || content.includes('lib/supabase/admin')) {
          offenders.push(path.relative(path.resolve(__dirname, '..'), file))
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('nenhum arquivo de app/ ou components/ referencia a service role key', () => {
    const offenders: string[] = []
    for (const root of roots) {
      for (const file of listSourceFiles(root)) {
        const content = readFileSync(file, 'utf-8')
        if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
          offenders.push(path.relative(path.resolve(__dirname, '..'), file))
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
