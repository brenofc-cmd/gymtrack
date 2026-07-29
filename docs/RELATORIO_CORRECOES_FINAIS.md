# Relatório — Correções da Auditoria Final

**Data:** 29/07/2026 · **Branch base:** `auditoria-p0-p1` @ `4ead10c` · **Branch de trabalho:** `fix/auditoria-final-gymtrack-2026-07-29`
**Confirmação:** nenhum `git push`, merge ou deploy foi executado. Nenhuma sessão ou série histórica foi apagada.

Este relatório responde ao `PROMPT_CORRECOES_FINAIS_GYMTRACK_2026-07-29.md`, que por sua vez respondia ao `RELATORIO_AUDITORIA_FINAL_GYMTRACK_2026-07-29.md` (veredito: aprovado com ressalvas, ~78% de aderência).

---

## 1. Commits por fase

| Commit | Fase | Escopo |
|---|---|---|
| `d5291d8` | Fase 1 (P0) | Sessão única ativa + cancelamento lógico |
| `d1b3a5a` | Fase 2 (P0) | `training_phase` controla a prescrição efetiva |
| `b659160` | Fase 3 (P0) | Volume planejado vindo do banco; abdômen separado |
| `1a6b03f` | Fase 4 (P1) | Versão da rotina, fuso, placeholder, duração, erro recuperável |
| `4e8cf2a` | Fase 5 (P1) | Pesquisa documentada com fontes verificadas |
| `c21c14d` | Fase 6 (P1) | E2E Playwright + correção de middleware |
| `96d8635` | Fase 7 | README, docs consolidadas, script de pacote limpo |

Total: 36 arquivos alterados, +1530 / −118 linhas.

---

## 2. P0 — Integridade das sessões (auditoria P0.1 e P0.2)

### Migration `20260729140000_session_integrity.sql`

- `workout_sessions.cancelled_at timestamptz` e `cancel_reason text` (`add column if not exists`).
- **Deduplicação não destrutiva antes do índice:** sessões ativas duplicadas pré-existentes viram canceladas logicamente (mantém a mais recente por usuário). Nada é apagado — as séries dessas sessões continuam intactas.
- **Índice único parcial** `workout_sessions_one_active_idx on (user_id) where finished_at is null and cancelled_at is null` — o banco passa a ser a autoridade sobre "uma sessão ativa por usuário".
- Rollback comentado no cabeçalho (só para ambientes novos).

### Repositório único de sessão (`lib/queries/sessions.ts`)

- `startOrResumeSession()` — **único caminho** para iniciar treino. Verifica sessão ativa antes de inserir; se houver, devolve `resumed` com `sameWorkout`. Em corrida de inserção, trata o erro `23505` relendo e abrindo a sessão vencedora em vez de falhar.
- `cancelSessionLogically()` — emite `update` com `cancelled_at`, `cancel_reason` e `duration_seconds` calculada. **Nunca `delete`** (o `on delete cascade` de `set_logs` apagaria o histórico — era exatamente o bug P0.2).
- `getActiveSession()` agora filtra `cancelled_at is null`.
- `getSessionsHistory()` inclui canceladas **que registraram séries** (marcadas "Cancelado" na UI) e omite canceladas vazias.

### UI

- `StartWorkoutButton` recebe a sessão ativa do server component: mostra "Continuar Treino X" quando é o mesmo treino; abre diálogo explícito (continuar existente × cancelar e começar) quando é outro; nunca cria segunda sessão.
- `SessionClient.cancelWorkout()` chama o cancelamento lógico.
- `/sessao/[id]` redireciona sessões canceladas para o histórico (somente leitura).

### Testes (`tests/session-integrity.test.ts`, 14 casos)

Migration idempotente · índice parcial correto · deduplicação **antes** do índice e sem `delete/truncate` · política RLS `for all using (auth.uid() = user_id)` já cobre o update · sessão única · retomada · **corrida simulada (23505 → reabre a vencedora)** · filtro `cancelled_at` · cancelamento emite `update` e nunca `delete` · histórico inclui cancelada com séries e exclui vazia · todas as queries de métrica filtram `finished_at`/`cancelled_at`.

---

## 3. P0 — Fase de treinamento efetiva (auditoria P0.3)

`lib/training/phase.ts` (módulo puro) conecta `user_profiles.training_phase` à prescrição:

- **`fundamentals` (padrão, inclusive para valor nulo/desconhecido):** o gate zera `top_set_enabled` no server component da sessão — os exercícios com top set aparecem como **séries retas conservadoras**, com aviso explicativo na tela. A rotina em si (exercícios, séries, faixas, RIR) **não muda**.
- **`intro_powerbuilding`:** habilita top set/back-off **somente** nos exercícios já marcados na rotina. Ativação exige confirmação explícita no Perfil (`TrainingPhaseCard`), com os critérios listados (8–12 semanas consistentes, execução boa, sem dor recorrente, recuperação adequada). Nunca automática.
- **`advanced_powerbuilding`:** não é oferecida na UI.

### Decisão de produto registrada (29/07/2026)

O prompt previa usar `canApproachFailure()` na interface. **O usuário determinou o contrário**: manter o treino mais próximo do estilo powerbuilding sem transformar a sessão em um sistema que autoriza/incentiva falha exercício por exercício. Portanto:

- `failureAllowed` **permanece no modelo de dados**, sem exposição nova na UI;
- **não** há badge de "falha permitida", aviso de "vá à falha", bônus de progressão por RIR 0, nem regra que torne a falha obrigatória ou frequente;
- RIR segue como **parâmetro interno** de controle de intensidade;
- rotina v4 e lógica de progressão **inalteradas** por essa decisão.

Um teste (`tests/training-phase.test.ts`) trava essa decisão: falha se `canApproachFailure` ou texto de falha aparecer nos componentes de sessão. Também verifica que a rotina v4 continua marcando exatamente 2 exercícios com top set (supino inclinado com halteres, hack squat).

---

## 4. P0 — Volume correto (auditoria P0.4)

O card usava `VOLUME_SEMANAL_ALVO` (constante estática da rotina), que conta **11 séries de abdômen** — mas a reconciliação do Abdômen Diário oculta (`is_hidden`) esses exercícios da ficha. O painel mentia.

- `lib/training/planned-volume.ts` (puro): `aggregatePlannedVolume` e `aggregatePlannedIndirect` ignoram exercícios ocultos e mantêm diretas/indiretas em estruturas separadas.
- `getPlannedWeeklyVolumeByMuscle()` lê `workouts` não arquivados + `workout_exercises` visíveis + `exercises.muscle_group/secondary_muscles`.
- `getDailyCoreWeeklySets()` conta as séries do Abdômen Diário da semana, exibidas em **seção própria** com a frase de que não são somadas ao painel.
- Falha na consulta → `null` → o card mostra **estado de erro**, não números estáticos.
- `PlannedVolumeCard` não importa mais nada da rotina estática.

**Teste que reproduz o cenário exato** (`tests/planned-volume.test.ts`): confirma que a rotina estática soma 11 séries de abdômen, monta a ficha com esses exercícios `is_hidden: true` e verifica que o planejado resultante **não contém abdômen**; verifica também que indiretas nunca se somam às diretas.

---

## 5. P1 — Correções de consistência

| Item | Correção |
|---|---|
| P1.2 "Rotina PPL v3" | `AppSidebar` agora deriva de `ROUTINE_VERSION` (fonte única) → "Rotina Powerbuilding v4" |
| P1.3 Data UTC | Novo `lib/utils/local-date.ts` (`America/Sao_Paulo`); substituído em `WellnessForms` (sono/recuperação) e `lib/queries/deload.ts`. À noite, o `toISOString().slice(0,10)` registrava no dia seguinte |
| P1.4 Fallback de imagem | Novo `public/exercises/placeholder.svg` — neutro e rotulado "Imagem indisponível"; nunca mais a foto de um agachamento no lugar de outro exercício. `next.config.ts` com `dangerouslyAllowSVG` + CSP sandbox (conforme a doc do `next/image`) |
| P1.5 Falha na interface | **Não implementado por decisão do usuário** (ver seção 3) |
| Duração | Estimativa agora inclui aquecimento (~8 min) e transição de equipamento (~90 s/exercício) além de séries+descanso; rotulada "estimativa ~X min" |
| Fallback silencioso | `getSuggestedWorkout` falhando não vira mais "treino A": sentinel `'error'` renderiza card de erro recuperável com link para `/treinos` |

---

## 6. P1 — Pesquisa documentada

`docs/PESQUISA_REFERENCIAS_PRODUTO_E_TREINO.md`, com **fontes acessadas e datadas em 29/07/2026**:

- **Matriz de 8 produtos** (Hevy, Strong, Fitbod, Alpha Progression, Boostcamp, JEFIT, StrengthLog, Nike Training Club) com colunas de log/timer/anterior/retomada/progressão/biblioteca/offline, mais fortes/fracos, princípio adotado e o que **não** foi copiado. Viés declarado onde a fonte é o blog do próprio produto (JEFIT).
- **Dossiê David Laid** separando fonte oficial secundária (Gymshark, 27/05/2026 — DUP 6 dias, esforços 1RM/3RM/5RM + 8–12, "força como ferramenta mais valiosa do natural"), inferências (RIR formal não é confirmado; um 5RM verdadeiro ≈ RIR 0) e o que **não** foi aplicado. A rotina é chamada de "adaptação baseada em princípios públicos de powerbuilding e objetivo estético", nunca "treino do David Laid".
- **Evidência científica** com links reais: falha × não-falha (PubMed 33497853 — sem diferença significativa), volume dose-resposta (Schoenfeld 2017; meta-regressão PubMed 41343037), frequência ≥2×/semana (Schoenfeld 2016), descanso entre séries (Frontiers 2024; JSCR 2016), core anti-movimento (McGill).
- **Pesquisa pendente listada explicitamente** (fontes primárias diretas do atleta não re-verificadas uma a uma, meta-análise específica de hipertrofia abdominal, DUP em iniciantes, teste hands-on dos apps, Gymshark Training não avaliado). Nada foi inventado.

---

## 7. P1 — E2E

`@playwright/test` + `playwright.config.ts` + `tests-e2e/shell.spec.ts` (`npm run test:e2e`).

**Bloqueio de ambiente registrado:** o Chromium do Playwright não instala em macOS 12 (`Playwright does not support chromium on mac12`) — a config usa `channel: 'chrome'` (Chrome do sistema, presente nesta máquina). Viewport iPhone 13.

**6 testes E2E passando** contra o build de produção: rota protegida redireciona ao login · formulário de login utilizável · `/offline` público com orientação · placeholder neutro servido e sem menção a outro exercício · manifest e `sw.js` servidos **sem sessão** · layout mobile sem rolagem horizontal.

**Bug real encontrado pelo E2E:** o middleware redirecionava `/sw.js` e `/manifest.webmanifest` para `/login`, devolvendo HTML — o service worker **nunca registraria** para usuário deslogado e o precache do shell quebraria. Corrigido em `lib/supabase/middleware.ts` (rotas públicas de PWA), com o teste travando a regressão.

### Bloqueio explícito de RLS real

Não há Docker nem Supabase CLI nesta máquina (`docker: command not found`, `supabase not found`), e não há credenciais de staging. Portanto:

- **NÃO** foi validado: RLS real com dois usuários, fluxos autenticados de ponta a ponta (iniciar → registrar série → recarregar → retomar → cancelar → concluir), isolamento entre contas.
- **Foi validado por outras vias:** migrations por parsing estático; lógica de sessão única, corrida e cancelamento por testes com client mockado; guarda de service role por varredura de `app/` e `components/`.
- **Ação obrigatória antes de produção:** backup → aplicar migrations em staging → validar cada página autenticada → testar isolamento entre dois usuários → testar insert/update/delete permitido e proibido → só então produção.

---

## 8. Documentação e pacote

- `README.md` reescrito: requisitos, instalação limpa, variáveis de ambiente, migrations, seed, execução, testes, deploy manual, rollback e **limitações conhecidas**. Todo o boilerplate do Create Next App foi removido.
- `docs/HANDOFF_REFORMULACAO.md` marcado no topo como registro histórico (números antigos não valem mais).
- `docs/ROTINA.md` e `docs/ABDOMEN_DIARIO.md` já haviam recebido as seções de deload, wake lock e service worker.
- `scripts/package.sh`: empacota via `git archive` (só o que está versionado) e **falha** se `node_modules`, `.next` ou `.env` aparecerem no zip. Testado: 382 arquivos, ~21 MB — contra os 264 MB do zip auditado.

---

## 9. Escopo complementar (auditado, não implementado)

Conforme a instrução "não misture esse escopo com as correções P0", apenas o levantamento:

**`/alimentacao`** — hoje só **lê**: metas de `nutrition_goals`, refeições do dia com `meal_entries` e totais de macros. Ambos os CTAs apontam para `/acompanhamento`, que só tem meta de proteína/calorias, peso, sono e recuperação. **Faltam:** criar/editar refeição, buscar alimento no catálogo (as tabelas `food_items`, `meal_entries`, `recipes` e `recipe_ingredients` existem e têm RLS, mas não há tela de escrita), quantidades, favoritos, copiar dia anterior, receitas, substituições, registro de água e plano flexível.

**`/suplementos`** — tracker funcional (catálogo global + do usuário, marcar/desmarcar hoje, criar item com dose padrão). **Faltam:** editar a dose efetivamente tomada (hoje grava a dose padrão), sequência de uso, lembrete diário real e páginas educativas específicas (incluindo cautela com cafeína/pré-treino).

Recomendação: tratar como fase própria depois que as migrations desta rodada estiverem aplicadas e validadas.

---

## 10. Validação final

Executada em **instalação limpa** (`rm -rf node_modules .next *.tsbuildinfo && npm ci`):

| Comando | Resultado |
|---|---|
| `npm ci` | ✅ (registry público acessível; nenhum bloqueio de registry nesta máquina) |
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ |
| `npm test` (Vitest) | ✅ **220/220** em 23 arquivos (eram 194 no commit base) |
| `npm run build` | ✅ 25 rotas, sem rede de fontes |
| `npx playwright test` | ✅ **6/6** (mobile-chrome) |

Testes adicionados nesta rodada: `session-integrity` (14), `training-phase` (7), `planned-volume` (5), `tests-e2e/shell` (6 E2E).

### Migrations a aplicar (ordem)

1. `20260729120000_baseline_missing_tables.sql` *(rodada anterior)*
2. `20260729130000_deload_recommendations.sql` *(rodada anterior)*
3. `20260729140000_session_integrity.sql` *(esta rodada)*

```bash
supabase db push
```

### Screenshots (viewport iPhone 13)

Capturados via Playwright contra o build de produção, em `docs/screenshots/`:

- `login-mobile.png` — tela de login (estado sem sessão)
- `offline-mobile.png` — página `/offline` renderizando na identidade do app

Telas autenticadas (dashboard, sessão, progresso) não puderam ser capturadas: dependem de Supabase real — mesmo bloqueio da seção 7.

### Pendências restantes

- **Validação de RLS real e fluxos autenticados em staging** (bloqueio de ambiente — seção 7). É o único item do gate da auditoria que não pode ser fechado desta máquina.
- Screenshots das telas autenticadas, pelo mesmo motivo.
- Escopo complementar de alimentação/suplementos (seção 9).
- Pesquisa pendente listada no documento de referências.
