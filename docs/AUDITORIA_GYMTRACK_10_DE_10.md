# Auditoria Delta — GymTrack 10/10

**Data:** 29/07/2026 · **Branch base:** `fix/gymtrack-powerbuilding-final-2026-07-29` @ `38ef455` · **Branch de trabalho:** `feat/gymtrack-10-of-10-final`

Auditoria feita **no código real**, não em documentos. Cada linha tem o arquivo e a evidência que sustenta o estado declarado.

## Baseline limpo (executado)

```bash
rm -rf node_modules .next playwright-report test-results *.tsbuildinfo && npm ci
```

| Item | Valor |
|---|---|
| Node | v24.18.0 |
| npm | 11.16.0 |
| `npm ci` | ✅ exit 0 (registry público acessível) |
| `npm run typecheck` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 |
| `npm test` | ✅ 272/272 no baseline → **313/313** ao final |
| `npm run build` | ✅ exit 0, 25 rotas |
| E2E (`npx playwright test`) | ✅ 6/6 (shell, mobile-chrome) |

---

## Tabela de delta

### P0 — Integridade e segurança

| Categoria | Requisito | Estado inicial | Evidência | Problema | Ação | Prior. |
|---|---|---|---|---|---|---|
| Banco | Constraint `letter` aceita A–F | **Incorreto** | `0001_initial.sql:25` → `check (letter in ('A'..'E'))`; `0005_rotina_v2_data.sql:1048` insere `'F'` | **Cadeia de migrations quebrava em banco limpo desde a v2** — não era só a v4 | Migration `0004a_workouts_letter_a_to_f.sql`, posicionada antes de 0005 | P0 |
| Progressão | Calcular sobre o alvo EFETIVO da fase | **Incorreto** | `sessao/[id]/page.tsx`: `previousResults` (linha ~44) rodava antes do ajuste de fase (linha ~112) | App prescrevia RIR 3 na tela e avaliava contra RIR 2 — podia sugerir aumento sobre alvo que ele mesmo não pediu | Reordenado: fase → alvos efetivos → progressão | P0 |
| PWA | Ícones do manifest existem | **Ausente** | `app/manifest.ts` referenciava `/icons/icon-192.png` e `/icons/icon-512.png`; `public/icons/` **não existia** | Instalação da PWA sem ícone; URLs 404 | `scripts/generate-pwa-icons.mjs` + 5 PNGs + manifest completo | P0 |
| Segurança | SW não guarda dado privado | **Incorreto** | `public/sw.js` fazia `cache.put` de **qualquer** navegação | Após logout, ou em aparelho compartilhado, página com dados privados podia ser servida do cache | Cache restrito ao shell público; rotas autenticadas network-only; limpeza no logout | P0 |
| Datas | Fuso São Paulo em todo lugar | **Parcial** | `MeasurementsPanel.tsx:41` usava `Intl.DateTimeFormat('en-CA')` **sem `timeZone`** | Medida gravada no fuso do aparelho | `localDateISO()` central + testes de virada | P0 |
| Sessão | Uma sessão ativa por usuário | **Completo** | `workout_sessions_one_active_idx`; `startOrResumeSession()` trata `23505` | — | Preservado | — |
| Sessão | Cancelamento lógico | **Completo** | `cancelSessionLogically()`; sem `delete` | — | Preservado | — |
| Fases | `training_phase` controla prescrição | **Completo** | `lib/training/phase.ts`; gate de top set + piso de RIR | — | Preservado | — |
| Volume | Musculação separada do abdômen | **Completo** | `getPlannedWeeklyVolumeByMuscle()` + `getDailyCoreWeeklySets()` | — | Preservado | — |
| RLS | Validação com dois usuários | **Bloqueado externamente** | `docker: command not found`, `supabase not found` | Sem Docker/CLI | Documentado em `docs/VALIDACAO_RLS_GYMTRACK.md` | P0 |

### P1 — Experiência e confiabilidade

| Categoria | Requisito | Estado | Evidência | Ação |
|---|---|---|---|---|
| PWA | `apple-touch-icon`, favicon, tema, scope, nomes | **Parcial → Completo** | manifest sem `scope`/`lang`/`categories` | Manifest completo + `icons.apple` no layout |
| SW | `skipWaiting` controlado, limpeza de versão | **Parcial → Completo** | não havia canal de mensagem | `SKIP_WAITING` e `CLEAR_PRIVATE_CACHE` por mensagem |
| Offline | Página `/offline` e fila idempotente | **Completo** | `app/offline/page.tsx`, `lib/offline/syncQueue.ts` | Preservado |
| Sessão | Persistência (localStorage + fila + banco) | **Completo** | `sessionStore` com persist; 4 filas `gymtrack-pending-*` | Preservado; logout agora limpa |
| UX | Estados vazios, alvos de toque, aria | **Completo** | rodadas anteriores | Preservado |
| Acessibilidade | Auditoria automatizada (axe/Lighthouse) | **Ausente** | sem ferramenta instalada | **Não executada** — ver pendências |
| Performance | Medição Web Vitals / Lighthouse | **Ausente** | idem | **Não medida** — ver pendências |

### P2 — Funcionalidades completas

| Categoria | Requisito | Estado | Evidência | Ação |
|---|---|---|---|---|
| Alimentação | Diário funcional (criar/editar refeição, buscar alimento, receitas) | **Parcial** | `/alimentacao` só lê; CTAs vão para `/acompanhamento` (só metas) | **Não implementado nesta rodada** |
| Suplementos | Dose tomada, sequência, lembrete, educação | **Parcial** | `SupplementTracker` marca/desmarca; grava dose padrão | **Não implementado nesta rodada** |
| Recuperação | Registro + integração com progressão/deload | **Completo** | `daily_readiness`, `readiness.ts`, motor de deload | Preservado |
| Abdômen | Módulo completo | **Completo** | 10 tabelas, progressão, dashboard, reconciliação | Preservado |
| Portabilidade | Exportar dados (JSON/CSV) | **Ausente** | não existe | **Não implementado nesta rodada** |
| Observabilidade | Error boundaries, logs estruturados | **Ausente** | não existe | **Não implementado nesta rodada** |

---

## Conflito de instruções mantido

A auditoria anterior registrou que o usuário instruiu **explicitamente** não expor `failureAllowed` na interface (sem badge de falha, sem aviso de "vá à falha", sem bônus por RIR 0). Essa decisão continua valendo e está travada por teste em `tests/training-phase.test.ts`. A política de falha é governada pela fase **internamente**.

---

## Resumo honesto

- **5 bugs P0 reais encontrados e corrigidos**, cada um com teste de regressão que falharia antes da correção.
- **Dois deles eram silenciosos e graves**: a cadeia de migrations não reconstruía o banco desde a rotina v2, e o service worker persistia páginas autenticadas.
- **Não foi possível atingir 10/10 em todas as categorias**: RLS real e E2E autenticado estão bloqueados por ambiente; alimentação, suplementos, exportação e observabilidade não foram implementados nesta rodada. O relatório final atribui nota apenas onde há evidência.
