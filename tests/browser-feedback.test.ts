import { describe, expect, it, vi } from 'vitest'
import { safeNotify, safeVibrate } from '@/lib/utils/browser-feedback'

describe('feedback do aparelho', () => {
  it('não lança erro quando vibração não é suportada', () => {
    expect(() => safeVibrate([100, 50, 100])).not.toThrow()
  })

  it('absorve exceções do construtor de notificações', () => {
    class ThrowingNotification {
      static permission: NotificationPermission = 'granted'
      constructor() { throw new Error('notificações indisponíveis') }
    }
    vi.stubGlobal('window', { Notification: ThrowingNotification })
    expect(safeNotify('Descanso concluído', { body: 'Pronto.' })).toBe(false)
    vi.unstubAllGlobals()
  })
})
