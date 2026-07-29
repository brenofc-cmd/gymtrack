// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { useWakeLock, wakeLockSupported } from '@/lib/hooks/useWakeLock'

function Probe({ enabled = true }: { enabled?: boolean }) {
  useWakeLock(enabled)
  return null
}

function mockWakeLock() {
  const release = vi.fn().mockResolvedValue(undefined)
  const sentinel = { release }
  const request = vi.fn().mockResolvedValue(sentinel)
  Object.defineProperty(navigator, 'wakeLock', {
    value: { request },
    configurable: true,
  })
  return { request, release, sentinel }
}

function removeWakeLock() {
  // jsdom não implementa a API; garante ausência explícita
  if ('wakeLock' in navigator) {
    delete (navigator as unknown as Record<string, unknown>).wakeLock
  }
}

async function flush() {
  await act(async () => {
    await Promise.resolve()
  })
}

afterEach(() => {
  cleanup()
  removeWakeLock()
})

describe('wakeLockSupported', () => {
  it('detecta suporte pela presença de navigator.wakeLock', () => {
    removeWakeLock()
    expect(wakeLockSupported()).toBe(false)
    mockWakeLock()
    expect(wakeLockSupported()).toBe(true)
  })
})

describe('useWakeLock — com suporte', () => {
  it('solicita o lock de tela ao montar', async () => {
    const { request } = mockWakeLock()
    render(<Probe />)
    await flush()
    expect(request).toHaveBeenCalledWith('screen')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('libera o lock no unmount', async () => {
    const { release } = mockWakeLock()
    const { unmount } = render(<Probe />)
    await flush()
    unmount()
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('reaquire quando a página volta a ficar visível', async () => {
    const { request } = mockWakeLock()
    render(<Probe />)
    await flush()
    expect(request).toHaveBeenCalledTimes(1)

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      await Promise.resolve()
    })
    // jsdom mantém visibilityState = 'visible'
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('não solicita quando desabilitado nas preferências', async () => {
    const { request } = mockWakeLock()
    render(<Probe enabled={false} />)
    await flush()
    expect(request).not.toHaveBeenCalled()
  })

  it('falha do request não quebra a sessão (bateria baixa/permissão negada)', async () => {
    const request = vi.fn().mockRejectedValue(new DOMException('NotAllowedError'))
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request },
      configurable: true,
    })
    expect(() => render(<Probe />)).not.toThrow()
    await flush()
    expect(request).toHaveBeenCalled()
  })
})

describe('useWakeLock — sem suporte', () => {
  it('é um no-op silencioso em navegador sem a API', async () => {
    removeWakeLock()
    const { unmount } = render(<Probe />)
    await flush()
    expect(() => {
      document.dispatchEvent(new Event('visibilitychange'))
      unmount()
    }).not.toThrow()
  })
})
