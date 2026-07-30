-- A sequência A–F é determinada pela última ação do atleta, não pelo
-- calendário. Registrar um pulo torna a decisão explícita e auditável.
create table public.training_sequence_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete restrict,
  event_type text not null default 'skipped',
  occurred_at timestamptz not null default now(),
  reason text,
  created_at timestamptz not null default now(),
  constraint training_sequence_events_type_check check (event_type in ('skipped'))
);

create index training_sequence_events_user_occurred_idx
  on public.training_sequence_events(user_id, occurred_at desc);

alter table public.training_sequence_events enable row level security;

create policy "sequence events own select"
  on public.training_sequence_events for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sequence events own insert"
  on public.training_sequence_events for insert to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert on public.training_sequence_events to authenticated;
