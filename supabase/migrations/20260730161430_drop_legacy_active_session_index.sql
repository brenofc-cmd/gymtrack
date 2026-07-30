-- O índice legado considerava toda sessão com finished_at nulo como ativa,
-- inclusive sessões já canceladas logicamente. Isso impedia iniciar o
-- próximo treino com erro 23505.
--
-- Sessões antigas ligadas a fichas arquivadas também não devem bloquear a
-- rotina v5. O cancelamento abaixo preserva integralmente seus set_logs.
update public.workout_sessions as session
set
  cancelled_at = coalesce(session.cancelled_at, now()),
  cancel_reason = coalesce(
    session.cancel_reason,
    'Cancelada automaticamente: ficha antiga arquivada. Séries preservadas.'
  )
from public.workouts as workout
where workout.id = session.workout_id
  and session.finished_at is null
  and session.cancelled_at is null
  and (
    workout.is_archived = true
    or workout.routine_version is distinct from 5
  );

-- Substituído por workout_sessions_one_active_idx, que considera tanto
-- finished_at quanto cancelled_at.
drop index if exists public.uniq_active_session_per_user;

create unique index if not exists workout_sessions_one_active_idx
  on public.workout_sessions(user_id)
  where finished_at is null and cancelled_at is null;
