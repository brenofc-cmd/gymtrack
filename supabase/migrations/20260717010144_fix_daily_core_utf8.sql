-- Corrige sementes transmitidas por clientes Windows que tenham decodificado
-- o arquivo UTF-8 como Windows-1252 antes de executar a migration diária.

update public.daily_core_days
set
  name = case when name ~ '(Ã|Â|â)' then convert_from(convert_to(name, 'WIN1252'), 'UTF8') else name end,
  objective = case when objective ~ '(Ã|Â|â)' then convert_from(convert_to(objective, 'WIN1252'), 'UTF8') else objective end,
  educational_note = case when educational_note ~ '(Ã|Â|â)' then convert_from(convert_to(educational_note, 'WIN1252'), 'UTF8') else educational_note end;

update public.daily_core_exercises
set
  name = case when name ~ '(Ã|Â|â)' then convert_from(convert_to(name, 'WIN1252'), 'UTF8') else name end,
  objective = case when objective ~ '(Ã|Â|â)' then convert_from(convert_to(objective, 'WIN1252'), 'UTF8') else objective end,
  equipment = case when equipment ~ '(Ã|Â|â)' then convert_from(convert_to(equipment, 'WIN1252'), 'UTF8') else equipment end,
  short_cue = case when short_cue ~ '(Ã|Â|â)' then convert_from(convert_to(short_cue, 'WIN1252'), 'UTF8') else short_cue end,
  instructions = (
    select array_agg(
      case when item ~ '(Ã|Â|â)' then convert_from(convert_to(item, 'WIN1252'), 'UTF8') else item end
      order by position
    )
    from unnest(instructions) with ordinality as instruction(item, position)
  ),
  progression_rule = case when progression_rule ~ '(Ã|Â|â)' then convert_from(convert_to(progression_rule, 'WIN1252'), 'UTF8') else progression_rule end;

update public.daily_core_variations
set
  name = case when name ~ '(Ã|Â|â)' then convert_from(convert_to(name, 'WIN1252'), 'UTF8') else name end,
  equipment_required = case when equipment_required ~ '(Ã|Â|â)'
    then convert_from(convert_to(equipment_required, 'WIN1252'), 'UTF8') else equipment_required end;

update public.daily_core_main_exercise_conflicts
set reason = case when reason ~ '(Ã|Â|â)'
  then convert_from(convert_to(reason, 'WIN1252'), 'UTF8') else reason end;
