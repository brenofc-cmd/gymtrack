-- e1RM passa a considerar RIR (repetições em reserva), não só repetições.
--
-- Fórmula anterior (trigger set_safe_estimated_1rm, desde 20260714111522):
--   peso × (1 + repetições / 30), válida para 3–10 repetições.
-- Fórmula nova, alinhada ao perfil de força do GymTrack:
--   peso × (1 + (repetições + RIR) / 30), válida para 3–8 repetições, com
--   RIR obrigatoriamente informado (sem RIR não há como estimar a reserva).
--
-- Apenas o campo derivado set_logs.estimated_1rm é recalculado. Nenhum dado
-- bruto (peso, repetições, RIR, técnica, dor) é alterado ou apagado. Afeta
-- todo o histórico (todas as rotinas/versões), pois estimated_1rm é um campo
-- compartilhado — não há duplicação de fórmula por rotina.

create or replace function public.set_safe_estimated_1rm()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_warmup = false
     and new.weight_kg is not null and new.weight_kg > 0
     and new.reps between 3 and 8
     and new.rir is not null
     and new.execution_quality = 'boa'
     and new.pain_level = 'nenhuma'
     and coalesce(new.rom_quality, 'adequada') <> 'reduzida'
  then
    new.estimated_1rm := round((new.weight_kg * (1 + (new.reps + new.rir) / 30.0))::numeric, 2);
  else
    new.estimated_1rm := null;
  end if;
  return new;
end;
$$;

revoke execute on function public.set_safe_estimated_1rm() from public, anon, authenticated;

drop trigger if exists trg_set_safe_estimated_1rm on public.set_logs;
create trigger trg_set_safe_estimated_1rm
before insert or update of weight_kg, reps, rir, is_warmup, execution_quality, pain_level, rom_quality
on public.set_logs
for each row execute function public.set_safe_estimated_1rm();

-- Recalcula apenas o campo derivado com a fórmula/janela nova.
update public.set_logs
set estimated_1rm = case
  when is_warmup = false
    and weight_kg is not null and weight_kg > 0
    and reps between 3 and 8
    and rir is not null
    and execution_quality = 'boa'
    and pain_level = 'nenhuma'
    and coalesce(rom_quality, 'adequada') <> 'reduzida'
  then round((weight_kg * (1 + (reps + rir) / 30.0))::numeric, 2)
  else null
end;

-- Perfil de força (exercise_reference_maxes, desde 20260730110000): adiciona
-- contagem de amostras válidas e nível de confiança, exibidos como "1RM
-- estimado" (nunca "máximo real"). O cálculo/atualização (mediana das 3
-- estimativas válidas mais recentes, limite de 5% de mudança por sessão)
-- é feito em lib/training/e1rm-profile.ts + RPC update_exercise_reference_max,
-- não neste trigger — o trigger acima só cuida do campo por série.
alter table public.exercise_reference_maxes
  add column if not exists valid_sample_count integer not null default 0,
  add column if not exists confidence_level text not null default 'baixa';
alter table public.exercise_reference_maxes drop constraint if exists exercise_reference_maxes_confidence_level_check;
alter table public.exercise_reference_maxes add constraint exercise_reference_maxes_confidence_level_check
  check (confidence_level in ('baixa', 'media', 'alta'));

-- Rollback:
-- drop trigger if exists trg_set_safe_estimated_1rm on public.set_logs;
-- (recriar a função/trigger antigos de 20260714111522 se necessário reverter)
-- alter table public.exercise_reference_maxes drop column if exists valid_sample_count,
--   drop column if exists confidence_level;
