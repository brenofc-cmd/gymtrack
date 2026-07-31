import { sleep } from 'workflow'
import { deliverRestPush } from '@/lib/push/server'

export async function restPushWorkflow(jobId: string, endsAt: string) {
  'use workflow'
  // Pequena margem permite que o app cancele quando o usuário ainda está com a tela aberta.
  await sleep(new Date(new Date(endsAt).getTime() + 2000))
  await deliverRestPush(jobId)
}
