# Relatório — Integração do Método Powerbuilding

**Data:** 29/07/2026
**Branch inicial:** `fix/auditoria-final-gymtrack-2026-07-29` · **Commit inicial:** `ae61fb4`
**Branch criada:** `fix/gymtrack-powerbuilding-final-2026-07-29`
**Confirmação:** nenhum `git push`, merge ou deploy. Nenhuma sessão, série ou dado histórico apagado. Nenhuma variável secreta exposta. `service_role` continua fora do frontend.

---

## 1. Método: auditoria de diferenças, não reconstrução

O documento `docs/AUDITORIA_DELTA_POWERBUILDING_FINAL.md` traz a tabela requisito × estado × evidência × ação. Resumo: dos ~40 requisitos do prompt, **28 já estavam Completos** (rodadas anteriores), **8 estavam Parciais**, **3 Ausentes** e **1 permanece bloqueado**. Nada correto foi reescrito e nenhuma solução foi duplicada.

### Bloqueio de material

`Texto colado(1).txt` (artigo sobre o powerbuilding de David Laid) **não existe no sistema** — procurado em `~/Downloads`, `~/Desktop` e `~/Documents`. Trabalhei a partir do resumo de princípios da seção 5 do próprio prompt e da fonte Gymshark (27/05/2026) já verificada. Nenhum princípio foi inventado.

---

## 2. Commits desta rodada

| Commit | Escopo |
|---|---|
| `183d5f4` | PB1 — RIR efetivo por fase + política de falha governada pela fase |
| `2cede9b` | PB2 — Tendência de 4–8 semanas |
| `9980397` | PB3 — Classificação do dia unificada (inclui "Misto") |
| `348f8bb` | PB4 — Hiperextensão e dips como alternativas opcionais |
| `4c5d300` | PB5 — Conteúdo educativo (força-ferramenta, DUP, alimentação) |

20 arquivos alterados, +1316 / −33 linhas.

---

## 3. Requisitos que JÁ EXISTIAM (preservados, não reescritos)

Verificados no código com evidência, sem alteração:

- **4.1 Sessão única** — `workout_sessions_one_active_idx`, `startOrResumeSession()` com tratamento de `23505`, diálogo no `StartWorkoutButton`.
- **4.2 Cancelamento lógico** — `cancelSessionLogically()`, sem `delete`; canceladas fora de métricas, visíveis no histórico.
- **4.4 Volume separado** — `getPlannedWeeklyVolumeByMuscle()` da ficha visível + `getDailyCoreWeeklySets()` em seção própria.
- **5.3 Compostos como base**, **5.6 pull-up assistido** (`load-input.ts` tipo `assistance`, reduzir assistência = progresso), **5.7/5.8** cues de elevação lateral e tríceps.
- **5.9 Bird-dog** — já existia em `daily_core_exercises` (dia 4) como `estabilidade`; **não** conta como hipertrofia abdominal. Nada a mudar.
- **5.11 Deadlift** — a rotina usa terra romeno/stiff 1×/semana. O prompt pede para **não** aumentar; mantido deliberadamente.
- **7 Progressão dupla**, **8 Execução**, **10 Área educativa**, **11 Abdômen Diário**, **12 Recuperação/deload**, **14 Biblioteca e mídia**.
- **15.1–15.3, 15.5–15.10** — corrigidos na rodada anterior.

---

## 4. Requisitos COMPLETADOS ou CORRIGIDOS

### 4.1 RIR efetivo por fase (item 4.3) — `lib/training/phase.ts`

Antes, a fase só zerava `top_set_enabled`. Agora `adjustTargetsForPhase()` aplica um **piso de RIR** em `fundamentals`: compostos RIR 3, isoladores/abdominais RIR 2 — preservando a amplitude da faixa (isolador 1–2 vira 2–3).

Garantias verificadas por teste: o ajuste **só eleva** o RIR (nunca deixa a sessão mais agressiva), preserva os demais campos do exercício, e **não altera** `lib/routine/powerbuilding-v4.ts` nem o banco — é camada de prescrição aplicada na leitura da sessão, igual ao gate do top set.

### 4.2 Política de falha governada pela fase (item 4.3) — `lib/training/failure-policy.ts`

`canApproachFailure()` agora recebe `phase`. Em `fundamentals` (padrão, inclusive quando a fase é omitida) a resposta é sempre `false`: a fase não planeja proximidade da falha em nenhum exercício. Risco alto continua bloqueado mesmo em `intro_powerbuilding`.

> **Conflito de instruções, resolvido e registrado.** A seção 15.4 deste prompt pede para conectar a falha à interface. Em 29/07/2026 o usuário instruiu explicitamente o contrário ("sem badge de falha permitida, sem aviso de vá à falha, sem bônus por RIR 0; `failureAllowed` fica só no modelo de dados"). **A instrução direta do usuário prevaleceu:** a política governa a prescrição internamente (atendendo ao espírito do item 4.3) e **não** existe exposição na UI. Dois testes travam essa decisão contra regressão.

### 4.3 Tendência de 4–8 semanas (item 6) — `lib/progression/trend.ts`

Módulo puro `analyzeTrend(sessions, window)` com janelas de 4, 6 e 8 semanas e seis estados nomeados: `evoluindo`, `estavel`, `dados_insuficientes`, `possivel_estagnacao`, `recuperacao_prejudicada`, `tecnica_inconsistente`.

Decisões de projeto verificadas por teste:
- **Técnica e recuperação vêm antes da carga** — 40% de sessões com execução ruim classifica como técnica inconsistente mesmo com a carga subindo; 50% com dor/prontidão baixa vira "desempenho prejudicado por recuperação".
- **Estagnação não é diagnosticada por um treino** — exige a janela praticamente cheia; com 3 sessões numa janela de 8 semanas o resultado é "estável", não estagnação.
- **Ganho de repetição com a mesma carga é progresso** (e exercícios sem carga evoluem só por repetições).
- **A janela é lente de observação, não cronômetro de troca** — nenhum texto sugere substituir exercício por tempo decorrido.

Query `getExerciseTrendSessions()` alimenta o módulo com RIR médio, execução, dor, prontidão do dia e consistência, respeitando `performed_exercise_id` (substituições) e ignorando sessões canceladas. UI: `ExerciseTrendCard` com seletor 4s/6s/8s em `/exercicios/[id]`.

### 4.4 Classificação do dia unificada (itens 5.2 e 9) — `components/workout/WorkoutFocusBadge.tsx`

Fonte única para dashboard, detalhe do treino e **cabeçalho da sessão** (que antes não tinha classificação nenhuma). `classifyDay()` acrescenta o estado **"Misto"**: um dia de força técnica com mais acessórios isoladores do que compostos não é chamado só de "força", exatamente como o prompt exige. No detalhe do treino, objetivo e classificação passaram a viver no mesmo card.

### 4.5 Alternativas opcionais (itens 5.9 e 5.10) — migration `20260729150000`

- **Hiperextensão** cadastrada como alternativa **opcional** do terra romeno, com instrução de parar na linha do tronco. Não vira série extra: a rotina já acumula fadiga lombar (terra romeno, búlgaro, hip thrust, remadas).
- **Dips** (livre + assistida) como alternativa dos supinos, com alerta explícito de desconforto no ombro, diferenciação peitoral × tríceps pela inclinação do tronco, e sem recomendar carga adicional antes de dominar o peso corporal. Na versão assistida, progredir = reduzir assistência.

A migration **não insere nenhuma linha em `workout_exercises`** (teste garante): nenhum volume é adicionado automaticamente; o usuário escolhe pela troca de exercício.

### 4.6 Conteúdo educativo (itens 5.1 e 13) — `/aprendizado`

- Tópico "Força é ferramenta, não substituto" — força amplia a carga utilizável mas não substitui volume; progresso também é repetição, controle e amplitude.
- Seção DUP explicando que o estímulo muda na semana, que dia pesado não é teste de máxima e dia de hipertrofia não é carga leve demais, com lista recolhível "o que evitar".
- Seção de alimentação com superávit × déficit, deixando explícito que os números vêm do perfil do usuário e só mudam com confirmação — **o déficit fixo de 300–500 kcal do material não foi copiado**.

---

## 5. Requisitos NÃO aplicados e o motivo

| Requisito | Motivo |
|---|---|
| **15.4** Expor falha na interface | Instrução explícita e posterior do usuário em contrário; registrado na auditoria delta e travado por teste |
| **5.11** Aumentar frequência de terra | O próprio prompt pede para não aumentar; a rotina já tem carga de cadeia posterior suficiente |
| Rotina literal com 1RM/3RM/5RM | Rejeitado por segurança — usuário iniciante |
| **19** Validação de RLS real | Bloqueado: sem Docker e sem Supabase CLI nesta máquina |
| **18** E2E de fluxo autenticado completo | Mesmo bloqueio: exige Supabase real; a lógica é coberta por testes de unidade com client mockado |
| **8** Escopo de alimentação/suplementos completo | Fora do escopo desta rodada por instrução anterior ("não misture com os P0"); lacunas documentadas |

---

## 6. Testes

| Arquivo | Casos | Cobre |
|---|---|---|
| `tests/training-phase.test.ts` | 22 | Fase padrão, gate de top set, piso de RIR por tipo, não-redução de RIR, política de falha por fase, ausência de UI de falha |
| `tests/trend.test.ts` | 13 | Seis estados, prioridade de técnica/recuperação sobre carga, estagnação exigindo janela cheia, melhor série, consistência |
| `tests/workout-focus.test.ts` | 11 | Classificação incl. "Misto", aplicação à rotina v4 real, fonte única nas 3 telas, nomenclatura sem "David Laid" |
| `tests/alternativas-opcionais.test.ts` | 10 | Catálogo completo, idempotência, ausência de `workout_exercises`, alertas de segurança, rollback |
| `tests/session-integrity.test.ts` | 14 | (rodada anterior) sessão única, corrida, cancelamento lógico |
| `tests/powerbuilding-v4.test.ts` | 11 | Atualizado: cenário seguro de falha agora exige fase avançada |

### Execução real em instalação limpa

```bash
rm -rf node_modules .next *.tsbuildinfo && npm ci
```

| Comando | Resultado |
|---|---|
| `npm ci` | ✅ exit 0 (registry público acessível; sem bloqueio) |
| `npm run typecheck` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 |
| `npm test` | ✅ **266/266** em 26 arquivos (eram 220) |
| `npm run build` | ✅ exit 0, 25 rotas |
| `npx playwright test` | ✅ **6/6** (mobile-chrome) |

### Screenshots

`docs/screenshots/`: `login-mobile.png`, `offline-mobile.png`, `login-desktop.png`, `offline-desktop.png`. Telas autenticadas dependem do Supabase — mesmo bloqueio da seção 5.

---

## 7. Migrations

Ordem completa a aplicar (as três primeiras são de rodadas anteriores):

1. `20260729120000_baseline_missing_tables.sql`
2. `20260729130000_deload_recommendations.sql`
3. `20260729140000_session_integrity.sql`
4. `20260729150000_alternativas_opcionais.sql` *(esta rodada)*

```bash
supabase db push
```

Todas idempotentes, com rollback comentado no cabeçalho (rollback **apenas para ambientes novos**). Nenhuma escreve em `set_logs`, `workout_sessions` ou `daily_core_*` históricos — teste estático garante.

---

## 8. Pendências e bloqueios

**Bloqueios de ambiente (não resolvíveis desta máquina):**
- Validação de RLS real com dois usuários e fluxos autenticados de ponta a ponta — sem Docker/Supabase CLI. **RLS não está validada**; roteiro em `docs/RELATORIO_CORRECOES_FINAIS.md` §7.
- Screenshots de telas autenticadas, pelo mesmo motivo.
- O artigo `Texto colado(1).txt` não foi localizado.

**Pendências de produto:**
- Escopo completo de alimentação (criar/editar refeição) e suplementos (dose tomada, sequência, lembrete) — auditado em `docs/RELATORIO_CORRECOES_FINAIS.md` §9.
- Fontes primárias diretas do atleta não re-verificadas individualmente.
- Vídeos de execução seguem como placeholder intencional.

**Comandos necessários para colocar em produção:**

```bash
supabase db push
```

Depois: validar em staging (login, dashboard, sessão, troca de exercício, `/offline`), e só então build + deploy pelo fluxo habitual. Nenhum push/merge/deploy foi feito nesta rodada.
