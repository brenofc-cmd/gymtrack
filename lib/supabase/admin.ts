import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// RESTRITO a scripts administrativos (scripts/seed.ts): usa a service role e
// ignora RLS. Proibido em app/ e components/ — o teste de guarda
// tests/no-admin-client-in-app.test.ts falha se aparecer lá. No app, use
// createClient() de lib/supabase/server.ts, que respeita as políticas RLS.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
