import { createClient as createAdminClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import type { Database } from '@/types/database'

export function adminPushClient() {
  return createAdminClient<any>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

export async function deliverRestPush(jobId: string) {
  'use step'
  const db = adminPushClient()
  const { data: job } = await db.from('rest_push_jobs').select('*').eq('id', jobId).maybeSingle()
  if (!job || job.cancelled_at || job.sent_at) return
  const { data: subscriptions } = await db.from('push_subscriptions').select('*').eq('user_id', job.user_id)
  if (!subscriptions?.length) return
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!)
  const payload = JSON.stringify({ title: 'Descanso concluído', body: 'Próxima série pronta para continuar.', tag: `gymtrack-rest-${job.id}`, url: '/' })
  await Promise.all(subscriptions.map(async (subscription) => {
    try { await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload) }
    catch (error) {
      const status = (error as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) await db.from('push_subscriptions').delete().eq('id', subscription.id)
    }
  }))
  await db.from('rest_push_jobs').update({ sent_at: new Date().toISOString() }).eq('id', job.id).is('cancelled_at', null)
}
