-- 20260729130000 — Recomendações de deload + preferência de tela ligada
--
-- Persiste as recomendações do motor de deload (lib/progression/deload.ts).
-- Nada é automático: a linha nasce 'sugerido' e o usuário decide
-- (aceito/recusado) na UI; 'concluido' encerra a semana de descarga.
-- Um índice parcial único garante no banco a regra "no máximo uma sugestão
-- pendente por usuário".
--
-- Também adiciona user_preferences.keep_screen_awake (Wake Lock na sessão).
--
-- Rollback seguro (apenas para ambientes novos; NUNCA executar em produção):
--   drop table if exists public.deload_recommendations;
--   alter table public.user_preferences drop column if exists keep_screen_awake;

create table if not exists public.deload_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  trigger_data jsonb,
  status text not null default 'sugerido' check (status in ('sugerido', 'aceito', 'recusado', 'concluido')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists deload_recommendations_user_idx
  on public.deload_recommendations(user_id, created_at desc);

create unique index if not exists deload_recommendations_one_pending_idx
  on public.deload_recommendations(user_id) where status = 'sugerido';

alter table public.deload_recommendations enable row level security;

drop policy if exists "deload select own" on public.deload_recommendations;
create policy "deload select own" on public.deload_recommendations for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "deload insert own" on public.deload_recommendations;
create policy "deload insert own" on public.deload_recommendations for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "deload update own" on public.deload_recommendations;
create policy "deload update own" on public.deload_recommendations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "deload delete own" on public.deload_recommendations;
create policy "deload delete own" on public.deload_recommendations for delete to authenticated using ((select auth.uid()) = user_id);

alter table public.user_preferences
  add column if not exists keep_screen_awake boolean not null default true;
