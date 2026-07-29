# Relatório de Execução — Auditoria P0/P1

Branch: `auditoria-p0-p1` · Execução: 29/07/2026 · Ambiente: macOS, Node v24.18.0, npm 11.16.0

## Fase 0 — Baseline

Fonte: `gymtrack-master.zip` (sem `.git`; repositório inicializado localmente com commit de baseline antes de qualquer alteração).

| Verificação | Baseline | Final |
|---|---|---|
| `npm run typecheck` | ✅ limpo | ✅ limpo |
| `npm run lint` | ✅ limpo | ✅ limpo |
| `npx vitest run` | ✅ 144/144 (14 arquivos) | ✅ **194/194 (20 arquivos)** |
| `npm run build` | ❌ Google Fonts (P0-3) | ✅ **conclui sem rede de fontes** |

**Divergência encontrada em relação à auditoria:** a auditoria listou 10 tabelas órfãs, mas o cruzamento `types/database.ts` × `supabase/migrations/` revelou **14** — as 10 listadas mais `food_items`, `meal_entries`, `recipes` e `recipe_ingredients` (usadas por `app/(app)/alimentacao/page.tsx`). A Fase 1 cobre as 14.

## Fases concluídas

### Fase 1 — Migration baseline das 14 tabelas órfãs (P0)
- `supabase/migrations/20260729120000_baseline_missing_tables.sql`: 14 tabelas com `create table if not exists` (no-op estrutural em produção), FKs para `auth.users` com cascade, índices nas FKs filtradas, RLS habilitado e 4 políticas por tabela (`drop policy if exists` antes de cada `create policy` = idempotente). Catálogos (`food_items`, `recipes`, `supplements`): `user_id is null` = global somente leitura. Filhas (`meal_entries`, `recipe_ingredients`): dono herdado do pai via `exists`. `user_preferences`: chaveada por `id = auth.uid()`. `nutrition_goals`: `unique(user_id)` (exigido pelo upsert `onConflict: 'user_id'` do código).
- Teste: `tests/baseline-missing-tables.test.ts` (12 testes de parsing estático).
- Nota: tipos numéricos foram inferidos de `number` do TS (numeric/integer/smallint documentados na migration); em produção os tipos existentes prevalecem.

### Fase 2 — Fim do service role no caminho principal + fontes (P0)
- As 13 páginas server e `DailyCoreHomeCard` agora usam o cliente SSR (`createClient()` de `lib/supabase/server.ts`) — **todo o acesso a dados do app passa pelo RLS**. `lib/supabase/admin.ts` permanece restrito a `scripts/seed.ts`, com comentário de restrição.
- Guarda: `tests/no-admin-client-in-app.test.ts` falha se `createAdminClient`/`SUPABASE_SERVICE_ROLE_KEY` aparecer em `app/` ou `components/`.
- Fontes Geist/Geist Mono self-hosted em `assets/fonts/` (woff2 variáveis do pacote npm `geist`, licença OFL incluída) via `next/font/local`, mesmas CSS variables. `next build` conclui sem rede.

### Fase 3 — Volume planejado × executado
- `lib/training/executed-volume.ts`: agregação pura (exclui warmup e dor moderada/forte; respeita `performed_exercise_id`). `getExecutedWeeklyVolumeByMuscle` em `lib/queries/analytics.ts` (semana iniciando segunda, mesmo padrão de `getWeeklyVolume`).
- `PlannedVolumeCard` (usado em `/progresso`): colunas separadas Feitas · Diretas · Indiretas (0,5/série, nunca somadas), barra de progresso do executado e faixa de referência 10–15 séries/músculo em tom informativo.
- Teste: `tests/executed-volume.test.ts` (7 testes).

### Fase 4 — Motor de deload (P1)
- `lib/progression/deload.ts` (puro): gatilhos (a) estagnação 3 semanas em ≥2 compostos com sessões completas; (b) ≥4 `low_recovery` em 7 dias; (c) queda e1RM >10% por 2 sessões sem dor aguda. Prescrição: 1 semana, −40% séries de acessórios, RIR 3–4 nos compostos, cargas mantidas. Sugestão pendente bloqueia novas.
- `supabase/migrations/20260729130000_deload_recommendations.sql`: tabela com status `sugerido/aceito/recusado/concluido`, RLS padrão, índice único parcial (1 pendente por usuário) + coluna `user_preferences.keep_screen_awake` (Fase 5).
- `lib/queries/deload.ts` constrói o histórico real (sessões concluídas de 35 dias, e1RM por sessão via `estimated_1rm`, prontidão de 7 dias). `components/dashboard/DeloadCard.tsx` no padrão visual do RecoveryAlertCard: Aceitar/Recusar/Concluir — nunca automático.
- Teste: `tests/deload.test.ts` (14 testes: 3 gatilhos, não-gatilhos, bloqueio por pendência, migration).

### Fase 5 — Wake Lock (P1)
- `lib/hooks/useWakeLock.ts`: detecção de suporte, `request('screen')` ao montar, reaquisição em `visibilitychange`, release no unmount, falha silenciosa sem suporte.
- Integrado em `SessionClient` (musculação) e `CoreSessionClient` (abdômen); toggle "Manter tela ligada" em `/configuracoes` (`keep_screen_awake`, default true).
- Teste: `tests/wake-lock.test.tsx` (7 testes, navigator mockado com e sem suporte).

### Fase 6 — Service worker mínimo (P1)
- `public/sw.js`: precache do shell (`/`, `/treinos`, `/abdomen`, `/offline`), network-first para navegações com fallback cache → `/offline`, stale-while-revalidate para `_next/static`, `/exercises` e fontes. Só intercepta GET do próprio origin; **não sincroniza dados** (fila idempotente intocada). Sem `skipWaiting` agressivo.
- `lib/offline/swCache.ts`: versionamento puro espelhado no SW (teste garante paridade — para invalidar cache, subir a versão nos dois arquivos). `app/offline/page.tsx` estática. Registro só em produção (`ServiceWorkerRegistration` no layout).
- Teste: `tests/sw-cache.test.ts` (8 testes). Teste manual documentado abaixo.

### Fase 7 — Qualidade, acessibilidade e UX fina
- `inputmode` conferido: carga `decimal`, repetições `numeric` (corrigido o `Field` do CoreSessionClient, que usava `decimal` para tudo).
- Alvos de toque: botão de concluir série `size-12` (48px) e controles do RestTimerDock `min-h-11/min-w-11` (44px) já conformes.
- aria-labels adicionados aos botões Pausar/Retomar e Pular do RestTimerDock (texto some em telas <390px); `aria-live` do timer preservado.
- `prefers-reduced-motion`: `MotionConfig reducedMotion="user"` global no provider.
- Estados vazios conferidos: `/historico`, `/progresso` (explorer + medidas) e `/abdomen` já renderizam orientação de primeiro uso.
- Identidade visual: tokens de `app/globals.css` intocados.

### Fase 8 — Validação final
Comandos executados nesta máquina em 29/07/2026, todos verdes:
`npm run typecheck` ✅ · `npm run lint` ✅ · `npx vitest run` ✅ **194/194** (144 baseline + 50 novos) · `npm run build` ✅ (24 rotas, `/offline` estática, sem rede de fontes).

## Migrations criadas (ordem de aplicação)

1. `20260729120000_baseline_missing_tables.sql`
2. `20260729130000_deload_recommendations.sql`

**Aplicar antes do deploy** (o toggle de Wake Lock grava `keep_screen_awake` e o card de deload lê `deload_recommendations`):

```bash
supabase db push
```

Ou cole o conteúdo de cada arquivo no SQL Editor do Dashboard, na ordem acima. Ambas são idempotentes (`if not exists` / `drop policy if exists`) — em produção a primeira é no-op estrutural nas tabelas que já existem, adicionando apenas as políticas RLS que faltarem.

## Plano de rollback por migration

Cada migration termina/inicia com bloco comentado de rollback **apenas para ambientes novos — nunca executar em produção**:

- `20260729120000`: `drop table if exists` das 14 tabelas (ordem inversa às FKs, documentada no cabeçalho).
- `20260729130000`: `drop table if exists public.deload_recommendations; alter table public.user_preferences drop column if exists keep_screen_awake;`

Nenhuma migration escreve em `workout_sessions`, `set_logs`, `daily_core_sessions`, `daily_core_sets` ou `routine_backups` (teste estático garante).

## Teste manual do modo offline (pós-deploy)

1. Abrir o app em produção, navegar por `/`, `/treinos` e `/abdomen` (popula o cache).
2. DevTools → Application → Service Workers: confirmar `sw.js` ativo com cache `gymtrack-shell-v1`.
3. Ativar "Offline" no DevTools e recarregar: o shell abre; rota sem cache cai em `/offline`.
4. Registrar uma série offline e religar a rede: a fila sincroniza (comportamento pré-existente, não alterado).

## Bloqueios encontrados

- **Sem credenciais do Supabase neste ambiente**: nada que dependesse delas foi bloqueante — as migrations são estáticas e testadas por parsing; a troca do admin client compila e passa na suíte. Validar em staging/produção que cada página segue retornando dados após `supabase db push` (se alguma esvaziar, é política RLS faltante — corrigir com política adicional, nunca voltando ao admin client).
- `npm run build` requer rede para o npm registry apenas na instalação; fontes não dependem mais de rede.

## Critérios de aceite (Parte 9)

- ✅ 14 (>10) tabelas órfãs com migration + RLS + testes
- ✅ Zero `createAdminClient` em `app/` e `components/` (teste de guarda verde)
- ✅ Build sem rede de fontes
- ✅ Deload: sugerido nos gatilhos, confirmável, persistido, testado
- ✅ Wake Lock ativo na sessão com fallback silencioso
- ✅ App abre offline com shell + página `/offline`
- ✅ Histórico intocado: nenhuma migration escreve em tabelas de sessão/série
- ✅ Suíte completa verde (194/194) com evidências reais de execução
- ✅ Commits pequenos por fase, em português, **sem push**
