-- Troca permanente e atômica do exercício principal por uma alternativa
-- já cadastrada na ficha do usuário autenticado.

create or replace function public.swap_workout_exercise(
  p_workout_exercise_id uuid,
  p_replacement_exercise_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_original_exercise_id uuid;
  v_substitution_id uuid;
begin
  select we.exercise_id
    into v_original_exercise_id
  from public.workout_exercises we
  join public.workouts w on w.id = we.workout_id
  where we.id = p_workout_exercise_id
    and w.user_id = auth.uid();

  if v_original_exercise_id is null then
    raise exception 'workout exercise not found';
  end if;

  if v_original_exercise_id = p_replacement_exercise_id then
    return;
  end if;

  select wes.id
    into v_substitution_id
  from public.workout_exercise_substitutions wes
  where wes.workout_exercise_id = p_workout_exercise_id
    and wes.exercise_id = p_replacement_exercise_id;

  if v_substitution_id is null then
    raise exception 'replacement is not an allowed substitution';
  end if;

  update public.workout_exercises
  set exercise_id = p_replacement_exercise_id
  where id = p_workout_exercise_id;

  update public.workout_exercise_substitutions
  set exercise_id = v_original_exercise_id
  where id = v_substitution_id;
end;
$$;

revoke all on function public.swap_workout_exercise(uuid, uuid) from public;
grant execute on function public.swap_workout_exercise(uuid, uuid) to authenticated;
