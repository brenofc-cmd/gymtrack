# Powerbuilding v4 — força técnica + hipertrofia

Fonte da verdade: [`lib/routine/powerbuilding-v4.ts`](../lib/routine/powerbuilding-v4.ts). A rotina é uma adaptação neutra para iniciante baseada em princípios públicos de powerbuilding; não é um programa oficial de atleta, não copia produto pago e não usa marca ou imagem de terceiros.

## Rotina ativa

| Dia | Sessão | Foco | Núcleo |
| --- | --- | --- | --- |
| Segunda | Push A | Força técnica | Supino inclinado top set/back-off, peito superior, ombros, tríceps, cable crunch |
| Terça | Pull A | Força técnica | Puxada, remada apoiada, deltoide posterior e bíceps |
| Quarta | Legs A | Força técnica | Hack top set/back-off, leg press, RDL, flexora, panturrilha, reverse crunch |
| Quinta | Push B | Hipertrofia | Peito, deltoide lateral e tríceps |
| Sexta | Pull B | Hipertrofia | Largura/espessura de costas, ombro posterior e bíceps |
| Sábado | Legs B | Hipertrofia | Unilateral, glúteos, pernas, panturrilha, anti-extensão e anti-rotação |
| Domingo | — | Descanso | A sequência continua no próximo dia útil se uma sessão for perdida |

O modo principal usa seis dias. O fallback de cinco dias mantém os treinos A–F intactos e rotativos entre semanas, sem amontoar duas sessões ou remover volume do ciclo.

## Progressão e segurança

- Progressão dupla: aumentar somente quando todas as séries atingirem o topo da faixa, com RIR alvo, execução boa e sem dor relevante.
- Top set/back-off: no máximo um composto por sessão; primeira série submáxima e back-offs 5–10% mais leves. Nunca é teste máximo.
- Falha: bloqueada em compostos de alto risco. Em isoladores seguros, é opcional apenas na última série, após adaptação, sem dor e com prontidão boa.
- Dor moderada/forte bloqueia aumento e orienta interrupção ou substituição indolor. O app não diagnostica lesões.
- Aquecimentos progressivos usam `set_role = warmup` e não entram no volume, PR ou progressão.

## e1RM e recordes

`lib/training/strength.ts` usa Epley: `peso × (1 + reps / 30)`. O e1RM só existe para séries de 3–10 repetições, execução boa, sem dor e sem amplitude reduzida. É uma estimativa, não recomendação para tentar 1RM.

PRs de carga e repetições ignoram aquecimento, dor moderada/forte, execução ruim e amplitude reduzida. Exercícios substitutos usam `performed_exercise_id`, portanto mantêm histórico e PR separados.

## Prontidão e fases

O check-in diário registra sono, energia, dor muscular/articular, estresse, motivação e sensação de recuperação:

- `ready`: mantém o plano;
- `attention`: +1 RIR e retirada opcional de uma série acessória;
- `low_recovery`: -5–10% de carga estimada, RIR 3–4 e menos acessórios;
- `stop_for_pain`: não executar o movimento afetado.

A fase padrão é `fundamentals`. `intro_powerbuilding` depende de histórico, aderência, boa técnica, ausência de dor relevante, recuperação e confirmação explícita. `advanced_powerbuilding` nunca é ativada automaticamente.

## Abdômen e volume

O Abdômen Diário substitui o volume abdominal da ficha principal por sessões matinais independentes. A migration `20260717010046_daily_core.sql` preserva os exercícios antigos no histórico e os oculta em qualquer rotina ativa para evitar duplicidade; consulte [`ABDOMEN_DIARIO.md`](./ABDOMEN_DIARIO.md).

Definição visual também depende de gordura corporal, alimentação, genética, sono e consistência; não existe redução localizada.

`directVolumeByMuscle` conta séries diretas. `secondaryVolumeByMuscle` mostra separadamente contribuição estimada de compostos (0,5 por série), sem fingir precisão absoluta.

## Banco e rollback

- `20260714105546_powerbuilding_schema.sql`: metadados de foco/progressão/top-back-off, função estética, risco, fase, papel da série, ROM, e1RM, `daily_readiness`, `content_sources`, RLS e grants explícitos.
- `20260714105553_powerbuilding_routine_v4.sql`: backup JSON da ficha, arquivamento não destrutivo, seis treinos v4, catálogo/substituições e fontes com proveniência.

O rollback está documentado ao fim das migrations. Ele só remove registros v4 ainda sem histórico e restaura a ficha anterior pelo `routine_backups`; sessões e séries realizadas nunca são apagadas.

## Fontes e proveniência

O Centro de aprendizado distingue `direct_primary_source`, `official_secondary_source`, `scientific_evidence` e `implementation_inference`. Decisões do app não são apresentadas como declarações de David Laid. Fontes públicas e datas de acesso ficam em `content_sources`.

## Validação

```bash
npm run typecheck
npm run lint
npm test -- --run
npm run build
```

Os testes cobrem progressão dupla, top/back-off, e1RM, PR válido/inválido, dor, falha, prontidão, sequência rotativa, volume, substituições, RLS estática, timer persistido e segurança/rollback das migrations.
