-- Corrige textos UTF-8 que foram interpretados como Windows-1252/Latin-1.
-- A função fica restrita à sessão da migração e não aumenta a superfície pública do banco.

create or replace function pg_temp.fix_mojibake(input_text text)
returns text
language plpgsql
immutable
strict
as $$
declare
  result text := input_text;
begin
  result := replace(result, U&'\00C3\00A1', 'á');
  result := replace(result, U&'\00C3\00A2', 'â');
  result := replace(result, U&'\00C3\00A3', 'ã');
  result := replace(result, U&'\00C3\00A4', 'ä');
  result := replace(result, U&'\00C3\00A7', 'ç');
  result := replace(result, U&'\00C3\00A9', 'é');
  result := replace(result, U&'\00C3\00AA', 'ê');
  result := replace(result, U&'\00C3\00AD', 'í');
  result := replace(result, U&'\00C3\00B3', 'ó');
  result := replace(result, U&'\00C3\00B4', 'ô');
  result := replace(result, U&'\00C3\00B5', 'õ');
  result := replace(result, U&'\00C3\00B6', 'ö');
  result := replace(result, U&'\00C3\00BA', 'ú');
  result := replace(result, U&'\00C3\00BC', 'ü');
  result := replace(result, U&'\00E2\20AC\201C', '–');
  result := replace(result, U&'\00E2\20AC\201D', '—');
  result := replace(result, U&'\00E2\20AC\02DC', '‘');
  result := replace(result, U&'\00E2\20AC\2122', '’');
  result := replace(result, U&'\00E2\20AC\0153', '“');
  result := replace(result, U&'\00E2\20AC\009D', '”');
  result := replace(result, U&'\00E2\20AC\00A6', '…');
  result := replace(result, U&'\00E2\2020\2019', '→');
  result := replace(result, U&'\00E2\2030\00A5', '≥');
  result := replace(result, U&'\00E2\2030\00A4', '≤');
  result := replace(result, U&'\00C2\00BA', 'º');
  result := replace(result, U&'\00C2\00AA', 'ª');
  result := replace(result, U&'\00C2\00B0', '°');
  result := replace(result, U&'\00C2\00B7', '·');
  result := replace(result, U&'\00C2\00A0', ' ');
  return result;
end;
$$;

-- Algumas entradas corrompidas duplicaram exercícios que já existiam corretamente.
-- Mantém o registro limpo, transfere todas as referências e remove somente a duplicata.
create temporary table exercise_mojibake_duplicates on commit drop as
select bad.id as corrupted_id, clean.id as clean_id
from public.exercises bad
cross join lateral (
  select candidate.id
  from public.exercises candidate
  where candidate.id <> bad.id
    and lower(candidate.name_pt) = lower(pg_temp.fix_mojibake(bad.name_pt))
    and candidate.name_pt = pg_temp.fix_mojibake(candidate.name_pt)
  order by candidate.created_at, candidate.id
  limit 1
) clean
where bad.name_pt <> pg_temp.fix_mojibake(bad.name_pt);

update public.workout_exercises target
set exercise_id = duplicates.clean_id
from exercise_mojibake_duplicates duplicates
where target.exercise_id = duplicates.corrupted_id;

update public.set_logs target
set performed_exercise_id = duplicates.clean_id
from exercise_mojibake_duplicates duplicates
where target.performed_exercise_id = duplicates.corrupted_id;

delete from public.workout_exercise_substitutions target
using exercise_mojibake_duplicates duplicates
where target.exercise_id = duplicates.corrupted_id
  and exists (
    select 1
    from public.workout_exercise_substitutions existing
    where existing.workout_exercise_id = target.workout_exercise_id
      and existing.exercise_id = duplicates.clean_id
  );

update public.workout_exercise_substitutions target
set exercise_id = duplicates.clean_id
from exercise_mojibake_duplicates duplicates
where target.exercise_id = duplicates.corrupted_id;

delete from public.exercises target
using exercise_mojibake_duplicates duplicates
where target.id = duplicates.corrupted_id;

update public.exercises target
set
  name_pt = pg_temp.fix_mojibake(target.name_pt),
  name_en = pg_temp.fix_mojibake(target.name_en),
  muscle_group = pg_temp.fix_mojibake(target.muscle_group),
  equipment = pg_temp.fix_mojibake(target.equipment),
  instructions = case
    when target.instructions is null then null
    else array(
      select pg_temp.fix_mojibake(item.value)
      from unnest(target.instructions) with ordinality as item(value, position)
      order by item.position
    )
  end,
  exercise_type = pg_temp.fix_mojibake(target.exercise_type),
  secondary_muscles = case
    when target.secondary_muscles is null then null
    else array(
      select pg_temp.fix_mojibake(item.value)
      from unnest(target.secondary_muscles) with ordinality as item(value, position)
      order by item.position
    )
  end,
  load_guidance = pg_temp.fix_mojibake(target.load_guidance),
  movement_pattern = pg_temp.fix_mojibake(target.movement_pattern)
where concat_ws(
  ' ', target.name_pt, target.name_en, target.muscle_group, target.equipment,
  array_to_string(target.instructions, ' '), target.exercise_type,
  array_to_string(target.secondary_muscles, ' '), target.load_guidance,
  target.movement_pattern
) <> pg_temp.fix_mojibake(concat_ws(
  ' ', target.name_pt, target.name_en, target.muscle_group, target.equipment,
  array_to_string(target.instructions, ' '), target.exercise_type,
  array_to_string(target.secondary_muscles, ' '), target.load_guidance,
  target.movement_pattern
));

update public.workouts target
set
  letter = pg_temp.fix_mojibake(target.letter),
  name = pg_temp.fix_mojibake(target.name),
  notes = pg_temp.fix_mojibake(target.notes),
  objective = pg_temp.fix_mojibake(target.objective),
  warmup_note = pg_temp.fix_mojibake(target.warmup_note)
where concat_ws(
  ' ', target.letter, target.name, target.notes, target.objective, target.warmup_note
) <> pg_temp.fix_mojibake(concat_ws(
  ' ', target.letter, target.name, target.notes, target.objective, target.warmup_note
));

update public.workout_exercises target
set
  notes = pg_temp.fix_mojibake(target.notes),
  user_note = pg_temp.fix_mojibake(target.user_note),
  load_guidance = pg_temp.fix_mojibake(target.load_guidance),
  technique_notes = case
    when target.technique_notes is null then null
    else array(
      select pg_temp.fix_mojibake(item.value)
      from unnest(target.technique_notes) with ordinality as item(value, position)
      order by item.position
    )
  end
where concat_ws(
  ' ', target.notes, target.user_note, target.load_guidance,
  array_to_string(target.technique_notes, ' ')
) <> pg_temp.fix_mojibake(concat_ws(
  ' ', target.notes, target.user_note, target.load_guidance,
  array_to_string(target.technique_notes, ' ')
));

update public.routine_backups target
set
  label = pg_temp.fix_mojibake(target.label),
  payload = pg_temp.fix_mojibake(target.payload::text)::jsonb
where concat_ws(' ', target.label, target.payload::text)
  <> pg_temp.fix_mojibake(concat_ws(' ', target.label, target.payload::text));
