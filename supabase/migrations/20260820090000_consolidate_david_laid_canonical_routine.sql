-- Consolida David Laid Powerbuilding DUP numa única routine_version ativa.
--
-- A "Guided Load v7" (routine_version 8) reescrevia os esforços de 1RM/3RM/
--5RM da fonte como `guided_top_set` — uma série de reps fixas com RIR 2 —
-- em vez de manter `rep_max_effort`. `formatPrescription()`
-- (lib/training/prescription.ts) não tem caso para `guided_top_set`, então a
-- tela caía no ramo genérico e mostrava "1×5" em vez de "1×5RM": a
-- prescrição pública ficava escondida atrás da orientação de carga do
-- GymTrack, exatamente o que a rotina não pode fazer.
--
-- A correção é feita nas MESMAS linhas de workout_exercises (mesmo id) —
-- nenhuma sessão, série ou histórico é apagado ou reatribuído. Os seis
-- top sets por usuário já tinham target_reps_min = target_reps_max =
-- rep_max_target corretos (ver 20260731190000); só prescription_type e
-- fixed_reps precisam voltar ao formato de rep_max_effort. As duas linhas
-- de barra fixa por usuário já estavam corretas (rep_range 8–10) e não são
-- tocadas. As colunas percentage_of_e1rm/load_strategy/source_prescription/
-- guided_prescription continuam como estão: elas já alimentam "Por que este
-- peso?" (CurrentExercisePanel/WhyThisWeightSheet) como camada secundária,
-- só deixam de ser a prescrição principal.
--
-- routine_version 8 deixa de existir como versão separada: workouts,
-- training_program_blocks e user_preferences.routine_provisioned_version em
-- 8 passam a 7, ficando só a Gymshark Exact v7 como rotina David Laid ativa.
-- routine_version 8 nunca foi provisionado fora da conta principal (ver
-- 20260731190000), então este UPDATE por versão já é escopo suficiente —
-- não precisa repetir o uuid da conta.

update public.workout_exercises we
set prescription_type = 'rep_max_effort',
    fixed_reps = null
from public.workouts w
where we.workout_id = w.id
  and w.routine_version = 8
  and we.prescription_type = 'guided_top_set';

update public.workouts
set routine_version = 7
where routine_version = 8;

update public.training_program_blocks
set routine_version = 7
where routine_version = 8;

update public.user_preferences
set routine_provisioned_version = 7
where routine_provisioned_version = 8;

-- Rollback seguro: não há como distinguir de volta quais linhas eram
-- originalmente routine_version 8 depois deste UPDATE (o objetivo é
-- justamente não haver mais duas versões). Se for necessário reverter,
-- restaure a partir do routine_backups mais recente com label
-- 'pre-david-laid-guided-load-v7-...' (ver 20260731190000).
