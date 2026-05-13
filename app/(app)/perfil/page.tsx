import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User, Dumbbell, Weight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserProfile, getLifetimeStats } from '@/lib/queries/profile'
import { getStreakStats } from '@/lib/utils/streak'
import { formatVolume } from '@/lib/utils/volume'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { ProfileForm } from '@/components/profile/ProfileForm'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [profile, stats, streakStats] = await Promise.all([
    getUserProfile(supabase, user.id),
    getLifetimeStats(admin, user.id),
    getStreakStats(admin, user.id),
  ])

  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Atleta'
  const avatarLetter = name[0].toUpperCase()

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Perfil</h1>
        <LogoutButton />
      </div>

      {/* Avatar + nome */}
      <div className="rounded-2xl bg-card border border-border p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <span className="text-2xl font-black text-primary">{avatarLetter}</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-lg truncate">{name}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          {stats.memberSince && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Membro desde {format(new Date(stats.memberSince), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
      </div>

      {/* Stats de vida */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <div className="flex justify-center mb-1">
            <Dumbbell className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-black">{stats.totalSessions}</p>
          <p className="text-xs text-muted-foreground leading-tight">
            {stats.totalSessions === 1 ? 'treino' : 'treinos'}
          </p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <div className="flex justify-center mb-1">
            <Weight className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-black">{formatVolume(stats.totalVolumeKg)}</p>
          <p className="text-xs text-muted-foreground leading-tight">volume total</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <div className="flex justify-center mb-1">
            <User className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-black">{streakStats.longest}</p>
          <p className="text-xs text-muted-foreground leading-tight">
            {streakStats.longest === 1 ? 'dia' : 'dias'} de recorde
          </p>
        </div>
      </div>

      {/* Formulário de configurações */}
      <ProfileForm
        userId={user.id}
        initialWeightKg={profile.weight_kg}
        initialWeeklyGoal={profile.weekly_goal}
      />
    </div>
  )
}
