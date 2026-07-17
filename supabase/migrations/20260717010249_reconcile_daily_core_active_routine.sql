-- Reconcilia instalações cuja rotina ativa avançou de versão após a criação
-- do plano. O filtro correto é a rotina não arquivada, independentemente da
-- versão numérica.

insert into public.routine_backups (user_id, label, payload)
select w.user_id, 'pre-daily-core-v1', jsonb_build_object(
  'workout_exercises', jsonb_agg(jsonb_build_object(
    'id', we.id,
    'workout_id', we.workout_id,
    'exercise_id', we.exercise_id,
    'is_hidden', we.is_hidden,
    'exercise_name', e.name_pt
  ) order by w.day_of_week, we.order_index)
)
from public.workout_exercises we
join public.workouts w on w.id = we.workout_id
join public.exercises e on e.id = we.exercise_id
where w.is_archived = false
  and e.exercise_type = 'abdominal'
  and not exists (
    select 1 from public.routine_backups rb
    where rb.user_id = w.user_id and rb.label = 'pre-daily-core-v1'
  )
group by w.user_id;

insert into public.daily_core_main_exercise_conflicts
  (user_id, workout_exercise_id, was_hidden, reason)
select w.user_id, we.id, we.is_hidden,
  'Ocultado no modelo ativo para evitar duplicidade com o Abdômen Diário; histórico preservado.'
from public.workout_exercises we
join public.workouts w on w.id = we.workout_id
join public.exercises e on e.id = we.exercise_id
where w.is_archived = false and e.exercise_type = 'abdominal'
on conflict (workout_exercise_id) do nothing;

update public.workout_exercises we
set is_hidden = true
from public.daily_core_main_exercise_conflicts c
where c.workout_exercise_id = we.id;

create index daily_core_progressions_current_variation_idx
  on public.daily_core_progressions(current_variation_id);
create index daily_core_progressions_suggested_variation_idx
  on public.daily_core_progressions(suggested_variation_id);
create index daily_core_sessions_day_idx
  on public.daily_core_sessions(day_of_week);
create index daily_core_sets_exercise_idx
  on public.daily_core_sets(exercise_id);
