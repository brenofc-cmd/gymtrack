-- Inscrições Web Push pertencem exclusivamente ao respectivo atleta.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rest_push_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_exercise_id uuid references public.workout_exercises(id) on delete set null,
  ends_at timestamptz not null,
  cancelled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index rest_push_jobs_due_idx on public.rest_push_jobs (ends_at) where cancelled_at is null and sent_at is null;
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
alter table public.rest_push_jobs enable row level security;

create policy "push subscriptions own" on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "rest push jobs own" on public.rest_push_jobs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.push_subscriptions, public.rest_push_jobs to authenticated;
