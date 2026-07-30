-- 0004a — Corrige a constraint de workouts.letter para aceitar A–F
--
-- BUG REAL (P0). 0001_initial.sql criou:
--     letter text not null check (letter in ('A','B','C','D','E'))
-- mas TODAS as rotinas de seis dias inserem um treino 'F':
--   * 0005_rotina_v2_data.sql       → 'F', 'Legs B'  (primeira ocorrência)
--   * 0006_rotina_v3_data.sql
--   * 20260714105553_powerbuilding_routine_v4.sql
--
-- Consequência: a cadeia de migrations NÃO reconstruía o banco do zero desde
-- a v2 — em banco limpo, 0005 falha com violação de check ao inserir o treino
-- F. Em produção o sintoma ficou latente (a constraint foi ajustada fora de
-- migration, como as 14 tabelas do baseline anterior).
--
-- POR QUE ESTE NOME: as migrations rodam em ordem de nome de arquivo, e
-- "0004a" ordena entre "0004_rotina_v2_schema" e "0005_rotina_v2_data" — ou
-- seja, a constraint é corrigida imediatamente antes da primeira migration que
-- insere o treino F. Nenhuma migration existente foi editada: este é um
-- arquivo novo inserido na posição correta da cadeia. O `supabase db push`
-- aplica qualquer migration ausente do histórico, então bancos já migrados
-- também recebem a correção.
--
-- Idempotente e não destrutiva: só troca a constraint, nenhum dado é tocado.
--
-- Rollback (apenas ambientes novos — reverter para A–E quebraria o treino F):
--   alter table public.workouts drop constraint if exists workouts_letter_check;
--   alter table public.workouts add constraint workouts_letter_check
--     check (letter in ('A','B','C','D','E'));

alter table public.workouts
  drop constraint if exists workouts_letter_check;

alter table public.workouts
  add constraint workouts_letter_check
  check (letter in ('A', 'B', 'C', 'D', 'E', 'F'));
