# Auditoria de Diferenças — Método Powerbuilding (final)

**Data:** 29/07/2026 · **Branch base:** `fix/auditoria-final-gymtrack-2026-07-29` @ `ae61fb4` · **Branch de trabalho:** `fix/gymtrack-powerbuilding-final-2026-07-29`

Metodologia: para cada requisito do prompt mestre, localizei a implementação real no código, verifiquei conexão com UI e banco, e classifiquei em **Completo / Parcial / Incorreto / Ausente**. Só foi alterado o que estava Parcial, Incorreto ou Ausente — nada correto foi reescrito e nenhuma solução foi duplicada.

## Bloqueio de material

`Texto colado(1).txt` (artigo sobre o powerbuilding de David Laid) **não foi encontrado** no sistema (`~/Downloads`, `~/Desktop`, `~/Documents`). Trabalhei a partir de (a) o resumo detalhado dos princípios na seção 5 do próprio prompt mestre e (b) a fonte Gymshark de 27/05/2026 que já havia sido verificada e citada em `docs/PESQUISA_REFERENCIAS_PRODUTO_E_TREINO.md`. Nenhum princípio foi inventado; o que não pôde ser confirmado está marcado como pendência.

---

## Tabela de delta

| Requisito | Estado atual | Evidência | Ação necessária | Prioridade |
|---|---|---|---|---|
| **4.1** Somente uma sessão ativa | **Completo** | `workout_sessions_one_active_idx` em `20260729140000_session_integrity.sql`; `startOrResumeSession()` trata `23505`; `StartWorkoutButton` com diálogo | Preservar | — |
| **4.2** Cancelamento lógico | **Completo** | `cancelSessionLogically()`; `SessionClient` sem `delete`; teste de guarda | Preservar | — |
| **4.3** `training_phase` → top set | **Completo** | `phaseAllowsTopSets()` aplicado no server de `/sessao/[id]` | Preservar | — |
| **4.3** `training_phase` → **RIR** | **Parcial** | Fase só zera `top_set_enabled`; `rir_min/rir_max` chegam à sessão sem ajuste por fase | Elevar piso de RIR em `fundamentals` (compostos 3; isoladores 2–3) sem tocar na rotina v4 | **Alta** |
| **4.3** Política de falha consolidada | **Parcial** | `canApproachFailure()` existe em `lib/training/failure-policy.ts`, testada, mas não recebe a fase | Conectar a fase à política (camada interna, **sem exposição na UI** — ver conflito abaixo) | **Alta** |
| **4.4** Volume musculação × abdômen | **Completo** | `getPlannedWeeklyVolumeByMuscle()` lê ficha visível; `getDailyCoreWeeklySets()` em seção separada | Preservar | — |
| **5.1** Força como ferramenta (educativo) | **Parcial** | `/aprendizado` cobre powerbuilding, DUP, RIR, e1RM, V-taper — falta o princípio "força ≠ substitui volume" | Acrescentar tópico | Média |
| **5.2** Classificação DUP visível | **Parcial** | Aparece no card do dashboard e em `/treino/[letter]`; **ausente no cabeçalho da sessão** | Componente reutilizável + cabeçalho da sessão | **Alta** |
| **5.3** Compostos como base | **Completo** | `POWERBUILDING_V4` cobre agachamento (hack), supino, desenvolvimento, remada, puxada, hinge, leg press, unilateral | Preservar | — |
| **5.4** Acessórios com progressão | **Completo** | `suggestForExercise()` roda para todos; `PreviousPerformanceSummary` mostra anterior + melhor carga | Preservar | — |
| **5.4** Acessórios com **tendência** | **Ausente** | Nenhum estado de tendência exibido | Coberto pelo item 6 | **Alta** |
| **5.5** Prioridade estética V | **Completo** | Tópico "Construção do V-taper" em `/aprendizado`; `AVISO_GERAL` cobre genética/composição | Preservar | — |
| **5.6** Pull-up e assistência | **Completo** | `lib/training/load-input.ts` tipo `assistance` com `lowerIsHarder: true`; progressão sugere `decrease_assistance` | Preservar | — |
| **5.7** Elevação lateral | **Completo** | `guidance: ['Sem balanço.']`, faixas 12–20, RIR 1–2 na rotina | Preservar | — |
| **5.8** Tríceps no cabo | **Completo** | 3 variações com faixas 8–20 e cues de cotovelo | Preservar | — |
| **5.9** Bird-dog | **Completo** | `daily_core_exercises` slug `bird-dog`, dia 4, `exercise_type: 'estabilidade'` — **não** conta como hipertrofia abdominal | Preservar | — |
| **5.9** Hiperextensão | **Ausente** | Só aparece como cue ("evite hiperextensão lombar"), nunca como exercício | Cadastrar como **alternativa opcional** de cadeia posterior, sem virar série obrigatória | Média |
| **5.10** Dips | **Ausente** | Não existe no catálogo | Cadastrar como **alternativa** com versão assistida e nota de desconforto no ombro | Média |
| **5.11** Deadlift e fadiga | **Completo (por omissão deliberada)** | Rotina usa terra romeno/stiff 1×/semana; sem terra pesado 2× | **Não alterar** — o prompt pede exatamente para não aumentar | — |
| **6** Tendência 4–8 semanas | **Ausente** | `getExerciseProgressHistory()` devolve carga/volume/reps por sessão, sem RIR, execução, dor, consistência ou classificação | Módulo puro de tendência + query + UI + testes | **Alta** |
| **7** Progressão dupla | **Completo** | `lib/progression/progression.ts` cobre faixa, RIR, técnica, dor, séries, assistência, motivo e confirmação | Preservar | — |
| **8** Execução e controle | **Completo** | `instructions` + `common_mistakes` no catálogo; `guidance` na rotina; `ExerciseDetailSheet` | Preservar | — |
| **9** Objetivo do dia | **Parcial** | `workout.objective` só em `/treino/[letter]`; sem componente reutilizável; ausente na sessão | Criar componente e usar nos três pontos | **Alta** |
| **10** Área educativa | **Completo** | `/aprendizado` com 10 tópicos + `content_sources` com proveniência | Acrescentar tópico do 5.1 | Baixa |
| **11** Abdômen Diário | **Completo** | 10 tabelas, 3 sessões fortes, dias leves, progressão, histórico, card no dashboard, reconciliação anti-duplicidade | Preservar | — |
| **12** Recuperação e frequência | **Completo** | `daily_readiness` + `readiness.ts` (4 estados) + motor de deload com 3 gatilhos e confirmação | Preservar | — |
| **13** Alimentação educativa | **Parcial** | `WellnessForms` traz referência de proteína/superávit, mas sem seção educativa de superávit × déficit | Seção curta e personalizada, sem número fixo do artigo | Média |
| **14** Biblioteca e mídia | **Completo** | Catálogo central, 67 JPGs licenciados (Unlicense), `placeholder.svg` neutro, sem hotlinking | Preservar | — |
| **15.1** "Rotina PPL v3" | **Completo** | `AppSidebar` deriva de `ROUTINE_VERSION` | — | — |
| **15.2** Datas UTC | **Completo** | `lib/utils/local-date.ts` aplicado em `WellnessForms` e `deload.ts` | — | — |
| **15.3** Fallback de agachamento | **Completo** | `DEFAULT_EXERCISE_IMAGE = '/exercises/placeholder.svg'` | — | — |
| **15.4** Falha conectada à UI | **NÃO APLICADO — decisão do usuário** | Ver conflito abaixo | Manter `failureAllowed` só no modelo de dados | — |
| **15.5** Duração sem aquecimento | **Completo** | Estimativa inclui aquecimento (~8 min) e transição (~90 s/exercício) | — | — |
| **15.6** Fallback silencioso p/ treino A | **Completo** | Sentinel `'error'` renderiza card de erro recuperável | — | — |
| **15.7** Docs com números antigos | **Completo** | `HANDOFF_REFORMULACAO.md` marcado como histórico | — | — |
| **15.8** README boilerplate | **Completo** | README reescrito | — | — |
| **15.9** Pacote com `node_modules` | **Completo** | `scripts/package.sh` via `git archive`, falha se detectar artefatos | — | — |
| **15.10** Ausência de E2E | **Completo** | Playwright, 6 testes, `npm run test:e2e` | Ampliar cobertura conforme possível sem Supabase | Baixa |
| **15.11** RLS real | **Bloqueado** | Sem Docker e sem Supabase CLI nesta máquina | Registrar; validar em staging | — |
| **15.12** "treino do David Laid" | **Completo** | Nomenclatura adaptada em docs e UI | Auditar strings novamente | Baixa |

---

## Conflito de instruções registrado

A seção **15.4** deste prompt lista "falha muscular não conectada à interface" como inconsistência a corrigir, e a **4.3** pede para usar `canApproachFailure()`.

Porém, em **29/07/2026 o usuário instruiu explicitamente o contrário**, por escrito:

> "Não implemente a exposição de `failureAllowed` na interface neste momento. […] Não adicionar: badge de 'falha permitida'; aviso de 'vá à falha nesta última série'; bônus de progressão por atingir RIR 0; qualquer regra que torne a falha obrigatória ou frequente. […] Mantenha `failureAllowed` no modelo de dados, sem exposição nova na UI."

**Resolução adotada:** a instrução direta do usuário prevalece sobre o documento. A política de falha é consolidada e **conectada à fase de treinamento como camada interna de prescrição** (satisfazendo o espírito da 4.3: a fase governa a política), mas **sem nenhuma exposição, badge, aviso ou incentivo na interface** (respeitando a decisão do usuário). Um teste automatizado trava essa decisão contra regressão futura.

---

## Ações executadas nesta rodada

1. RIR efetivo por fase (4.3) — camada de prescrição, rotina v4 intocada.
2. Política de falha recebendo a fase (4.3), sem UI.
3. Tendências de 4–8 semanas com estados nomeados (6, 5.4).
4. Componente reutilizável de objetivo/classificação do dia (9, 5.2), incluindo cabeçalho da sessão.
5. Hiperextensão e dips como alternativas opcionais (5.9, 5.10).
6. Tópicos educativos de força-como-ferramenta e alimentação (5.1, 13).
7. Testes e documentação correspondentes.
