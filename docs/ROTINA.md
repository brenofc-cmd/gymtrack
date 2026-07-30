# DUP público David Laid v5

Fonte canônica: [`lib/routine/david-laid-public-dup-v5.ts`](../lib/routine/david-laid-public-dup-v5.ts).

O GymTrack separa duas coisas:

- **prescrição pública bloqueada:** exercícios, ordem, séries, repetições e esforços RM;
- **camada individual do GymTrack:** máximas de referência, training max, RIR, descanso, readiness, sugestões de carga, deload e bloco de nove semanas.

Os cálculos do app não são apresentados como percentuais oficiais de David Laid.

## Rotina ativa

| Dia | Sessão | Prescrição |
| --- | --- | --- |
| A · Legs 1 | Segunda | Agachamento 5RM + 4×12; RDL 3×10; afundo caminhando 3×10/lado; glute-ham raise 3×10 |
| B · Push 1 | Terça | Supino 1RM + 4×4; push press 3×4; paralelas 3×10; crucifixo, lateral, tríceps testa e extensão 3×10 |
| C · Pull 1 | Quarta | Terra 3RM + 4×6; stiff-leg 3×10; barra fixa 3×8–10; Yates row, encolhimento, rosca direta e martelo 3×10 |
| D · Legs 2 | Quinta | Agachamento 3RM + 4×8; RDL 3×10; afundo 3×10/lado; glute-ham raise 3×10 |
| E · Push 2 | Sexta | Desenvolvimento 5RM + 4×12; supino inclinado 3×12; lateral, paralelas e dois exercícios de tríceps 3×10 |
| F · Pull 2 | Sábado | Terra 1RM + 4×2; stiff-leg em déficit de 5–7,5 cm 3×10; barra fixa 3×8–10; Yates row, encolhimento e roscas 3×10 |

Alternativas permitidas pela ficha: reverse hyper no lugar do glute-ham raise e peck deck no lugar do crucifixo. A escolha não altera séries ou repetições. O stiff-leg em déficit é um exercício próprio no catálogo.

## Provisionamento

`provision_david_laid_public_dup_v5(uuid)` cria exatamente seis treinos e 41 entradas. A função:

- exige o usuário autenticado;
- é idempotente;
- falha claramente se um item do catálogo estiver ausente;
- arquiva fichas anteriores e cria backup JSON sem apagar sessões ou séries;
- usa IDs separados para treino, entrada e substituição;
- é chamada pelo onboarding e, como recuperação, pelo dashboard.

`ensure_active_david_laid_routine_v5()` também garante um bloco ativo de nove semanas. Novas sessões recebem bloco e semana por trigger.

## Máximas e sugestão de carga

As quatro referências principais são agachamento, supino, terra e desenvolvimento:

- `tested_1rm`: valor testado e informado;
- `estimated_1rm`: estimativa Epley de uma série válida;
- `training_max`: por padrão, 90% da máxima testada ou estimada;
- ausência de dados: nenhuma carga é inventada.

Toda carga exibida é rotulada como **“Progressão individual calculada pelo GymTrack”**. Tentativas RM exigem confirmação manual e resultado explícito: concluída, recorde, falha técnica, falha de força, pulada ou dor. O app nunca aumenta uma tentativa RM automaticamente.

## Progressão e segurança

- séries de 8–10 usam progressão por repetições antes da carga;
- acessórios só sobem após todas as séries, técnica boa, RIR adequado e ausência de dor;
- duas falhas recentes, técnica ruim ou baixa recuperação reduzem conservadoramente a sugestão;
- dor moderada/forte bloqueia progressão e orienta interrupção;
- barra fixa diferencia peso corporal, assistência e carga adicional;
- halteres são registrados por halter;
- exercícios unilaterais registram repetições por lado e o volume multiplica os dois lados;
- aquecimentos usam `set_role = warmup` e não entram no volume principal.

O readiness do dia pode manter, moderar ou bloquear a recomendação. O deload continua opcional e explícito; não reescreve a rotina pública.

## Bloco de nove semanas

A semana só avança depois de sessões concluídas A–F no mesmo bloco e na mesma semana. A checagem é transacional e idempotente no banco. Ao concluir a semana 9, o bloco termina e o próximo ciclo é apenas sugerido.

## Banco e rollback

- `20260730090000_david_laid_public_dup_v5.sql`: catálogo, prescrição, função de provisionamento, backup e índice de unicidade;
- `20260730110000_dup_progression_blocks.sql`: referências, histórico, blocos, resultado RM, operação offline idempotente, RLS e avanço semanal.

Rollback nunca apaga `workout_sessions`, `set_logs` ou máximas do usuário. Em ambiente com dados reais, reverta o app e pause/archive o bloco conforme os comentários das migrations.

## Validação

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Os testes travam a rotina exata, o total de 41 entradas, catálogo sem fallback genérico, motor de carga, resultado RM, integridade offline, RLS estática, avanço semanal e preservação de histórico.
