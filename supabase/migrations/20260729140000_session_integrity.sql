-- 20260729140000 — Integridade de sessões (P0.1 e P0.2 da auditoria final)
--
-- 1) Cancelamento LÓGICO: sessões canceladas nunca são apagadas (o delete em
--    cascade levava os set_logs junto). Elas recebem cancelled_at e ficam
--    fora das métricas (todas filtram finished_at is not null), mas o
--    histórico de séries é preservado.
-- 2) No máximo UMA sessão ativa por usuário (finished_at null e
--    cancelled_at null), garantido por índice único parcial. Corridas de
--    inserção caem em erro 23505 e o app abre a sessão existente.
--
-- Antes de criar o índice, sessões ativas duplicadas pré-existentes são
-- canceladas logicamente (a mais recente por usuário permanece ativa) — as
-- séries dessas sessões são preservadas; nada é apagado.
--
-- Rollback seguro (apenas para ambientes novos; NUNCA executar em produção):
--   drop index if exists public.workout_sessions_one_active_idx;
--   alter table public.workout_sessions drop column if exists cancel_reason;
--   alter table public.workout_sessions drop column if exists cancelled_at;

alter table public.workout_sessions
  add column if not exists cancelled_at timestamptz;

alter table public.workout_sessions
  add column if not exists cancel_reason text;

-- Deduplicação não destrutiva: mantém ativa apenas a sessão mais recente de
-- cada usuário; as demais viram canceladas logicamente com motivo explícito.
update public.workout_sessions ws
set cancelled_at = now(),
    cancel_reason = 'Cancelada automaticamente: havia mais de uma sessão ativa (migration de integridade). Séries preservadas.'
where ws.finished_at is null
  and ws.cancelled_at is null
  and ws.id not in (
    select distinct on (user_id) id
    from public.workout_sessions
    where finished_at is null and cancelled_at is null
    order by user_id, started_at desc
  );

create unique index if not exists workout_sessions_one_active_idx
  on public.workout_sessions(user_id)
  where finished_at is null and cancelled_at is null;
