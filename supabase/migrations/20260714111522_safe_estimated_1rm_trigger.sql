-- Mantém estimated_1rm coerente em inserts e alterações de feedback.
-- Epley somente para 3–10 reps, execução boa, sem dor e ROM não reduzida.
create or replace function public.set_safe_estimated_1rm()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_warmup = false
     and new.weight_kg is not null and new.weight_kg > 0
     and new.reps between 3 and 10
     and new.execution_quality = 'boa'
     and new.pain_level = 'nenhuma'
     and coalesce(new.rom_quality, 'adequada') <> 'reduzida'
  then
    new.estimated_1rm := round((new.weight_kg * (1 + new.reps / 30.0))::numeric, 2);
  else
    new.estimated_1rm := null;
  end if;
  return new;
end;
$$;

revoke execute on function public.set_safe_estimated_1rm() from public, anon, authenticated;

drop trigger if exists trg_set_safe_estimated_1rm on public.set_logs;
create trigger trg_set_safe_estimated_1rm
before insert or update of weight_kg, reps, is_warmup, execution_quality, pain_level, rom_quality
on public.set_logs
for each row execute function public.set_safe_estimated_1rm();

-- Recalcula apenas o campo derivado; histórico bruto permanece intocado.
update public.set_logs
set estimated_1rm = case
  when is_warmup = false
    and weight_kg is not null and weight_kg > 0
    and reps between 3 and 10
    and execution_quality = 'boa'
    and pain_level = 'nenhuma'
    and coalesce(rom_quality, 'adequada') <> 'reduzida'
  then round((weight_kg * (1 + reps / 30.0))::numeric, 2)
  else null
end;

-- Rollback:
-- drop trigger if exists trg_set_safe_estimated_1rm on public.set_logs;
-- drop function if exists public.set_safe_estimated_1rm();
-- update public.set_logs set estimated_1rm = null;
