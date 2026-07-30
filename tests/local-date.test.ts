import { describe, it, expect, afterEach, vi } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import path from 'path'
import { localDateISO } from '@/lib/utils/local-date'

/**
 * O Brasil (São Paulo) está em UTC−3. Entre 21h e 00h no horário local, o
 * relógio UTC já virou o dia seguinte. Qualquer registro que use a data em UTC
 * grava sono, medidas, hidratação e prontidão no dia errado.
 *
 * Estes testes fixam o relógio em instantes UTC reais e verificam a data
 * LOCAL resultante.
 */

afterEach(() => {
  vi.useRealTimers()
})

function atUtc(iso: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(iso))
}

describe('localDateISO — virada do dia no Brasil', () => {
  it('20h59 em São Paulo ainda é o mesmo dia (23h59 UTC)', () => {
    atUtc('2026-07-29T23:59:00Z') // 20:59 em SP
    expect(localDateISO()).toBe('2026-07-29')
  })

  it('21h01 em São Paulo continua sendo o mesmo dia, mesmo com UTC já no dia seguinte', () => {
    atUtc('2026-07-30T00:01:00Z') // 21:01 de 29/07 em SP
    // A armadilha: new Date().toISOString().slice(0,10) devolveria '2026-07-30'
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-07-30')
    expect(localDateISO()).toBe('2026-07-29')
  })

  it('meia-noite e um em São Paulo já é o dia novo', () => {
    atUtc('2026-07-30T03:01:00Z') // 00:01 de 30/07 em SP
    expect(localDateISO()).toBe('2026-07-30')
  })

  it('domingo → segunda vira corretamente', () => {
    atUtc('2026-08-03T02:30:00Z') // 23:30 de domingo 02/08 em SP
    expect(localDateISO()).toBe('2026-08-02')
    atUtc('2026-08-03T03:30:00Z') // 00:30 de segunda 03/08 em SP
    expect(localDateISO()).toBe('2026-08-03')
  })

  it('virada de mês respeita o fuso local', () => {
    atUtc('2026-08-01T01:00:00Z') // 22:00 de 31/07 em SP
    expect(localDateISO()).toBe('2026-07-31')
  })

  it('virada de ano respeita o fuso local', () => {
    atUtc('2027-01-01T02:00:00Z') // 23:00 de 31/12/2026 em SP
    expect(localDateISO()).toBe('2026-12-31')
    atUtc('2027-01-01T03:00:00Z') // 00:00 de 01/01/2027 em SP
    expect(localDateISO()).toBe('2027-01-01')
  })

  it('29 de fevereiro em ano bissexto', () => {
    atUtc('2028-02-29T15:00:00Z') // 12:00 de 29/02/2028 em SP
    expect(localDateISO()).toBe('2028-02-29')
    atUtc('2028-03-01T01:00:00Z') // 22:00 de 29/02 em SP
    expect(localDateISO()).toBe('2028-02-29')
  })

  it('aceita uma data explícita além de "agora"', () => {
    expect(localDateISO(new Date('2026-12-25T23:00:00Z'))).toBe('2026-12-25')
    expect(localDateISO(new Date('2026-12-26T02:00:00Z'))).toBe('2026-12-25')
  })

  it('sempre devolve o formato ISO yyyy-mm-dd', () => {
    atUtc('2026-03-05T18:00:00Z')
    expect(localDateISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('nenhum código de app usa data em UTC ou fuso do aparelho', () => {
  const listSources = (dir: string): string[] => {
    const out: string[] = []
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) out.push(...listSources(full))
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
    }
    return out
  }

  const files = ['app', 'components', 'lib']
    .map((dir) => path.resolve(__dirname, '..', dir))
    .flatMap(listSources)
    .filter((file) => !file.endsWith('local-date.ts'))

  it('nenhum arquivo usa toISOString().slice(0, 10) para obter "hoje"', () => {
    const offenders: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf-8')
      // Aceita quando a data-base já foi normalizada em São Paulo (âncora
      // T12:00:00Z construída a partir de localDateISO) — ver daily-core/logic.
      if (/new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/.test(source)) {
        offenders.push(path.relative(path.resolve(__dirname, '..'), file))
      }
    }
    expect(offenders).toEqual([])
  })

  it('nenhum Intl.DateTimeFormat de data omite o timeZone', () => {
    const offenders: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf-8')
      for (const match of source.matchAll(/new Intl\.DateTimeFormat\(([^)]*)\)/g)) {
        const args = match[1]
        // Formatação de exibição sem opções (ex.: só locale) é aceitável
        // apenas se não estiver derivando a data-calendário 'en-CA'.
        if (args.includes("'en-CA'") && !args.includes('timeZone')) {
          offenders.push(`${path.relative(path.resolve(__dirname, '..'), file)}: ${match[0]}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('streak do Abdômen Diário usa âncora normalizada (não é bug de UTC)', () => {
  it('a âncora é construída ao meio-dia UTC a partir da data local', async () => {
    const source = readFileSync(
      path.resolve(__dirname, '../lib/daily-core/logic.ts'),
      'utf-8'
    )
    // ${today}T12:00:00Z com `today` vindo de localDateISO: meio-dia UTC é 9h
    // em SP, então a data UTC e a data local coincidem e o passo por dias UTC
    // permanece alinhado — imune a DST.
    expect(source).toContain('T12:00:00Z')
  })

  it('contagem regressiva de dias não pula nem repete datas', async () => {
    const { streakStats, localDateISO: coreLocalDate } = await import('@/lib/daily-core/logic')
    atUtc('2026-07-30T00:30:00Z') // 21:30 de 29/07 em SP
    const today = coreLocalDate()
    expect(today).toBe('2026-07-29')

    // Três dias consecutivos concluídos (27, 28, 29 — 26 é domingo)
    const sessions = ['2026-07-27', '2026-07-28', '2026-07-29'].map((date) => ({
      session_date: date,
      status: 'concluido',
    }))
    const result = streakStats(sessions as never, today)
    expect(result.current).toBe(3)
  })
})
