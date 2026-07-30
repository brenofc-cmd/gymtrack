'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clearPrivateState } from '@/lib/offline/clearPrivateState'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Descarta cache de navegação e estado local antes de liberar o aparelho:
    // sem isso, dados privados sobreviveriam ao logout.
    await clearPrivateState()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
      title="Sair"
    >
      <LogOut className="w-5 h-5" />
    </button>
  )
}
