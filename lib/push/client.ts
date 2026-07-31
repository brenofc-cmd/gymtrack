function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

export async function enableRestPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  if (Notification.permission === 'denied') return false
  if (Notification.permission === 'default' && await Notification.requestPermission() !== 'granted') return false
  if (Notification.permission !== 'granted') return false
  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const keyResponse = await fetch('/api/push/key')
  if (!keyResponse.ok) return false
  const { publicKey } = await keyResponse.json() as { publicKey: string }
  const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })
  const result = await fetch('/api/push/subscription', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(subscription) })
  return result.ok
}

export async function scheduleRestPush(endsAt: number, workoutExerciseId: string): Promise<string | null> {
  try {
    const response = await fetch('/api/rest-push/schedule', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endsAt, workoutExerciseId }) })
    if (!response.ok) return null
    return (await response.json() as { jobId: string }).jobId
  } catch { return null }
}

export async function cancelRestPush(jobId: string | null): Promise<void> {
  if (!jobId) return
  try { await fetch('/api/rest-push/cancel', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jobId }) }) } catch {}
}
