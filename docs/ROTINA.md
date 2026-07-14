# Rotina v3 — PPL 6 dias (divisão definitiva)

Fonte da verdade no código: [`lib/routine/rotina-v2.ts`](../lib/routine/rotina-v2.ts).
Qualquer alteração na rotina deve ser feita lá e regenerada com `npm run gen:rotina`.

O `scripts/seed.ts` é legado e fica bloqueado por padrão porque reescreve
fichas antigas. A rotina v3 é criada exclusivamente pelas migrations, que
fazem backup e preservam o histórico.

## Divisão semanal

| Dia | Treino | Letra | Foco |
| --- | --- | --- | --- |
| Segunda | Push A | A | Peitoral superior, deltoide lateral, ombros, tríceps, **abdômen (cable crunch)** |
| Terça | Pull A | B | Largura das costas, parte média, deltoide posterior, bíceps |
| Quarta | Legs A | C | Quadríceps, posteriores, panturrilhas, **abdômen (reverse crunch)** |
| Quinta | Push B | D | Peitoral completo, peitoral superior, deltoide lateral, tríceps |
| Sexta | Pull B | E | Dorsal, espessura, deltoide posterior, bíceps |
| Sábado | Legs B | F | Posteriores, glúteos, quadríceps, panturrilhas, deltoide lateral, **abdômen (ab wheel)** |
| Domingo | — | — | Descanso |

O app mostra o treino do dia conforme o fuso `America/Sao_Paulo`
(`lib/utils/weekday.ts`), e o card de descanso no domingo.

## Volume semanal direto (séries válidas)

Peitoral 12 · Costas/dorsais 14 · Deltoide lateral 10 · Deltoide posterior 6 ·
Bíceps 8 · Tríceps 8 · Quadríceps 11 · Posteriores 9 · Panturrilhas 8 ·
**Abdômen 12**.

Participação secundária (ex.: tríceps no supino) não é somada como série direta.
A tabela é exibida no dashboard (`PlannedVolumeCard`) e validada por teste.

## Estratégia do abdômen

Três sessões diretas por semana, uma por padrão de movimento:

- **Segunda** — cable crunch (flexão do tronco com resistência)
- **Quarta** — reverse crunch / elevação de joelhos (retroversão pélvica)
- **Sábado** — ab wheel (anti-extensão)

Por que não treinar abdômen todos os dias: recuperação entre estímulos,
progressão objetiva por padrão de movimento, e não prejudicar agachamentos,
remadas e stiff (que já exigem forte trabalho estabilizador). Não há
"desafios diários", centenas de repetições nem falha diária.

## RIR

- RIR 3 = faria mais 3 repetições · RIR 0 = nenhuma repetição sobrando.
- Semanas 1–2 da rotina: compostos ~RIR 3, isoladores ~RIR 2, sem drop sets,
  sem rest-pause, sem teste de 1RM, sem falha em exercícios livres.
- A partir da 3ª semana: normalmente RIR 1–2; apenas a última série de
  isoladores seguros pode ocasionalmente chegar a RIR 0–1.
- Agachamento livre, stiff e supino livre não são levados deliberadamente à falha.

## Progressão dupla (`lib/progression/progression.ts`)

1. Manter a carga enquanto as séries não atingirem o topo da faixa.
2. Aumentar a carga somente quando **todas** as séries válidas atingirem o topo
   da faixa, com técnica boa, RIR na meta e sem dor — no menor incremento
   disponível; as repetições voltam para a parte inferior da faixa.
3. Reduzir/revisar quando 2+ séries ficarem abaixo do mínimo, técnica ruim ou
   RIR real muito abaixo do planejado.
4. **Dor moderada/forte bloqueia qualquer sugestão de aumento** e recomenda
   substituição segura + avaliação profissional.

Progressões específicas do abdômen:
- Cable crunch: 15 reps em todas as séries com RIR ok → menor aumento da máquina.
- Reverse crunch: progride por reps/controle/amplitude; **sem carga** enquanto a
  retroversão pélvica não estiver dominada (execução "boa").
- Ab wheel: progride por controle/distância/variação; **qualquer desconforto
  lombar bloqueia** progressão de amplitude. Nunca progredir à custa de
  hiperextensão lombar.

## Aquecimento

Antes do primeiro composto de cada treino (`WarmupPanel` + `lib/progression/warmup.ts`):
geral ~5min, depois ~40%×8–12, ~60%×5–6, ~75–80%×2–4 sobre a última carga de
trabalho. Séries de aquecimento são registradas com `is_warmup = true` e **não
contam** no volume, nos recordes nem na progressão. Abdômen não exige
aquecimento separado.

## Cronômetro de descanso

Baseado em timestamp real (`endsAt`), então continua correto com a aba
minimizada e não reinicia após atualização da página (estado persistido em
`sessionStorage`). Controles: +30s, pausar/retomar, reiniciar, pular. Aviso
visual + vibração + som ao terminar. Cada exercício usa o próprio
`rest_seconds` (faixas como 75–90s usam o maior valor como padrão).

## Substituições permitidas

Cadastradas em `workout_exercise_substitutions` (apenas as equivalências do
plano). Ao treinar com uma variação, cada série registra
`performed_exercise_id`, mantendo o histórico da variação **separado** para não
comparar cargas incompatíveis. Exemplos: hack squat ⇄ agachamento livre ⇄
smith; cable crunch ⇄ máquina de abdominal; ab wheel ⇄ rollout com barra ⇄
body saw ⇄ prancha com alavanca.

## Deload e recuperação

Não há deload em calendário fixo. `lib/progression/recovery.ts` alerta quando o
volume de um treino cai por 2+ sessões consecutivas e sugere: manter carga,
aumentar RIR, reduzir séries temporariamente, dia extra de descanso, revisar
sono/alimentação, procurar profissional se houver dor persistente. Em um deload
voluntário: reduzir séries em ~30–50%, cargas moderadas, RIR 3–4, sem falha.

## Banco de dados e migrations

- `0004_rotina_v2_schema.sql` — colunas (RIR, dor, execução, aquecimento,
  arquivamento, padrão de movimento, versão da rotina, variação executada),
  tabelas `workout_exercise_substitutions` e `routine_backups`, RLS e índices.
- `0005_rotina_v2_data.sql` — **gerada** por `npm run gen:rotina`:
  1. backup jsonb da ficha ativa em `routine_backups`;
  2. arquivamento (`is_archived = true`) da rotina anterior — nada é apagado;
  3. criação dos 6 treinos v2 com exercícios, RIR, descanso, orientações e
     substituições (find-or-create no catálogo por `name_pt`).

### Rollback

O procedimento completo está comentado no fim de `0005_rotina_v2_data.sql`:
remover substituições/exercícios/treinos v2 que ainda não têm histórico e
desarquivar a rotina anterior a partir do snapshot em `routine_backups`.
Sessões realizadas na v2 nunca são apagadas.

### Como editar a rotina depois

1. Edite `lib/routine/rotina-v2.ts` (incremente `ROUTINE_VERSION` se for uma
   nova versão completa da ficha).
2. `npm run test` (valida contagens, ordem e volume).
3. `npm run gen:rotina` e aplique a migration gerada.
4. O histórico é preservado automaticamente: treinos antigos são arquivados e
   `getLastSetLogForExercise` busca continuidade pelo exercício de catálogo.

## Preservação de histórico ao trocar exercícios

- Sessões e séries antigas nunca são alteradas ou apagadas.
- Exercícios idênticos entre versões reutilizam o mesmo registro do catálogo,
  então "última carga" e recordes continuam aparecendo.
- Nome e estrutura de exercícios já realizados não são alterados
  retroativamente.

## Testes

`npm run test` (Vitest) cobre: estrutura da divisão (7/6/6/6/5/6), stiff no
Legs B, extensora no Legs A, sem 3ª remada no Pull B, 12 séries diretas de
abdômen (e ausência nos outros dias), volume semanal por grupo, progressão
dupla, progressões específicas do abdômen, bloqueio por dor, cronômetro por
timestamp (inclusive após reload), aquecimento, usuário sem histórico e as
garantias da migration (backup antes de arquivar, nenhum delete/update de
histórico, RLS nas tabelas novas).
