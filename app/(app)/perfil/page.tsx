import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User, Dumbbell, Weight, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile, getLifetimeStats } from '@/lib/queries/profile'
import { getStreakStats } from '@/lib/utils/streak'
import { formatVolume } from '@/lib/utils/volume'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { TrainingPhaseCard } from '@/components/profile/TrainingPhaseCard'
import { normalizeTrainingPhase } from '@/lib/training/phase'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')


  const [profile, stats, streakStats, phaseRow] = await Promise.all([
    getUserProfile(supabase, user.id),
    getLifetimeStats(supabase, user.id),
    getStreakStats(supabase, user.id),
    supabase.from('user_profiles').select('training_phase').eq('id', user.id).maybeSingle(),
  ])
  const trainingPhase = normalizeTrainingPhase(phaseRow.data?.training_phase)

  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Atleta'
  const avatarLetter = name[0].toUpperCase()

  return (
    <div className="mx-auto max-w-[520px] space-y-4 px-4 py-5 lg:py-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Perfil</h1>
          <p className="mt-1 text-xs text-muted-foreground">Dados pessoais e histórico acumulado</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/configuracoes" className="grid size-9 place-items-center rounded-xl border border-input text-muted-foreground" aria-label="Abrir configurações">
            <Settings className="size-4" />
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* Avatar + nome */}
      <div className="surface-card flex items-center gap-4 p-5">
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
        <div className="surface-card p-3 text-center">
          <div className="flex justify-center mb-1">
            <Dumbbell className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-black">{stats.totalSessions}</p>
          <p className="text-xs text-muted-foreground leading-tight">
            {stats.totalSessions === 1 ? 'treino' : 'treinos'}
          </p>
        </div>
        <div className="surface-card p-3 text-center">
          <div className="flex justify-center mb-1">
            <Weight className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-black">{formatVolume(stats.totalVolumeKg)}</p>
          <p className="text-xs text-muted-foreground leading-tight">volume total</p>
        </div>
        <div className="surface-card p-3 text-center">
          <div className="flex justify-center mb-1">
            <User className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-black">{streakStats.longest}</p>
          <p className="text-xs text-muted-foreground leading-tight">
            {streakStats.longest === 1 ? 'dia' : 'dias'} de recorde
          </p>
        </div>
      </div>

      <TrainingPhaseCard userId={user.id} phase={trainingPhase} />

      {/* Formulário de configurações */}
      <ProfileForm
        userId={user.id}
        initialGoal={profile.goal}
        initialHeightCm={profile.height_cm}
        initialWeightKg={profile.weight_kg}
        initialWeeklyGoal={profile.weekly_goal}
      />
    </div>
  )
}
