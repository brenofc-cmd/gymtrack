-- Camada de progressão individual do GymTrack aplicada à rotina pública.
-- O bloco tem 9 semanas, mas não reproduz percentuais de produto proprietário.

alter table public.set_logs drop constraint if exists set_logs_set_role_check;
alter table public.set_logs add constraint set_logs_set_role_check
  check (set_role in ('warmup','top','backoff','standard','rm_effort','deload'));
alter table public.set_logs
  add column if not exists attempt_result text,
  add column if not exists client_operation_id uuid,
  add column if not exists is_deload boolean not null default false;
alter table public.set_logs drop constraint if exists set_logs_attempt_result_check;
alter table public.set_logs add constraint set_logs_attempt_result_check check (
  attempt_result is null or attempt_result in (
    'completed','personal_record','technical_failure','strength_failure','skipped','pain'
  )
);
create unique index if not exists set_logs_client_operation_unique
  on public.set_logs(session_id,client_operation_id) where client_operation_id is not null;

create table if not exists public.exercise_reference_maxes (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  tested_1rm numeric(8,2),
  estimated_1rm numeric(8,2),
  training_max numeric(8,2),
  source text not null,
  tested_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id,exercise_id)
);
alter table public.exercise_reference_maxes drop constraint if exists exercise_reference_maxes_source_check;
alter table public.exercise_reference_maxes add constraint exercise_reference_maxes_source_check
  check (source in ('manual_test','estimated_from_set','imported'));
alter table public.exercise_reference_maxes drop constraint if exists exercise_reference_maxes_value_check;
alter table public.exercise_reference_maxes add constraint exercise_reference_maxes_value_check
  check (
    (tested_1rm is null or tested_1rm > 0) and
    (estimated_1rm is null or estimated_1rm > 0) and
    (training_max is null or training_max > 0) and
    (tested_1rm is not null or estimated_1rm is not null)
  );

create table if not exists public.training_program_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_block_id text not null,
  week_number integer not null default 1,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'active',
  unique(user_id,program_block_id)
);
alter table public.training_program_blocks
  add column if not exists routine_version integer not null default 5,
  add column if not exists total_weeks integer not null default 9,
  add column if not exists cycle_number integer not null default 1,
  add column if not exists paused_at timestamptz,
  add column if not exists next_block_suggested boolean not null default false;
alter table public.training_program_blocks drop constraint if exists training_program_blocks_week_number_check;
alter table public.training_program_blocks add constraint training_program_blocks_week_number_check
  check (week_number between 1 and total_weeks and total_weeks=9);
alter table public.training_program_blocks drop constraint if exists training_program_blocks_status_check;
alter table public.training_program_blocks add constraint training_program_blocks_status_check
  check (status in ('active','completed','cancelled','paused'));

create unique index if not exists training_program_blocks_one_active_idx
  on public.training_program_blocks(user_id)
  where status in ('active','paused');

create table if not exists public.exercise_reference_max_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  block_id uuid references public.training_program_blocks(id) on delete set null,
  tested_1rm numeric(8,2),
  estimated_1rm numeric(8,2),
  training_max numeric(8,2),
  source text not null check (source in ('manual_test','estimated_from_set','imported')),
  reason text not null,
  recorded_at timestamptz not null default now()
);

create table if not exists public.block_exercise_choices (
  user_id uuid not null references auth.users(id) on delete cascade,
  block_id uuid not null references public.training_program_blocks(id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  selected_exercise_id uuid references public.exercises(id),
  updated_at timestamptz not null default now(),
  primary key(block_id,workout_exercise_id)
);

create or replace function public.record_exercise_reference_max_history()
returns trigger language plpgsql set search_path=public as $$
begin
  if tg_op='INSERT'
    or old.tested_1rm is distinct from new.tested_1rm
    or old.estimated_1rm is distinct from new.estimated_1rm
    or old.training_max is distinct from new.training_max then
    insert into public.exercise_reference_max_history(
      user_id,exercise_id,tested_1rm,estimated_1rm,training_max,source,reason
    ) values(
      new.user_id,new.exercise_id,new.tested_1rm,new.estimated_1rm,new.training_max,
      new.source,case when tg_op='INSERT' then 'initial_reference' else 'reference_updated' end
    );
  end if;
  return new;
end $$;
drop trigger if exists exercise_reference_max_history_trigger on public.exercise_reference_maxes;
create trigger exercise_reference_max_history_trigger
after insert or update on public.exercise_reference_maxes
for each row execute function public.record_exercise_reference_max_history();

alter table public.workout_sessions
  add column if not exists program_block_id uuid references public.training_program_blocks(id),
  add column if not exists block_week_number integer check (block_week_number between 1 and 9);

create or replace function public.attach_active_dup_block_to_session()
returns trigger language plpgsql set search_path=public as $$
declare v_block public.training_program_blocks;
begin
  if new.program_block_id is not null then return new; end if;
  select * into v_block from public.training_program_blocks
  where user_id=new.user_id and status='active'
  order by started_at desc limit 1;
  if v_block.id is not null then
    new.program_block_id:=v_block.id;
    new.block_week_number:=v_block.week_number;
  end if;
  return new;
end $$;
drop trigger if exists attach_active_dup_block_to_session_trigger on public.workout_sessions;
create trigger attach_active_dup_block_to_session_trigger
before insert on public.workout_sessions
for each row execute function public.attach_active_dup_block_to_session();

alter table public.user_preferences
  add column if not exists routine_provisioned_version integer,
  add column if not exists barbell_increment_kg numeric(5,2) not null default 2.5,
  add column if not exists dumbbell_increment_kg numeric(5,2) not null default 1,
  add column if not exists machine_increment_kg numeric(5,2) not null default 2.5,
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists heavy_attempt_risk_acknowledged boolean not null default false;

alter table public.user_profiles
  add column if not exists display_name text,
  add column if not exists training_experience text,
  add column if not exists available_days integer[] not null default array[1,2,3,4,5,6],
  add column if not exists relevant_pain_history text;

alter table public.exercise_reference_maxes enable row level security;
alter table public.exercise_reference_max_history enable row level security;
alter table public.training_program_blocks enable row level security;
alter table public.block_exercise_choices enable row level security;
drop policy if exists "reference maxes own" on public.exercise_reference_maxes;
create policy "reference maxes own" on public.exercise_reference_maxes for all to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "reference max history own" on public.exercise_reference_max_history;
create policy "reference max history own" on public.exercise_reference_max_history for all to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "program blocks own" on public.training_program_blocks;
create policy "program blocks own" on public.training_program_blocks for all to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "block exercise choices own" on public.block_exercise_choices;
create policy "block exercise choices own" on public.block_exercise_choices for all to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update,delete on public.exercise_reference_maxes,public.exercise_reference_max_history,public.training_program_blocks,public.block_exercise_choices to authenticated;

create or replace function public.ensure_active_david_laid_routine_v5()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid := auth.uid();
  v_routine jsonb;
  v_block_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  v_routine := public.provision_david_laid_public_dup_v5(v_user_id);

  select id into v_block_id from public.training_program_blocks
  where user_id=v_user_id and status in ('active','paused')
  order by started_at desc limit 1;
  if v_block_id is null then
    insert into public.training_program_blocks(user_id,program_block_id,week_number,status,routine_version,total_weeks,cycle_number)
    values(
      v_user_id,
      'dup-v5-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISS'),
      1,'active',5,9,
      coalesce((select max(cycle_number)+1 from public.training_program_blocks where user_id=v_user_id),1)
    ) returning id into v_block_id;
  end if;

  insert into public.user_preferences(id,onboarding_done,weight_unit,rest_timer_sound,rest_timer_vibrate,routine_provisioned_version)
  values(v_user_id,false,'kg',true,true,5)
  on conflict(id) do update set routine_provisioned_version=5,updated_at=now();

  return v_routine || jsonb_build_object('program_block_id',v_block_id);
end $$;
revoke all on function public.ensure_active_david_laid_routine_v5() from public,anon;
grant execute on function public.ensure_active_david_laid_routine_v5() to authenticated;

create or replace function public.advance_active_dup_block_week()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid:=auth.uid();
  v_block public.training_program_blocks;
  v_completed_letters integer:=0;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  select * into v_block from public.training_program_blocks
  where user_id=v_user_id and status='active' order by started_at desc limit 1 for update;
  if v_block.id is null then raise exception 'active block not found'; end if;
  select count(distinct w.letter)::integer into v_completed_letters
  from public.workout_sessions s
  join public.workouts w on w.id=s.workout_id
  where s.user_id=v_user_id
    and s.program_block_id=v_block.id
    and s.block_week_number=v_block.week_number
    and s.finished_at is not null
    and s.cancelled_at is null
    and w.letter in ('A','B','C','D','E','F');
  if v_completed_letters < 6 then
    return jsonb_build_object(
      'advanced',false,
      'completed',false,
      'week_number',v_block.week_number,
      'completed_letters',v_completed_letters
    );
  end if;
  if v_block.week_number=9 then
    update public.training_program_blocks
    set status='completed',completed_at=now(),next_block_suggested=true where id=v_block.id;
    return jsonb_build_object('advanced',true,'completed',true,'week_number',9,'completed_letters',6);
  end if;
  update public.training_program_blocks set week_number=week_number+1 where id=v_block.id;
  return jsonb_build_object('advanced',true,'completed',false,'week_number',v_block.week_number+1,'completed_letters',6);
end $$;
revoke all on function public.advance_active_dup_block_week() from public,anon;
grant execute on function public.advance_active_dup_block_week() to authenticated;

-- Usuários migrados recebem bloco inicial sem apagar histórico.
insert into public.training_program_blocks(user_id,program_block_id,week_number,status,routine_version,total_weeks,cycle_number)
select distinct w.user_id,'dup-v5-migrated-'||substr(w.user_id::text,1,8),1,'active',5,9,1
from public.workouts w
where w.routine_version=5 and w.is_archived=false and w.is_daily=false
  and not exists(select 1 from public.training_program_blocks b where b.user_id=w.user_id and b.status in ('active','paused'))
on conflict(user_id,program_block_id) do nothing;

-- Rollback: pausar blocos e arquivar a rotina v5. Máximos e histórico são
-- dados do usuário e não devem ser apagados automaticamente.
