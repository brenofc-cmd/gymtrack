/** Recursos de sistema são opcionais. Uma falha neles nunca pode interromper o treino. */
export function safeVibrate(pattern: VibratePattern): boolean {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false
    return navigator.vibrate(pattern)
  } catch {
    return false
  }
}

export function safeNotify(
  title: string,
  options: NotificationOptions,
  onClick?: () => void
): boolean {
  try {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      window.Notification.permission !== 'granted'
    ) return false

    const notification = new window.Notification(title, options)
    if (onClick) {
      notification.onclick = () => {
        try {
          onClick()
        } finally {
          notification.close()
        }
      }
    }
    return true
  } catch {
    return false
  }
}

export function requestNotificationPermissionSafely(): void {
  try {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      window.Notification.permission !== 'default'
    ) return
    void window.Notification.requestPermission().catch(() => undefined)
  } catch {
    // Permissão é opcional; o cronômetro funciona mesmo sem ela.
  }
}
