# Relatório Final — GymTrack

**Data:** 29/07/2026
**Branch inicial:** `fix/gymtrack-powerbuilding-final-2026-07-29` @ `38ef455`
**Branch criada:** `feat/gymtrack-10-of-10-final`
**Confirmação:** nenhum push, merge ou deploy. Nenhum histórico, sessão ou série apagada. Nenhum secret exposto ou incluído no pacote.

---

## 1. Estado inicial

| Item | Valor |
|---|---|
| Node / npm | v24.18.0 / 11.16.0 |
| Testes | 272 passando (27 arquivos) |
| Build | ✅ 25 rotas |
| E2E | 6/6 (shell) |

O app chegou nesta rodada já maduro — três rodadas anteriores fecharam sessão única, cancelamento lógico, RLS no caminho principal, fases de treinamento, deload, tendências e Abdômen Diário. **Ainda assim, a auditoria encontrou 5 bugs P0 reais**, dois deles silenciosos e graves.

---

## 2. Bugs P0 encontrados e corrigidos

Cada um tem teste de regressão que **falharia antes** da correção.

### 2.1 A cadeia de migrations não reconstruía o banco (desde a rotina v2)

`0001_initial.sql:25` criou `check (letter in ('A','B','C','D','E'))`, mas `0005_rotina_v2_data.sql:1048` insere o treino `'F'` (Legs B) — e as rotinas v3 e v4 também. **Em banco limpo, `supabase db reset` falhava na migration 0005.** O sintoma ficou latente em produção porque a constraint foi ajustada fora de migration.

- **Correção:** `supabase/migrations/0004a_workouts_letter_a_to_f.sql`, nomeada para ordenar **entre** `0004_rotina_v2_schema` e `0005_rotina_v2_data` — a constraint é corrigida imediatamente antes da primeira migration que insere o F. Nenhuma migration existente foi editada.
- **Teste:** `tests/migration-chain.test.ts` percorre as migrations na ordem real e reprova se qualquer uma inserir uma letra que a constraint vigente não aceita. Foi exatamente esse teste que revelou que o problema vinha da v2, não da v4.

### 2.2 Progressão avaliada contra o RIR errado

A página da sessão calculava `previousResults` (com `suggestForExercise`) **antes** de aplicar o ajuste de fase. Em Fundamentos o app **exibia RIR 3 e avaliava contra RIR 2** — podia sugerir aumento de carga com base num alvo que ele mesmo não estava pedindo.

- **Correção:** ordem reescrita em `app/(app)/sessao/[id]/page.tsx` — fase → alvos efetivos → progressão → exibição.
- **Teste:** `tests/progression-effective-target.test.ts` prova que a mesma sessão (topo da faixa, RIR 2) **não** sugere aumento em Fundamentos e **sugere** em `intro_powerbuilding`.

### 2.3 Service worker persistia páginas autenticadas

`public/sw.js` fazia `cache.put` de **qualquer** navegação. Depois do logout — ou em aparelho compartilhado — uma página com séries, peso e alimentação podia ser servida do cache para outra pessoa.

- **Correção:** cache restrito ao shell público (`/offline`, `/login`); rotas autenticadas passam a ser network-only com fallback para `/offline`; respostas redirecionadas (302 → login) nunca são gravadas; `CLEAR_PRIVATE_CACHE` e `SKIP_WAITING` por mensagem; versão do cache para `v2` para invalidar o cache inseguro já distribuído.
- **Complemento:** `lib/offline/clearPrivateState.ts` chamado no logout limpa Cache Storage e as chaves `gymtrack-*` do localStorage (sessão em andamento e as 4 filas offline).
- **Teste:** `tests/sw-cache.test.ts` (16 casos). O teste antigo, que assertava o precache de `/`, `/treinos` e `/abdomen`, foi corrigido — ele codificava o bug como comportamento esperado.

### 2.4 Ícones da PWA não existiam

O manifest referenciava `/icons/icon-192.png` e `/icons/icon-512.png`, mas `public/icons/` **não existia**.

- **Correção:** `scripts/generate-pwa-icons.mjs` gera 5 PNGs (192/512 em `any` e `maskable` + `apple-touch-icon` 180) usando só `node:zlib` — sem dependência nova, determinístico. Manifest completo com `scope`, `lang`, `categories` e propósitos separados.
- **Teste:** `tests/pwa-assets.test.ts` lê o manifest, confere que cada arquivo existe, é PNG válido e tem exatamente as dimensões declaradas.

### 2.5 Data gravada no fuso do aparelho

`components/progress/MeasurementsPanel.tsx:41` usava `Intl.DateTimeFormat('en-CA')` **sem `timeZone`**.

- **Correção:** `localDateISO()` central; `ReadinessCheckin` também migrado do Intl inline.
- **Teste:** `tests/local-date.test.ts` fixa o relógio em instantes UTC reais e cobre 20h59, 21h01 (quando o UTC já virou), domingo→segunda, virada de mês, de ano e 29/02 em ano bissexto. Inclui varredura que reprova qualquer `toISOString().slice(0,10)` ou `Intl('en-CA')` sem fuso em `app/`, `components/` e `lib/`.
- **Verificado e mantido:** `lib/daily-core/logic.ts` usa âncora `T12:00:00Z` construída a partir da data local — correto por construção (meio-dia UTC = 9h em SP), imune a DST. Não foi alterado; há teste documentando o porquê.

---

## 3. Validação executada

Instalação limpa (`rm -rf node_modules .next playwright-report test-results && npm ci`):

| Comando | Resultado |
|---|---|
| `npm ci` | ✅ exit 0 |
| `npm run typecheck` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 |
| `npm test` | ✅ **313/313** em 30 arquivos (eram 272) |
| `npm run build` | ✅ exit 0, 25 rotas |
| `npx playwright test` | ✅ 6/6 (mobile-chrome) |

**41 testes novos** nesta rodada: `migration-chain` (6), `progression-effective-target` (9), `pwa-assets` (11), `local-date` (13), mais os acréscimos em `sw-cache`.

---

## 4. Pontuação por categoria

Nota atribuída **apenas com evidência**. Onde não há prova executada, a nota reflete isso.

| Categoria | Nota | Critério e evidência | Limitação |
|---|---:|---|---|
| Estratégia de treino | **9,5** | Rotina v4 auditada, 6 dias DUP, volume por músculo conferido, alternativas opcionais | Duração de ~70 min é estimativa calculada, não cronometrada em uso real |
| Adequação ao nível | **10** | `fundamentals` padrão, piso de RIR, top set desativado, sem teste máximo, falha não incentivada — `tests/training-phase.test.ts` (22 casos) | — |
| Experiência na sessão | **8,5** | Timer por timestamp, wake lock, retomada, fila offline, `inputmode`, alvos ≥44px | Sem E2E autenticado provando o fluxo ponta a ponta |
| Progressão e acompanhamento | **10** | Progressão dupla sobre alvo efetivo + tendências 4/6/8 semanas com 6 estados — `progression`, `trend`, `progression-effective-target` | — |
| Abdômen Diário | **9** | 10 tabelas, progressão, reconciliação anti-duplicidade, dashboard | Métricas de frequência/consistência não expandidas nesta rodada |
| UX/UI | **8** | Estados vazios, classificação do dia unificada, divulgação progressiva, mobile sem scroll horizontal | Sem design system centralizado; sem auditoria visual tela a tela |
| Integridade dos dados | **10** | Sessão única (índice parcial + corrida), cancelamento lógico, cadeia de migrations válida do zero — `session-integrity`, `migration-chain` | — |
| Segurança e RLS | **7** | Zero service role no app, políticas por dono, SW sem dado privado, logout limpa estado | **RLS NÃO validada em banco real** — sem Docker/CLI (`docs/VALIDACAO_RLS_GYMTRACK.md`) |
| Testes automatizados | **8,5** | 313 unidade/integração + 6 E2E; todo bug desta rodada gerou teste de regressão | E2E cobre só o shell; falta fluxo autenticado |
| PWA e offline | **9** | Ícones reais, manifest completo, SW com escopo de privacidade, página `/offline`, fila idempotente | Comportamento offline não exercido por E2E real |
| Alimentação | **4** | Leitura de metas, refeições e macros funciona | **Diário não é editável** — criar/editar refeição, buscar alimento e receitas não implementados |
| Suplementos | **5** | Catálogo, marcar/desmarcar, item próprio, aviso de segurança | Dose realmente tomada, sequência, lembrete e conteúdo educativo ausentes |
| Recuperação | **9** | Prontidão com 4 estados integrada a progressão, deload e dashboard | Sem histórico visual de tendência de recuperação |
| Performance e acessibilidade | **6** | `prefers-reduced-motion`, aria-labels, foco visível, alvos de toque, fontes self-hosted | **Sem medição**: Lighthouse e axe não foram executados (ferramentas indisponíveis) |
| Documentação | **9,5** | README real, auditoria delta, relatórios por rodada, RLS documentada com bloqueio explícito | — |

### Por que não é 10/10 geral

O próprio prompt define: *"Não declarar 10/10 quando houver: teste não executado, RLS não validada, fluxo principal não testado."* Três dessas condições são verdadeiras:

1. **RLS não validada em banco real** — `docker: command not found`, `supabase not found`.
2. **Fluxo principal não coberto por E2E autenticado** — depende do mesmo bloqueio.
3. **Alimentação e suplementos não funcionais** — não implementados nesta rodada.

Declarar 10/10 aqui seria exatamente o que o prompt proíbe.

---

## 5. Pendências

### Bloqueios externos (não resolvíveis nesta máquina)
- Validação de RLS com dois usuários — roteiro pronto em `docs/VALIDACAO_RLS_GYMTRACK.md`.
- E2E autenticado (sessão completa, duplicada, cancelamento, offline, abdômen, fases).
- `supabase db reset` para provar a cadeia em Postgres real — a correção 0004a é o que torna isso possível.

### Não implementado nesta rodada (escopo)
- Diário alimentar editável, busca de alimentos, receitas.
- Suplementos: dose tomada, sequência, lembretes, educação.
- Exportação/portabilidade de dados (JSON/CSV).
- Observabilidade: error boundaries e logs estruturados.
- Design system centralizado.
- Medição de Lighthouse, axe e Web Vitals.

### Riscos
- A migration `0004a` usa numeração fora da ordem cronológica das demais. Isso é intencional e documentado, mas exige atenção se alguém rodar `supabase migration new` depois.
- O cache do SW subiu para `v2`: na primeira visita após o deploy, o shell é rebaixado e rebaixado uma vez (comportamento esperado).

---

## 6. Comandos

```bash
# Instalação limpa
rm -rf node_modules .next playwright-report test-results && npm ci

# Qualidade
npm run typecheck && npm run lint && npm test && npm run build

# E2E
npm run test:e2e

# Ícones da PWA (determinístico)
node scripts/generate-pwa-icons.mjs

# Banco — 5 migrations pendentes, nesta ordem
supabase db push
#  0004a_workouts_letter_a_to_f.sql      ← correção da constraint (crítica)
#  20260729120000_baseline_missing_tables.sql
#  20260729130000_deload_recommendations.sql
#  20260729140000_session_integrity.sql
#  20260729150000_alternativas_opcionais.sql

# Pacote limpo (falha se detectar node_modules/.next/.env)
./scripts/package.sh
```

**Rollback:** cada migration tem bloco comentado no cabeçalho (apenas ambientes novos). Rollback de app = redeploy da versão anterior na Vercel.
